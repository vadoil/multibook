import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatPrice } from "@/lib/money";
import { getOrderByToken } from "@/lib/orders";
import { paymentMode } from "@/lib/payments";
import { finishDemoPayment } from "@/app/order/actions";

export const metadata: Metadata = { title: "Демо-оплата", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Заглушка страницы банка. Когда появятся ключи ЮKassa, сюда никто не попадёт — будет её страница. */
export default async function DemoPay({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  if (paymentMode() !== "demo") notFound();
  const id = Number((await params).id);
  const token = (await searchParams).t ?? "";
  const data = getOrderByToken(token);
  const p = Number.isInteger(id) ? db.select().from(schema.payments).where(eq(schema.payments.id, id)).get() : undefined;
  if (!data || !p || p.orderId !== data.order.id) notFound();
  const done = p.status !== "pending";

  return (
    <div className="mx-auto max-w-md px-4 pt-12 sm:px-6">
      <div className="rounded-[28px] bg-card p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,.4)]">
        <p className="inline-block rounded-full bg-warn/15 px-3 py-1 text-xs font-semibold text-warn">Демо-режим · деньги не списываются</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Оплата заказа № {data.order.number}</h1>
        <p className="mt-1 text-muted">Multibook · multi-book.ru</p>
        <p className="mt-6 font-display text-4xl font-bold tabular-nums">{formatPrice(p.amount)}</p>

        <div className="mt-6 grid gap-2 rounded-2xl border border-dashed border-line p-4 text-sm text-muted">
          <p>Здесь будет страница ЮKassa: карта, СБП, SberPay, T-Pay.</p>
          <p>Сейчас ключей нет, поэтому оплата имитируется: заказ отметится оплаченным, менеджеру придёт уведомление с пометкой «демо».</p>
        </div>

        {done ? (
          <p className="mt-6 rounded-xl bg-paper px-4 py-3 text-sm">Этот платёж уже {p.status === "succeeded" ? "проведён" : "отменён"}.</p>
        ) : (
          <div className="mt-6 grid gap-2">
            <form action={finishDemoPayment.bind(null, p.id, token, true)}>
              <button className="w-full rounded-full bg-ink px-6 py-4 font-semibold text-white">Оплатить {formatPrice(p.amount)}</button>
            </form>
            <form action={finishDemoPayment.bind(null, p.id, token, false)}>
              <button className="w-full rounded-full px-6 py-3 text-muted underline underline-offset-4">Отказаться и вернуться</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
