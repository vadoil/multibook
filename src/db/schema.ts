import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/** Нормализованные свойства товара — заполняются при импорте (src/lib/normalize.ts). */
export type ProductAttrs = {
  format?: string; // "А5", "А4", "85х160", "85х95"
  sheets?: number; // листов в блоке
  paper?: "white" | "cream";
  ruling?: "grid" | "dot" | "line" | "blank" | "plan";
  diameter?: number; // мм, для дисков
  pack?: number; // штук в упаковке дисков
  material?: string; // материал обложки
  isSet?: boolean; // комплект обложек (перед + зад)
  print?: boolean; // обложка с принтом
  color?: string; // название цвета
  colorHex?: string;
  metal?: boolean; // алюминиевые диски
  finish?: string; // матовые / глянцевые / перламутровые
  finishKind?: "matte" | "gloss" | "pearl" | "metal" | "clear"; // как рисовать диск
  inferred?: string[]; // какие свойства угаданы при импорте — данные в Tilda стоит поправить
};

export const PRODUCT_TYPES = [
  "Тетради",
  "Блокноты",
  "Обложки",
  "Блоки",
  "Диски",
  "Аксессуары",
  "Фотокниги",
  "Распродажа",
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number] | "Прочее";

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tildaUid: text("tilda_uid").notNull().unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    shortTitle: text("short_title").notNull(),
    type: text("type").$type<ProductType>().notNull(),
    price: integer("price").notNull(), // в копейках
    priceOld: integer("price_old"), // в копейках
    sku: text("sku"),
    stock: integer("stock"), // null — без ограничения
    description: text("description"),
    specs: text("specs", { mode: "json" }).$type<Record<string, string>>().notNull().default(sql`'{}'`),
    attrs: text("attrs", { mode: "json" }).$type<ProductAttrs>().notNull().default(sql`'{}'`),
    images: text("images", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
    sourceUrl: text("source_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    importedAt: integer("imported_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("products_type_idx").on(t.type)],
);

export const importRuns = sqliteTable("import_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  created: integer("created").notNull().default(0),
  updated: integer("updated").notNull().default(0),
  deactivated: integer("deactivated").notNull().default(0),
  warnings: text("warnings", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
