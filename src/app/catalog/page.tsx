import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import type { Metadata } from "next";
import Link from "next/link";
import { DiscCatalog } from "@/components/DiscCatalog";
import { ProductCard } from "@/components/ProductCard";
import { countByType, listProducts, TYPE_LABELS } from "@/lib/catalog";
import type { ProductType } from "@/db/schema";
import { plural } from "@/lib/plural";
import { typeLabel } from "@/lib/seo";
import { StoreNavIcon } from "@/components/store/StoreNavIcon";
import { CategoryTabIcon } from "@/components/store/StoreTab";
import "@/components/store/shop.css";

export const dynamic = "force-dynamic";
const PAGE = 48;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }): Promise<Metadata> {
  const sp = await searchParams;
  const t = TYPE_LABELS.find((x) => x.type === sp.type);
  const page = Math.max(1, Number(sp.page) || 1);
  const path = t ? `/catalog?type=${encodeURIComponent(t.type)}${page > 1 ? `&page=${page}` : ""}` : page > 1 ? `/catalog?page=${page}` : "/catalog";
  const title = t ? (t.type === "Диски" ? "Диски для блокнотов и тетрадей — купить" : `${t.label} на дисках — купить`) : "Каталог модульных блокнотов на дисках";
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
const RULINGS = [{ value: "grid", label: "Клетка" }, { value: "dot", label: "Точка" }, { value: "line", label: "Линейка" }, { value: "blank", label: "Без линовки" }, { value: "plan", label: "Планер" }];
const formatLabel = (value: string) => ({ "85х160": "Мини 8,5 × 16 см", "85х95": "Мини 8,5 × 9,5 см" }[value] ?? value);
const FORMAT_ORDER = ["А5", "А4", "85х160", "85х95"];
type FilterPatch = { type?: string; sort?: string; format?: string; ruling?: string; material?: string; available?: string; page?: number };

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; sort?: string; d?: string; m?: string; page?: string; format?: string; ruling?: string; material?: string; available?: string }>;
}) {
  const sp = await searchParams;
  const type = TYPE_LABELS.find((t) => t.type === sp.type)?.type as ProductType | undefined;
  const sort = (SORTS.find((s) => s.v === sp.sort)?.v ?? "popular") as Sort;
  const collection = listProducts({ type, sort });
  const formats = [...new Set(collection.flatMap((p) => p.attrs.format ? [p.attrs.format] : []))].sort((a,b) => {
    const rank = (value: string) => FORMAT_ORDER.includes(value) ? FORMAT_ORDER.indexOf(value) : FORMAT_ORDER.length;
    return rank(a) - rank(b) || a.localeCompare(b,"ru");
  });
  const materials = [...new Set(collection.flatMap((p) => p.attrs.material ? [p.attrs.material] : []))].sort((a,b)=>a.localeCompare(b,"ru"));
  const rulings = RULINGS.filter((r)=>collection.some((p)=>p.attrs.ruling===r.value));
  const format = formats.includes(sp.format ?? "") ? sp.format : undefined;
  const ruling = rulings.some((r)=>r.value===sp.ruling) ? sp.ruling : undefined;
  const material = materials.includes(sp.material ?? "") ? sp.material : undefined;
  const available = sp.available === "1" ? "1" : undefined;
  const all = collection.filter((p) => (!format || p.attrs.format === format) && (!ruling || p.attrs.ruling === ruling) && (!material || p.attrs.material === material) && (!available || p.stock === null || p.stock > 0));
  const pages = Math.max(1, Math.ceil(all.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  // Диски показываются группами по цвету (DiscCatalog) — им отдаём весь список.
  const items = type === "Диски" ? all : all.slice((page - 1) * PAGE, page * PAGE);
  const counts = countByType();
  const href = (p: FilterPatch) => {
    const q = new URLSearchParams();
    const t = "type" in p ? p.type : type;
    const s = p.sort ?? sort;
    if (t) q.set("type", t);
    if (s !== "popular") q.set("sort", s);
    // Category changes start a clean selection; sorting and pagination retain it.
    const next = "type" in p ? p : { format, ruling, material, available, ...p };
    for (const key of ["format", "ruling", "material", "available"] as const) if (next[key]) q.set(key, next[key]!);
    if (!("type" in p) && type === "Диски") {
      if (sp.d) q.set("d", sp.d);
      if (sp.m) q.set("m", sp.m);
    }
    if (p.page && p.page > 1) q.set("page", String(p.page));
    const qs = q.toString();
    return `/catalog${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="catalog-page page-shell pt-8"><Breadcrumbs items={type ? [{ label: "Каталог", href: "/catalog" }, { label: typeLabel(type) }] : [{ label: "Каталог" }]} />
      <h1 className="font-display text-4xl font-bold sm:text-5xl">{type ? TYPE_LABELS.find((t) => t.type === type)!.label : "Каталог"}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Готовые тетради и блокноты — или части, чтобы собрать свой: обложки, блоки листов и диски совместимы между собой в формате А5.
      </p>

      <nav aria-label="Категории" className="catalog-categories mt-8 flex gap-2 overflow-x-auto pb-2">
        <Link
          href={href({ type: undefined })}
          aria-current={!type ? "page" : undefined}
          className="store-tab"
        >
          <StoreNavIcon kind="shop" />Всё
        </Link>
        {TYPE_LABELS.filter((t) => counts[t.type]).map((t) => (
          <Link
            key={t.type}
            href={href({ type: t.type })}
            aria-current={type === t.type ? "page" : undefined}
            className="store-tab"
          >
            <CategoryTabIcon type={t.type} />{t.type === "Блокноты" ? "Ежедневники" : t.label} <span className="store-tab-count">{counts[t.type]}</span>
          </Link>
        ))}
      </nav>

      <section className="catalog-filter-panel" aria-label="Фильтры товаров">
        {formats.length > 0 && <div className="catalog-filter-group">
          <span className="catalog-filter-label"><StoreNavIcon kind="shop" />Формат</span>
          <nav className="catalog-filter-options" aria-label="Формат">
            <Link className="store-tab store-tab-compact" href={href({format:undefined})} aria-current={!format ? "true" : undefined}>Все форматы</Link>
            {formats.map((f)=><Link className="store-tab store-tab-compact" key={f} href={href({format:f})} aria-current={format===f ? "true" : undefined}>{formatLabel(f)}<small>{collection.filter((p)=>p.attrs.format===f).length}</small></Link>)}
          </nav>
        </div>}
        {rulings.length > 0 && <div className="catalog-filter-group">
          <span className="catalog-filter-label"><StoreNavIcon kind="binding" />Линовка</span>
          <nav className="catalog-filter-options" aria-label="Линовка">
            <Link className="store-tab store-tab-compact" href={href({ruling:undefined})} aria-current={!ruling ? "true" : undefined}>Любая</Link>
            {rulings.map((r)=><Link className="store-tab store-tab-compact" key={r.value} href={href({ruling:r.value})} aria-current={ruling===r.value ? "true" : undefined}>{r.label}</Link>)}
          </nav>
        </div>}
        <div className="catalog-filter-extra">
          {materials.length > 0 && <details className="catalog-material" key={`${type ?? "all"}-${material ?? "all"}`}>
            <summary className="store-tab store-tab-compact">{material ?? "Материал"}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg></summary>
            <nav className="catalog-material-options" aria-label="Материал">
              <Link className="store-tab store-tab-compact" href={href({material:undefined})} aria-current={!material ? "true" : undefined}>Любой материал</Link>
              {materials.map((m)=><Link className="store-tab store-tab-compact" key={m} href={href({material:m})} aria-current={material===m ? "true" : undefined}>{m}</Link>)}
            </nav>
          </details>}
          <Link className="store-tab store-tab-compact" href={href({available:available ? undefined : "1"})} aria-current={available ? "true" : undefined} aria-label={available ? "Показать товары с любым наличием" : "Показать только товары в наличии"}>Только в наличии</Link>
          {(format || ruling || material || available) && <Link className="store-tab store-tab-compact catalog-filter-reset" href={href({format:undefined,ruling:undefined,material:undefined,available:undefined})}>Сбросить фильтры</Link>}
        </div>
      </section>

      <div className="catalog-toolbar mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted" aria-live="polite">
          Найдено: {all.length} {plural(all.length, ["товар", "товара", "товаров"])}
        </span>
        <div className="catalog-sorts flex flex-wrap gap-1">
          {SORTS.map((s) => (
            <Link
              key={s.v}
              href={href({ sort: s.v })}
              aria-current={sort === s.v ? "true" : undefined}
              className="store-tab store-tab-compact"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {type === "Диски" ? (
        <DiscCatalog products={items} d={sp.d} m={sp.m} />
      ) : items.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <StoreNavIcon kind="shop" />
          <p>С такими параметрами товаров пока нет. Попробуйте другой формат или снимите часть фильтров.</p>
          <Link className="shop-all" href={href({format:undefined,ruling:undefined,material:undefined,available:undefined})}>Показать всю категорию</Link>
        </div>
      )}

      {(type === "Обложки" || type === "Блоки" || type === "Диски") && (
        <Link href="/constructor" className="mt-6 flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-ink px-5 py-4 text-white">
          <span>Подберите совместимые детали в конструкторе.</span>
          <StoreNavIcon kind="constructor" />
        </Link>
      )}

      {type !== "Диски" && pages > 1 && (
        <nav aria-label="Страницы каталога" className="mt-10 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={href({ page: n })}
              aria-current={n === page ? "page" : undefined}
              className="store-tab store-tab-compact"
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
