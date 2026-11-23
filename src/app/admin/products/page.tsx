import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { PRODUCT_TYPES, type ProductType } from "@/db/schema";
import { input } from "@/components/admin";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { toggleProduct } from "../actions";

export const metadata: Metadata = { title: "Товары" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; hidden?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const p = schema.products;
  const type = ([...PRODUCT_TYPES, "Прочее"] as string[]).includes(sp.type ?? "") ? (sp.type as ProductType) : undefined;
  const q = (sp.q ?? "").trim().slice(0, 60);
  // LIKE в SQLite не умеет без учёта регистра для кириллицы — товаров сотни, фильтруем в JS.
  const needle = q.toLocaleLowerCase("ru");
  const rows = db
    .select()
    .from(p)
    .where(and(type ? eq(p.type, type) : undefined, sp.hidden === "1" ? eq(p.isActive, false) : undefined))
    .orderBy(asc(p.type), asc(p.sortOrder))
    .all()
    .filter((r) => !needle || `${r.title} ${r.sku ?? ""}`.toLocaleLowerCase("ru").includes(needle));

  const qs = (patch: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const all = { q: q || undefined, type, hidden: sp.hidden, ...patch };
    for (const [k, v] of Object.entries(all)) if (v) u.set(k, v);
    return `/admin/products${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Товары</h1>
        <form className="flex gap-2">
          {type && <input type="hidden" name="type" value={type} />}
          <input name="q" defaultValue={q} placeholder="Название или артикул" className={`${input} w-64`} />
          <button className="rounded-full bg-ink px-4 text-sm font-semibold text-white">Найти</button>
        </form>
      </div>
      <nav className="mt-5 flex flex-wrap gap-1.5 text-sm">
        <Link href={qs({ type: undefined })} aria-current={!type ? "page" : undefined} className="rounded-full border border-line px-3 py-1.5 aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white">
          Все типы
        </Link>
        {[...PRODUCT_TYPES, "Прочее"].map((t) => (
          <Link key={t} href={qs({ type: t })} aria-current={type === t ? "page" : undefined} className="rounded-full border border-line px-3 py-1.5 aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white">
            {t}
          </Link>
        ))}
        <Link href={qs({ hidden: sp.hidden === "1" ? undefined : "1" })} aria-current={sp.hidden === "1" ? "page" : undefined} className="ml-auto rounded-full border border-line px-3 py-1.5 aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white">
          Только скрытые
        </Link>
      </nav>

      <p className="mt-4 text-sm text-muted">
        {rows.length} шт. Товар, исправленный здесь, помечается «вручную» — импорт из Tilda больше не меняет его цену, название, наличие и видимость.
      </p>

      <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] bg-card">
        {rows.map((r) => (
          <li key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${r.isActive ? "" : "opacity-60"}`}>
            <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#efe9df]">
              {r.images[0] && <Image src={r.images[0]} alt="" fill sizes="44px" className="object-cover" />}
            </div>
            <Link href={`/admin/products/${r.id}`} className="min-w-0 flex-1 basis-60 text-sm leading-snug hover:underline">
              {r.title}
              <span className="block text-muted">
                {r.type}
                {r.sku && ` · арт. ${r.sku}`}
                {r.lockedAt && <span className="ml-2 rounded bg-paper px-1.5 py-0.5 text-xs text-ink">вручную</span>}
                {r.attrs.inferred?.length ? <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-xs text-warn">проверить данные</span> : null}
              </span>
            </Link>
            <span className="w-16 text-right text-sm text-muted">{r.stock === null ? "∞" : `${r.stock} шт`}</span>
            <b className="w-24 text-right text-sm tabular-nums">{formatPrice(r.price)}</b>
            <form action={toggleProduct.bind(null, r.id, !r.isActive)}>
              <button className={`w-28 rounded-full px-3 py-1.5 text-xs font-semibold ${r.isActive ? "bg-ok/15 text-ok" : "border border-line text-muted"}`}>
                {r.isActive ? "На сайте" : "Скрыт"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
