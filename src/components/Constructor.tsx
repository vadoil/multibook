"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cart } from "@/lib/cart";
import { FORMATS, type FormatKey } from "@/lib/formats";
import { formatPrice } from "@/lib/money";
import { NotebookPreview, type NotebookLook, type Ruling } from "./NotebookPreview";
import { DiscSwatch, PageSwatch } from "./Swatches";

export type CoverOpt = {
  id: number;
  title: string;
  note: string; // «комплект», «эко-замша», «блок в клетку, диски, ручка»
  price: number;
  image: string | null;
  hex: string | null;
  print: boolean;
  isSet: boolean;
  ruling?: Ruling; // у готового мини-блокнота — линовка блока из комплекта
  available: boolean;
};
export type BlockOpt = {
  id: number;
  title: string;
  price: number;
  image: string | null;
  sheets: number | null;
  paper: "white" | "cream";
  ruling: Ruling;
  available: boolean;
};
export type DiscOpt = {
  id: number;
  title: string;
  price: number;
  hex: string;
  diameter: 18 | 24;
  metal: boolean;
  finishKind: string;
  variant: string;
  available: boolean;
};
/** disc: null — оставить диски из комплекта мини-блокнота. */
export type Initial = { cover?: number; blocks: Record<number, number>; disc?: number | null };

/** Сколько листов держат диски: 18 мм — до 64, 24 мм — до 86. */
const CAPACITY = { 18: 64, 24: 86 } as const;
const MAX_SPARES = 3;
const MAX_MINI_BLOCKS = 5;
const RULING: Record<Ruling, string> = { grid: "клетка", dot: "точка", line: "линейка", blank: "без линовки", plan: "планер" };
const PRINT_HEX = "#33403f";
const KIT_DISCS = { hex: "#2f2f30", diameter: 18 };
const MINI_SHEETS = 40; // для толщины превью, у мини-блоков нет числа листов в данных

