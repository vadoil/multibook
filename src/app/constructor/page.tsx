import type { Metadata } from "next";
import { Constructor, type BlockOpt, type CoverOpt, type DiscOpt, type Initial } from "@/components/Constructor";
import { getProduct, listProducts } from "@/lib/catalog";
import type { Product } from "@/db/schema";

export const metadata: Metadata = {
  title: "Конструктор блокнота",
  description: "Соберите блокнот А5 на дисках: обложка, блоки листов и диски. Превью меняется на глазах, совместимость проверяется сама.",
};
export const dynamic = "force-dynamic";

const ok = (p: Product) => p.price > 0 && (p.stock === null || p.stock > 0);

function options() {
  const covers: CoverOpt[] = listProducts({ type: "Обложки" })
    .filter((p) => /а5/i.test(p.title) && !/коробк/i.test(p.title))
    .map((p) => ({
      id: p.id,
      title: p.shortTitle.replace(/^«Обложка»,\s*/, "С клапаном, "),
      price: p.price,
      image: p.images[0] ?? null,
      hex: p.attrs.colorHex ?? null,
      print: !!p.attrs.print,
      isSet: !!p.attrs.isSet,
      material: p.attrs.material ?? null,
      available: ok(p),
    }));

  const blocks: BlockOpt[] = listProducts({ type: "Блоки" })
    .filter((p) => p.attrs.format === "А5" && !/9,5/.test(p.title))
    .map((p) => ({
      id: p.id,
      title: p.shortTitle,
      price: p.price,
      image: p.images[0] ?? null,
      sheets: p.attrs.sheets ?? 52,
      approx: !p.attrs.sheets,
      paper: p.attrs.paper ?? "white",
      ruling: p.attrs.ruling ?? "blank",
      available: ok(p),
    }));

  const discs: DiscOpt[] = listProducts({ type: "Диски" })
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

  return { covers, blocks, discs };
}

/** ?c=12&b=40.2,41&d=77 — ссылка на сборку; ?with=slug — пришли с карточки товара. */
function initial(sp: Record<string, string | undefined>, o: ReturnType<typeof options>): Initial {
  const num = (s?: string) => (s && /^\d+$/.test(s) ? Number(s) : undefined);
  const init: Initial = { cover: num(sp.c), blocks: {}, disc: num(sp.d) };
  for (const part of (sp.b ?? "").split(",").slice(0, 6)) {
    const [id, q] = part.split(".");
    const n = num(id);
    if (n && o.blocks.some((b) => b.id === n)) init.blocks[n] = Math.min(4, Math.max(1, num(q) ?? 1));
  }
  if (sp.with) {
    const p = getProduct(sp.with);
    if (p && o.covers.some((c) => c.id === p.id)) init.cover = p.id;
    if (p && o.blocks.some((b) => b.id === p.id)) init.blocks = { [p.id]: 1 };
    if (p && p.type === "Диски") {
      // Пришли с упаковки по 100 — подставим тот же цвет в упаковке на блокнот.
      const v = [p.attrs.color, p.attrs.finishKind, p.attrs.finish, p.attrs.metal ? "m" : ""].join("|");
      init.disc = o.discs.find((d) => d.id === p.id)?.id ?? o.discs.find((d) => d.variant === v)?.id;
    }
  }
  if (!o.covers.some((c) => c.id === init.cover)) init.cover = o.covers.find((c) => c.available)?.id;
  if (!Object.keys(init.blocks).length) {
    const first = o.blocks.find((b) => b.available && b.ruling === "grid") ?? o.blocks.find((b) => b.available);
    if (first) init.blocks[first.id] = 1;
  }
  // По умолчанию — серебристые «под металл»: смотрятся дорого, стоят как пластик.
  if (!o.discs.some((d) => d.id === init.disc))
    init.disc = o.discs.find((d) => d.available && d.finishKind === "metal" && !d.metal && d.diameter === 24)?.id ?? o.discs.find((d) => d.available)?.id;
  return init;
}

export default async function ConstructorPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const o = options();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">Конструктор · формат А5</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Соберите свой блокнот</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Выберите обложку, листы и диски — превью меняется сразу. Если листов больше, чем держат диски, конструктор подскажет.
      </p>
      <Constructor {...o} initial={initial(sp, o)} />
    </div>
  );
}
