/**
 * Сделать пользователя администратором: npm run admin:grant -- почта@пример.ру
 * Пользователь сначала регистрируется на сайте сам (/account) — пароль знает только он.
 * Снять права: npm run admin:grant -- почта@пример.ру --revoke
 */
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

const email = process.argv[2]?.trim().toLowerCase();
const revoke = process.argv.includes("--revoke");
if (!email) {
  console.error("Укажите почту: npm run admin:grant -- почта@пример.ру");
  process.exit(1);
}
const res = db
  .update(schema.users)
  .set({ role: revoke ? "customer" : "admin" })
  .where(eq(schema.users.email, email))
  .run();
if (!res.changes) {
  console.error(`Нет пользователя ${email}. Пусть сначала зарегистрируется на сайте в /account.`);
  process.exit(1);
}
console.log(revoke ? `${email} больше не администратор` : `${email} теперь администратор — админка: /admin`);
