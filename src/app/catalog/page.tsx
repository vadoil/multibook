import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { countByType, listProducts, TYPE_LABELS } from "@/lib/catalog";
import type { ProductType } from "@/db/schema";

export const metadata: Metadata = { title: "Каталог" };
export const dynamic = "force-dynamic";

const SORTS = [
  { v: "popular", label: "Сначала популярные" },
  { v: "new", label: "Сначала новые" },
  { v: "price-asc", label: "Дешевле" },
  { v: "price-desc", label: "Дороже" },
] as const;
type Sort = (typeof SORTS)[number]["v"];

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: string }> }) {
  const sp = await searchParams;
  const type = TYPE_LABELS.find((t) => t.type === sp.type)?.type as ProductType | undefined;
  const sort = (SORTS.find((s) => s.v === sp.sort)?.v ?? "popular") as Sort;
  const items = listProducts({ type, sort });
  const counts = countByType();
  const href = (p: { type?: string; sort?: string }) => {
    const q = new URLSearchParams();
    const t = "type" in p ? p.type : type;
    const s = p.sort ?? sort;
    if (t) q.set("type", t);
    if (s !== "popular") q.set("sort", s);
    const qs = q.toString();
    return `/catalog${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{type ? TYPE_LABELS.find((t) => t.type === type)!.label : "Каталог"}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Готовые тетради и блокноты — или части, чтобы собрать свой: обложки, блоки листов и диски совместимы между собой в формате А5.
      </p>

      <nav aria-label="Категории" className="mt-8 flex gap-2 overflow-x-auto pb-2">
        <Link
          href={href({ type: undefined })}
          aria-current={!type ? "page" : undefined}
          className="shrink-0 rounded-full border border-line px-4 py-2 text-sm aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white"
        >
          Всё
        </Link>
        {TYPE_LABELS.filter((t) => counts[t.type]).map((t) => (
          <Link
            key={t.type}
            href={href({ type: t.type })}
            aria-current={type === t.type ? "page" : undefined}
            className="shrink-0 rounded-full border border-line px-4 py-2 text-sm aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white"
          >
            {t.label} <span className="opacity-60">{counts[t.type]}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted">{items.length} товаров</span>
        <div className="flex flex-wrap gap-1">
          {SORTS.map((s) => (
            <Link
              key={s.v}
              href={href({ sort: s.v })}
              aria-current={sort === s.v ? "true" : undefined}
              className="rounded-full px-3 py-1.5 text-muted aria-[current=true]:bg-card aria-[current=true]:text-ink"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {(type === "Обложки" || type === "Блоки" || type === "Диски") && (
        <Link href="/constructor" className="mt-6 flex items-center justify-between rounded-[var(--radius-card)] bg-ink px-5 py-4 text-white">
          <span>Собираете блокнот из частей? В конструкторе совместимость проверяется сама.</span>
          <span aria-hidden>→</span>
        </Link>
      )}

      {items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-muted">
          Каталог пуст. Запустите импорт: <code>npm run import:tilda</code>
        </p>
      )}
    </div>
  );
}
