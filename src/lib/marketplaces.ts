import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Остатки и карточки с Ozon и Wildberries. Ключи — только в .env на сервере:
 *   OZON_CLIENT_ID, OZON_API_KEY          — Ozon Seller API (кабинет продавца → Настройки → API-ключи, роль «Только чтение»)
 *   WB_API_TOKEN                          — Wildberries (кабинет → Доступ к API, категории «Контент» и «Статистика», только чтение)
 * Товары связываются по артикулу: products.sku = offer_id на Ozon = «Артикул продавца» на WB.
 * Связь можно поправить вручную в карточке товара в админке.
 */
export const ozonReady = () => !!(process.env.OZON_CLIENT_ID && process.env.OZON_API_KEY);
export const wbReady = () => !!process.env.WB_API_TOKEN;

export const ozonLink = (sku: string) => `https://www.ozon.ru/product/${sku}/`;
export const wbLink = (nmId: string) => `https://www.wildberries.ru/catalog/${nmId}/detail.aspx`;

export type MarketRow = { article: string; id: string; stock: number };

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase();

async function ozonCall<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`https://api-seller.ozon.ru${path}`, {
    method: "POST",
    headers: { "Client-Id": process.env.OZON_CLIENT_ID!, "Api-Key": process.env.OZON_API_KEY!, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Ozon ${path}: ${res.status} ${(await res.text()).slice(0, 160)}`);
  return (await res.json()) as T;
}

/** Ozon: остатки по всем товарам продавца (FBO + FBS, за вычетом резерва). */
export async function fetchOzon(): Promise<MarketRow[]> {
  type Item = { offer_id: string; stocks?: { present?: number; reserved?: number; sku?: number }[] };
  const out: MarketRow[] = [];
  let cursor = "";
  for (let page = 0; page < 50; page++) {
    const r = await ozonCall<{ items?: Item[]; cursor?: string }>("/v4/product/info/stocks", { filter: { visibility: "ALL" }, limit: 1000, cursor });
    for (const it of r.items ?? []) {
      const stocks = it.stocks ?? [];
      out.push({
        article: it.offer_id,
        id: String(stocks.find((s) => s.sku)?.sku ?? ""),
        stock: stocks.reduce((sum, s) => sum + Math.max(0, (s.present ?? 0) - (s.reserved ?? 0)), 0),
      });
    }
    if (!r.cursor || !(r.items ?? []).length) break;
    cursor = r.cursor;
  }
  return out;
}

/** Wildberries: остатки на складах WB из отчёта статистики, сумма по всем складам и размерам. */
export async function fetchWb(): Promise<MarketRow[]> {
  const res = await fetch("https://statistics-api.wildberries.ru/api/v1/supplier/stocks?dateFrom=2019-06-20", {
    headers: { authorization: process.env.WB_API_TOKEN! },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Wildberries: ${res.status} ${(await res.text()).slice(0, 160)}`);
  const rows = (await res.json()) as { supplierArticle?: string; nmId?: number; quantity?: number }[];
  const by = new Map<string, MarketRow>();
  for (const r of rows) {
    if (!r.nmId) continue;
    const key = String(r.nmId);
    const cur = by.get(key) ?? { article: r.supplierArticle ?? "", id: key, stock: 0 };
    cur.stock += Math.max(0, r.quantity ?? 0);
    by.set(key, cur);
  }
  return [...by.values()];
}

export const STOCK_RULES = [
  { v: "keep", label: "Не менять остаток на сайте" },
  { v: "ozon", label: "Как на Ozon" },
  { v: "wb", label: "Как на Wildberries" },
  { v: "min", label: "Меньший из двух" },
] as const;
export type StockRule = (typeof STOCK_RULES)[number]["v"];

export type SyncResult = { ozon: string; wb: string; matched: number; siteUpdated: number };

/**
 * Забирает остатки с площадок и записывает их в товары. Связь: сначала по сохранённому id площадки
 * (ozon_sku / wb_nm_id), иначе по артикулу. rule решает, обновлять ли остаток самого сайта.
 */
export async function syncMarketplaces(rule: StockRule): Promise<SyncResult> {
  const result: SyncResult = { ozon: "не подключён", wb: "не подключён", matched: 0, siteUpdated: 0 };
  let ozon: MarketRow[] | null = null;
  let wb: MarketRow[] | null = null;
  if (ozonReady())
    try {
      ozon = await fetchOzon();
      result.ozon = `получено ${ozon.length}`;
    } catch (e) {
      result.ozon = `ошибка: ${(e as Error).message}`;
    }
  if (wbReady())
    try {
      wb = await fetchWb();
      result.wb = `получено ${wb.length}`;
    } catch (e) {
      result.wb = `ошибка: ${(e as Error).message}`;
    }
  if (!ozon && !wb) return result;

  const index = (rows: MarketRow[] | null) => ({ byId: new Map((rows ?? []).filter((r) => r.id).map((r) => [r.id, r])), byArticle: new Map((rows ?? []).filter((r) => r.article).map((r) => [norm(r.article), r])) });
  const oz = index(ozon);
  const w = index(wb);
  const now = new Date();
  for (const p of db.select().from(schema.products).all()) {
    const o = ozon ? ((p.ozonSku && oz.byId.get(p.ozonSku)) || (p.sku && oz.byArticle.get(norm(p.sku))) || null) : null;
    const b = wb ? ((p.wbNmId && w.byId.get(p.wbNmId)) || (p.sku && w.byArticle.get(norm(p.sku))) || null) : null;
    if (!o && !b) continue;
    result.matched++;
    const patch: Partial<typeof schema.products.$inferInsert> = { marketSyncedAt: now };
    if (o) Object.assign(patch, { ozonStock: o.stock, ozonSku: o.id || p.ozonSku, ozonUrl: p.ozonUrl ?? (o.id ? ozonLink(o.id) : null) });
    if (b) Object.assign(patch, { wbStock: b.stock, wbNmId: b.id, wbUrl: p.wbUrl ?? wbLink(b.id) });
    const site = rule === "ozon" ? o?.stock : rule === "wb" ? b?.stock : rule === "min" && o && b ? Math.min(o.stock, b.stock) : undefined;
    if (site !== undefined && site !== p.stock) {
      // lockedAt: импорт из Tilda больше не перезапишет остаток, выставленный с площадки.
      Object.assign(patch, { stock: site, lockedAt: now, updatedAt: now });
      result.siteUpdated++;
    }
    db.update(schema.products).set(patch).where(eq(schema.products.id, p.id)).run();
  }
  return result;
}
