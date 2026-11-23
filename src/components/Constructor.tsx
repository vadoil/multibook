"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cart } from "@/lib/cart";
import { shade } from "@/lib/color";
import { formatPrice } from "@/lib/money";
import { NotebookPreview, type NotebookLook, type Ruling } from "./NotebookPreview";

export type CoverOpt = {
  id: number;
  title: string;
  price: number;
  image: string | null;
  hex: string | null;
  print: boolean;
  isSet: boolean;
  material: string | null;
  available: boolean;
};
export type BlockOpt = {
  id: number;
  title: string;
  price: number;
  image: string | null;
  sheets: number;
  approx: boolean;
  paper: "white" | "cream";
  ruling: Ruling;
  available: boolean;
};
export type DiscOpt = {
  id: number;
  title: string;
  price: number;
  image: string | null;
  hex: string;
  diameter: 18 | 24;
  metal: boolean;
  finishKind: string;
  variant: string;
  available: boolean;
};
export type Initial = { cover?: number; blocks: Record<number, number>; disc?: number };

/** Сколько листов держат диски: 18 мм — до 64, 24 мм — до 86. */
const CAPACITY = { 18: 64, 24: 86 } as const;
const MAX_SPARES = 3;
const RULING: Record<Ruling, string> = { grid: "клетка", dot: "точка", line: "линейка", blank: "без линовки", plan: "планер" };
const PRINT_HEX = "#33403f";

function swatch(d: Pick<DiscOpt, "hex" | "metal" | "finishKind">): React.CSSProperties {
  const c = d.hex;
  if (d.metal || d.finishKind === "metal") return { background: `linear-gradient(135deg, ${shade(c, 0.55)}, ${c} 45%, ${shade(c, -0.25)} 70%, ${shade(c, 0.35)})` };
  if (d.finishKind === "pearl") return { background: `radial-gradient(circle at 30% 30%, #fff, ${shade(c, 0.3)} 35%, ${c} 70%, ${shade(c, -0.1)})` };
  if (d.finishKind === "clear") return { background: `radial-gradient(circle at 30% 30%, #fff8, ${c}aa)`, backdropFilter: "blur(2px)" };
  if (d.finishKind === "gloss") return { background: `radial-gradient(circle at 32% 28%, ${shade(c, 0.55)}, ${c} 40%, ${shade(c, -0.15)})` };
  return { background: c };
}

