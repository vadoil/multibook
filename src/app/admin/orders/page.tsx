import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { fmtDate, input, StatusBadge } from "@/components/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { DELIVERY_LABELS, STATUS_LABELS } from "@/lib/orders";

export const metadata: Metadata = { title: "Заказы" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const o = schema.orders;
  // Поиск без учёта регистра по-русски — в JS (LIKE в SQLite так не умеет). Телефон ищем по цифрам.
  const needle = q.toLocaleLowerCase("ru");
  const digits = q.replace(/\D/g, "");
  const rows = db
    .select()
    .from(o)
    .where(status ? eq(o.status, status) : undefined)
    .orderBy(desc(o.createdAt))
    .limit(q ? 5000 : 200)
    .all()
    .filter(
      (r) =>
        !q ||
        `${r.number} ${r.customerName} ${r.email ?? ""}`.toLocaleLowerCase("ru").includes(needle) ||
        (digits.length >= 3 && r.phone.replace(/\D/g, "").includes(digits)),
    )
    .slice(0, 200);
  const counts = Object.fromEntries(db.select({ s: o.status, n: sql<number>`count(*)` }).from(o).groupBy(o.status).all().map((r) => [r.s, r.n]));
  const href = (s?: string) => `/admin/orders${s ? `?status=${s}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Заказы</h1>
        <form className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Номер, имя, телефон, почта" className={`${input} w-64`} />
          <button className="rounded-full bg-ink px-4 text-sm font-semibold text-white">Найти</button>
        </form>
      </div>

      <nav aria-label="Статусы" className="mt-5 flex flex-wrap gap-1.5">
        <Link href={href()} aria-current={!status ? "page" : undefined} className="rounded-full border border-line px-3 py-1.5 text-sm aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white">
          Все
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={href(s)} aria-current={status === s ? "page" : undefined} className="rounded-full border border-line px-3 py-1.5 text-sm aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white">
            {STATUS_LABELS[s]} <span className="opacity-60">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-5 overflow-x-auto rounded-[var(--radius-card)] bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-medium">№</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Покупатель</th>
              <th className="px-4 py-3 font-medium">Доставка</th>
              <th className="px-4 py-3 font-medium">Создан</th>
              <th className="px-4 py-3 text-right font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${r.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {r.number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} />
                </td>
                <td className="px-4 py-3">
                  {r.customerName}
                  <span className="block text-muted">{r.phone}</span>
                </td>
                <td className="px-4 py-3">
                  {DELIVERY_LABELS[r.deliveryMethod]}
                  {r.deliveryCity && <span className="block text-muted">{r.deliveryCity}</span>}
                </td>
                <td className="px-4 py-3 text-muted">{fmtDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">
                  {formatPrice(r.total)}
                  {r.deliveryPrice === null && <span className="block text-xs font-normal text-warn">без доставки</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-8 text-center text-muted">Ничего не нашлось.</p>}
      </div>
    </>
  );
}
