import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import type { User } from "@/db/schema";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const COOKIE = "mb_session";
const TTL_DAYS = 30;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(pw, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

/** Создаёт сессию и ставит cookie. Вызывать только из server action или route handler. */
export async function startSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_DAYS * 864e5);
  db.insert(schema.sessions).values({ id: sha(token), userId, expiresAt, createdAt: now }).run();
  // Заодно чистим протухшие сессии этого пользователя.
  db.delete(schema.sessions).where(and(eq(schema.sessions.userId, userId), lt(schema.sessions.expiresAt, now))).run();
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) db.delete(schema.sessions).where(eq(schema.sessions.id, sha(token))).run();
  jar.delete(COOKIE);
}

export type SessionUser = Omit<User, "passwordHash">;

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(and(eq(schema.sessions.id, sha(token)), gt(schema.sessions.expiresAt, new Date())))
    .get();
  if (!row) return null;
  const { passwordHash: _, ...user } = row.user;
  return user;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect("/account");
  return u;
}

/** Для страниц и действий админки. Не вошёл — на вход; не админ — 404, чтобы не светить админку. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect("/account?next=/admin");
  if (u.role !== "admin") notFound();
  return u;
}

/** Простое ограничение попыток входа в памяти процесса: 8 попыток за 15 минут на почту и на IP. */
const attempts = new Map<string, number[]>();
export function tooManyAttempts(...keys: string[]): boolean {
  const now = Date.now();
  const windowMs = 15 * 60_000;
  let blocked = false;
  for (const k of keys) {
    const list = (attempts.get(k) ?? []).filter((t) => now - t < windowMs);
    list.push(now);
    attempts.set(k, list);
    if (list.length > 8) blocked = true;
  }
  if (attempts.size > 5000) attempts.clear();
  return blocked;
}
