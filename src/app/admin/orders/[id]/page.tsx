import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ORDER_STATUSES } from "@/db/schema";
import { fmtDate, input, StatusBadge, STATUS_TONE } from "@/components/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { DELIVERY_LABELS, STATUS_LABELS } from "@/lib/orders";
import { saveManagerNote, setDelivery, setOrderStatus } from "../../actions";

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const order = db.select().from(schema.orders).where(eq(schema.orders.id, id)).get();
  if (!order) notFound();
  const items = db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, id)).all();
  const events = db.select().from(schema.orderEvents).where(eq(schema.orderEvents.orderId, id)).orderBy(desc(schema.orderEvents.at)).all();
  const customer = order.userId ? db.select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.id, order.userId)).get() : null;
  const groups = [...new Set(items.map((i) => i.bundle ?? ""))];
  const tel = order.phone.replace(/[^\d+]/g, "");

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-muted">
        ← Все заказы
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">Заказ № {order.number}</h1>
        <StatusBadge status={order.status} label={STATUS_LABELS[order.status]} />
        <span className="text-sm text-muted">от {fmtDate(order.createdAt)}</span>
        <Link href={`/order/${order.token}`} target="_blank" className="ml-auto text-sm underline underline-offset-4">
          Страница покупателя ↗
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-6">
          <section className="rounded-[var(--radius-card)] bg-card p-5">
            <h2 className="font-semibold">Статус</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ORDER_STATUSES.map((s) => (
                <form key={s} action={setOrderStatus.bind(null, order.id, s)}>
                  <button
                    disabled={order.status === s}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${order.status === s ? STATUS_TONE[s] : "border border-line hover:border-ink"}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                </form>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] bg-card p-5">
            <h2 className="font-semibold">Состав</h2>
            {groups.map((g) => (
              <div key={g || "loose"} className="mt-3">
                {g && <p className="text-sm font-medium text-muted">{g}</p>}
                <ul className="divide-y divide-line">
                  {items
                    .filter((i) => (i.bundle ?? "") === g)
                    .map((i) => (
                      <li key={i.id} className="flex items-center gap-3 py-2.5">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-[#efe9df]">
                          {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                        </div>
                        <span className="min-w-0 flex-1 text-sm leading-snug">
                          {i.title}
                          {i.sku && <span className="block text-muted">арт. {i.sku}</span>}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {i.qty} × {formatPrice(i.price)}
                        </span>
                        <b className="w-20 shrink-0 text-right text-sm tabular-nums">{formatPrice(i.qty * i.price)}</b>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 border-t border-line pt-3 text-sm">
              <dt>Товары</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              <dt>Доставка</dt>
              <dd className="tabular-nums">{order.deliveryPrice === null ? <span className="text-warn">не посчитана</span> : formatPrice(order.deliveryPrice)}</dd>
              <dt className="pt-1 text-base font-semibold">Итого</dt>
              <dd className="pt-1 text-base font-bold tabular-nums">{formatPrice(order.total)}</dd>
            </dl>
          </section>

          <section className="rounded-[var(--radius-card)] bg-card p-5">
            <h2 className="font-semibold">История</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap gap-x-3">
                  <span className="w-28 shrink-0 text-muted">{fmtDate(e.at)}</span>
                  <span className="flex-1">{e.text}</span>
                  <span className="text-muted">{e.by ?? "сайт"}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid h-fit gap-6">
          <section className="rounded-[var(--radius-card)] bg-card p-5 text-sm">
            <h2 className="text-base font-semibold">Покупатель</h2>
            <p className="mt-3 text-base">{order.customerName}</p>
            <a href={`tel:${tel}`} className="mt-1 block text-base font-semibold underline underline-offset-4">
              {order.phone}
            </a>
            {order.email && (
              <a href={`mailto:${order.email}`} className="mt-1 block underline underline-offset-4">
                {order.email}
              </a>
            )}
            {customer && <p className="mt-2 text-muted">Оформлен из кабинета {customer.email}</p>}
            <h3 className="mt-4 font-semibold">Доставка</h3>
            <p className="mt-1">
              {DELIVERY_LABELS[order.deliveryMethod]}
              {order.deliveryCity && <span className="block">{order.deliveryCity}</span>}
              {order.deliveryAddress && <span className="block">{order.deliveryAddress}</span>}
            </p>
            {order.comment && (
              <>
                <h3 className="mt-4 font-semibold">Комментарий покупателя</h3>
                <p className="mt-1 whitespace-pre-line">{order.comment}</p>
              </>
            )}
          </section>

          <section className="rounded-[var(--radius-card)] bg-card p-5">
            <h2 className="font-semibold">Стоимость доставки, ₽</h2>
            <form action={setDelivery.bind(null, order.id)} className="mt-3 flex gap-2">
              <input name="delivery" inputMode="decimal" defaultValue={order.deliveryPrice === null ? "" : order.deliveryPrice / 100} placeholder="например 350" className={input} />
              <button className="shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-white">Сохранить</button>
            </form>
            <p className="mt-2 text-xs text-muted">Итог для покупателя пересчитается. Пустое поле — «посчитаем при подтверждении».</p>
          </section>

          <section className="rounded-[var(--radius-card)] bg-card p-5">
            <h2 className="font-semibold">Заметка менеджера</h2>
            <form action={saveManagerNote.bind(null, order.id)} className="mt-3 grid gap-2">
              <textarea name="note" rows={4} defaultValue={order.managerNote ?? ""} placeholder="Видна только в админке" className={input} />
              <button className="justify-self-start rounded-full border border-ink px-4 py-2 text-sm font-semibold">Сохранить</button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
