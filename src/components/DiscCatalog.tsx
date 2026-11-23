import Link from "next/link";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/catalog";
import { ProductVisual } from "./ProductVisual";

type Group = { key: string; rep: Product; packs: Product[] };

/** Одна карточка на цвет и покрытие, фасовки 8 / 100 / 1000 — переключателями внутри. */
export function groupDiscs(products: Product[]): Group[] {
  const map = new Map<string, Product[]>();
  for (const p of products) {
    const a = p.attrs;
    const k = [a.diameter ?? "x", a.color, a.finishKind, a.finish, a.metal].join("|");
    map.set(k, [...(map.get(k) ?? []), p]);
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const packs = [...list].sort((a, b) => (a.attrs.pack ?? 8) - (b.attrs.pack ?? 8) || a.price - b.price);
      return { key, rep: packs[0], packs };
    })
    .sort((a, b) => (b.rep.attrs.diameter ?? 0) - (a.rep.attrs.diameter ?? 0) || a.rep.price - b.rep.price);
}

const FILTERS = {
  d: [
    { v: "", label: "Любой диаметр" },
    { v: "24", label: "24 мм — до 86 листов" },
    { v: "18", label: "18 мм — до 64 листов" },
  ],
  m: [
    { v: "", label: "Все" },
    { v: "plastic", label: "Пластик" },
    { v: "metal", label: "Металлик и алюминий" },
    { v: "pearl", label: "Перламутр" },
  ],
} as const;

export function DiscCatalog({ products, d, m }: { products: Product[]; d?: string; m?: string }) {
  const all = groupDiscs(products);
  const groups = all.filter((g) => {
    const a = g.rep.attrs;
    if (d && String(a.diameter) !== d) return false;
    if (m === "plastic") return !a.metal && a.finishKind !== "metal" && a.finishKind !== "pearl";
    if (m === "metal") return a.finishKind === "metal";
    if (m === "pearl") return a.finishKind === "pearl";
    return true;
  });
  const href = (p: { d?: string; m?: string }) => {
    const q = new URLSearchParams({ type: "Диски" });
    const dd = "d" in p ? p.d : d;
    const mm = "m" in p ? p.m : m;
    if (dd) q.set("d", dd);
    if (mm) q.set("m", mm);
    return `/catalog?${q}`;
  };

  return (
    <>
      <div className="mt-6 flex flex-col gap-3">
        {(["d", "m"] as const).map((f) => (
          <div key={f} className="flex flex-wrap gap-2">
            {FILTERS[f].map((o) => {
              const cur = (f === "d" ? d : m) ?? "";
              return (
                <Link
                  key={o.v}
                  href={href({ [f]: o.v || undefined })}
                  aria-current={cur === o.v ? "true" : undefined}
                  className="rounded-full border border-line px-4 py-2 text-sm aria-[current=true]:border-ink aria-[current=true]:bg-ink aria-[current=true]:text-white"
                >
                  {o.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        {groups.length} вариантов. На блокнот А5 нужна одна упаковка — 8 дисков. Упаковки по 100 и 1000 — для мастерских и корпоративных заказов.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {groups.map((g) => {
          const a = g.rep.attrs;
          return (
            <article key={g.key} className="group flex flex-col gap-3 rounded-[var(--radius-card)] p-2 transition hover:bg-card">
              <Link href={`/product/${g.rep.slug}`} className="relative block overflow-hidden rounded-[var(--radius-card)]">
                <div className="transition duration-500 group-hover:scale-[1.03]">
                  <ProductVisual product={g.rep} />
                </div>
              </Link>
              <div className="px-1">
                <h3 className="font-medium leading-snug">{g.rep.shortTitle}</h3>
                <p className="text-sm text-muted">
                  {a.metal ? "Алюминий" : "Пластик"} · {a.diameter ? `${a.diameter} мм` : "диаметр уточняется"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {g.packs.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-line bg-card px-3 py-1.5 text-sm transition hover:border-ink"
                      title={p.attrs.inferred?.includes("pack") ? "Фасовка определена по цене — уточните в карточке" : undefined}
                    >
                      {p.attrs.pack ?? 8} шт · <b>{formatPrice(p.price)}</b>
                    </Link>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
