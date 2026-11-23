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
};

const DISC_Y = Array.from({ length: 8 }, (_, i) => 52 + i * (316 / 7));
const PAPER = { white: "#fbfaf6", cream: "#f3e9d3" };


function Discs({ cx, discs }: { cx: number; discs: NonNullable<NotebookLook["discs"]> }) {
  const r = discs.diameter === 24 ? 15 : discs.diameter === 18 ? 12 : 13.5;
  const c = discs.hex;
  return (
    <g key={`${c}-${discs.diameter}-${cx}`}>
      {DISC_Y.map((y, i) => (
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

/** Живое превью блокнота: рисуется из выбранных частей, без фотографий. */
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

  return (
    <div
      ref={stage}
      className={`grid place-items-center [perspective:1100px] ${className}`}
      onPointerMove={(e) => {
        const r = stage.current!.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        setTilt(`rotateY(${(x * 16).toFixed(1)}deg) rotateX(${(-y * 10).toFixed(1)}deg)`);
      }}
      onPointerLeave={() => setTilt("")}
    >
      <svg
        viewBox="0 0 360 440"
        role="img"
        aria-label={label}
        className="nb-svg h-auto w-full max-w-[380px]"
        style={{ transform: tilt }}
      >
        <Patterns id={id} />
        {view === "open" ? (
          <>
            <ellipse cx="180" cy="420" rx="160" ry="9" fill="#000" opacity=".1" />
            <rect className="nb-t" x="6" y="26" width="348" height="384" rx="10" style={{ fill: fc, stroke: shade(fc, -0.25) }} />
            <rect className="nb-t" x="16" y="32" width="160" height="372" rx="3" style={{ fill: paper }} />
            <rect x="24" y="44" width="146" height="350" fill={`url(#${id}-${look.pages?.[0] ?? "blank"})`} />
            <rect className="nb-t" x="184" y="32" width="160" height="372" rx="3" style={{ fill: paper }} />
            <rect x="190" y="44" width="146" height="350" fill={`url(#${id}-${look.pages?.[1] ?? look.pages?.[0] ?? "blank"})`} />
            {look.discs && <Discs cx={180} discs={look.discs} />}
          </>
        ) : (
          <>
            <ellipse cx="185" cy="420" rx="150" ry="9" fill="#000" opacity=".12" />
            <rect
              className="nb-t"
              x="30"
              y="20"
              width="280"
              height="380"
              rx="10"
              style={{ fill: shade(bc, -0.15), transform: `translate(${t}px, ${t * 0.5}px)` }}
            />
            <g className="nb-t" style={{ transform: `translate(${t * 0.55}px, ${t * 0.28}px)` }}>
              <rect x="33" y="24" width="273" height="373" rx="3" fill={paper} />
              <rect x="33" y="24" width="273" height="373" rx="3" fill={`url(#${id}-edge)`} />
            </g>
            {look.discs && <Discs cx={31} discs={look.discs} />}
            <g key={fc} className={look.front ? "nb-bump" : ""}>
              <rect className="nb-t" x="30" y="20" width="280" height="380" rx="10" style={{ fill: fc, stroke: shade(fc, -0.25) }} />
              <rect x="30" y="20" width="280" height="380" rx="10" fill="#808080" filter={`url(#${id}-noise)`} style={{ mixBlendMode: "overlay" }} />
              {look.front?.print && (
                <g fill="none" stroke={shade(fc, 0.45)} strokeWidth="2" opacity=".55">
                  <path d="M40 110c40-30 80 30 120 0s80-30 140 0" />
                  <path d="M40 170c40-30 80 30 120 0s80-30 140 0" />
                  <path d="M40 290c40-30 80 30 120 0s80-30 140 0" />
                  <circle cx="230" cy="330" r="34" />
                </g>
              )}
              <rect x="30" y="20" width="280" height="380" rx="10" fill={`url(#${id}-light)`} />
              <text
                x="170"
                y="214"
                textAnchor="middle"
                fontSize="17"
                fontWeight="700"
                letterSpacing="5"
                style={{ fill: shade(fc, look.front ? 0.22 : -0.15), opacity: 0.55 }}
              >
                MULTIBOOK
              </text>
              {!look.discs &&
                DISC_Y.map((y) => (
                  <rect key={y} x="30" y={y - 3} width="11" height="6" rx="3" fill={shade(fc, -0.35)} opacity=".55" />
                ))}
            </g>
          </>
        )}
      </svg>
      <style>{`
        .nb-svg{transition:transform .35s ease-out;animation:nb-float 6s ease-in-out infinite}
        .nb-t{transition:fill .45s ease,stroke .45s ease,transform .45s cubic-bezier(.3,1.3,.5,1)}
        .nb-disc{transform-box:fill-box;transform-origin:center;animation:nb-pop .5s cubic-bezier(.3,1.7,.5,1) both}
        .nb-bump{transform-box:fill-box;transform-origin:center;animation:nb-bump .5s cubic-bezier(.3,1.5,.5,1)}
        @keyframes nb-pop{from{transform:scale(0)}to{transform:scale(1)}}
        @keyframes nb-bump{40%{transform:scale(1.025)}}
        @keyframes nb-float{50%{translate:0 -4px}}
      `}</style>
    </div>
  );
}
