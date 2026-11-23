import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { AuthForms, ProfileForm } from "@/components/AccountForms";
import { currentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orders";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Кабинет", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await currentUser();
  const { next } = await searchParams;

  if (!user)
    return (
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <h1 className="text-center font-display text-4xl font-bold sm:text-5xl">Кабинет</h1>
        <AuthForms next={next} />
      </div>
    );

  const orders = db.select().from(schema.orders).where(eq(schema.orders.userId, user.id)).orderBy(desc(schema.orders.createdAt)).all();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{user.email}</p>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{user.name ? `Здравствуйте, ${user.name}` : "Кабинет"}</h1>
        </div>
        <div className="flex gap-2">
          {user.role === "admin" && (
            <Link href="/admin" className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white">
              Админка
            </Link>
          )}
          <form action={logout}>
            <button className="rounded-full border border-line px-5 py-2.5">Выйти</button>
          </form>
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="font-display text-2xl font-bold">Мои заказы</h2>
          {orders.length ? (
            <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] bg-card px-5">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.token}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4 hover:opacity-80">
                    <b className="font-display text-lg">№ {o.number}</b>
                    <span className="text-sm text-muted">{o.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span className="rounded-full bg-paper px-3 py-1 text-sm">{STATUS_LABELS[o.status]}</span>
                    <b className="ml-auto tabular-nums">{formatPrice(o.total)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-[var(--radius-card)] border border-dashed border-line p-8 text-center">
              <p>Заказов пока нет.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/catalog" className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white">
                  В каталог
                </Link>
                <Link href="/constructor" className="rounded-full border border-ink px-5 py-2.5 font-semibold">
                  Конструктор
                </Link>
              </div>
            </div>
          )}
          <p className="mt-3 text-sm text-muted">Здесь видны заказы, оформленные после входа в кабинет.</p>
        </section>

        <section className="h-fit rounded-[var(--radius-card)] bg-card p-5">
          <h2 className="font-display text-xl font-bold">Данные для доставки</h2>
          <div className="mt-4">
            <ProfileForm user={user} />
          </div>
        </section>
      </div>
    </div>
  );
}
