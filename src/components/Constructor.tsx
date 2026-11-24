"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { cart } from "@/lib/cart";
import { FORMATS, type FormatKey } from "@/lib/formats";
import { formatPrice } from "@/lib/money";
import { NotebookPreview, type NotebookLook, type Ruling } from "./NotebookPreview";
import { PageSwatch } from "./Swatches";
import { CategoryTabIcon, StoreTabButton, StoreTabLink } from "./store/StoreTab";
import discPhotos from "./constructor/disc-photos.json";
import { getCoverArtwork as artwork } from "./constructor/coverArt";
import { CoverCarousel } from "./constructor/CoverCarousel";
import { AccessoryCarousel, type AccessoryOpt } from "./constructor/AccessoryCarousel";
import { ViewportPhoto } from "./constructor/ViewportPhoto";

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
  image: string | null;
  hex: string;
  diameter: 18 | 24;
  metal: boolean;
  finishKind: string;
  variant: string;
  available: boolean;
};
/** disc: null — оставить диски из комплекта мини-блокнота. */
export type Initial = { cover?: number; back?: number; blocks: Record<number, number>; disc?: number | null };

/** Сколько листов держат диски: 18 мм — до 64, 24 мм — до 86. */
const CAPACITY = { 18: 64, 24: 86 } as const;
const MAX_A5_BLOCKS = 4;
const MAX_MINI_BLOCKS = 5;
const RULING: Record<Ruling, string> = { grid: "клетка", dot: "точка", line: "линейка", blank: "без линовки", plan: "планер" };
const PRINT_HEX = "#33403f";
const KIT_DISCS = { hex: "#2f2f30", diameter: 18 };
const MINI_SHEETS = 40; // для толщины превью, у мини-блоков нет числа листов в данных

