import type { Metadata } from "next";
import Link from "next/link";
import { DiscCatalog } from "@/components/DiscCatalog";
import { ProductCard } from "@/components/ProductCard";
import { countByType, listProducts, TYPE_LABELS } from "@/lib/catalog";
import type { ProductType } from "@/db/schema";
import { plural } from "@/lib/plural";

export const dynamic = "force-dynamic";
const PAGE = 48;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }): Promise<Metadata> {
  const sp = await searchParams;
  const t = TYPE_LABELS.find((x) => x.type === sp.type);
  const page = Math.max(1, Number(sp.page) || 1);
  const path = t ? `/catalog?type=${encodeURIComponent(t.type)}${page > 1 ? `&page=${page}` : ""}` : page > 1 ? `/catalog?page=${page}` : "/catalog";
  const title = t ? `${t.label} на дисках — купить` : "Каталог модульных блокнотов на дисках";
  const description = t
    ? `${t.label} Multibook: ${t.hint.toLowerCase()}. Совместимы с блокнотами на дисках, доставка СДЭК по России.`
    : "Тетради, блокноты, обложки, блоки листов и диски для дискового переплёта Multibook. Готовые блокноты и детали, чтобы собрать свой.";
  return { title: page > 1 ? `${title}, страница ${page}` : title, description, alternates: { canonical: path } };
}

const SORTS = [
  { v: "popular", label: "Сначала популярные" },
  { v: "new", label: "Сначала новые" },
  { v: "price-asc", label: "Дешевле" },
  { v: "price-desc", label: "Дороже" },
] as const;
type Sort = (typeof SORTS)[number]["v"];

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string; d?: string; m?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const type = TYPE_LABELS.find((t) => t.type === sp.type)?.type as ProductType | undefined;
  const sort = (SORTS.find((s) => s.v === sp.sort)?.v ?? "popular") as Sort;
  const all = listProducts({ type, sort });
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  // Диски показываются группами по цвету (DiscCatalog) — им отдаём весь список.
  const items = type === "Диски" ? all : all.slice((page - 1) * PAGE, page * PAGE);
  const counts = countByType();
  const href = (p: { type?: string; sort?: string; page?: number }) => {
    const q = new URLSearchParams();
    const t = "type" in p ? p.type : type;
    const s = p.sort ?? sort;
    if (t) q.set("type", t);
    if (s !== "popular") q.set("sort", s);
    if (p.page && p.page > 1) q.set("page", String(p.page));
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
        <span className="text-muted">
          {all.length} {plural(all.length, ["товар", "товара", "товаров"])}
        </span>
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

      {type === "Диски" ? (
        <DiscCatalog products={items} d={sp.d} m={sp.m} />
      ) : items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-muted">
          Здесь пока пусто. Загляните в <Link href="/catalog" className="underline underline-offset-2">весь каталог</Link> или соберите
          блокнот в <Link href="/constructor" className="underline underline-offset-2">конструкторе</Link>.
        </p>
      )}

      {type !== "Диски" && pages > 1 && (
        <nav aria-label="Страницы каталога" className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n })}
              aria-current={n === page ? "page" : undefined}
              className="grid min-h-11 min-w-11 place-items-center rounded-full border border-line px-3 aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white"
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
