"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { ozonLink, STOCK_RULES, type StockRule, syncMarketplaces, wbLink } from "@/lib/marketplaces";

export async function runMarketSync(fd: FormData) {
  await requireAdmin();
  const rule = (STOCK_RULES.find((r) => r.v === fd.get("rule"))?.v ?? "keep") as StockRule;
  const r = await syncMarketplaces(rule);
  revalidatePath("/", "layout");
  redirect(`/admin/marketplaces?result=${encodeURIComponent(`Ozon: ${r.ozon}. Wildberries: ${r.wb}. Связано товаров: ${r.matched}. Остаток на сайте изменён у ${r.siteUpdated}.`)}`);
}

/** Ссылка на маркетплейс: только https и только свой домен площадки, иначе не сохраняем. */
function marketUrl(raw: string, hosts: string[]): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" && hosts.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`)) ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

/** Ручная связь товара с карточками площадок: ссылка или номер (SKU Ozon, артикул WB). */
export async function saveMarketLinks(productId: number, fd: FormData) {
  await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const digits = (v: string) => (/^\d{4,15}$/.test(v) ? v : null);
  const ozonRaw = s("ozon");
  const wbRaw = s("wb");
  const ozonSku = digits(ozonRaw) ?? ozonRaw.match(/-(\d{6,15})\/?(?:\?|$)/)?.[1] ?? null;
  const wbNmId = digits(wbRaw) ?? wbRaw.match(/catalog\/(\d{4,15})/)?.[1] ?? null;
  db.update(schema.products)
    .set({
      ozonSku,
      ozonUrl: marketUrl(ozonRaw, ["ozon.ru"]) ?? (ozonSku ? ozonLink(ozonSku) : null),
      wbNmId,
      wbUrl: marketUrl(wbRaw, ["wildberries.ru", "wb.ru"]) ?? (wbNmId ? wbLink(wbNmId) : null),
    })
    .where(eq(schema.products.id, productId))
    .run();
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}?saved=1#market`);
}
