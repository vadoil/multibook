import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import type { Metadata } from "next";
import { Constructor, type BlockOpt, type CoverOpt, type DiscOpt, type Initial } from "@/components/Constructor";
import type { Ruling } from "@/components/NotebookPreview";
import { getProduct, listProducts } from "@/lib/catalog";
import { FORMAT_KEYS, FORMATS, formatByDb, type FormatKey } from "@/lib/formats";
import type { Product } from "@/db/schema";
import { StoreTabLink } from "@/components/store/StoreTab";
import type { AccessoryOpt } from "@/components/constructor/AccessoryCarousel";

export const metadata: Metadata = {
  title: "Конструктор блокнота",
  description: "Соберите блокнот на дисках: А5 или мини. Обложка, листы и диски — превью меняется на глазах, совместимость проверяется сама.",
};
export const dynamic = "force-dynamic";

const ok = (p: Product) => p.price > 0 && (p.stock === null || p.stock > 0);
const RULING_BY_SPEC: Record<string, Ruling> = { "В клетку": "grid", "В точку": "dot", "В линейку": "line", "Без линовки": "blank" };

function covers(f: FormatKey): CoverOpt[] {
  if (FORMATS[f].mode === "parts")
    return listProducts({ type: "Обложки" })
      .filter((p) => /а5/i.test(p.title) && !/коробк/i.test(p.title))
      .map((p) => ({
        id: p.id,
        title: p.shortTitle.replace(/^«Обложка»,\s*/, "С клапаном, "),
        note: p.attrs.isSet ? "комплект" : (p.attrs.material?.toLowerCase() ?? "обложка"),
        price: p.price,
        image: p.images[0] ?? null,
        hex: p.attrs.colorHex ?? null,
        print: !!p.attrs.print,
        isSet: !!p.attrs.isSet,
        available: ok(p),
      }));

  // Мини-форматы: готовый блокнот — основа сборки.
  return listProducts({ type: "Блокноты" })
    .filter((p) => p.attrs.format === FORMATS[f].db)
    .map((p) => {
      const name = p.title.match(/["«]([^"»]+)["»]/)?.[1];
      const material = /крафт/i.test(p.title) ? "крафт" : (p.attrs.material?.toLowerCase() ?? "");
      return {
        id: p.id,
        title: name ? `«${name}»` : (p.title.replace(/^Мини блокнот\s*(для заметок)?\s*/i, "").replace(/Multib.ok\s*/i, "") || "Мини").replace(/^./, (c) => c.toUpperCase()),
        note: material || "блокнот",
        price: p.price,
        image: p.images[0] ?? null,
        hex: p.attrs.colorHex ?? (material === "эко-замша" ? "#6b5a48" : "#3b3433"),
        print: !!name && !/Дело|куба/i.test(name),
        isSet: false,
        ruling: RULING_BY_SPEC[p.specs["Разметка"] ?? ""],
        available: ok(p),
      };
    });
}

function blocks(f: FormatKey): BlockOpt[] {
  return listProducts({ type: "Блоки" })
    .filter((p) => p.attrs.format === FORMATS[f].db && !/9,5/.test(p.title))
    .map((p) => ({
      id: p.id,
      title: FORMATS[f].mode === "parts" ? p.shortTitle : (p.attrs.ruling === "blank" ? "Без линовки" : p.title.match(/в (клетку|точку|линейку)/i)?.[0] ?? p.shortTitle).replace(/^в/, "В") + (p.attrs.paper === "cream" ? ", кремовый" : ""),
      price: p.price,
      image: p.images[0] ?? null,
      sheets: p.attrs.sheets ?? (FORMATS[f].mode === "parts" ? 52 : null),
      paper: p.attrs.paper ?? "white",
      ruling: p.attrs.ruling ?? "blank",
      available: ok(p),
    }));
}

function discs(): DiscOpt[] {
  return listProducts({ type: "Диски" })
    .filter((p) => p.attrs.pack === 8 && (p.attrs.diameter === 18 || p.attrs.diameter === 24))
    .map((p) => {
      const a = p.attrs;
      return {
        id: p.id,
        title: p.shortTitle,
        price: p.price,
        image: p.images[0] ?? null,
        hex: a.colorHex ?? (a.finishKind === "clear" ? "#dfe5ea" : "#cfcfcf"),
        diameter: a.diameter as 18 | 24,
        metal: !!a.metal,
        finishKind: a.finishKind ?? "matte",
        variant: [a.color, a.finishKind, a.finish, a.metal ? "m" : ""].join("|"),
        available: ok(p),
      };
    });
}

/** ?f=euro&c=12&b=40.2,41&d=77 — ссылка на сборку; ?with=slug — пришли с карточки товара. */
function initial(f: FormatKey, sp: Record<string, string | undefined>, o: { covers: CoverOpt[]; blocks: BlockOpt[]; discs: DiscOpt[] }): Initial {
  const parts = FORMATS[f].mode === "parts";
  const num = (s?: string) => (s && /^\d+$/.test(s) ? Number(s) : undefined);
  const init: Initial = { cover: num(sp.c), back: num(sp.r), blocks: {}, disc: num(sp.d) ?? null };
  if (!o.covers.some(c => c.id === init.back && !c.isSet)) init.back = undefined;
  for (const part of (sp.b ?? "").split(",").slice(0, o.blocks.length)) {
    const [id, q] = part.split(".");
    const n = num(id);
    if (n && o.blocks.some((b) => b.id === n)) init.blocks[n] = Math.min(parts ? 4 : 5, Math.max(1, num(q) ?? 1));
  }
  const w = sp.with ? getProduct(sp.with) : undefined;
  if (w && o.covers.some((c) => c.id === w.id)) init.cover = w.id;
  if (w && o.blocks.some((b) => b.id === w.id)) init.blocks = { [w.id]: 1 };
  if (w?.type === "Диски") {
    // Пришли с упаковки по 100 — подставим тот же цвет в упаковке на блокнот.
    const v = [w.attrs.color, w.attrs.finishKind, w.attrs.finish, w.attrs.metal ? "m" : ""].join("|");
    init.disc = o.discs.find((d) => d.id === w.id)?.id ?? o.discs.find((d) => d.variant === v)?.id ?? null;
  }

  if (!o.covers.some((c) => c.id === init.cover)) init.cover = o.covers.find((c) => c.available)?.id;
  if (!parts || o.covers.find(c => c.id === init.cover)?.isSet) init.back = undefined;
  if (parts && sp.b !== "0" && !Object.keys(init.blocks).length) {
    const first = o.blocks.find((b) => b.available && b.ruling === "grid") ?? o.blocks.find((b) => b.available);
    if (first) init.blocks[first.id] = 1;
  }
  if (init.disc && !o.discs.some((d) => d.id === init.disc)) init.disc = null;
  // А5 по умолчанию — «под металл»: смотрятся дорого, стоят как пластик. Мини — диски из комплекта.
  if (parts && !init.disc)
    init.disc = o.discs.find((d) => d.available && d.finishKind === "metal" && !d.metal && d.diameter === 24)?.id ?? o.discs.find((d) => d.available)?.id;
  return init;
}

function Silhouette({ w, h, on }: { w: number; h: number; on: boolean }) {
  const k = 40 / 380;
  return (
    <span className="grid h-11 w-9 place-items-end justify-center" aria-hidden>
      <span className={`block rounded-[3px] border-2 transition ${on ? "border-accent bg-accent/10" : "border-ink/60"}`} style={{ width: w * k, height: h * k }} />
    </span>
  );
}

export default async function ConstructorPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const fromProduct = sp.with ? getProduct(sp.with) : undefined;
  const f: FormatKey =
    (FORMAT_KEYS as string[]).includes(sp.f ?? "") ? (sp.f as FormatKey) : (formatByDb(fromProduct?.attrs.format) ?? "a5");
  const o = { covers: covers(f), blocks: blocks(f), discs: discs() };
  const accessories: AccessoryOpt[] = listProducts({ type: "Аксессуары" }).map(p => ({ id: p.id, title: p.shortTitle, href: `/product/${p.slug}`, price: p.price, image: p.images[0] ?? null, available: ok(p) }));
  const available = FORMAT_KEYS.filter((k) => k === f || covers(k).length > 0);

  return (
    <div className="constructor-page page-shell pt-6 sm:pt-8"><Breadcrumbs items={[{ label: "Конструктор" }]} />
      <p className="text-sm uppercase tracking-[0.18em] text-muted">Конструктор</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Соберите свой блокнот</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Обложки, блоки листов и диски — ваш блокнот по частям. Превью и стоимость меняются сразу.
      </p>

      <nav aria-label="Формат" className="mt-6 grid grid-cols-3 gap-2 sm:flex">
        {available.map((k) => {
          const F = FORMATS[k];
          const on = k === f;
          return (
            <StoreTabLink
              key={k}
              href={`/constructor?f=${k}`}
              aria-current={on ? "page" : undefined}
              className="constructor-format-tab"
            >
              <Silhouette w={F.w} h={F.h} on={on} />
              <span>
                <span className="block text-sm font-semibold sm:text-base">{F.label}</span>
                <span className="block text-xs text-muted">{F.size}</span>
              </span>
            </StoreTabLink>
          );
        })}
      </nav>

      <Constructor key={f} format={f} {...o} accessories={accessories} initial={initial(f, sp, o)} />
    </div>
  );
}
