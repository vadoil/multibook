import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { ContentItem, Product } from "@/db/schema";
import { formatPrice } from "./money";
import { SITE } from "./site";

/** Картинки для соцсетей: настоящие фото товара + текст фирменными шрифтами. Товар не перерисовывается. */

const C = { paper: "#eee7db", card: "#faf5ec", ink: "#462c2b", muted: "#6f5b53", line: "#d0c3b5", accent: "#823a31" };
export const SIZES = { feed: { w: 1080, h: 1350 }, reel: { w: 1080, h: 1920 } } as const;
export type Layer = "full" | "bg" | "text";

type Font = { name: string; data: Buffer; weight: 400 | 500 | 600; style: "normal" };
let fontsCache: Promise<Font[]> | null = null;
function fonts(): Promise<Font[]> {
  fontsCache ??= Promise.all(
    (
      [
        ["Serif", "cormorant-latin-500-normal.woff", 500],
        ["Serif", "cormorant-cyrillic-500-normal.woff", 500],
        ["Sans", "golos-text-latin-400-normal.woff", 400],
        ["Sans", "golos-text-cyrillic-400-normal.woff", 400],
        ["Sans", "golos-text-latin-600-normal.woff", 600],
        ["Sans", "golos-text-cyrillic-600-normal.woff", 600],
      ] as const
    ).map(async ([name, file, weight]) => ({ name, weight, style: "normal" as const, data: await readFile(path.join(process.cwd(), "assets", "fonts", file)) })),
  );
  return fontsCache;
}

const photoCache = new Map<string, string>();
/** Фото товара → JPEG нужного размера в data URL (satori не читает webp и не кадрирует сам). */
async function photo(url: string | undefined, w: number, h: number): Promise<string | null> {
  if (!url) return null;
  const key = `${url}|${w}x${h}`;
  const hit = photoCache.get(key);
  if (hit) return hit;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !/(^|\.)tildacdn\.com$/.test(u.hostname)) return null;
    const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const out = await sharp(Buffer.from(await res.arrayBuffer())).rotate().resize(w, h, { fit: "cover", position: "attention" }).jpeg({ quality: 84 }).toBuffer();
    const data = `data:image/jpeg;base64,${out.toString("base64")}`;
    if (photoCache.size > 60) photoCache.delete(photoCache.keys().next().value!);
    photoCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

const host = () => SITE.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
/** В шрифтах слайдов нет знака рубля — пишем словом. */
const rub = (s: string) => s.replace(/\s?₽/g, " руб.");
const fit = (s: string, big: number, small: number, limit = 22) => (s.length > limit ? small : big);

function Mark({ color, count }: { color: string; count?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", color }}>
      <div style={{ display: "flex", fontFamily: "Serif", fontSize: 50, letterSpacing: -3 }}>multibook</div>
      {count ? <div style={{ display: "flex", fontFamily: "Sans", fontSize: 26, opacity: 0.85 }}>{count}</div> : <div style={{ display: "flex" }} />}
    </div>
  );
}

