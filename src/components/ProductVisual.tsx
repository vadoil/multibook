import Image from "next/image";
import type { Product } from "@/db/schema";
import { shade } from "./NotebookPreview";

/**
 * Визуал товара. Для обложек, блоков и дисков рисуем сами — по цвету, линовке и диаметру из данных.
 * Для готовых тетрадей и блокнотов пока используем фото из Tilda: до съёмки реальных SKU.
 */
export function ProductVisual({ product, size = "card" }: { product: Product; size?: "card" | "large" }) {
  const a = product.attrs;
  const h = size === "large" ? "aspect-[4/5]" : "aspect-[4/5]";
  const base = `relative ${h} w-full overflow-hidden rounded-[var(--radius-card)]`;

  if (product.type === "Обложки") {
    const c = a.colorHex ?? "#9a8f80";
    return (
      <div className={`${base} grid place-items-center bg-[#efe9df]`}>
        <div
          className="relative h-[78%] w-[62%] rounded-[10px] shadow-[0_18px_30px_-12px_rgba(40,30,10,.35)]"
          style={{ background: `linear-gradient(120deg, ${shade(c, 0.18)}, ${c} 45%, ${shade(c, -0.18)})` }}
        >
          {a.isSet && (
            <div
              className="absolute -right-3 top-2 -z-10 h-full w-full rounded-[10px]"
              style={{ background: shade(c, -0.25) }}
            />
          )}
          {a.print && (
            <div className="absolute inset-0 rounded-[10px] opacity-40 [background:radial-gradient(circle_at_30%_35%,#fff_0_14%,transparent_15%),radial-gradient(circle_at_70%_70%,#fff_0_20%,transparent_21%)]" />
          )}
          <span className="absolute inset-x-0 top-[46%] text-center font-display text-[11px] tracking-[0.3em]" style={{ color: shade(c, 0.3) }}>
            MULTIBOOK
          </span>
        </div>
      </div>
    );
  }

  if (product.type === "Блоки") {
    const paper = a.paper === "cream" ? "#f3e9d3" : "#fbfaf6";
    return (
      <div className={`${base} grid place-items-center bg-[#efe9df]`}>
        <div className="relative h-[78%] w-[60%]">
          {[2, 1].map((i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-[4px] shadow-sm"
              style={{ background: paper, transform: `translate(${i * 5}px, ${i * 4}px)` }}
            />
          ))}
          <div className={`absolute inset-0 rounded-[4px] shadow-md ruling-${a.ruling ?? "blank"}`} style={{ backgroundColor: paper }} />
          <div className="absolute left-0 top-0 flex h-full flex-col justify-around py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="-ml-[3px] block h-[6px] w-[10px] rounded-full bg-[#d8d0c2]" />
            ))}
          </div>
        </div>
        {a.sheets && <span className="absolute bottom-3 right-3 rounded-full bg-card px-2.5 py-1 text-xs">{a.sheets} л.</span>}
      </div>
    );
  }

  if (product.type === "Диски") {
    const c = a.colorHex ?? "#bbb";
    const d = a.diameter === 24 ? 76 : a.diameter === 18 ? 58 : 66;
    return (
      <div className={`${base} grid place-items-center bg-[#efe9df]`}>
        <div className="relative" style={{ width: d * 1.9, height: d * 1.3 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute rounded-full shadow-[inset_0_-5px_0_rgba(0,0,0,.18),inset_0_4px_0_rgba(255,255,255,.35),0_6px_12px_rgba(0,0,0,.15)]"
              style={{
                width: d,
                height: d,
                left: i * d * 0.45,
                top: i % 2 ? d * 0.3 : 0,
                background: a.metal ? `linear-gradient(135deg, #fff8, transparent 55%), ${c}` : c,
              }}
            />
          ))}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-card px-2.5 py-1 text-xs">
          {a.diameter ? `${a.diameter} мм` : "диаметр ?"} · {a.pack ?? 8} шт
        </span>
      </div>
    );
  }

  const img = product.images[0];
  return (
    <div className={`${base} bg-[#efe9df]`}>
      {img ? (
        <Image
          src={img}
          alt={product.title}
          fill
          sizes={size === "large" ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-sm text-muted">Фото скоро</div>
      )}
    </div>
  );
}
