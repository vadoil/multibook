"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import "./wallpaper-hero.css";

export type Wallpaper = {
  id: string;
  name: string;
  alt: string;
  tone: string;
  desktop: string;
  desktopSmall: string;
  mobile: string;
  thumb: string;
  href?: string;
  price?: string;
};

const HOLD = 7000; // сколько стоит один кадр, мс
const SCENES: Record<string, string> = {
  "lifestyle-desk": "За рабочим столом",
  "lifestyle-writing": "Место для идей",
  "lifestyle-gallery": "Предмет с характером",
  "premium-city": "Москва-Сити",
  "premium-meeting": "Переговоры",
  "premium-coaching": "С коучем",
  "premium-academy": "Новые знания",
  "premium-city-night": "Вечерний Сити",
  "premium-executive": "Рабочий день",
};

/** Первый экран-«рабочий стол»: полноэкранные обои из фото блокнотов меняются сами,
 *  а в доке справа внизу можно выбрать любые — как обои в настройках компьютера. */
export function WallpaperHero({ slides }: { slides: Wallpaper[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // пауза по кнопке
  const [hold, setHold] = useState(false); // пауза, пока курсор или фокус в доке
  const [still, setStill] = useState(false); // prefers-reduced-motion
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const hero = useRef<HTMLElement>(null);
  const n = slides.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + n) % n;
      setIndex(next);
      setSeen((s) => (s.has(next) && s.has((next + 1) % n) ? s : new Set([...s, next, (next + 1) % n])));
    },
    [n],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setStill(mq.matches);
      if (mq.matches) {
        hero.current?.style.setProperty("--wp-x", "0px");
        hero.current?.style.setProperty("--wp-y", "0px");
      }
    };
    sync();
    mq.addEventListener("change", sync);
    // Следующий кадр подгружаем заранее, остальные — по мере показа.
    const t = setTimeout(() => setSeen((s) => new Set([...s, 1 % n])), 1500);
    return () => {
      mq.removeEventListener("change", sync);
      clearTimeout(t);
    };
  }, [n]);

  const running = !paused && !hold && !still && n > 1;
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => go(index + 1), HOLD);
    return () => clearTimeout(t);
  }, [running, index, go]);

  if (!n) return null;
  const cur = slides[index];

  return (
    <section
      ref={hero}
      className="wp-hero"
      aria-roledescription="карусель"
      aria-label="Премиальные ежедневники Multibook"
      data-running={running || undefined}
      onPointerMove={(e) => {
        if (still || e.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        const r = e.currentTarget.getBoundingClientRect();
        const x = Math.max(-6, Math.min(6, ((e.clientX - r.left) / r.width - 0.5) * 12));
        const y = Math.max(-4, Math.min(4, ((e.clientY - r.top) / r.height - 0.5) * 8));
        e.currentTarget.style.setProperty("--wp-x", `${x}px`);
        e.currentTarget.style.setProperty("--wp-y", `${y}px`);
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--wp-x", "0px");
        e.currentTarget.style.setProperty("--wp-y", "0px");
      }}
      onPointerDown={(e) => {
        if (e.target instanceof Element && e.target.closest(".wp-dock")) return;
        if (e.pointerType !== "mouse") swipe.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const s = swipe.current;
        swipe.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(index + (dx < 0 ? 1 : -1));
      }}
      onPointerCancel={() => (swipe.current = null)}
    >
      <div className="wp-stage" aria-hidden="true">
        {slides.map((s, i) => (
          <div key={s.id} className="wp-slide" data-active={i === index || undefined} style={{ "--wp-tone": s.tone } as React.CSSProperties}>
            {seen.has(i) && (
              <picture>
                <source media="(max-width: 760px)" srcSet={s.mobile} />
                <source media="(max-width: 1700px)" srcSet={s.desktopSmall} />
                <img src={s.desktop} alt="" width={2560} height={1440} decoding="async" fetchPriority={i === 0 ? "high" : "low"} />
              </picture>
            )}
          </div>
        ))}
      </div>

      <div className="wp-copy">
        <h1><span>Ежедневники</span><span>для ваших планов.</span></h1>
        <p><span>Готовая коллекция или ваша сборка.<br />Листы меняются. Любимые вещи остаются.</span></p>
        <div className="wp-actions">
          <Link href="/catalog?type=%D0%91%D0%BB%D0%BE%D0%BA%D0%BD%D0%BE%D1%82%D1%8B" className="wp-btn wp-btn-main">
            Готовые ежедневники
          </Link>
          <Link href="/constructor" className="wp-btn">
            Конструктор
          </Link>
        </div>
      </div>

      <div className="wp-bar">
        {cur.href ? (
          <Link href={cur.href} className="wp-caption">
            <span className="wp-caption-name">«{cur.name}»</span>
            {cur.price && <span className="wp-caption-price">{cur.price}</span>}
            <span className="wp-caption-more">Посмотреть ежедневник</span>
          </Link>
        ) : (
          <p className="wp-caption">
            <span className="wp-caption-name">«{cur.name}»</span>
          </p>
        )}

        {n > 1 && (
          <div
            className="wp-dock"
            role="group"
            aria-label="Выбор сцены и ежедневника"
            onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
            onPointerLeave={() => setHold(false)}
            onFocus={() => setHold(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold(false)}
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="wp-thumb"
                data-name={SCENES[s.id] ?? s.name}
                aria-label={`${SCENES[s.id] ?? "Коллекция"}: ежедневник «${s.name}»`}
                aria-current={i === index || undefined}
                onClick={() => go(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumb} alt="" width={64} height={36} loading="lazy" />
                {i === index && <span className="wp-progress" key={`${index}-${running}`} />}
              </button>
            ))}
            {!still && (
              <button type="button" className="wp-pause" onClick={() => setPaused(!paused)} aria-label={paused ? "Продолжить просмотр" : "Остановить смену кадров"}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {paused ? <path d="M8 5.5v13l10-6.5z" /> : <path d="M8 5h3v14H8zM13 5h3v14h-3z" />}
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      <p className="wp-sr" aria-live={running ? "off" : "polite"}>
        Коллекция {index + 1} из {n}: {cur.alt}
      </p>
    </section>
  );
}
