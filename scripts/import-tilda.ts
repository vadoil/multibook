/**
 * Импорт каталога из публичного API Tilda Store.
 * Запуск: npm run import:tilda
 * Повторный запуск обновляет цены, наличие и описания по uid; товары, исчезнувшие из Tilda, отключаются.
 */
import { eq, notInArray } from "drizzle-orm";
import { db, schema } from "../src/db";
import type { NewProduct, ProductAttrs } from "../src/db/schema";
import { isTestProduct, normalizeProduct, parseType, plainDescription, slugify } from "../src/lib/normalize";

const STOREPART = process.env.TILDA_STOREPART ?? "341682625071";
const RECID = process.env.TILDA_RECID ?? "639786271";
const API = "https://store.tildaapi.com/api/getproductslist/";

type TildaProduct = {
  uid: number | string;
  title: string;
  sku?: string;
  text?: string;
  descr?: string;
  quantity?: string;
  price?: string;
  priceold?: string;
  gallery?: string;
  url?: string;
  sort?: string | number;
  characteristics?: { title: string; value: string }[];
};

async function fetchPage(slice: number): Promise<{ products: TildaProduct[]; total: number; nextslice?: number }> {
  const params = new URLSearchParams({
    storepartuid: STOREPART,
    recid: RECID,
    getparts: "true",
    getoptions: "true",
    size: "100",
    slice: String(slice),
    flag_root: "withroot",
    c: String(Date.now()),
  });
  const res = await fetch(`${API}?${params}`);
  if (!res.ok) throw new Error(`Tilda API ${res.status}`);
  const j = (await res.json()) as { products?: TildaProduct[]; total?: string | number; nextslice?: number };
  return { products: j.products ?? [], total: Number(j.total ?? 0), nextslice: j.nextslice };
}

async function fetchAll(): Promise<TildaProduct[]> {
  const all: TildaProduct[] = [];
  let slice = 1;
  for (let i = 0; i < 20; i++) {
    const page = await fetchPage(slice);
    all.push(...page.products);
    if (!page.nextslice || !page.products.length || all.length >= page.total) break;
    slice = page.nextslice;
  }
  return all;
}

const rub = (v?: string) => (v && Number(v) > 0 ? Math.round(Number(v) * 100) : null);

type Prepared = Omit<NewProduct, "importedAt" | "updatedAt"> & { attrs: ProductAttrs };

/**
 * Диски в Tilda заведены без характеристик, а в названиях встречаются ошибки:
 * у части нет диаметра, у части все три упаковки подписаны «8 шт».
 * Восстанавливаем по соседним товарам того же цвета и покрытия и помечаем как угаданное.
 */
function repairDiscs(items: Prepared[], warnings: string[]) {
  const discs = items.filter((p) => p.type === "Диски");
  const key = (p: Prepared) => [p.attrs.color, p.attrs.finishKind, p.attrs.finish, p.attrs.metal].join("|");
  const groups = new Map<string, Prepared[]>();
  for (const d of discs) groups.set(key(d), [...(groups.get(key(d)) ?? []), d]);

  for (const group of groups.values()) {
    const diameters = [...new Set(group.map((d) => d.attrs.diameter).filter(Boolean))] as number[];
    for (const p of group.filter((p) => !p.attrs.diameter)) {
      // Подставляем диаметр, у которого в этом цвете не хватает именно такой фасовки — и только если вариант один.
      const fits = diameters.filter((d) => !group.some((o) => o !== p && o.attrs.diameter === d && o.attrs.pack === p.attrs.pack));
      if (fits.length === 1) {
        const d = fits[0];
        p.attrs.diameter = d;
        p.attrs.inferred = [...(p.attrs.inferred ?? []), "diameter"];
        warnings.push(`Диаметр не указан, взят у соседних: ${p.title} → ${d} мм`);
      }
    }
    // Внутри одного диаметра: если одна фасовка повторяется с разной ценой — раскладываем 8/100/1000 по цене.
    const byD = new Map<number | undefined, Prepared[]>();
    for (const p of group) byD.set(p.attrs.diameter, [...(byD.get(p.attrs.diameter) ?? []), p]);
    for (const list of byD.values()) {
      const packs = list.map((p) => p.attrs.pack);
      if (new Set(packs).size === packs.length) continue;
      const sorted = [...list].sort((a, b) => a.price! - b.price!);
      // Раскладываем, только если цены явно разных порядков (каждая следующая минимум вдвое дороже).
      if (sorted.length > 3 || sorted.some((p, i) => i > 0 && p.price! < sorted[i - 1].price! * 2)) {
        warnings.push(`Не удалось определить фасовку: ${sorted.map((p) => `${p.title} (${p.price! / 100} ₽)`).join("; ")}`);
        continue;
      }
      const ladder = [8, 100, 1000];
      sorted.forEach((p, i) => {
        const pack = ladder[Math.min(i, ladder.length - 1)];
        if (p.attrs.pack !== pack) {
          warnings.push(`Фасовка в названии не совпадает с ценой: ${p.title} (${p.price! / 100} ₽) → считаем ${pack} шт`);
          p.attrs.pack = pack;
          p.attrs.inferred = [...(p.attrs.inferred ?? []), "pack"];
        }
      });
    }
  }
}

