import { useId } from "react";
import { shade } from "@/lib/color";
import type { Ruling } from "./NotebookPreview";

/**
 * Диск для выбора в конструкторе (вид сверху): обод, канавка, ступица и блик.
 * Размер на экране пропорционален диаметру, чтобы 18 и 24 мм было видно на глаз.
 */
export function DiscSwatch({ hex, kind, metal, diameter, size = 72 }: { hex: string; kind: string; metal?: boolean; diameter: 18 | 24; size?: number }) {
  const id = useId().replace(/:/g, "");
  const px = Math.round(size * (diameter === 24 ? 1 : 0.78));
  const isMetal = metal || kind === "metal";
  const c = hex;
  return (
    <svg viewBox="0 0 100 100" width={px} height={px} aria-hidden className="drop-shadow-[0_6px_10px_rgba(0,0,0,.18)] transition-transform duration-300">
      <defs>
        {isMetal ? (
          <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={shade(c, 0.6)} />
            <stop offset=".35" stopColor={c} />
            <stop offset=".55" stopColor={shade(c, -0.3)} />
            <stop offset=".75" stopColor={shade(c, 0.45)} />
            <stop offset="1" stopColor={shade(c, -0.15)} />
          </linearGradient>
        ) : kind === "pearl" ? (
          <radialGradient id={`${id}-f`} cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".3" stopColor={shade(c, 0.35)} />
            <stop offset=".6" stopColor={c} />
            <stop offset=".85" stopColor={shade(c, 0.2)} />
            <stop offset="1" stopColor={shade(c, -0.15)} />
          </radialGradient>
        ) : (
          <radialGradient id={`${id}-f`} cx=".35" cy=".3" r=".85">
            <stop offset="0" stopColor={shade(c, kind === "gloss" || kind === "clear" ? 0.55 : 0.15)} />
            <stop offset=".45" stopColor={c} />
            <stop offset="1" stopColor={shade(c, -0.18)} />
          </radialGradient>
        )}
      </defs>
      <g opacity={kind === "clear" ? 0.65 : 1}>
        <circle cx="50" cy="50" r="47" fill={`url(#${id}-f)`} stroke={shade(c, -0.35)} strokeWidth="1.5" />
        <circle cx="50" cy="50" r="36" fill="none" stroke={shade(c, -0.22)} strokeWidth="3" opacity=".55" />
        <circle cx="50" cy="50" r="34" fill="none" stroke={shade(c, 0.4)} strokeWidth="1.2" opacity=".7" />
        <circle cx="50" cy="50" r="16" fill={shade(c, -0.08)} stroke={shade(c, -0.3)} strokeWidth="1" />
      </g>
      {(kind !== "matte" || isMetal) && (
        <path d="M20 34a34 34 0 0 1 22-16" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity={isMetal ? 0.85 : 0.6} />
      )}
      {kind === "clear" && <circle cx="50" cy="50" r="47" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" />}
    </svg>
  );
}

const RULING_BG: Record<Ruling, string> = {
  grid: "linear-gradient(#c3ccd4 1px, transparent 1px) 0 0/12px 12px, linear-gradient(90deg, #c3ccd4 1px, transparent 1px) 0 0/12px 12px",
  dot: "radial-gradient(circle, #8f99a3 1.2px, transparent 1.6px) 0 0/12px 12px",
  line: "linear-gradient(transparent 13px, #c3ccd4 13px, #c3ccd4 14px, transparent 14px) 0 0/100% 14px",
  plan: "linear-gradient(#e2d9c9 0 14px, transparent 14px) 0 0/100% 100%, linear-gradient(transparent 27px, #d3cbbd 27px, #d3cbbd 28px, transparent 28px) 0 14px/100% 28px, linear-gradient(90deg, transparent 34%, #d3cbbd 34%, #d3cbbd calc(34% + 1px), transparent calc(34% + 1px))",
  blank: "none",
};

/** Кусочек листа с линовкой — видно, какой будет страница. */
export function PageSwatch({ ruling, paper, className = "" }: { ruling: Ruling; paper: "white" | "cream"; className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-md shadow-[0_1px_0_rgba(0,0,0,.06),0_8px_18px_-8px_rgba(0,0,0,.35)] ring-1 ring-black/5 ${className}`}
      style={{ background: `${RULING_BG[ruling] === "none" ? "" : RULING_BG[ruling] + ","} ${paper === "cream" ? "#f3e9d3" : "#fbfaf6"}` }}
    />
  );
}