async function feedFrame(item: ContentItem, p: Product | null, n: number) {
  const { w, h } = SIZES.feed;
  const slides = item.data.slides;
  const s = { ...slides[n], title: rub(slides[n].title), text: rub(slides[n].text) };
  const total = slides.length;
  const count = total > 1 ? `${n + 1} / ${total}` : undefined;
  const tpl = item.data.template;
  const last = item.kind === "carousel" && total > 1 && n === total - 1;
  const src = p?.images[s.image] ?? p?.images[0];

  if (last) {
    const img = await photo(src, 640, 640);
    const cta = rub(item.data.cta);
    return (
      <div style={{ width: w, height: h, display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.accent, color: C.card, padding: 72 }}>
        <Mark color={C.card} count={count} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {img && <img src={img} width={560} height={560} style={{ borderRadius: 12, border: `6px solid ${C.card}` }} />}
          <div style={{ display: "flex", marginTop: 44, fontFamily: "Serif", fontSize: fit(s.title, 104, 80, 18), lineHeight: 1, letterSpacing: -3 }}>{s.title}</div>
          {s.text && <div style={{ display: "flex", marginTop: 22, fontFamily: "Sans", fontSize: 34, lineHeight: 1.4, opacity: 0.92, maxWidth: 860 }}>{s.text}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Sans", fontSize: 30 }}>
          <div style={{ display: "flex", background: C.card, color: C.ink, borderRadius: 999, padding: "20px 38px", fontWeight: 600 }}>{cta && cta.length <= 30 ? cta : "Заказать на сайте"}</div>
          <div style={{ display: "flex", opacity: 0.9 }}>{host()}</div>
        </div>
      </div>
    );
  }
  if (tpl === "photo") {
    const img = await photo(src, w, h);
    return (
      <div style={{ width: w, height: h, display: "flex", position: "relative", background: C.ink, color: C.card }}>
        {img && <img src={img} width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }} />}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: w, height: 760, display: "flex", backgroundImage: "linear-gradient(0deg, rgba(40,22,20,0.9) 12%, rgba(40,22,20,0))" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", height: "100%", padding: 72 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Serif", fontSize: fit(s.title, 118, 88), lineHeight: 0.98, letterSpacing: -4 }}>{s.title}</div>
            {s.text && <div style={{ display: "flex", marginTop: 26, fontFamily: "Sans", fontSize: 38, lineHeight: 1.38, maxWidth: 860 }}>{s.text}</div>}
            {n === 0 && p && (
              <div style={{ display: "flex", marginTop: 36 }}>
                <div style={{ display: "flex", background: C.card, color: C.ink, borderRadius: 999, padding: "16px 32px", fontFamily: "Sans", fontWeight: 600, fontSize: 32 }}>{rub(formatPrice(p.price))}</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", marginTop: 40, paddingTop: 22, borderTop: "2px solid rgba(250,245,236,0.35)" }}>
            <Mark color={C.card} count={count} />
          </div>
        </div>
      </div>
    );
  }

  const dark = tpl === "ink";
  const bg = dark ? C.ink : C.paper;
  const fg = dark ? C.card : C.ink;
  const sub = dark ? "#e2d5c6" : C.muted;
  const img = await photo(src, 936, 760);
  return (
    <div style={{ width: w, height: h, display: "flex", flexDirection: "column", background: bg, color: fg, padding: 72 }}>
      {img ? <img src={img} width={936} height={760} style={{ borderRadius: 10 }} /> : <div style={{ display: "flex", width: 936, height: 760, background: C.line, borderRadius: 10 }} />}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", fontFamily: "Serif", fontSize: fit(s.title, 104, 78), lineHeight: 1, letterSpacing: -3 }}>{s.title}</div>
        {s.text && <div style={{ display: "flex", marginTop: 22, fontFamily: "Sans", fontSize: 36, lineHeight: 1.4, color: sub }}>{s.text}</div>}
      </div>
      <div style={{ display: "flex", borderTop: `2px solid ${dark ? "#6b4a47" : C.line}`, paddingTop: 22 }}>
        <Mark color={dark ? C.card : C.accent} count={count} />
      </div>
    </div>
  );
}

async function reelFrame(item: ContentItem, p: Product | null, n: number, layer: Layer) {
  const { w, h } = SIZES.reel;
  const s = { ...item.data.scenes[n], overlay: rub(item.data.scenes[n].overlay) };
  const img = layer === "text" ? null : await photo(p?.images[s.image] ?? p?.images[0], w, h);
  const last = n === item.data.scenes.length - 1;
  return (
    <div style={{ width: w, height: h, display: "flex", position: "relative", background: layer === "text" ? "transparent" : C.ink }}>
      {img && <img src={img} width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }} />}
      {layer !== "bg" && (
        <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "150px 72px 0" }}>
          <div style={{ display: "flex", fontFamily: "Serif", fontSize: 56, letterSpacing: -3, color: C.card, textShadow: "0 2px 18px rgba(40,22,20,0.55)" }}>multibook</div>
          <div style={{ display: "flex", flex: 1 }} />
          {s.overlay && (
            <div style={{ display: "flex", marginBottom: 470 }}>
              <div
                style={{
                  display: "flex",
                  background: last ? C.accent : C.card,
                  color: last ? C.card : C.ink,
                  borderRadius: 14,
                  padding: "30px 40px",
                  maxWidth: 900,
                  fontFamily: n === 0 ? "Serif" : "Sans",
                  fontWeight: n === 0 ? 500 : 600,
                  fontSize: n === 0 ? fit(s.overlay, 104, 82, 18) : fit(s.overlay, 66, 56),
                  lineHeight: 1.08,
                  letterSpacing: n === 0 ? -3 : -1,
                  boxShadow: "0 14px 44px rgba(40,22,20,0.28)",
                }}
              >
                {s.overlay}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** PNG кадра: слайд ленты (1080×1350) или кадр рилса (1080×1920). */
export async function renderFrame(item: ContentItem, p: Product | null, n: number, layer: Layer = "full"): Promise<Buffer> {
  const reel = item.kind === "reel";
  const size = reel ? SIZES.reel : SIZES.feed;
  const jsx = reel ? await reelFrame(item, p, n, layer) : await feedFrame(item, p, n);
  const res = new ImageResponse(jsx, { width: size.w, height: size.h, fonts: await fonts() });
  return Buffer.from(await res.arrayBuffer());
}