function Step({ n, title, hint, done, children, aside }: { n: number; title: string; hint?: string; done: boolean; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6" aria-labelledby={`step-${n}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={`grid size-9 place-items-center rounded-full text-sm font-bold transition ${done ? "bg-ink text-white" : "border border-line text-muted"}`}
          aria-hidden
        >
          {done ? "✓" : n}
        </span>
        <div className="min-w-0">
          <h2 id={`step-${n}`} className="font-display text-xl font-bold sm:text-2xl">
            {title}
          </h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
        <div className="ml-auto">{aside}</div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Qty({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex items-center rounded-full border border-line bg-paper">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} className="grid size-9 place-items-center text-lg disabled:opacity-30" aria-label={`Меньше: ${label}`}>
        −
      </button>
      <span className="min-w-6 text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className="grid size-9 place-items-center text-lg disabled:opacity-30" aria-label={`Больше: ${label}`}>
        +
      </button>
    </div>
  );
}

const pick = "ring-2 ring-transparent transition hover:bg-card disabled:opacity-40 aria-pressed:bg-card aria-pressed:ring-ink";
const Check = () => (
  <span className="absolute right-2 top-2 hidden size-7 place-items-center rounded-full bg-ink text-sm text-white shadow group-aria-pressed:grid" aria-hidden>
    ✓
  </span>
);

export function Constructor({
  format,
  covers,
  blocks,
  discs,
  initial,
}: {
  format: FormatKey;
  covers: CoverOpt[];
  blocks: BlockOpt[];
  discs: DiscOpt[];
  initial: Initial;
}) {
  const F = FORMATS[format];
  const parts = F.mode === "parts";

  const [coverId, setCoverId] = useState(initial.cover);
  // А5: один блок в блокноте + запасные. Мини: любые запасные блоки в любом количестве.
  const [blockQty, setBlockQty] = useState<Record<number, number>>(initial.blocks);
  const startDisc = initial.disc ? discs.find((d) => d.id === initial.disc) : undefined;
  const [variant, setVariant] = useState<string | null>(startDisc?.variant ?? (parts ? (discs[0]?.variant ?? null) : null));
  const [wantD, setWantD] = useState<18 | 24>(startDisc?.diameter ?? (parts ? 24 : 18));
  const [view, setView] = useState<"closed" | "open">("closed");
  const [allCovers, setAllCovers] = useState(false);
  const [coverKind, setCoverKind] = useState<"all" | "set" | "print" | "soft">("all");
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const cover = covers.find((c) => c.id === coverId);
  const chosen = blocks.filter((b) => blockQty[b.id]).map((b) => ({ ...b, qty: blockQty[b.id] }));
  const main = parts ? chosen[0] : undefined; // блок, который стоит в А5
  const spares = parts ? Math.max(0, (main?.qty ?? 1) - 1) : chosen.reduce((s, b) => s + b.qty, 0);
  const sheets = parts ? (main?.sheets ?? 52) : MINI_SHEETS;
  const tooMany = parts && sheets > CAPACITY[24];
  const diameter: 18 | 24 = parts && sheets > CAPACITY[18] ? 24 : wantD;
  const forced = parts && sheets > CAPACITY[18] && wantD === 18;

  const variants = useMemo(() => {
    const m = new Map<string, { key: string; title: string; rep: DiscOpt; by: Partial<Record<18 | 24, DiscOpt>> }>();
    for (const d of discs) {
      const v = m.get(d.variant) ?? { key: d.variant, title: d.title, rep: d, by: {} };
      v.by[d.diameter] ??= d;
      m.set(d.variant, v);
    }
    return [...m.values()].sort((a, b) => Number(a.rep.metal) - Number(b.rep.metal));
  }, [discs]);
  const shown = variants.filter((v) => v.by[diameter]);
  const colorOf = (v: string) => v.split("|")[0];
  // Если выбранного цвета нет в другом диаметре — берём самый похожий: тот же цвет и материал, потом просто цвет.
  const want = variants.find((v) => v.key === variant)?.rep;
  const disc: DiscOpt | undefined =
    variant === null
      ? undefined
      : (variants.find((v) => v.key === variant)?.by[diameter] ??
        (want && shown.find((v) => colorOf(v.key) === colorOf(want.variant) && v.rep.metal === want.metal)?.by[diameter]) ??
        (want && shown.find((v) => colorOf(v.key) === colorOf(want.variant))?.by[diameter]) ??
        (parts ? shown[0]?.by[diameter] : undefined));

  const total = (cover?.price ?? 0) + chosen.reduce((s, b) => s + b.price * b.qty, 0) + (disc?.price ?? 0);
  const ready = parts ? !!cover?.available && !!main?.available && !!disc?.available : !!cover?.available && chosen.every((b) => b.available);

  const ruling = parts ? main?.ruling : (cover?.ruling ?? chosen[0]?.ruling);
  const look: NotebookLook = {
    front: cover ? { hex: cover.hex ?? PRINT_HEX, print: cover.print } : undefined,
    back: cover ? { hex: cover.hex ?? PRINT_HEX } : undefined,
    discs: disc ? { hex: disc.hex, diameter: disc.diameter, metal: disc.metal || disc.finishKind === "metal" } : !parts && cover ? KIT_DISCS : undefined,
    sheets,
    paper: (main ?? chosen[0])?.paper,
    pages: [ruling, ruling],
    shape: { w: F.w, h: F.h, discs: F.discs },
  };

  // Сборка — в адресной строке, чтобы ей можно было поделиться.
  const query = useMemo(() => {
    const q = new URLSearchParams({ f: format });
    if (cover) q.set("c", String(cover.id));
    if (chosen.length) q.set("b", chosen.map((b) => (b.qty > 1 ? `${b.id}.${b.qty}` : String(b.id))).join(","));
    if (disc) q.set("d", String(disc.id));
    return q.toString();
  }, [format, cover, chosen, disc]);
  useEffect(() => {
    window.history.replaceState(null, "", `/constructor?${query}`);
    setAdded(false);
  }, [query]);

  const kinds = {
    all: covers,
    set: covers.filter((c) => c.isSet && !c.print),
    print: covers.filter((c) => c.print),
    soft: covers.filter((c) => !c.isSet),
  };
  const coverList = parts ? kinds[coverKind] : covers;
  const visibleCovers = allCovers || coverList.length <= 9 ? [...coverList] : coverList.slice(0, 8);
  if (cover && !visibleCovers.includes(cover) && coverList.includes(cover)) visibleCovers[visibleCovers.length - 1] = cover;

  const setQty = (id: number, n: number) =>
    setBlockQty((q) => {
      if (parts) return n > 0 ? { [id]: n } : q; // в А5 блок один, меняем целиком
      const next = { ...q };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(MAX_MINI_BLOCKS, n);
      return next;
    });

  const add = () => {
    if (!ready || !cover) return;
    const label = parts
      ? `Блокнот ${F.label}: ${cover.title}, ${sheets} л., диски ${diameter} мм`
      : `${F.label}: ${cover.title}${spares ? ` + ${spares} запасн. блок.` : ""}`;
    cart.addBundle(
      [{ productId: cover.id, qty: 1 }, ...chosen.map((b) => ({ productId: b.id, qty: b.qty })), ...(disc ? [{ productId: disc.id, qty: 1 }] : [])],
      label,
      look,
    );
    setAdded(true);
  };

  const cap = CAPACITY[diameter];
  const meter = Math.min(100, (sheets / cap) * 100);

  const summary = (
    <>
      <ul className="grid gap-1.5 text-sm">
        {cover && (
          <li className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {parts ? "Обложка" : "Блокнот"} · {cover.title}
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(cover.price)}</span>
          </li>
        )}
        {chosen.map((b) => (
          <li key={b.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {parts ? `${b.title}${b.sheets ? `, ${b.sheets} л.` : ""}${spares ? ` + ${spares} запасн.` : ""}` : `Запасной блок · ${b.title}${b.qty > 1 ? ` × ${b.qty}` : ""}`}
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(b.price * b.qty)}</span>
          </li>
        ))}
        {disc ? (
          <li className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              Диски {disc.diameter} мм · {disc.title.toLowerCase()}, 8 шт
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(disc.price)}</span>
          </li>
        ) : (
          !parts && cover && <li className="text-muted">Диски — из комплекта</li>
        )}
      </ul>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span>Итого</span>
        <b className="font-display text-3xl tabular-nums">{formatPrice(total)}</b>
      </div>
    </>
  );

  return (
    <div className="mt-8 grid gap-10 pb-28 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-0">
      {/* Превью: на телефоне сверху, на десктопе — липкая колонка справа. */}
      <aside className="lg:order-2 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-[28px] bg-[#ece5d9] p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex rounded-full bg-paper p-1 text-sm" role="group" aria-label="Вид">
              {(["closed", "open"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className="min-h-11 rounded-full px-4 py-2 transition aria-pressed:bg-ink aria-pressed:text-white">
                  {v === "closed" ? "Обложка" : "Страница"}
                </button>
              ))}
            </div>
            {cover?.image && (
              <div className="relative size-12 overflow-hidden rounded-xl ring-2 ring-paper" title="Так выглядит на фото">
                <Image src={cover.image} alt={`Фото: ${cover.title}`} fill sizes="48px" className="object-cover" />
              </div>
            )}
          </div>
          <NotebookPreview look={look} view={view} label={`${view === "open" ? "Страница" : "Обложка"}: ${F.label}`} className="mx-auto mt-3 max-w-[280px] sm:max-w-[320px] lg:max-w-none" />
          <p className="text-center text-sm text-muted">
            {F.label} · {F.size}
          </p>
          {parts && (
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span>
                  {sheets} листов из {cap}
                </span>
                <span className="text-muted">диски {diameter} мм</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper" aria-hidden>
                <div className={`h-full rounded-full transition-all duration-500 ${tooMany ? "bg-warn" : "bg-ink"}`} style={{ width: `${meter}%` }} />
              </div>
              {tooMany && <p className="mt-2 text-sm font-medium text-warn">Это больше, чем держат диски 24 мм (до {CAPACITY[24]} листов). Подтвердим комплектацию при звонке.</p>}
              {forced && !tooMany && <p className="mt-2 text-sm text-muted">Листов больше {CAPACITY[18]} — поставили диски 24 мм.</p>}
            </div>
          )}
        </div>

        <div className="mt-4 hidden rounded-[var(--radius-card)] bg-card p-5 lg:block">
          {summary}
          <AddButton ready={ready} added={added} total={total} onAdd={add} />
          <button
            type="button"
            className="mt-3 w-full text-sm text-muted underline underline-offset-4"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Ссылка скопирована" : "Скопировать ссылку на сборку"}
          </button>
        </div>
      </aside>

      <div className="grid gap-12 lg:order-1">
        <Step
          n={1}
          title={parts ? "Обложка" : "Блокнот"}
          hint={parts ? undefined : "В комплекте блок, диски и ручка"}
          done={!!cover}
          aside={
            parts && (
              <div className="flex flex-wrap gap-1 text-sm">
                {(
                  [
                    ["all", "Все"],
                    ["set", "Твёрдые комплекты"],
                    ["print", "С принтом"],
                    ["soft", "Одиночные"],
                  ] as const
                ).map(([k, l]) =>
                  kinds[k].length ? (
                    <button key={k} type="button" onClick={() => setCoverKind(k)} aria-pressed={coverKind === k} className="rounded-full border border-line px-3 py-1.5 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white">
                      {l}
                    </button>
                  ) : null,
                )}
              </div>
            )
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visibleCovers.map((c) => (
              <button key={c.id} type="button" onClick={() => setCoverId(c.id)} disabled={!c.available} aria-pressed={coverId === c.id} className={`group relative rounded-[20px] p-1.5 text-left ${pick}`}>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#efe9df]">
                  {c.image && <Image src={c.image} alt="" fill sizes="(min-width:1280px) 200px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                  {c.hex && <span className="absolute bottom-2 left-2 size-4 rounded-full ring-2 ring-white" style={{ background: c.hex }} />}
                </div>
                <Check />
                <span className="mt-2 block px-1 text-sm font-medium leading-snug">{c.title}</span>
                <span className="block px-1 text-sm text-muted">
                  {c.note} · <b className="text-ink">{formatPrice(c.price)}</b>
                </span>
              </button>
            ))}
          </div>
          {coverList.length > 9 && (
            <button type="button" onClick={() => setAllCovers((v) => !v)} className="mt-4 rounded-full border border-line px-5 py-2.5 text-sm">
              {allCovers ? "Свернуть" : `Показать все ${coverList.length}`}
            </button>
          )}
        </Step>

        <Step
          n={2}
          title={parts ? "Листы" : "Запасные блоки"}
          hint={parts ? "Один блок встаёт в блокнот" : "По желанию: сменные блоки, когда листы закончатся"}
          done={parts ? !!main : chosen.length > 0}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {blocks.map((b) => {
              const n = blockQty[b.id] ?? 0;
              return (
                <div key={b.id} className={`relative flex flex-col rounded-[22px] p-2 ring-2 transition ${n ? "bg-card ring-ink" : "ring-transparent hover:bg-card"} ${b.available ? "" : "opacity-40"}`}>
                  <button
                    type="button"
                    disabled={!b.available}
                    onClick={() => setQty(b.id, parts ? 1 : n ? 0 : 1)}
                    aria-pressed={n > 0}
                    className="group flex flex-1 flex-col text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#efe9df]">
                      {b.image && <Image src={b.image} alt="" fill sizes="(min-width:768px) 260px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                      <PageSwatch ruling={b.ruling} paper={b.paper} className="absolute -bottom-3 right-3 h-24 w-[72px] rotate-[4deg] transition duration-300 group-hover:rotate-0 sm:h-28 sm:w-20" />
                    </div>
                    <Check />
                    <span className="mt-3 block px-1 font-semibold leading-snug">{b.title}</span>
                    <span className="block px-1 text-sm text-muted">
                      {RULING[b.ruling]} · {b.paper === "cream" ? "кремовая" : "белая"}
                      {b.sheets ? ` · ${b.sheets} л.` : ""}
                    </span>
                    <b className="mt-1 block px-1">{formatPrice(b.price)}</b>
                  </button>
                  {!parts && n > 0 && (
                    <div className="mt-2 px-1">
                      <Qty value={n} min={0} max={MAX_MINI_BLOCKS} onChange={(v) => setQty(b.id, v)} label={`блок «${b.title}»`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {parts && main && (
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[20px] bg-card px-4 py-3">
              <span className="min-w-0 flex-1 text-sm">Запасные блоки «{main.title}» — чтобы заменить, когда листы закончатся</span>
              <Qty value={spares} min={0} max={MAX_SPARES} onChange={(v) => setQty(main.id, v + 1)} label="запасные блоки" />
            </div>
          )}
        </Step>

        <Step
          n={3}
          title="Диски"
          hint={parts ? "Упаковка 8 дисков — ровно на один блокнот" : "В комплекте свои диски 19 мм. Хотите цветные — замените"}
          done={parts ? !!disc : true}
          aside={
            parts && (
              <div className="flex rounded-full border border-line p-1" role="group" aria-label="Диаметр">
                {([18, 24] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWantD(d)}
                    disabled={d === 18 && sheets > CAPACITY[18]}
                    aria-pressed={diameter === d}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition disabled:opacity-30 aria-pressed:bg-ink aria-pressed:text-white"
                  >
                    <span className="rounded-full border-2 border-current" style={{ width: d * 0.75, height: d * 0.75 }} aria-hidden />
                    {d} мм · до {CAPACITY[d]} л.
                  </button>
                ))}
              </div>
            )
          }
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {!parts && (
              <button type="button" onClick={() => setVariant(null)} aria-pressed={!disc} className={`group flex flex-col items-center gap-2 rounded-[22px] p-3 text-center ${pick}`}>
                <span className="grid h-24 place-items-center">
                  <DiscSwatch hex={KIT_DISCS.hex} kind="matte" diameter={18} size={84} />
                </span>
                <span className="text-sm font-medium leading-tight">Из комплекта</span>
                <b className="text-sm">0 ₽</b>
              </button>
            )}
            {shown.map((v) => {
              const d = v.by[diameter]!;
              const on = disc?.variant === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVariant(v.key)}
                  disabled={!d.available}
                  aria-pressed={on}
                  className={`group flex flex-col items-center gap-2 rounded-[22px] p-3 text-center ${pick}`}
                >
                  <span className={`grid h-24 place-items-center transition duration-300 ${on ? "scale-110" : "group-hover:-translate-y-1 group-hover:rotate-12"}`}>
                    <DiscSwatch hex={d.hex} kind={d.finishKind} metal={d.metal} diameter={diameter} size={84} />
                  </span>
                  <span className="text-sm font-medium leading-tight">{v.title}</span>
                  <b className="text-sm">{formatPrice(d.price)}</b>
                </button>
              );
            })}
          </div>
          <Link href="/catalog?type=Диски" className="mt-4 inline-block text-sm underline underline-offset-4">
            Нужно больше дисков? Упаковки по 100 и 1000 — в каталоге
          </Link>
        </Step>
      </div>

      {/* Телефон: итог и кнопка всегда под пальцем. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          {/* Мини-превью: пока листаешь шаги, блокнот всё равно на виду. */}
          <NotebookPreview look={look} className="w-11 shrink-0" label="Мини-превью блокнота" />
          <div className="min-w-0 flex-1">
            <b className="block font-display text-xl tabular-nums">{formatPrice(total)}</b>
            <span className="block truncate text-xs text-muted">
              {F.label} · {cover?.title}
            </span>
          </div>
          <AddButton ready={ready} added={added} total={total} onAdd={add} compact />
        </div>
      </div>
    </div>
  );
}

function AddButton({ ready, added, total, onAdd, compact }: { ready: boolean; added: boolean; total: number; onAdd: () => void; compact?: boolean }) {
  if (added)
    return (
      <Link href="/cart" className={`block rounded-full bg-ok text-center font-semibold text-white ${compact ? "shrink-0 px-5 py-3" : "mt-5 w-full px-6 py-4"}`}>
        В корзине ✓ Оформить →
      </Link>
    );
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={!ready}
      className={`rounded-full bg-ink font-semibold text-white transition active:scale-95 disabled:opacity-40 ${compact ? "shrink-0 px-5 py-3" : "mt-5 w-full px-6 py-4"}`}
    >
      {compact ? "В корзину" : `В корзину — ${formatPrice(total)}`}
    </button>
  );
}
