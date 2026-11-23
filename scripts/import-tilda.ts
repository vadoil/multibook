/**
 * Импорт каталога из публичного API Tilda Store.
 * Запуск: npm run import:tilda
 * Повторный запуск обновляет цены, наличие и описания по uid; товары, исчезнувшие из Tilda, отключаются.
 */
import { eq, notInArray } from "drizzle-orm";
import { db, schema } from "../src/db";
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

async function main() {
  const startedAt = new Date();
  const warnings: string[] = [];
  const items = await fetchAll();
  console.log(`Получено из Tilda: ${items.length}`);

  const seenUids: string[] = [];
  const usedSlugs = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const p of items) {
    const uid = String(p.uid);
    if (seenUids.includes(uid)) continue;
    seenUids.push(uid);

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
    const now = new Date();
    const values = {
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
      updatedAt: now,
    };

    const existing = db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.tildaUid, uid)).get();
    if (existing) {
      db.update(schema.products).set(values).where(eq(schema.products.id, existing.id)).run();
      updated++;
    } else {
      db.insert(schema.products).values({ ...values, importedAt: now }).run();
      created++;
    }
  }

  const deactivated = seenUids.length
    ? db.update(schema.products).set({ isActive: false }).where(notInArray(schema.products.tildaUid, seenUids)).run().changes
    : 0;

  db.insert(schema.importRuns)
    .values({ source: "tilda", startedAt, finishedAt: new Date(), created, updated, deactivated, warnings })
    .run();

  console.log(`Создано: ${created}, обновлено: ${updated}, отключено: ${deactivated}`);
  if (warnings.length) console.log(`Предупреждения (${warnings.length}):\n- ${warnings.slice(0, 30).join("\n- ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
