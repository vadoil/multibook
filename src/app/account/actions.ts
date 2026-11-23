"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { endSession, hashPassword, requireUser, startSession, tooManyAttempts, verifyPassword } from "@/lib/auth";

export type AuthState = { error?: string; email?: string; ok?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
// Только свои страницы: не даём увести человека на чужой сайт через ?next=
const safeNext = (v: string) => (v.startsWith("/") && !v.startsWith("//") ? v : "/account");

async function ip() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
}

export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email", 120).toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (tooManyAttempts(`e:${email}`, `i:${await ip()}`)) return { error: "Слишком много попыток. Подождите 15 минут.", email };
  const user = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  // Одинаковый ответ и для «нет такого», и для «неверный пароль».
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Неверная почта или пароль", email };
  await startSession(user.id);
  redirect(safeNext(str(fd, "next", 200)));
}

export async function register(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email", 120).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const name = str(fd, "name", 100);
  if (tooManyAttempts(`r:${await ip()}`)) return { error: "Слишком много попыток. Подождите 15 минут.", email };
  if (!EMAIL.test(email)) return { error: "Проверьте адрес почты", email };
  if (password.length < 8) return { error: "Пароль — минимум 8 символов", email };
  if (password.length > 200) return { error: "Слишком длинный пароль", email };
  if (fd.get("consent") !== "on") return { error: "Нужно согласие на обработку персональных данных", email };
  if (db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get())
    return { error: "Такая почта уже зарегистрирована — войдите", email };

  const user = db
    .insert(schema.users)
    .values({ email, passwordHash: await hashPassword(password), name: name || null, createdAt: new Date() })
    .returning({ id: schema.users.id })
    .get();
  await startSession(user.id);
  redirect(safeNext(str(fd, "next", 200)));
}

export async function logout() {
  await endSession();
  redirect("/");
}

export async function saveProfile(_: AuthState, fd: FormData): Promise<AuthState> {
  const u = await requireUser();
  const phone = str(fd, "phone", 30);
  const digits = phone.replace(/\D/g, "");
  if (phone && (digits.length < 10 || digits.length > 15)) return { error: "Проверьте телефон" };
  db.update(schema.users)
    .set({ name: str(fd, "name", 100) || null, phone: phone || null, city: str(fd, "city", 80) || null, address: str(fd, "address", 300) || null })
    .where(eq(schema.users.id, u.id))
    .run();
  return { ok: "Сохранено. Эти данные подставятся при оформлении заказа." };
}
