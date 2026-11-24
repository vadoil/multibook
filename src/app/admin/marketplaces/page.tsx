import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { fmtDate, input } from "@/components/admin";
import { SubmitButton } from "@/components/content/ContentControls";
import { requireAdmin } from "@/lib/auth";
import { ozonReady, STOCK_RULES, wbReady } from "@/lib/marketplaces";
import { runMarketSync } from "./actions";

export const metadata: Metadata = { title: "Ozon и Wildberries" };

const FILTERS = [
  { v: "", label: "Все товары" },
  { v: "linked", label: "Связаны с площадкой" },
  { v: "unlinked", label: "Без связи" },
  { v: "diff", label: "Остатки расходятся" },
  { v: "zero", label: "Закончились на сайте" },
] as const;

export default async function Marketplaces({ searchParams }: { searchParams: Promise<{ f?: string; q?: string; result?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const needle = (sp.q ?? "").trim().toLocaleLowerCase("ru");
  const all = db.select().from(schema.products).orderBy(asc(schema.products.type), asc(schema.products.sortOrder)).all();
  const linked = (p: (typeof all)[number]) => !!(p.ozonUrl || p.wbUrl || p.ozonSku || p.wbNmId);
  const diff = (p: (typeof all)[number]) => [p.ozonStock, p.wbStock].some((s) => s !== null && p.stock !== null && s !== p.stock);
  const rows = all
    .filter((p) => !needle || `${p.title} ${p.sku ?? ""}`.toLocaleLowerCase("ru").includes(needle))
    .filter((p) => (sp.f === "linked" ? linked(p) : sp.f === "unlinked" ? !linked(p) : sp.f === "diff" ? diff(p) : sp.f === "zero" ? p.stock !== null && p.stock <= 0 : true));
  const last = all.reduce<Date | null>((m, p) => (p.marketSyncedAt && (!m || p.marketSyncedAt > m) ? p.marketSyncedAt : m), null);
  const num = (n: number | null) => (n === null ? "—" : String(n));
  const sum = (k: "stock" | "ozonStock" | "wbStock") => all.reduce((s, p) => s + (p[k] ?? 0), 0);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Ozon и Wildberries</h1>
      <p className="mt-2 max-w-3xl text-muted">
        Остатки по каждому товару в одном месте: сайт, Ozon и Wildberries. Товары связываются по артикулу продавца. На карточке товара появляются кнопки «Купить на Ozon» и «Купить на
        Wildberries».
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.3fr]">
        {[
          { name: "Ozon", ready: ozonReady(), env: "OZON_CLIENT_ID и OZON_API_KEY", where: "Кабинет продавца → Настройки → API-ключи, роль «Только чтение».", total: sum("ozonStock"), linked: all.filter((p) => p.ozonUrl || p.ozonSku).length },
          { name: "Wildberries", ready: wbReady(), env: "WB_API_TOKEN", where: "Кабинет → Профиль → Доступ к API, категория «Статистика», только чтение.", total: sum("wbStock"), linked: all.filter((p) => p.wbUrl || p.wbNmId).length },
        ].map((m) => (
          <section key={m.name} className="rounded-[var(--radius-card)] bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{m.name}</h2>
              <span className={`rounded-full px-3 py-1 text-xs ${m.ready ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>{m.ready ? "подключён" : "не подключён"}</span>
            </div>
            <p className="mt-3 text-sm">
              Связано товаров: <b className="tabular-nums">{m.linked}</b> из {all.length}. На площадке: <b className="tabular-nums">{m.total}</b> шт.
            </p>
            {!m.ready && (
              <p className="mt-3 text-sm text-muted">
                Чтобы подключить, добавьте {m.env} в .env на сервере. {m.where}
              </p>
            )}
          </section>
        ))}
        <form action={runMarketSync} className="grid content-start gap-3 rounded-[var(--radius-card)] bg-card p-5">
          <h2 className="font-display text-xl font-bold">Обновить остатки</h2>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Что делать с остатком на сайте</span>
            <select name="rule" className={input} defaultValue="keep">
              {STOCK_RULES.map((r) => (
                <option key={r.v} value={r.v}>{r.label}</option>
              ))}
            </select>
          </label>
          <SubmitButton className="justify-self-start rounded-full bg-ink px-6 py-3 font-semibold text-white disabled:opacity-60" pending="Запрашиваем площадки…">
            Обновить сейчас
          </SubmitButton>
          <p className="text-sm text-muted">{last ? `Последнее обновление: ${fmtDate(last)}.` : "Ещё не обновляли."}</p>
        </form>
      </div>

      {sp.result && <p className="mt-4 rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok" role="status">{sp.result}</p>}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <nav aria-label="Фильтр" className="flex flex-wrap gap-1.5 text-sm">
          {FILTERS.map((f) => (
            <Link key={f.v} href={`/admin/marketplaces${f.v ? `?f=${f.v}` : ""}`} aria-current={(sp.f ?? "") === f.v ? "page" : undefined} className="rounded-full border border-line px-3 py-1.5 aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-white">
              {f.label}
            </Link>
          ))}
        </nav>
        <form className="ml-auto flex gap-2">
          {sp.f && <input type="hidden" name="f" value={sp.f} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Название или артикул" className={`${input} w-64`} />
          <button className="rounded-full bg-ink px-4 text-sm font-semibold text-white">Найти</button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[var(--radius-card)] bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-muted">
            <tr className="border-b border-line">
              <th className="px-4 py-3 font-normal">Товар</th>
              <th className="px-4 py-3 font-normal">Артикул</th>
              <th className="px-4 py-3 text-right font-normal">Сайт</th>
              <th className="px-4 py-3 text-right font-normal">Ozon</th>
              <th className="px-4 py-3 text-right font-normal">Wildberries</th>
              <th className="px-4 py-3 font-normal">Ссылки</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="underline-offset-4 hover:underline">{p.shortTitle}</Link>
                  <span className="ml-2 text-xs text-muted">{p.type}</span>
                </td>
                <td className="px-4 py-2.5 text-muted">{p.sku ?? "—"}</td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${p.stock !== null && p.stock <= 0 ? "font-semibold text-accent" : ""}`}>{p.stock === null ? "без ограничения" : p.stock}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{num(p.ozonStock)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{num(p.wbStock)}</td>
                <td className="px-4 py-2.5">
                  {p.ozonUrl && <a href={p.ozonUrl} target="_blank" rel="noopener" className="mr-3 underline underline-offset-4">Ozon</a>}
                  {p.wbUrl && <a href={p.wbUrl} target="_blank" rel="noopener" className="underline underline-offset-4">WB</a>}
                  {!p.ozonUrl && !p.wbUrl && <Link href={`/admin/products/${p.id}#market`} className="text-muted underline underline-offset-4">добавить</Link>}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">Таких товаров нет. Снимите фильтр или измените запрос.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
