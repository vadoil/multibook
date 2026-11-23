import Link from "next/link";
import { desc, gte, ne, sql, and } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmtDate, Stat, StatusBadge } from "@/components/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orders";

export default async function AdminHome() {
  await requireAdmin();
  const o = schema.orders;
  const monthAgo = new Date(Date.now() - 30 * 864e5);
  const byStatus = Object.fromEntries(
    db.select({ s: o.status, n: sql<number>`count(*)` }).from(o).groupBy(o.status).all().map((r) => [r.s, r.n]),
  ) as Record<string, number>;
  const month = db
    .select({ n: sql<number>`count(*)`, sum: sql<number>`coalesce(sum(${o.total}), 0)` })
    .from(o)
    .where(and(gte(o.createdAt, monthAgo), ne(o.status, "cancelled")))
    .get()!;
  const latest = db.select().from(o).orderBy(desc(o.createdAt)).limit(8).all();
  const products = db
    .select({ active: sql<number>`sum(${schema.products.isActive})`, locked: sql<number>`count(${schema.products.lockedAt})` })
    .from(schema.products)
    .get()!;

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Сводка</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/orders?status=new">
          <Stat label="Новые — ждут звонка" value={String(byStatus.new ?? 0)} hint="нажмите, чтобы открыть" />
        </Link>
        <Stat label="Заказов за 30 дней" value={String(month.n)} hint="без отменённых" />
        <Stat label="Сумма за 30 дней" value={formatPrice(month.sum)} hint="с доставкой, где посчитана" />
        <Link href="/admin/products">
          <Stat label="Товаров на сайте" value={String(products.active ?? 0)} hint={`правлено вручную: ${products.locked}`} />
        </Link>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">Последние заказы</h2>
        <Link href="/admin/orders" className="text-sm underline underline-offset-4">
          Все заказы
        </Link>
      </div>
      {latest.length ? (
        <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] bg-card px-5">
          {latest.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/orders/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:opacity-80">
                <b className="w-16">№ {r.number}</b>
                <StatusBadge status={r.status} label={STATUS_LABELS[r.status]} />
                <span className="min-w-0 flex-1 truncate">
                  {r.customerName} · {r.phone}
                </span>
                <span className="text-sm text-muted">{fmtDate(r.createdAt)}</span>
                <b className="w-24 text-right tabular-nums">{formatPrice(r.total)}</b>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-muted">Заказов пока нет.</p>
      )}
    </>
  );
}
