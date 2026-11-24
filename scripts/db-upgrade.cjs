// Безопасное обновление схемы SQLite: только добавляет недостающие колонки и таблицы.
// Запуск: npm run db:upgrade. В отличие от drizzle-kit push, таблицы не пересоздаёт.
const Database = require("better-sqlite3");
const db = new Database(process.env.DATABASE_PATH || "./data/multibook.db");
db.pragma("journal_mode = WAL");

const has = (table, col) => db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
const add = (table, col, type) => {
  if (has(table, col)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  console.log(`+ ${table}.${col}`);
};

add("products", "ozon_url", "text");
add("products", "ozon_sku", "text");
add("products", "ozon_stock", "integer");
add("products", "wb_url", "text");
add("products", "wb_nm_id", "text");
add("products", "wb_stock", "integer");
add("products", "market_synced_at", "integer");

db.exec(`
CREATE TABLE IF NOT EXISTS content_items (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  product_id integer REFERENCES products(id) ON DELETE set null,
  kind text NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  title text NOT NULL,
  angle text,
  data text NOT NULL,
  published_to text DEFAULT '[]' NOT NULL,
  source text,
  created_by text,
  created_at integer NOT NULL,
  updated_at integer NOT NULL
);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON content_items (status);
`);
console.log("Схема актуальна. Товаров:", db.prepare("SELECT count(*) c FROM products").get().c);