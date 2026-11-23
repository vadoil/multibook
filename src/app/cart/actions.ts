"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { newOrderText, notifyManager } from "@/lib/notify";
import { createOrder, DELIVERY_LABELS, quote, type QuotedProduct } from "@/lib/orders";

export async function quoteProducts(ids: number[]): Promise<Record<number, QuotedProduct>> {
  return quote(Array.isArray(ids) ? ids.map(Number) : []);
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
  if (values.name.length < 2) fieldErrors.name = "Как к вам обращаться?";
  if (digits.length < 10 || digits.length > 15) fieldErrors.phone = "Нужен телефон для связи, например +7 999 123-45-67";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) fieldErrors.email = "Проверьте адрес почты";
  const delivery = (DELIVERY_METHODS as readonly string[]).includes(values.delivery) ? (values.delivery as DeliveryMethod) : "cdek-pvz";
  if (delivery !== "other") {
    if (values.city.length < 2) fieldErrors.city = "Укажите город";
    if (values.address.length < 3) fieldErrors.address = delivery === "cdek-pvz" ? "Адрес или код пункта СДЭК" : "Улица, дом, квартира";
  }
  if (values.consent !== "on") fieldErrors.consent = "Без согласия мы не сможем связаться с вами по заказу";
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const user = await currentUser();
  const res = createOrder({
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
        subtotal: res.subtotal,
        delivery: DELIVERY_LABELS[delivery],
        city: values.city || null,
        items: lines.length,
      }),
    ),
  );
  redirect(`/order/${res.token}?new=1`);
}
