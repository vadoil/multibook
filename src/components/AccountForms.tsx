"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, saveProfile, type AuthState } from "@/app/account/actions";

export const field = "w-full rounded-xl border border-line bg-card px-4 py-3 outline-none transition focus:border-ink";

function Msg({ s }: { s: AuthState }) {
  if (s.error) return <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">{s.error}</p>;
  if (s.ok) return <p className="rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">{s.ok}</p>;
  return null;
}

export function AuthForms({ next }: { next?: string }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [ls, loginAction, lp] = useActionState(login, {});
  const [rs, registerAction, rp] = useActionState(register, {});

  return (
    <div className="mx-auto mt-8 max-w-md rounded-[var(--radius-card)] bg-card p-6">
      <div className="flex rounded-full bg-paper p-1" role="tablist">
        {(
          [
            ["login", "Вход"],
            ["register", "Регистрация"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className="flex-1 rounded-full py-2 font-medium transition aria-selected:bg-ink aria-selected:text-white"
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "login" ? (
        <form action={loginAction} className="mt-6 grid gap-3">
          <input type="hidden" name="next" value={next ?? ""} />
          <label>
            <span className="text-sm text-muted">Почта</span>
            <input name="email" type="email" autoComplete="email" defaultValue={ls.email} required className={field} />
          </label>
          <label>
            <span className="text-sm text-muted">Пароль</span>
            <input name="password" type="password" autoComplete="current-password" required className={field} />
          </label>
          <Msg s={ls} />
          <p className="text-sm text-muted">
            Забыли пароль? Позвоните нам:{" "}
            <a href="tel:+79998994114" className="underline underline-offset-2">
              +7 999 899-41-14
            </a>
            , восстановим доступ.
          </p>
          <button disabled={lp} className="mt-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white disabled:opacity-50">
            {lp ? "Входим…" : "Войти"}
          </button>
        </form>
      ) : (
        <form action={registerAction} className="mt-6 grid gap-3">
          <input type="hidden" name="next" value={next ?? ""} />
          <label>
            <span className="text-sm text-muted">Как к вам обращаться</span>
            <input name="name" autoComplete="name" className={field} />
          </label>
          <label>
            <span className="text-sm text-muted">Почта</span>
            <input name="email" type="email" autoComplete="email" defaultValue={rs.email} required className={field} />
          </label>
          <label>
            <span className="text-sm text-muted">Пароль — от 8 символов</span>
            <input name="password" type="password" autoComplete="new-password" minLength={8} required className={field} />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-1 accent-ink" />
            <span>
              Даю{" "}
              <Link href="/consent" target="_blank" className="underline underline-offset-2">
                согласие на обработку персональных данных
              </Link>{" "}
              и ознакомлен с{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-2">
                политикой обработки данных
              </Link>
            </span>
          </label>
          <Msg s={rs} />
          <button disabled={rp} className="mt-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-white disabled:opacity-50">
            {rp ? "Создаём…" : "Создать кабинет"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted">Заказать можно без регистрации. В кабинете хранятся ваши заказы и адрес доставки.</p>
    </div>
  );
}

export function ProfileForm({ user }: { user: { name: string | null; phone: string | null; city: string | null; address: string | null } }) {
  const [s, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="grid gap-3">
      <label>
        <span className="text-sm text-muted">Имя</span>
        <input name="name" defaultValue={user.name ?? ""} autoComplete="name" className={field} />
      </label>
      <label>
        <span className="text-sm text-muted">Телефон</span>
        <input name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" className={field} />
      </label>
      <label>
        <span className="text-sm text-muted">Город</span>
        <input name="city" defaultValue={user.city ?? ""} autoComplete="address-level2" className={field} />
      </label>
      <label>
        <span className="text-sm text-muted">Адрес или пункт СДЭК</span>
        <input name="address" defaultValue={user.address ?? ""} autoComplete="street-address" className={field} />
      </label>
      <Msg s={s} />
      <button disabled={pending} className="mt-1 justify-self-start rounded-full border border-ink px-6 py-3 font-semibold disabled:opacity-50">
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
