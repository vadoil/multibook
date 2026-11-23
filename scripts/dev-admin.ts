/**
 * Только для локальной разработки: создаёт админа admin@multibook.test со случайным паролем
 * и записывает его в .env.local (файл не попадает в git). Повторный запуск пароль не меняет.
 * Запуск: npm run dev:admin
 */
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

if (process.env.NODE_ENV === "production") {
  console.error("Не для продакшена.");
  process.exit(1);
}
const EMAIL = "admin@multibook.test";
const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
if (db.select().from(schema.users).where(eq(schema.users.email, EMAIL)).get() && env.includes("DEV_ADMIN_PASSWORD=")) {
  console.log(`Уже есть: ${EMAIL}, пароль — в .env.local (DEV_ADMIN_PASSWORD)`);
  process.exit(0);
}
const password = randomBytes(12).toString("base64url");
// Тот же формат, что в src/lib/auth.ts: scrypt$соль$хеш
const salt = randomBytes(16);
const hash = `scrypt$${salt.toString("base64")}$${scryptSync(password, salt, 64).toString("base64")}`;
db.delete(schema.users).where(eq(schema.users.email, EMAIL)).run();
db.insert(schema.users).values({ email: EMAIL, passwordHash: hash, role: "admin", name: "Разработчик", createdAt: new Date() }).run();
appendFileSync(".env.local", `\n# Локальный админ для разработки (npm run dev:admin)\nDEV_ADMIN_EMAIL=${EMAIL}\nDEV_ADMIN_PASSWORD=${password}\n`);
console.log(`Создан ${EMAIL}, пароль записан в .env.local (DEV_ADMIN_PASSWORD)`);
