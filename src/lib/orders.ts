import "server-only";
import { randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import type { DeliveryMethod } from "@/db/schema";

export type QuotedProduct = {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
  type: string;
  price: number;
  image: string | null;
  available: boolean;
};

/** Актуальные цены и наличие — корзина в браузере цен не хранит. */
export function quote(ids: number[]): Record<number, QuotedProduct> {
  const uniq = [...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))].slice(0, 100);
  if (!uniq.length) return {};
  const rows = db.select().from(schema.products).where(inArray(schema.products.id, uniq)).all();
  return Object.fromEntries(
    rows.map((p) => [
      p.id,
      {
        id: p.id,
        slug: p.slug,
        title: p.title,
        shortTitle: p.shortTitle,
        type: p.type,
        price: p.price,
        image: p.images[0] ?? null,
        available: p.isActive && p.price > 0 && (p.stock === null || p.stock > 0),
      },
    ]),
  );
}

export type OrderInput = {
  name: string;
  phone: string;
  email: string | null;
  delivery: DeliveryMethod;
  city: string | null;
  address: string | null;
  comment: string | null;
  userId: number | null;
  deliveryPrice: number | null; // копейки, посчитано на сервере (СДЭК или демо)
  deliveryEta: string | null;
  lines: { productId: number; qty: number; bundle: string | null }[];
};

/** Создаёт заказ по ценам из базы. Возвращает токен страницы заказа или список недоступных товаров. */
export function createOrder(input: OrderInput): { token: string; number: string; id: number; subtotal: number } | { unavailable: string[] } {
  const q = quote(input.lines.map((l) => l.productId));
  const unavailable = input.lines.filter((l) => !q[l.productId]?.available).map((l) => q[l.productId]?.shortTitle ?? `товар #${l.productId}`);
  if (unavailable.length) return { unavailable };

  const subtotal = input.lines.reduce((s, l) => s + q[l.productId].price * l.qty, 0);
  const now = new Date();
  const token = randomBytes(18).toString("base64url");

  return db.transaction((tx) => {
    // Номер = 1000 + id: id в SQLite не переиспользуется (AUTOINCREMENT), значит и номера не повторятся.
    const order = tx
      .insert(schema.orders)
      .values({
        number: `tmp-${token}`,
        token,
        userId: input.userId,
        customerName: input.name,
        phone: input.phone,
        email: input.email,
        deliveryMethod: input.delivery,
        deliveryCity: input.city,
        deliveryAddress: input.address,
        comment: input.comment,
        subtotal,
        deliveryPrice: input.deliveryPrice,
        deliveryEta: input.deliveryEta,
        total: subtotal + (input.deliveryPrice ?? 0),
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: schema.orders.id })
      .get();
    const number = String(1000 + order.id);
    tx.update(schema.orders).set({ number }).where(eq(schema.orders.id, order.id)).run();
    const products = tx.select().from(schema.products).where(inArray(schema.products.id, input.lines.map((l) => l.productId))).all();
    const byId = new Map(products.map((p) => [p.id, p]));
    tx.insert(schema.orderItems)
      .values(
        input.lines.map((l) => {
          const p = byId.get(l.productId)!;
          return {
            orderId: order.id,
            productId: p.id,
            title: p.title,
            sku: p.sku,
            image: p.images[0] ?? null,
            price: p.price,
            qty: l.qty,
            bundle: l.bundle,
          };
        }),
      )
      .run();
    tx.insert(schema.orderEvents).values({ orderId: order.id, at: now, by: null, text: "Заказ оформлен на сайте" }).run();
    return { token, number, id: order.id, subtotal };
  });
}

export function getOrderByToken(token: string) {
  if (!/^[\w-]{20,40}$/.test(token)) return null;
  const order = db.select().from(schema.orders).where(eq(schema.orders.token, token)).get();
  if (!order) return null;
  const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).all();
  return { order, items };
}

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  "cdek-pvz": "СДЭК, пункт выдачи",
  "cdek-door": "СДЭК, курьер до двери",
  other: "Другой способ — обсудим по телефону",
};

export const STATUS_LABELS: Record<string, string> = {
  new: "Принят, ждёт подтверждения",
  confirmed: "Подтверждён",
  paid: "Оплачен",
  shipped: "Передан в доставку",
  done: "Получен",
  cancelled: "Отменён",
};