function Step({ n, title, done, children, aside }: { n: number; title: string; done: boolean; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6" aria-labelledby={`step-${n}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`grid size-8 place-items-center rounded-full text-sm font-bold transition ${done ? "bg-ink text-white" : "border border-line text-muted"}`}
          aria-hidden
        >
          {done ? "✓" : n}
        </span>
        <h2 id={`step-${n}`} className="font-display text-xl font-bold sm:text-2xl">
          {title}
        </h2>
        <div className="ml-auto">{aside}</div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Constructor({
  covers,
  blocks,
  discs,
  initial,
}: {
  covers: CoverOpt[];
  blocks: BlockOpt[];
  discs: DiscOpt[];
  initial: Initial;
}) {
  const [coverId, setCoverId] = useState(initial.cover);
  const [firstBlock, firstQty] = Object.entries(initial.blocks)[0] ?? [];
  const [blockId, setBlockId] = useState(firstBlock ? Number(firstBlock) : undefined);
  const [spares, setSpares] = useState(Math.max(0, Math.min(MAX_SPARES, (firstQty ?? 1) - 1)));
  const startDisc = discs.find((d) => d.id === initial.disc);
  const [variant, setVariant] = useState(startDisc?.variant);
  const [wantD, setWantD] = useState<18 | 24>(startDisc?.diameter ?? 24);
  const [view, setView] = useState<"closed" | "open">("closed");
  const [allCovers, setAllCovers] = useState(false);
  const [coverKind, setCoverKind] = useState<"all" | "set" | "print" | "soft">("all");
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);

  const cover = covers.find((c) => c.id === coverId);
  const block = blocks.find((b) => b.id === blockId);
  // В блокнот встаёт один блок; запасные едут в комплекте и на ёмкость дисков не влияют.
  const chosen = block ? [{ ...block, qty: 1 + spares }] : [];
  const sheets = block?.sheets ?? 0;
  const tooMany = sheets > CAPACITY[24];
  const diameter: 18 | 24 = sheets > CAPACITY[18] ? 24 : wantD;
  const forced = sheets > CAPACITY[18] && wantD === 18;

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
  // Если выбранного цвета нет в другом диаметре — берём самый похожий: тот же цвет и материал, потом просто цвет.
  const want = variants.find((v) => v.key === variant)?.rep;
  const disc = (variants.find((v) => v.key === variant)?.by[diameter] ??
    (want && shown.find((v) => v.rep.variant.split("|")[0] === want.variant.split("|")[0] && v.rep.metal === want.metal)?.by[diameter]) ??
    (want && shown.find((v) => v.rep.variant.split("|")[0] === want.variant.split("|")[0])?.by[diameter]) ??
    shown[0]?.by[diameter]) as DiscOpt | undefined;

  const total = (cover?.price ?? 0) + chosen.reduce((s, b) => s + b.price * b.qty, 0) + (disc?.price ?? 0);
  const ready = !!cover?.available && !!block?.available && !!disc?.available;

  const look: NotebookLook = {
    front: cover ? { hex: cover.hex ?? PRINT_HEX, print: cover.print } : undefined,
    back: cover ? { hex: cover.hex ?? PRINT_HEX } : undefined,
    discs: disc ? { hex: disc.hex, diameter: disc.diameter, metal: disc.metal || disc.finishKind === "metal" } : undefined,
    sheets,
    paper: chosen[0]?.paper,
    pages: [block?.ruling, block?.ruling],
  };

  // Ссылка на сборку — в адресной строке, чтобы ей можно было поделиться.
  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (cover) q.set("c", String(cover.id));
    if (block) q.set("b", spares ? `${block.id}.${spares + 1}` : String(block.id));
    if (disc) q.set("d", String(disc.id));
    return q.toString();
  }, [cover, block, spares, disc]);
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
  const coverList = kinds[coverKind];
  const visibleCovers = allCovers ? coverList : coverList.slice(0, 8);
  if (!allCovers && cover && !visibleCovers.includes(cover) && coverList.includes(cover)) visibleCovers[visibleCovers.length - 1] = cover;

  const add = () => {
    if (!ready || !cover || !disc) return;
    const label = `Блокнот А5: ${cover.title}, ${sheets} л., диски ${disc.diameter} мм`;
    cart.addBundle(
      [{ productId: cover.id, qty: 1 }, ...chosen.map((b) => ({ productId: b.id, qty: b.qty })), { productId: disc.id, qty: 1 }],
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
            <span className="min-w-0 truncate">Обложка · {cover.title}</span>
            <span className="shrink-0 tabular-nums">{formatPrice(cover.price)}</span>
          </li>
        )}
        {chosen.map((b) => (
          <li key={b.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {b.title}, {b.sheets} л.{spares > 0 && ` + ${spares} запасн.`}
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(b.price * b.qty)}</span>
          </li>
        ))}
        {disc && (
          <li className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              Диски {disc.diameter} мм · {disc.title.toLowerCase()}, 8 шт
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(disc.price)}</span>
          </li>
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
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className="rounded-full px-3 py-1.5 transition aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {v === "closed" ? "Обложка" : "Разворот"}
                </button>
              ))}
            </div>
            {cover?.image && (
              <div className="relative size-12 overflow-hidden rounded-xl ring-2 ring-paper" title="Обложка на фото">
                <Image src={cover.image} alt={`Фото: ${cover.title}`} fill sizes="48px" className="object-cover" />
              </div>
            )}
          </div>
          <NotebookPreview look={look} view={view} className="mx-auto mt-3 max-w-[240px] sm:max-w-[300px] lg:max-w-none" />
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span>
                {sheets} {sheets % 10 === 1 && sheets % 100 !== 11 ? "лист" : "листов"} из {cap}
              </span>
              <span className="text-muted">диски {diameter} мм</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper" aria-hidden>
              <div className={`h-full rounded-full transition-all duration-500 ${tooMany ? "bg-warn" : "bg-ink"}`} style={{ width: `${meter}%` }} />
            </div>
            {tooMany && (
              <p className="mt-2 text-sm font-medium text-warn">
                Это больше, чем держат диски 24 мм (до {CAPACITY[24]} листов). Подтвердим комплектацию при звонке.
              </p>
            )}
            {forced && !tooMany && <p className="mt-2 text-sm text-muted">Листов больше {CAPACITY[18]} — поставили диски 24 мм.</p>}
          </div>
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

      <div className="grid gap-10 lg:order-1">
        <Step
          n={1}
          title="Обложка"
          done={!!cover}
          aside={
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
                  <button
                    key={k}
                    type="button"
                    onClick={() => setCoverKind(k)}
                    aria-pressed={coverKind === k}
                    className="rounded-full border border-line px-3 py-1.5 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white"
                  >
                    {l}
                  </button>
                ) : null,
              )}
            </div>
          }
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visibleCovers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCoverId(c.id)}
                disabled={!c.available}
                aria-pressed={coverId === c.id}
                className="group rounded-[20px] p-1.5 text-left ring-2 ring-transparent transition hover:bg-card disabled:opacity-40 aria-pressed:bg-card aria-pressed:ring-ink"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#efe9df]">
                  {c.image && <Image src={c.image} alt="" fill sizes="(min-width:1280px) 200px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />}
                  {c.hex && <span className="absolute bottom-2 left-2 size-4 rounded-full ring-2 ring-white" style={{ background: c.hex }} />}
                </div>
                <span className="mt-2 block px-1 text-sm font-medium leading-snug">{c.title}</span>
                <span className="block px-1 text-sm text-muted">
                  {c.isSet ? "комплект" : (c.material?.toLowerCase() ?? "обложка")} · <b className="text-ink">{formatPrice(c.price)}</b>
                </span>
              </button>
            ))}
          </div>
          {coverList.length > 8 && (
            <button type="button" onClick={() => setAllCovers((v) => !v)} className="mt-4 rounded-full border border-line px-5 py-2.5 text-sm">
              {allCovers ? "Свернуть" : `Показать все ${coverList.length}`}
            </button>
          )}
        </Step>

        <Step n={2} title="Листы" done={!!block}>
          <div className="grid gap-3 sm:grid-cols-2">
            {blocks.map((b) => (
              <button
                key={b.id}
                type="button"
                disabled={!b.available}
                onClick={() => setBlockId(b.id)}
                aria-pressed={blockId === b.id}
                className="flex items-center gap-3 rounded-[20px] p-2 text-left ring-2 ring-transparent transition hover:bg-card disabled:opacity-40 aria-pressed:bg-card aria-pressed:ring-ink"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#efe9df]">
                  {b.image && <Image src={b.image} alt="" fill sizes="64px" className="object-cover" />}
                </div>
                <span className="min-w-0">
                  <span className="block font-medium leading-snug">{b.title}</span>
                  <span className="block text-sm text-muted">
                    {RULING[b.ruling]} · {b.paper === "cream" ? "кремовая" : "белая"} · {b.approx ? "≈" : ""}
                    {b.sheets} л.
                  </span>
                  <b className="text-sm">{formatPrice(b.price)}</b>
                </span>
              </button>
            ))}
          </div>
          {block && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[20px] bg-card px-4 py-3">
              <span className="min-w-0 flex-1 text-sm">
                Запасные блоки «{block.title}» — чтобы заменить, когда листы закончатся
              </span>
              <div className="flex items-center rounded-full border border-line bg-paper">
                <button type="button" onClick={() => setSpares((n) => Math.max(0, n - 1))} disabled={!spares} className="grid size-9 place-items-center disabled:opacity-30" aria-label="Меньше запасных блоков">
                  −
                </button>
                <span className="min-w-6 text-center tabular-nums" aria-live="polite">
                  {spares}
                </span>
                <button type="button" onClick={() => setSpares((n) => Math.min(MAX_SPARES, n + 1))} disabled={spares >= MAX_SPARES} className="grid size-9 place-items-center disabled:opacity-30" aria-label="Больше запасных блоков">
                  +
                </button>
              </div>
            </div>
          )}
        </Step>

        <Step
          n={3}
          title="Диски"
          done={!!disc}
          aside={
            <div className="flex rounded-full border border-line p-1 text-sm" role="group" aria-label="Диаметр">
              {([18, 24] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWantD(d)}
                  disabled={d === 18 && sheets > CAPACITY[18]}
                  aria-pressed={diameter === d}
                  className="rounded-full px-3 py-1.5 transition disabled:opacity-30 aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {d} мм · до {CAPACITY[d]} л.
                </button>
              ))}
            </div>
          }
        >
          <p className="text-sm text-muted">Упаковка 8 дисков — ровно на один блокнот А5.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
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
                  className="flex flex-col items-center gap-2 rounded-[20px] p-3 text-center ring-2 ring-transparent transition hover:bg-card disabled:opacity-40 aria-pressed:bg-card aria-pressed:ring-ink"
                >
                  <span
                    className={`relative size-12 rounded-full shadow-[inset_0_-3px_6px_rgba(0,0,0,.18),0_2px_6px_rgba(0,0,0,.12)] transition ${on ? "scale-110" : ""}`}
                    style={swatch(d)}
                  >
                    <span className="absolute inset-[30%] rounded-full bg-black/10" />
                  </span>
                  <span className="text-xs leading-tight">{v.title}</span>
                  <b className="text-xs">{formatPrice(d.price)}</b>
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
              {cover?.title} · {sheets} л. · диски {diameter} мм
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
