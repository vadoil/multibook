"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getOrderByToken } from "@/lib/orders";
import { paymentMode, settlePayment, startPayment } from "@/lib/payments";

/** Кнопка «Оплатить онлайн» на странице заказа. Доступ — по секретной ссылке заказа (token). */
export async function payOrder(token: string) {
  const data = getOrderByToken(token);
  if (!data) redirect("/");
  let url: string;
  try {
    url = await startPayment(data.order, data.items);
  } catch (e) {
    console.error("[pay]", (e as Error).message);
    redirect(`/order/${token}?payerror=1`);
  }
  redirect(url);
}

/** Демо-оплата: только в демо-режиме, только для демо-платежа этого заказа. */
export async function finishDemoPayment(paymentId: number, token: string, ok: boolean) {
  if (paymentMode() !== "demo") redirect("/");
  const data = getOrderByToken(token);
  const p = db.select().from(schema.payments).where(eq(schema.payments.id, paymentId)).get();
  if (!data || !p || p.orderId !== data.order.id || p.provider !== "demo") redirect("/");
  await settlePayment(p.id, ok ? "succeeded" : "canceled");
  redirect(`/order/${token}${ok ? "?paid=1" : ""}`);
}