async function main() {
  const startedAt = new Date();
  const warnings: string[] = [];
  const items = await fetchAll();
  console.log(`Получено из Tilda: ${items.length}`);

  const usedSlugs = new Set<string>();
  const seen = new Set<string>();
  const prepared: Prepared[] = [];

  for (const p of items) {
    const uid = String(p.uid);
    if (seen.has(uid)) continue;
    seen.add(uid);

    const chars: Record<string, string> = {};
    for (const c of p.characteristics ?? []) chars[c.title] = c.value;
    const type = parseType(chars, p.title);
    if (type === "Прочее") warnings.push(`Без типа: ${p.title} (${uid})`);
    const { attrs, shortTitle } = normalizeProduct(p.title, type, chars);

    let images: string[] = [];
    try {
      images = (JSON.parse(p.gallery || "[]") as { img: string }[]).map((g) => g.img).filter(Boolean);
    } catch {
      warnings.push(`Не разобрана галерея: ${uid}`);
    }

    let slug = `${slugify(p.title)}-${uid.slice(-6)}`;
    while (usedSlugs.has(slug)) slug += "x";
    usedSlugs.add(slug);

    const price = rub(p.price);
    if (price == null) warnings.push(`Нет цены: ${p.title} (${uid})`);
    prepared.push({
      tildaUid: uid,
      slug,
      title: p.title.trim(),
      shortTitle,
      type,
      price: price ?? 0,
      priceOld: rub(p.priceold),
      sku: p.sku || null,
      stock: p.quantity === "" || p.quantity == null ? null : Number(p.quantity),
      description: plainDescription(p.text || p.descr) ?? null,
      specs: chars,
      attrs,
      images,
      sourceUrl: p.url ?? null,
      isActive: price != null && type !== "Прочее" && !isTestProduct(p.title),
      sortOrder: Number(p.sort ?? 0) || 0,
    });
  }

  repairDiscs(prepared, warnings);

  let created = 0;
  let updated = 0;
  const now = new Date();
  db.transaction((tx) => {
    for (const values of prepared) {
      const existing = tx
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(eq(schema.products.tildaUid, values.tildaUid))
        .get();
      if (existing) {
        tx.update(schema.products).set({ ...values, updatedAt: now }).where(eq(schema.products.id, existing.id)).run();
        updated++;
      } else {
        tx.insert(schema.products).values({ ...values, importedAt: now, updatedAt: now }).run();
        created++;
      }
    }
  });

  const uids = [...seen];
  const deactivated = uids.length
    ? db.update(schema.products).set({ isActive: false }).where(notInArray(schema.products.tildaUid, uids)).run().changes
    : 0;

  db.insert(schema.importRuns)
    .values({ source: "tilda", startedAt, finishedAt: new Date(), created, updated, deactivated, warnings })
    .run();

  console.log(`Создано: ${created}, обновлено: ${updated}, отключено: ${deactivated}`);
  if (warnings.length) console.log(`Предупреждения (${warnings.length}):\n- ${warnings.join("\n- ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
