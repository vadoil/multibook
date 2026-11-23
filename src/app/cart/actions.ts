"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { quoteDelivery, type DeliveryQuote } from "@/lib/delivery";
import { newOrderText, notifyManager } from "@/lib/notify";
import { createOrder, DELIVERY_LABELS, quote, type QuotedProduct } from "@/lib/orders";

export async function quoteProducts(ids: number[]): Promise<Record<number, QuotedProduct>> {
  return quote(Array.isArray(ids) ? ids.map(Number) : []);
}

type Line = { productId: number; qty: number };

async function deliveryFor(city: string, method: DeliveryMethod, lines: Line[]): Promise<DeliveryQuote> {
  const q = quote(lines.map((l) => l.productId));
  return quoteDelivery(city, method, lines.filter((l) => q[l.productId]).map((l) => ({ type: q[l.productId].type, qty: l.qty })));
}

/** Предварительный расчёт доставки в корзине. */
export async function estimateDelivery(city: string, method: string, lines: Line[]): Promise<DeliveryQuote> {
  const m = (DELIVERY_METHODS as readonly string[]).includes(method) ? (method as DeliveryMethod) : "cdek-pvz";
  const clean = (Array.isArray(lines) ? lines : [])
    .slice(0, 60)
    .map((l) => ({ productId: Number(l?.productId), qty: Number(l?.qty) }))
    .filter((l) => Number.isInteger(l.productId) && l.productId > 0 && Number.isInteger(l.qty) && l.qty > 0 && l.qty < 100);
  return deliveryFor(String(city ?? ""), m, clean);
}

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "phone" | "email" | "city" | "address" | "consent", string>>;
  values?: Record<string, string>;
};

const str = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function placeOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const values = {
    name: str(fd, "name", 100),
    phone: str(fd, "phone", 30),
    email: str(fd, "email", 120),
    delivery: str(fd, "delivery", 20),
    city: str(fd, "city", 80),
    address: str(fd, "address", 300),
    comment: str(fd, "comment", 1000),
    consent: fd.get("consent") === "on" ? "on" : "",
  };

  // Ловушка для ботов: поле скрыто от людей.
  if (str(fd, "website", 100)) return { error: "Не удалось оформить заказ.", values };

  let lines: { productId: number; qty: number; bundle: string | null }[] = [];
  try {
    const raw = JSON.parse(String(fd.get("lines") ?? "[]"));
    if (Array.isArray(raw))
      lines = raw.slice(0, 60).flatMap((l) => {
        const productId = Number(l?.productId);
        const qty = Number(l?.qty);
        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(qty) || qty < 1 || qty > 99) return [];
        const bundle = typeof l?.bundleLabel === "string" ? l.bundleLabel.slice(0, 120) : null;
        return [{ productId, qty, bundle }];
      });
  } catch {
    lines = [];
  }
  if (!lines.length) return { error: "Корзина пуста.", values };

  const fieldErrors: CheckoutState["fieldErrors"] = {};
  const digits = values.phone.replace(/\D/g, "");
  if (values.name.length < 2) fieldErrors.name = "Укажите имя";
  if (digits.length < 10 || digits.length > 15) fieldErrors.phone = "Нужен телефон для связи, например +7 999 123-45-67";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) fieldErrors.email = "Проверьте адрес почты";
  const delivery = (DELIVERY_METHODS as readonly string[]).includes(values.delivery) ? (values.delivery as DeliveryMethod) : "cdek-pvz";
  if (delivery !== "other") {
    if (values.city.length < 2) fieldErrors.city = "Укажите город";
    if (values.address.length < 3) fieldErrors.address = delivery === "cdek-pvz" ? "Укажите адрес пункта СДЭК, например: ул. Ленина, 5" : "Укажите улицу, дом и квартиру";
  }
  if (values.consent !== "on") fieldErrors.consent = "Без согласия мы не сможем связаться с вами по заказу";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const user = await currentUser();
  // Доставку считаем заново на сервере: цифре из браузера не верим.
  const dq = await deliveryFor(values.city, delivery, lines);
  const res = createOrder({
    deliveryPrice: "price" in dq ? dq.price : null,
    deliveryEta: "price" in dq ? dq.eta : null,
    name: values.name,
    phone: values.phone,
    email: values.email || null,
    delivery,
    city: values.city || null,
    address: values.address || null,
    comment: values.comment || null,
    userId: user?.id ?? null,
    lines,
  });
  if ("unavailable" in res) return { error: `Уже нет в продаже: ${res.unavailable.join(", ")}. Уберите их из корзины.`, values };

  // Уведомление уходит после ответа покупателю — оформление не ждёт Telegram.
  after(() =>
    notifyManager(
      newOrderText({
        number: res.number,
        id: res.id,
        name: values.name,
        phone: values.phone,
        subtotal: res.subtotal + ("price" in dq ? dq.price : 0),
        delivery: DELIVERY_LABELS[delivery],
        city: values.city || null,
        items: lines.length,
      }),
    ),
  );
  redirect(`/order/${res.token}?new=1`);
}
