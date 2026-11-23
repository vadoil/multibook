"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type HeroSlide = { src: string; title: string; href: string; price: string };

/** Первый экран: крупные фото товаров сменяют друг друга. На наведении — пауза. */
export function HeroGallery({ slides }: { slides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((v) => (v + 1) % slides.length), 3500);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  if (!slides.length) return null;
  const cur = slides[i];

  return (
    <div className="relative" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <Link href={cur.href} className="relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-[#efe9df]">
        {slides.map((s, n) => (
          <Image
            key={s.src}
            src={s.src}
            alt={s.title}
            fill
            priority={n === 0}
            sizes="(min-width: 1024px) 45vw, 100vw"
            className={`object-cover transition-all duration-700 ${n === i ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          />
        ))}
        <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl bg-card/90 px-4 py-3 backdrop-blur">
          <span className="line-clamp-1 text-sm font-medium">{cur.title}</span>
          <b className="shrink-0">{cur.price}</b>
        </span>
      </Link>
      {slides.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Фото товаров">
          {slides.map((s, n) => (
            <button
              key={s.src}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={s.title}
              onClick={() => setI(n)}
              className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-ink" : "w-2 bg-ink/25"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
