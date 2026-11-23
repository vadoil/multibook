import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/ClearCart";
import { formatPrice } from "@/lib/money";
import { DELIVERY_LABELS, getOrderByToken, STATUS_LABELS } from "@/lib/orders";
import { canPay, paymentMode } from "@/lib/payments";
import { payOrder } from "../actions";

export const metadata: Metadata = { title: "Заказ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string; paid?: string; payerror?: string }>;
}) {
  const data = getOrderByToken((await params).token);
  if (!data) notFound();
  const { order, items } = data;
  const sp = await searchParams;
  const fresh = sp.new === "1";
  const mode = paymentMode();
  const groups = [...new Set(items.map((i) => i.bundle ?? ""))];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      {fresh && <ClearCart />}
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{fresh ? "Спасибо!" : "Ваш заказ"}</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Заказ № {order.number}</h1>
      <p className="mt-4 inline-flex rounded-full bg-card px-4 py-2 text-sm font-medium">{STATUS_LABELS[order.status]}</p>
      {fresh && (
        <p className="mt-4 text-lg text-ink/80">
          {canPay(order)
            ? "Заказ принят. Можно оплатить сейчас — или дождаться звонка менеджера. Сохраните эту страницу — по ссылке всегда виден статус."
            : `Мы позвоним или напишем на ${order.phone}, чтобы подтвердить заказ и посчитать доставку. Сохраните эту страницу — по ссылке всегда виден статус.`}
        </p>
      )}
      {order.status === "paid" && sp.paid === "1" && <p className="mt-4 rounded-xl bg-ok/10 px-4 py-3 text-ok">Оплата прошла. Спасибо! Соберём заказ и сообщим, когда передадим в доставку.</p>}
      {sp.paid === "1" && order.status !== "paid" && (
        <p className="mt-4 rounded-xl bg-paper px-4 py-3">Ждём подтверждения оплаты от банка — обычно это несколько секунд. Обновите страницу.</p>
      )}
      {sp.payerror === "1" && <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-accent">Не получилось начать оплату. Попробуйте ещё раз или дождитесь звонка менеджера.</p>}
      {canPay(order) && (
        <form action={payOrder.bind(null, order.token)} className="mt-6 flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] bg-ink p-5 text-white">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Оплатить онлайн {formatPrice(order.total)}</p>
            <p className="text-sm text-white/70">{mode === "demo" ? "Демо-режим: деньги не списываются" : "Карта, СБП, SberPay — через ЮKassa"}</p>
          </div>
          <button className="rounded-full bg-white px-6 py-3 font-semibold text-ink">Оплатить</button>
        </form>
      )}

      <div className="mt-8 rounded-[var(--radius-card)] bg-card p-5">
        {groups.map((g) => (
          <div key={g || "loose"} className="mb-2">
            {g && <p className="pt-2 text-sm font-medium text-muted">{g}</p>}
            <ul className="divide-y divide-line">
              {items
                .filter((i) => (i.bundle ?? "") === g)
                .map((i) => (
                  <li key={i.id} className="flex items-center gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#efe9df]">
                      {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                    </div>
                    <span className="min-w-0 flex-1 leading-snug">{i.title}</span>
                    <span className="shrink-0 text-sm text-muted tabular-nums">
                      {i.qty} × {formatPrice(i.price)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 border-t border-line pt-4">
          <dt>Товары</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
          <dt>Доставка</dt>
          <dd className="text-right text-muted">
            {order.deliveryPrice === null ? "посчитаем при подтверждении" : `${formatPrice(order.deliveryPrice)}${order.deliveryEta ? ` · ${order.deliveryEta}` : ""}`}
          </dd>
          <dt className="pt-2 text-lg font-semibold">Итого</dt>
          <dd className="pt-2 text-lg font-bold tabular-nums">{formatPrice(order.total)}</dd>
        </dl>
      </div>

      <dl className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">Получатель</dt>
        <dd>{order.customerName}</dd>
        <dt className="text-muted">Доставка</dt>
        <dd>
          {DELIVERY_LABELS[order.deliveryMethod]}
          {order.deliveryCity && `, ${order.deliveryCity}`}
          {order.deliveryAddress && `, ${order.deliveryAddress}`}
        </dd>
        {order.comment && (
          <>
            <dt className="text-muted">Комментарий</dt>
            <dd>{order.comment}</dd>
          </>
        )}
      </dl>

      <Link href="/catalog" className="mt-10 inline-block rounded-full border border-ink px-6 py-3 font-semibold">
        Продолжить покупки
      </Link>
    </div>
  );
}
