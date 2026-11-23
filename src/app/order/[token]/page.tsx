import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/ClearCart";
import { formatPrice } from "@/lib/money";
import { DELIVERY_LABELS, getOrderByToken, STATUS_LABELS } from "@/lib/orders";

export const metadata: Metadata = { title: "Заказ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const data = getOrderByToken((await params).token);
  if (!data) notFound();
  const { order, items } = data;
  const fresh = (await searchParams).new === "1";
  const groups = [...new Set(items.map((i) => i.bundle ?? ""))];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      {fresh && <ClearCart />}
      <p className="text-sm uppercase tracking-[0.18em] text-muted">{fresh ? "Спасибо!" : "Ваш заказ"}</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Заказ № {order.number}</h1>
      <p className="mt-4 inline-flex rounded-full bg-card px-4 py-2 text-sm font-medium">{STATUS_LABELS[order.status]}</p>
      {fresh && (
        <p className="mt-4 text-lg text-ink/80">
          Мы позвоним или напишем на {order.phone}, чтобы подтвердить заказ и посчитать доставку. Сохраните эту страницу — по ссылке всегда виден статус.
        </p>
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
          <dd className="text-muted">{order.deliveryPrice === null ? "посчитаем при подтверждении" : formatPrice(order.deliveryPrice)}</dd>
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
