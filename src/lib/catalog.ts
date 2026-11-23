import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { ProductType } from "@/db/schema";

export const TYPE_LABELS: { type: ProductType; label: string; hint: string }[] = [
  { type: "Тетради", label: "Тетради", hint: "Готовые модульные тетради" },
  { type: "Блокноты", label: "Блокноты", hint: "Еженедельники и записные книги" },
  { type: "Обложки", label: "Обложки", hint: "Твёрдые и мягкие, комплекты" },
  { type: "Блоки", label: "Блоки листов", hint: "Клетка, точка, линейка, планеры" },
  { type: "Диски", label: "Диски", hint: "18 и 24 мм, пластик и алюминий" },
  { type: "Аксессуары", label: "Аксессуары", hint: "Ручки, дырокол, уголки" },
  { type: "Фотокниги", label: "Фотоальбомы", hint: "Альбомы на дисках" },
];

export { formatPrice } from "./money";

export function listProducts(opts: { type?: ProductType; sort?: "popular" | "price-asc" | "price-desc" | "new" } = {}) {
  const where = and(eq(schema.products.isActive, true), opts.type ? eq(schema.products.type, opts.type) : undefined);
  const order =
    opts.sort === "price-asc"
      ? asc(schema.products.price)
      : opts.sort === "price-desc"
        ? desc(schema.products.price)
        : opts.sort === "new"
          ? desc(schema.products.importedAt)
          : asc(schema.products.sortOrder);
  return db.select().from(schema.products).where(where).orderBy(order).all();
}

export function countByType(): Record<string, number> {
  const rows = db
    .select({ type: schema.products.type, n: sql<number>`count(*)` })
    .from(schema.products)
    .where(eq(schema.products.isActive, true))
    .groupBy(schema.products.type)
    .all();
  return Object.fromEntries(rows.map((r) => [r.type, r.n]));
}

export function getProduct(slug: string) {
  return db.select().from(schema.products).where(eq(schema.products.slug, slug)).get();
}

export function relatedProducts(type: ProductType, excludeId: number, limit = 4) {
  return db
    .select()
    .from(schema.products)
    .where(and(eq(schema.products.isActive, true), eq(schema.products.type, type), sql`${schema.products.id} != ${excludeId}`))
    .orderBy(asc(schema.products.sortOrder))
    .limit(limit)
    .all();
}
