"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { placeOrder, quoteProducts, type CheckoutState } from "@/app/cart/actions";
import type { QuotedProduct } from "@/lib/orders";
import { cart, MAX_QTY, useCart, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/money";
import { NotebookPreview } from "./NotebookPreview";

type Quotes = Record<number, QuotedProduct>;

function Stepper({ line }: { line: CartLine }) {
  const set = (q: number) => cart.setQty(line.productId, line.bundle, q);
  return (
    <div className="flex items-center rounded-full border border-line bg-card">
      <button type="button" onClick={() => set(line.qty - 1)} className="grid size-9 place-items-center text-lg" aria-label="Меньше">
        −
      </button>
      <span className="min-w-6 text-center tabular-nums" aria-live="polite">
        {line.qty}
      </span>
      <button
        type="button"
        onClick={() => set(line.qty + 1)}
        disabled={line.qty >= MAX_QTY}
        className="grid size-9 place-items-center text-lg disabled:opacity-30"
        aria-label="Больше"
      >
        +
      </button>
    </div>
  );
}

function Line({ line, q, compact }: { line: CartLine; q?: QuotedProduct; compact?: boolean }) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-[#efe9df] ${compact ? "size-14" : "size-20"}`}>
        {q?.image && <Image src={q.image} alt="" fill sizes="80px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1 basis-40">
        {q ? (
          <Link href={`/product/${q.slug}`} className="line-clamp-2 font-medium leading-snug hover:underline">
            {q.shortTitle}
          </Link>
        ) : (
          <span className="block h-4 w-40 animate-pulse rounded bg-line" />
        )}
        <span className="text-sm text-muted">{q?.type}</span>
        {q && !q.available && <span className="block text-sm font-medium text-accent">Нет в продаже</span>}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Stepper line={line} />
        <b className="w-20 shrink-0 text-right tabular-nums">{q ? formatPrice(q.price * line.qty) : "…"}</b>
      </div>
    </li>
  );
}

const field = "w-full rounded-xl border border-line bg-card px-4 py-3 outline-none transition focus:border-ink";

function Err({ m }: { m?: string }) {
  return m ? <span className="mt-1 block text-sm text-accent">{m}</span> : null;
}

export function CartView() {
  const c = useCart();
  const [ready, setReady] = useState(false);
  const [quotes, setQuotes] = useState<Quotes>({});
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [delivery, setDelivery] = useState(state.values?.delivery ?? "cdek-pvz");

  const idsKey = [...new Set(c.lines.map((l) => l.productId))].sort((a, b) => a - b).join(",");
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!idsKey) return;
    let live = true;
    quoteProducts(idsKey.split(",").map(Number)).then((q) => live && setQuotes(q));
    return () => {
      live = false;
    };
  }, [idsKey]);

  const loose = c.lines.filter((l) => !l.bundle);
  const total = c.lines.reduce((s, l) => s + (quotes[l.productId]?.price ?? 0) * l.qty, 0);
  const loaded = c.lines.every((l) => quotes[l.productId]);
  const gone = c.lines.filter((l) => quotes[l.productId] && !quotes[l.productId].available).map((l) => l.productId);
  const payload = useMemo(
    () =>
      JSON.stringify(
        c.lines.map((l) => ({ productId: l.productId, qty: l.qty, bundleLabel: c.bundles.find((b) => b.id === l.bundle)?.label })),
      ),
    [c],
  );
  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};

  if (!ready) return <div className="mt-10 h-64 animate-pulse rounded-[var(--radius-card)] bg-card" />;

  if (!c.lines.length)
    return (
      <div className="mt-10 rounded-[var(--radius-card)] border border-dashed border-line p-10 text-center">
        <p className="text-lg">В корзине пока пусто.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/catalog" className="rounded-full bg-ink px-6 py-3 font-semibold text-white">
            В каталог
          </Link>
          <Link href="/constructor" className="rounded-full border border-ink px-6 py-3 font-semibold">
            Собрать блокнот
          </Link>
        </div>
      </div>
    );

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
      <div>
        {c.bundles.map((b) => (
          <section key={b.id} className="mb-6 rounded-[var(--radius-card)] bg-card p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <NotebookPreview look={b.look} className="w-24 shrink-0 sm:w-32" label={b.label} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted">Собран в конструкторе</p>
                <h2 className="font-semibold leading-snug">{b.label}</h2>
                <button type="button" onClick={() => cart.removeBundle(b.id)} className="mt-2 text-sm text-muted underline underline-offset-4">
                  Убрать набор
                </button>
              </div>
            </div>
            <ul className="mt-2 divide-y divide-line">
              {c.lines
                .filter((l) => l.bundle === b.id)
                .map((l) => (
                  <Line key={l.productId} line={l} q={quotes[l.productId]} compact />
                ))}
            </ul>
          </section>
        ))}
        {loose.length > 0 && (
          <ul className="divide-y divide-line border-y border-line">
            {loose.map((l) => (
              <Line key={l.productId} line={l} q={quotes[l.productId]} />
            ))}
          </ul>
        )}
        {gone.length > 0 && (
          <button type="button" onClick={() => cart.drop(gone)} className="mt-4 text-sm font-medium text-accent underline underline-offset-4">
            Убрать товары, которых нет в продаже
          </button>
        )}
      </div>

      <form action={action} className="h-fit rounded-[var(--radius-card)] bg-card p-5 lg:sticky lg:top-24" noValidate>
        <h2 className="font-display text-2xl font-bold">Оформление</h2>
        <input type="hidden" name="lines" value={payload} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <div className="mt-5 grid gap-3">
          <label>
            <span className="text-sm text-muted">Имя</span>
            <input name="name" defaultValue={v.name} autoComplete="name" className={field} required aria-invalid={!!fe.name} />
            <Err m={fe.name} />
          </label>
          <label>
            <span className="text-sm text-muted">Телефон</span>
            <input name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" inputMode="tel" placeholder="+7" className={field} required aria-invalid={!!fe.phone} />
            <Err m={fe.phone} />
          </label>
          <label>
            <span className="text-sm text-muted">Почта — пришлём номер заказа (необязательно)</span>
            <input name="email" type="email" defaultValue={v.email} autoComplete="email" className={field} aria-invalid={!!fe.email} />
            <Err m={fe.email} />
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm text-muted">Доставка</legend>
          <div className="mt-2 grid gap-2">
            {[
              ["cdek-pvz", "СДЭК, пункт выдачи"],
              ["cdek-door", "СДЭК, курьер до двери"],
              ["other", "Другой способ — обсудим"],
            ].map(([val, label]) => (
              <label key={val} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-ink">
                <input type="radio" name="delivery" value={val} checked={delivery === val} onChange={() => setDelivery(val)} className="accent-ink" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {delivery !== "other" && (
          <div className="mt-3 grid gap-3">
            <label>
              <span className="text-sm text-muted">Город</span>
              <input name="city" defaultValue={v.city} autoComplete="address-level2" className={field} aria-invalid={!!fe.city} />
              <Err m={fe.city} />
            </label>
            <label>
              <span className="text-sm text-muted">{delivery === "cdek-pvz" ? "Адрес или код пункта СДЭК" : "Улица, дом, квартира"}</span>
              <input name="address" defaultValue={v.address} autoComplete="street-address" className={field} aria-invalid={!!fe.address} />
              <Err m={fe.address} />
            </label>
          </div>
        )}

        <label className="mt-3 block">
          <span className="text-sm text-muted">Комментарий</span>
          <textarea name="comment" defaultValue={v.comment} rows={2} className={field} />
        </label>

        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
          <span>Товары</span>
          <b className="text-2xl tabular-nums">{loaded ? formatPrice(total) : "…"}</b>
        </div>
        <p className="mt-1 text-sm text-muted">Доставку посчитаем и согласуем, когда менеджер подтвердит заказ. Оплата — после подтверждения.</p>

        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" name="consent" defaultChecked={v.consent === "on"} className="mt-1 accent-ink" aria-invalid={!!fe.consent} />
          <span>
            Согласен на обработку персональных данных по{" "}
            <Link href="/privacy" className="underline underline-offset-2" target="_blank">
              политике конфиденциальности
            </Link>
          </span>
        </label>
        <Err m={fe.consent} />

        {state.error && <p className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || !loaded || gone.length > 0}
          className="mt-5 w-full rounded-full bg-ink px-6 py-4 font-semibold text-white transition disabled:opacity-50"
        >
          {pending ? "Отправляем…" : "Оформить заказ"}
        </button>
      </form>
    </div>
  );
}
