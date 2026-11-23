"use client";

import { useId, useRef, useState } from "react";
import { shade } from "@/lib/color";

export type Ruling = "grid" | "dot" | "line" | "blank" | "plan";

export type NotebookLook = {
  front?: { hex: string; print?: boolean };
  back?: { hex: string };
  discs?: { hex: string; diameter?: number; metal?: boolean };
  sheets?: number;
  paper?: "white" | "cream";
  pages?: [Ruling?, Ruling?];
  /** Размер страницы в единицах превью и число дисков; по умолчанию — А5. */
  shape?: { w: number; h: number; discs: number };
};

const VB_W = 360;
const FLOOR = 420;
const PAPER = { white: "#fbfaf6", cream: "#f3e9d3" };
const A5 = { w: 280, h: 380, discs: 8 };

function discYs(top: number, h: number, n: number) {
  const pad = h * 0.085;
  return Array.from({ length: n }, (_, i) => top + pad + (i * (h - 2 * pad)) / Math.max(1, n - 1));
}

function Discs({ cx, ys, discs }: { cx: number; ys: number[]; discs: NonNullable<NotebookLook["discs"]> }) {
  const r = discs.diameter === 24 ? 15 : discs.diameter === 18 ? 12 : 13.5;
  const c = discs.hex;
  return (
    <g key={`${c}-${discs.diameter}-${cx}-${ys.length}`}>
      {ys.map((y, i) => (
        <g key={i} className="nb-disc" style={{ animationDelay: `${i * 45}ms` }}>
          <circle cx={cx} cy={y} r={r} fill={c} stroke={shade(c, -0.3)} />
          <circle cx={cx} cy={y} r={r - 4} fill="none" stroke={shade(c, discs.metal ? 0.6 : 0.35)} strokeWidth={1.4} opacity={0.7} />
          <path
            d={`M${cx - r * 0.55} ${y - r * 0.55}a${r * 0.8} ${r * 0.8} 0 0 1 ${r * 0.7} -${r * 0.25}`}
            stroke="#fff"
            strokeWidth={2}
            fill="none"
            opacity={discs.metal ? 0.8 : 0.45}
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>
  );
}

function Patterns({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-noise`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} seed={4} />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 .55" />
        </feComponentTransfer>
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".22" />
        <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".2" />
      </linearGradient>
      <pattern id={`${id}-edge`} width="4" height="2.2" patternUnits="userSpaceOnUse">
        <rect width="4" height="1" fill="#000" opacity=".08" />
      </pattern>
      <pattern id={`${id}-grid`} width="9" height="9" patternUnits="userSpaceOnUse">
        <path d="M9 0H0V9" fill="none" stroke="#c9d1d8" strokeWidth=".6" />
      </pattern>
      <pattern id={`${id}-dot`} width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="4.5" cy="4.5" r=".8" fill="#9ea7b0" />
      </pattern>
      <pattern id={`${id}-line`} width="9" height="11" patternUnits="userSpaceOnUse">
        <path d="M0 10.5H9" stroke="#c9d1d8" strokeWidth=".6" />
      </pattern>
      <pattern id={`${id}-plan`} width="140" height="44" patternUnits="userSpaceOnUse">
        <rect width="140" height="9" fill="#e7dfd1" />
        <path d="M0 43.5H140M0 22H140M42 0V44" stroke="#d6cfc2" strokeWidth=".6" />
      </pattern>
      <pattern id={`${id}-blank`} width="10" height="10" patternUnits="userSpaceOnUse" />
    </defs>
  );
}

/** Живое превью блокнота: рисуется из выбранных частей, без фотографий. Пропорции — по формату. */
export function NotebookPreview({
  look,
  view = "closed",
  className = "",
  label = "Превью блокнота",
}: {
  look: NotebookLook;
  view?: "closed" | "open";
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, "");
  const stage = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState("");
  const fc = look.front?.hex ?? "#e9e3d8";
  const bc = look.back?.hex ?? look.front?.hex ?? "#e2dbcf";
  const paper = PAPER[look.paper ?? "white"];
  const t = look.sheets ? Math.min(18, 3 + look.sheets / 8) : 2;
  const { w, h, discs: nDiscs } = look.shape ?? A5;

  // Закрытый блокнот: по центру, корешок с дисками слева.
  const x = (VB_W - w) / 2 + 5;
  const y = FLOOR - 20 - h;
  const k = w / A5.w; // масштаб декора относительно А5
  const ys = discYs(y, h, nDiscs);

  // Одна страница в пропорциях выбранного формата: разметка видна крупно.
  const pw = w - 12;
  const ph = h - 12;
  const ox = x + 6;
  const oy = y + 6;

  return (
    <div
      ref={stage}
      className={`grid place-items-center [perspective:1100px] ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const r = stage.current!.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        setTilt(`rotateY(${(px * 16).toFixed(1)}deg) rotateX(${(-py * 10).toFixed(1)}deg)`);
      }}
      onPointerLeave={() => setTilt("")}
    >
      <svg viewBox={`0 0 ${VB_W} 440`} role="img" aria-label={label} className={`nb-svg h-auto w-full max-w-[380px] ${view === "open" ? "nb-page" : ""}`} style={{ transform: tilt }}>
        <Patterns id={id} />
        {view === "open" ? (
          <>
            <ellipse cx={x + w / 2 + 5} cy={FLOOR} rx={w / 2 + 10} ry="9" fill="#000" opacity=".1" />
            <rect className="nb-t" x={x} y={y} width={w} height={h} rx="10" style={{ fill: fc, stroke: shade(fc, -0.25) }} />
            <rect className="nb-t" x={ox} y={oy} width={pw} height={ph} rx="4" style={{ fill: paper }} />
            <rect x={ox + 19} y={oy + 15} width={pw - 31} height={ph - 30} fill={`url(#${id}-${look.pages?.[0] ?? "blank"})`} />
            {look.discs ? <Discs cx={x + 1} ys={ys} discs={look.discs} /> : ys.map((dy) => <rect key={dy} x={ox} y={dy - 3} width="8" height="6" rx="3" fill={shade(paper, -0.25)} />)}
          </>
        ) : (
          <>
            <ellipse cx={x + w / 2 + 5} cy={FLOOR} rx={w / 2 + 10} ry="9" fill="#000" opacity=".12" />
            <rect className="nb-t" x={x} y={y} width={w} height={h} rx="10" style={{ fill: shade(bc, -0.15), transform: `translate(${t}px, ${t * 0.5}px)` }} />
            <g className="nb-t" style={{ transform: `translate(${t * 0.55}px, ${t * 0.28}px)` }}>
              <rect x={x + 3} y={y + 4} width={w - 7} height={h - 7} rx="3" fill={paper} />
              <rect x={x + 3} y={y + 4} width={w - 7} height={h - 7} rx="3" fill={`url(#${id}-edge)`} />
            </g>
            {look.discs && <Discs cx={x + 1} ys={ys} discs={look.discs} />}
            <g key={fc} className={look.front ? "nb-bump" : ""}>
              <rect className="nb-t" x={x} y={y} width={w} height={h} rx="10" style={{ fill: fc, stroke: shade(fc, -0.25) }} />
              <rect x={x} y={y} width={w} height={h} rx="10" fill="#808080" filter={`url(#${id}-noise)`} style={{ mixBlendMode: "overlay" }} />
              {look.front?.print && (
                <g fill="none" stroke={shade(fc, 0.45)} strokeWidth={2 / k} opacity=".55" transform={`translate(${x} ${y}) scale(${k} ${h / A5.h})`}>
                  <path d="M10 90c40-30 80 30 120 0s80-30 140 0" />
                  <path d="M10 150c40-30 80 30 120 0s80-30 140 0" />
                  <path d="M10 270c40-30 80 30 120 0s80-30 140 0" />
                  <circle cx="200" cy="310" r="34" />
                </g>
              )}
              <rect x={x} y={y} width={w} height={h} rx="10" fill={`url(#${id}-light)`} />
              <text
                x={x + w / 2 + 6}
                y={y + h / 2 + 6}
                textAnchor="middle"
                fontSize={Math.max(10, 17 * k)}
                fontWeight="700"
                letterSpacing={5 * k}
                style={{ fill: shade(fc, look.front ? 0.22 : -0.15), opacity: 0.55 }}
              >
                MULTIBOOK
              </text>
              {!look.discs && ys.map((dy) => <rect key={dy} x={x} y={dy - 3} width="11" height="6" rx="3" fill={shade(fc, -0.35)} opacity=".55" />)}
            </g>
          </>
        )}
      </svg>
      <style>{`
        .nb-svg{transition:transform .35s ease-out;animation:nb-float 6s ease-in-out infinite}
        .nb-page{animation:none}
        .nb-t{transition:fill .45s ease,stroke .45s ease,transform .45s cubic-bezier(.3,1.3,.5,1)}
        .nb-disc{transform-box:fill-box;transform-origin:center;animation:nb-pop .5s cubic-bezier(.3,1.7,.5,1) both}
        .nb-bump{transform-box:fill-box;transform-origin:center;animation:nb-bump .5s cubic-bezier(.3,1.5,.5,1)}
        @keyframes nb-pop{from{transform:scale(0)}to{transform:scale(1)}}
        @keyframes nb-bump{40%{transform:scale(1.025)}}
        @keyframes nb-float{50%{translate:0 -4px}}
        @media (prefers-reduced-motion: reduce){.nb-svg,.nb-disc,.nb-bump{animation:none}}
      `}</style>
    </div>
  );
}
