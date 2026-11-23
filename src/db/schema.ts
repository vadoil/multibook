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
    // Товар правили в админке: импорт из Tilda не перезаписывает цену, название, наличие и описание.
    lockedAt: integer("locked_at", { mode: "timestamp" }),
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

export const ORDER_STATUSES = ["new", "confirmed", "paid", "shipped", "done", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const DELIVERY_METHODS = ["cdek-pvz", "cdek-door", "other"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/** Заказ. Онлайн-оплаты пока нет: менеджер подтверждает заказ и считает доставку. */
export const orders = sqliteTable(
  "orders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    number: text("number").notNull().unique(), // видит покупатель: «1042»
    token: text("token").notNull().unique(), // ссылка на страницу заказа без входа
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), // если оформлял вошедший покупатель
    status: text("status").$type<OrderStatus>().notNull().default("new"),
    managerNote: text("manager_note"), // видит только админка
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    deliveryMethod: text("delivery_method").$type<DeliveryMethod>().notNull(),
    deliveryCity: text("delivery_city"),
    deliveryAddress: text("delivery_address"),
    comment: text("comment"),
    subtotal: integer("subtotal").notNull(), // копейки
    deliveryPrice: integer("delivery_price"), // null — ещё не посчитана
    deliveryEta: text("delivery_eta"), // «2–4 дн.» из расчёта СДЭК
    total: integer("total").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("orders_status_idx").on(t.status)],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    title: text("title").notNull(), // снимок на момент заказа
    sku: text("sku"),
    image: text("image"),
    price: integer("price").notNull(), // копейки, за штуку
    qty: integer("qty").notNull(),
    bundle: text("bundle"), // название набора из конструктора, если позиция из него
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** История заказа для админки: кто и когда менял статус, доставку, заметку. */
export const orderEvents = sqliteTable(
  "order_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    at: integer("at", { mode: "timestamp" }).notNull(),
    by: text("by"), // почта сотрудника; null — система
    text: text("text").notNull(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
);

export const PAYMENT_STATUSES = ["pending", "succeeded", "canceled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Онлайн-оплаты заказа. provider "demo" — заглушка без денег, "yookassa" — настоящая. */
export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").$type<"demo" | "yookassa">().notNull(),
    externalId: text("external_id").unique(), // id платежа в ЮKassa
    status: text("status").$type<PaymentStatus>().notNull().default("pending"),
    amount: integer("amount").notNull(), // копейки
    confirmationUrl: text("confirmation_url"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(), // в нижнем регистре
  passwordHash: text("password_hash").notNull(), // scrypt$соль$хеш
  role: text("role").$type<UserRole>().notNull().default("customer"),
  name: text("name"),
  phone: text("phone"),
  city: text("city"),
  address: text("address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/** Сессии: в cookie — случайный токен, в базе — только его SHA-256. */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(), // sha256(token)
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