/** Restore the choice for this history entry when Next reuses an older page snapshot. */
function restoreChoice(format: FormatKey, initial: Initial, covers: CoverOpt[], blocks: BlockOpt[], discs: DiscOpt[]): Initial {
  if (typeof window === "undefined") return initial;
  const saved = window.history.state?.multibookConstructor;
  if (saved?.format !== format || saved?.query !== window.location.search.slice(1)) return initial;
  const choice = saved.selection as Initial | undefined;
  if (!choice || !choice.blocks || typeof choice.blocks !== "object" || Array.isArray(choice.blocks)) return initial;
  if (choice.cover !== undefined && !covers.some(item => item.id === choice.cover)) return initial;
  if (choice.back !== undefined && !covers.some(item => item.id === choice.back && !item.isSet)) return initial;
  if (choice.disc !== undefined && choice.disc !== null && !discs.some(item => item.id === choice.disc)) return initial;
  const maximum = FORMATS[format].mode === "parts" ? MAX_A5_BLOCKS : MAX_MINI_BLOCKS;
  if (!Object.entries(choice.blocks).every(([id, quantity]) => blocks.some(item => item.id === Number(id)) && Number.isInteger(quantity) && quantity > 0 && quantity <= maximum)) return initial;
  return choice;
}

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
    <div className="constructor-qty" role="group" aria-label={`Количество: ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Меньше: ${label}`}>
        −
      </button>
      <output aria-label={`Количество: ${label}`} aria-live="polite">
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Больше: ${label}`}>
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
  accessories,
  initial,
}: {
  format: FormatKey;
  covers: CoverOpt[];
  blocks: BlockOpt[];
  discs: DiscOpt[];
  accessories: AccessoryOpt[];
  initial: Initial;
}) {
  const F = FORMATS[format];
  const parts = F.mode === "parts";

  const [start] = useState(() => restoreChoice(format, initial, covers, blocks, discs));
  const [coverId, setCoverId] = useState(start.cover);
  const [backId, setBackId] = useState(start.back);
  const [blockQty, setBlockQty] = useState<Record<number, number>>(start.blocks);
  const startDisc = start.disc ? discs.find((d) => d.id === start.disc) : undefined;
  const [variant, setVariant] = useState<string | null>(startDisc?.variant ?? (parts ? (discs[0]?.variant ?? null) : null));
  const [wantD, setWantD] = useState<18 | 24>(startDisc?.diameter ?? (parts ? 24 : 18));
  const [view, setView] = useState<"closed" | "open" | "back">("closed");
  const [coverKind, setCoverKind] = useState<"all" | "set" | "print" | "soft">("all");
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [compositionOpen, setCompositionOpen] = useState(false);
  const compositionId = useId();

  const cover = covers.find((c) => c.id === coverId);
  const backIncluded = !parts || !!cover?.isSet;
  const back = backIncluded ? undefined : covers.find((c) => c.id === backId && !c.isSet);
  const rearOptions = covers.filter((c) => !c.isSet).sort((a, b) => Number(!!artwork(b.image)?.back) - Number(!!artwork(a.image)?.back));
  const frontArt = artwork(cover?.image);
  const rearArt = artwork(back?.image);
  const chosen = blocks.filter((b) => blockQty[b.id]).map((b) => ({ ...b, qty: blockQty[b.id] }));
  const main = parts ? chosen[0] : undefined;
  const blockCount = chosen.reduce((s, b) => s + b.qty, 0);
  const sheets = parts ? chosen.reduce((s, b) => s + (b.sheets ?? 52) * b.qty, 0) : MINI_SHEETS;
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

  const total = (cover?.price ?? 0) + (back?.price ?? 0) + chosen.reduce((s, b) => s + b.price * b.qty, 0) + (disc?.price ?? 0);
  const ready = !!cover?.available && chosen.every((b) => b.available) && (parts ? blockCount > 0 && !!disc?.available && (backIncluded || !!back?.available) : true);
  const missing = !cover ? "Выберите обложку" : parts && !backIncluded && !back ? "Выберите заднюю обложку" : parts && !blockCount ? "Добавьте хотя бы один блок листов" : !ready ? "Проверьте наличие выбранных деталей" : "";

  const ruling = parts ? main?.ruling : (cover?.ruling ?? chosen[0]?.ruling);
  const look: NotebookLook = {
    front: cover ? { hex: cover.hex ?? PRINT_HEX, print: cover.print, artwork: frontArt?.front } : undefined,
    back: back ? { hex: back.hex ?? PRINT_HEX, artwork: rearArt?.back } : backIncluded && cover ? { hex: cover.hex ?? PRINT_HEX, artwork: frontArt?.back } : undefined,
    discs: disc ? { hex: disc.hex, diameter: disc.diameter, metal: disc.metal || disc.finishKind === "metal" } : !parts && cover ? KIT_DISCS : undefined,
    sheets,
    paper: (main ?? chosen[0])?.paper,
    pages: [ruling, ruling],
    shape: { w: F.w, h: F.h, discs: frontArt?.discs ?? F.discs },
    binding: frontArt?.binding,
    coverAspect: parts ? 5 / 6 : undefined,
  };

  // Сборка — в адресной строке, чтобы ей можно было поделиться.
  const query = useMemo(() => {
    const q = new URLSearchParams({ f: format });
    if (cover) q.set("c", String(cover.id));
    if (back) q.set("r", String(back.id));
    // Distinguish an intentionally empty selection from an old link with defaults.
    if (!chosen.length) q.set("b", "0");
    if (chosen.length) q.set("b", chosen.map((b) => (b.qty > 1 ? `${b.id}.${b.qty}` : String(b.id))).join(","));
    if (disc) q.set("d", String(disc.id));
    return q.toString();
  }, [format, cover, back, chosen, disc]);
  useEffect(() => {
    window.history.replaceState({ multibookConstructor: {
      format,
      query,
      selection: { cover: cover?.id, back: back?.id, blocks: Object.fromEntries(chosen.map(item => [item.id, item.qty])), disc: disc?.id ?? null },
    } }, "", `/constructor?${query}`);
    setAdded(false);
  }, [query]);

  const kinds = {
    all: covers,
    set: covers.filter((c) => c.isSet && !c.print),
    print: covers.filter((c) => c.print),
    soft: covers.filter((c) => !c.isSet),
  };
  const coverList = parts ? kinds[coverKind] : covers;

  const setQty = (id: number, n: number) =>
    setBlockQty((q) => {
      const next = { ...q };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(parts ? MAX_A5_BLOCKS : MAX_MINI_BLOCKS, n);
      return next;
    });

  const add = () => {
    if (!ready || !cover) return;
    const label = parts
      ? `Блокнот ${F.label}: ${cover.title}, ${sheets} л., диски ${diameter} мм`
      : `${F.label}: ${cover.title}${blockCount ? ` + ${blockCount} запасн. блок.` : ""}`;
    const items = [{ productId: cover.id, qty: 1 }, ...(back ? [{ productId: back.id, qty: 1 }] : []), ...chosen.map((b) => ({ productId: b.id, qty: b.qty })), ...(disc ? [{ productId: disc.id, qty: 1 }] : [])];
    // Front and rear may be the same SKU. The existing cart expects one line per SKU.
    const quantities = new Map<number, number>();
    for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.qty);
    cart.addBundle(
      [...quantities].map(([productId, qty]) => ({ productId, qty })),
      label,
      look,
    );
    setAdded(true);
  };

  const cap = CAPACITY[diameter];
  const meter = Math.min(100, (sheets / cap) * 100);

  const summary = (
    <>
      <h2 className="mb-3 hidden items-center gap-2 font-display text-xl lg:flex"><CategoryTabIcon type="Тетради" />Ваша комплектация</h2>
      <ul className="grid gap-1.5 text-sm">
        {cover && (
          <li className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {parts ? cover.isSet ? "Комплект из двух обложек" : "Передняя обложка" : "Блокнот"} · {cover.title}
            </span>
            <span className="shrink-0 tabular-nums">{formatPrice(cover.price)}</span>
          </li>
        )}
        {back && <li className="flex justify-between gap-3"><span>Задняя обложка · {back.title}</span><span className="shrink-0 tabular-nums">{formatPrice(back.price)}</span></li>}
        {backIncluded && cover && <li className="text-muted">Задняя обложка — входит в комплект</li>}
        {!parts && cover && <li className="text-muted">Блок листов и {frontArt?.accessory ?? "пишущий инструмент"} — входят в комплект</li>}
        {!backIncluded && !back && <li className="text-accent">Задняя обложка ещё не выбрана</li>}
        {chosen.map((b) => (
          <li key={b.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate">
              {parts ? b.title : `Запасной блок · ${b.title}`} × {b.qty}{b.sheets ? ` · по ${b.sheets} л.` : ""}
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
      <p className="mt-3 text-sm text-muted" data-block-count>{parts ? "Блоков листов" : "Запасных блоков"}: {blockCount}{parts ? ` · всего ${sheets} л.` : ""}</p>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span>Итого</span>
        <b className="font-display text-3xl tabular-nums" data-constructor-total>{formatPrice(total)}</b>
      </div>
    </>
  );

  return (
    <div className="constructor-builder mt-8 grid gap-10 pb-28 lg:grid-cols-[minmax(0,1fr)_400px] lg:pb-0">
      {/* Превью: на телефоне сверху, на десктопе — липкая колонка справа. */}
      <aside className="constructor-preview lg:order-2 lg:self-start">
        <div className="constructor-stage">
          <div className="flex items-center justify-between gap-2">
            <div className="store-tabs-row" role="group" aria-label="Вид">
              {(["closed", "back", "open"] as const).map((v) => (
                <StoreTabButton key={v} onClick={() => setView(v)} aria-pressed={view === v} className="store-tab-compact">
                  {v === "closed" ? "Спереди" : v === "back" ? "Сзади" : "Страница"}
                </StoreTabButton>
              ))}
            </div>
          </div>
          <NotebookPreview look={look} view={view} label={`${view === "open" ? "Страница" : view === "back" ? "Задняя обложка" : "Передняя обложка"}: ${F.label}`} className="constructor-main-book mx-auto mt-2 sm:max-w-[320px] lg:max-w-none" />
          <p className="text-center text-sm text-muted">
            {F.label} · {F.size}
          </p>
          {parts && (
            <div className="mt-3">
              <div className="flex justify-between text-sm">
                <span>
                  {sheets} л. выбрано · вместимость {cap}
                </span>
                <span className="text-muted">диски {diameter} мм</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper" aria-hidden>
                <div className={`h-full rounded-full transition-all duration-500 ${tooMany ? "bg-warn" : "bg-ink"}`} style={{ width: `${meter}%` }} />
              </div>
              {tooMany && <p className="mt-2 text-sm font-medium text-warn" role="status">Все {sheets} листов сразу не поместятся: диски 24 мм держат до {CAPACITY[24]} л. Часть листов можно оставить на замену.</p>}
              {forced && !tooMany && <p className="mt-2 text-sm text-muted">Листов больше {CAPACITY[18]} — поставили диски 24 мм.</p>}
            </div>
          )}
        </div>

        <div className="constructor-composition mt-4 rounded-[var(--radius-card)] bg-card p-5">
          <StoreTabButton icon={<CategoryTabIcon type="Тетради" />} aria-expanded={compositionOpen} aria-controls={compositionId} onClick={() => setCompositionOpen(!compositionOpen)} className="constructor-summary-toggle">Состав комплекта <span aria-hidden>{compositionOpen ? "−" : "+"}</span></StoreTabButton>
          <div id={compositionId} className={`constructor-summary-body ${compositionOpen ? "is-open" : ""}`}>
          {summary}
          <div className="hidden lg:block"><AddButton ready={ready} added={added} total={total} onAdd={add} /></div>
          <button
            type="button"
            className="mt-2 min-h-11 w-full text-sm text-muted underline underline-offset-4"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Ссылка скопирована" : "Скопировать ссылку на сборку"}
          </button>
          </div>
          {missing && <p className="mt-3 text-sm text-accent" role="status">{missing}</p>}
        </div>
      </aside>

      <div className="constructor-steps grid gap-12 lg:order-1">
        <Step
          n={1}
          title={parts ? "Передняя обложка" : "Блокнот"}
          hint={parts ? "Одиночная обложка или готовый комплект из двух" : `В комплекте обложки, блок, диски и ${frontArt?.accessory ?? "пишущий инструмент"}`}
          done={!!cover}
          aside={
            parts && (
              <div className="store-tabs-row" role="group" aria-label="Категории обложек">
                {(
                  [
                    ["all", "Все"],
                    ["set", "Твёрдые комплекты"],
                    ["print", "С принтом"],
                    ["soft", "Одиночные"],
                  ] as const
                ).map(([k, l]) =>
                  kinds[k].length ? (
                    <StoreTabButton key={k} onClick={() => setCoverKind(k)} aria-pressed={coverKind === k} className="store-tab-compact">
                      {l}
                    </StoreTabButton>
                  ) : null,
                )}
              </div>
            )
          }
        >
          <CoverCarousel covers={coverList} selectedId={coverId} side="front" onSelect={c => { setCoverId(c.id); setView("closed"); if (c.isSet) setBackId(undefined); }} />
        </Step>

        {parts && <Step n={2} title="Задняя обложка" hint={backIncluded ? "В выбранном комплекте уже две обложки" : "Нужна для полной сборки. Можно выбрать ту же модель или сочетать разные"} done={backIncluded || !!back?.available}>
          {backIncluded ? <div className="constructor-kit-covers">
            <div className="constructor-kit-faces">
              {([['closed', 'Передняя', frontArt?.front], ['back', 'Задняя', frontArt?.back]] as const).map(([face, title, image]) => (
                <button key={face} type="button" onClick={() => setView(face)} aria-pressed={view === face} aria-label={`Показать: ${title.toLowerCase()} обложка из комплекта`} className="constructor-kit-face">
                  <span className="constructor-cover-photo">{image ? <Image src={image} alt="" fill sizes="(max-width:760px) 40vw, 200px" className="object-contain" /> : <span className="constructor-no-photo"><CategoryTabIcon type="Обложки" /><span>Фото этой стороны нет</span></span>}</span>
                  <span>{title}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">Обе обложки входят в комплект и уже учтены в цене.</p>
          </div> : <CoverCarousel covers={rearOptions} selectedId={back?.id} side="back" onSelect={c => { setBackId(c.id); setView("back"); }} />}
        </Step>}

        <Step
          n={parts ? 3 : 2}
          title={parts ? "Листы" : "Запасные блоки"}
          hint={parts ? "Сочетайте разные линовки. Количество каждого блока — под его фотографией" : "По желанию: сменные блоки, когда листы закончатся"}
          done={chosen.length > 0}
          aside={<span className="text-sm text-muted" aria-live="polite">Блоков: <b className="text-ink" data-block-counter>{blockCount}</b></span>}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {blocks.map((b) => {
              const n = blockQty[b.id] ?? 0;
              return (
                <div key={b.id} data-block={b.id} className={`constructor-block relative flex flex-col p-2 ring-2 transition ${n ? "bg-card ring-ink" : "ring-transparent hover:bg-card"} ${b.available ? "" : "opacity-40"}`}>
                  <button
                    type="button"
                    disabled={!b.available}
                    onClick={() => setQty(b.id, n ? 0 : 1)}
                    aria-pressed={n > 0}
                    className="group flex flex-1 flex-col text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#efe9df]">
                      {b.image && <ViewportPhoto src={b.image} alt="" fill sizes="(min-width:768px) 260px, 45vw" className="object-cover transition duration-500 group-hover:scale-105" />}
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
                  {b.available && (
                    <div className="mt-2 px-1">
                      <Qty value={n} min={0} max={parts ? MAX_A5_BLOCKS : MAX_MINI_BLOCKS} onChange={(v) => setQty(b.id, v)} label={`блок «${b.title}»`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Step>

        <Step
          n={parts ? 4 : 3}
          title="Диски"
          hint={parts ? "Упаковка 8 дисков — ровно на один блокнот" : "Свои диски уже в комплекте. Цветные наборы можно добавить отдельно"}
          done={parts ? !!disc : true}
          aside={
            parts && (
              <div className="store-tabs-row" role="group" aria-label="Диаметр">
                {([18, 24] as const).map((d) => (
                  <StoreTabButton
                    key={d}
                    type="button"
                    onClick={() => setWantD(d)}
                    disabled={d === 18 && sheets > CAPACITY[18]}
                    aria-pressed={diameter === d}
                    className="store-tab-compact"
                  >
                    <span className="rounded-full border-2 border-current" style={{ width: d * 0.75, height: d * 0.75 }} aria-hidden />
                    {d} мм · до {CAPACITY[d]} л.
                  </StoreTabButton>
                ))}
              </div>
            )
          }
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
            {!parts && (
              <button type="button" onClick={() => setVariant(null)} aria-pressed={!disc} className={`constructor-disc group flex flex-col items-center gap-2 p-2 text-center ${pick}`}>
                <span className="relative aspect-square w-full overflow-hidden rounded-lg bg-card">{cover?.image && <Image src={cover.image} alt="" fill sizes="(min-width:1280px) 120px, 30vw" className="object-contain" />}</span>
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
                  data-disc={d.id}
                  className={`constructor-disc group flex flex-col items-center gap-2 p-2 text-center ${pick}`}
                >
                  <span className="relative aspect-square w-full overflow-hidden rounded-lg bg-card">
                    {d.image ? <ViewportPhoto src={(discPhotos as Record<string,string>)[d.image] ?? d.image} alt="" fill sizes="(min-width:1280px) 120px, 30vw" className="object-contain transition duration-300 group-hover:scale-105" /> : <span className="constructor-no-photo"><CategoryTabIcon type="Диски" /><span>Нет фото</span></span>}
                  </span>
                  <span className="text-sm font-medium leading-tight">{v.title}</span>
                  <b className="text-sm">{formatPrice(d.price)}</b>
                </button>
              );
            })}
          </div>
          <StoreTabLink href="/catalog?type=Диски" icon={<CategoryTabIcon type="Диски" />} className="mt-4 store-tab-compact constructor-catalog-link">
            Нужно больше дисков? Упаковки по 100 и 1000 — в каталоге
          </StoreTabLink>
        </Step>

        <section className="constructor-extras border-t border-line pt-6" aria-labelledby="constructor-extra">
          <h2 id="constructor-extra" className="flex items-center gap-2 font-display text-2xl"><CategoryTabIcon type="Аксессуары" />Что ещё добавить?</h2>
          <p className="mt-2 text-sm text-muted">Все аксессуары из каталога — отдельно от сборки.</p>
          {accessories.length > 0 && <AccessoryCarousel accessories={accessories} />}
          <StoreTabLink href="/catalog?type=Аксессуары" icon={<CategoryTabIcon type="Аксессуары" />} className="mt-4 store-tab-compact">Открыть раздел аксессуаров</StoreTabLink>
        </section>
      </div>

      {/* Телефон: итог и кнопка всегда под пальцем. */}
      <div data-constructor-purchase className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="page-shell flex items-center gap-3">
          {/* Мини-превью: пока листаешь шаги, блокнот всё равно на виду. */}
          <NotebookPreview look={look} className="w-11 shrink-0" label="Мини-превью блокнота" />
          <div className="min-w-0 flex-1">
            <b className="block font-display text-xl tabular-nums">{formatPrice(total)}</b>
            <span className="block truncate text-xs text-muted">
              {missing || `${F.label} · блоков: ${blockCount}`}
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
