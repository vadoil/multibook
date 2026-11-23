import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Order, OrderItem } from "@/db/schema";
import { formatPrice } from "./money";
import { notifyManager } from "./notify";

/**
 * Онлайн-оплата.
 * - Есть YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY → настоящая ЮKassa (редирект на её страницу, вебхук).
 * - Нет ключей → демо: своя страница «оплаты», деньги не списываются.
 *   В продакшене демо включается только явно: DEMO_PAYMENTS=1 (иначе оплата скрыта).
 */
export type PaymentMode = "yookassa" | "demo" | "off";

export function paymentMode(): PaymentMode {
  if (process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY) return "yookassa";
  if (process.env.NODE_ENV !== "production" || process.env.DEMO_PAYMENTS === "1") return "demo";
  return "off";
}

const API = "https://api.yookassa.ru/v3";
const rub = (kop: number) => (kop / 100).toFixed(2);

function authHeader() {
  return `Basic ${Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString("base64")}`;
}

type YkPayment = { id: string; status: "pending" | "waiting_for_capture" | "succeeded" | "canceled"; amount: { value: string; currency: string }; confirmation?: { confirmation_url?: string }; metadata?: Record<string, string> };

async function yk<T>(path: string, init: RequestInit & { idempotenceKey?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.idempotenceKey ? { "Idempotence-Key": init.idempotenceKey } : {}),
    },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ЮKassa ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

/** Чек по 54-ФЗ. Включается YOOKASSA_RECEIPTS=1 (если к магазину подключена онлайн-касса ЮKassa). */
function receipt(order: Order, items: OrderItem[]) {
  if (process.env.YOOKASSA_RECEIPTS !== "1") return undefined;
  const vat = Number(process.env.YOOKASSA_VAT_CODE ?? 1); // 1 — без НДС
  const lines = items.map((i) => ({
    description: i.title.slice(0, 128),
    quantity: i.qty.toFixed(2),
    amount: { value: rub(i.price), currency: "RUB" },
    vat_code: vat,
    payment_mode: "full_payment",
    payment_subject: "commodity",
  }));
  if (order.deliveryPrice)
    lines.push({ description: "Доставка", quantity: "1.00", amount: { value: rub(order.deliveryPrice), currency: "RUB" }, vat_code: vat, payment_mode: "full_payment", payment_subject: "service" });
  return { customer: order.email ? { email: order.email } : { phone: order.phone.replace(/[^\d]/g, "") }, items: lines };
}

/** Можно ли сейчас платить онлайн: доставка посчитана, заказ не оплачен и не отменён. */
export function canPay(order: Order) {
  return paymentMode() !== "off" && order.deliveryPrice !== null && (order.status === "new" || order.status === "confirmed");
}

/** Создаёт платёж и возвращает адрес, куда отправить покупателя. */
export async function startPayment(order: Order, items: OrderItem[]): Promise<string> {
  const mode = paymentMode();
  if (mode === "off" || !canPay(order)) throw new Error("Оплата сейчас недоступна");
  const now = new Date();
  const site = process.env.SITE_URL ?? "http://localhost:3000";

  if (mode === "demo") {
    const p = db
      .insert(schema.payments)
      .values({ orderId: order.id, provider: "demo", amount: order.total, createdAt: now, updatedAt: now })
      .returning({ id: schema.payments.id })
      .get();
    return `/pay/demo/${p.id}?t=${order.token}`;
  }

  // Повторный клик «Оплатить» — отдаём ещё не оплаченный платёж на ту же сумму.
  const open = db
    .select()
    .from(schema.payments)
    .where(and(eq(schema.payments.orderId, order.id), eq(schema.payments.status, "pending"), eq(schema.payments.provider, "yookassa")))
    .all()
    .find((p) => p.amount === order.total && p.confirmationUrl);
  if (open) return open.confirmationUrl!;

  const yp = await yk<YkPayment>("/payments", {
    method: "POST",
    idempotenceKey: randomUUID(),
    body: JSON.stringify({
      amount: { value: rub(order.total), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: `${site}/order/${order.token}?paid=1` },
      description: `Заказ № ${order.number} на multi-book.ru`,
      metadata: { orderId: String(order.id) },
      receipt: receipt(order, items),
    }),
  });
  const url = yp.confirmation?.confirmation_url;
  if (!url) throw new Error("ЮKassa не вернула ссылку на оплату");
  db.insert(schema.payments)
    .values({ orderId: order.id, provider: "yookassa", externalId: yp.id, amount: order.total, confirmationUrl: url, createdAt: now, updatedAt: now })
    .run();
  return url;
}

/** Отмечает платёж оплаченным/отменённым и двигает заказ. Повторный вызов ничего не ломает. */
export async function settlePayment(paymentId: number, status: "succeeded" | "canceled") {
  const p = db.select().from(schema.payments).where(eq(schema.payments.id, paymentId)).get();
  if (!p || p.status !== "pending") return;
  const now = new Date();
  const order = db.select().from(schema.orders).where(eq(schema.orders.id, p.orderId)).get();
  db.transaction((tx) => {
    tx.update(schema.payments).set({ status, updatedAt: now }).where(eq(schema.payments.id, p.id)).run();
    if (status === "succeeded") {
      tx.update(schema.orders).set({ status: "paid", updatedAt: now }).where(eq(schema.orders.id, p.orderId)).run();
      tx.insert(schema.orderEvents)
        .values({ orderId: p.orderId, at: now, by: null, text: `Оплачено онлайн: ${formatPrice(p.amount)}${p.provider === "demo" ? " (демо, без денег)" : " через ЮKassa"}` })
        .run();
    } else {
      tx.insert(schema.orderEvents).values({ orderId: p.orderId, at: now, by: null, text: "Покупатель не завершил оплату" }).run();
    }
  });
  if (status === "succeeded" && order)
    await notifyManager(`💳 Заказ № ${order.number} оплачен: ${formatPrice(p.amount)}${p.provider === "demo" ? " (демо)" : ""}`);
}

/**
 * Вебхук ЮKassa. Телу уведомления не верим: перезапрашиваем платёж по API
 * и сверяем статус и сумму с нашей записью.
 */
export async function handleYookassaWebhook(body: unknown) {
  if (paymentMode() !== "yookassa") return;
  const id = (body as { object?: { id?: unknown } })?.object?.id;
  if (typeof id !== "string" || !/^[\w-]{10,60}$/.test(id)) return;
  const local = db.select().from(schema.payments).where(eq(schema.payments.externalId, id)).get();
  if (!local) return;
  const real = await yk<YkPayment>(`/payments/${id}`);
  if (real.amount.currency !== "RUB" || real.amount.value !== rub(local.amount)) {
    console.error(`[yookassa] сумма не совпадает: платёж ${id}`);
    return;
  }
  if (real.status === "succeeded") await settlePayment(local.id, "succeeded");
  if (real.status === "canceled") await settlePayment(local.id, "canceled");
}
