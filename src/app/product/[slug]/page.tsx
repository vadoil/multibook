import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { formatPrice, getProduct, relatedProducts } from "@/lib/catalog";
import { FORMATS, formatByDb } from "@/lib/formats";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.title, description: p.description?.slice(0, 160) } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p || !p.isActive) notFound();
  const related = relatedProducts(p.type, p.id);
  const out = p.stock !== null && p.stock <= 0;
  const fmt = formatByDb(p.attrs.format);
  const drawn =
    p.type === "Диски" ||
    ((p.type === "Обложки" || p.type === "Блоки") && !/9,5/.test(p.title)) ||
    (p.type === "Блокноты" && !!fmt && FORMATS[fmt].mode === "base");
  const specs = Object.entries(p.specs).filter(([k]) => k !== "Тип");

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <nav aria-label="Навигация" className="text-sm text-muted">
        <Link href="/catalog">Каталог</Link> / <Link href={`/catalog?type=${encodeURIComponent(p.type)}`}>{p.type}</Link>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="grid gap-3">
          <ProductVisual product={p} size="large" />
          {p.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {p.images.slice(1, 9).map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-[#efe9df]">
                  <Image src={src} alt="" fill sizes="12vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-sm uppercase tracking-wider text-muted">{p.type}</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{p.title}</h1>
          {p.sku && <p className="mt-2 text-sm text-muted">Артикул {p.sku}</p>}

          <div className="mt-6 flex items-baseline gap-3">
            <b className="text-3xl">{formatPrice(p.price)}</b>
            {p.priceOld && p.priceOld > p.price && <s className="text-muted">{formatPrice(p.priceOld)}</s>}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <AddToCart productId={p.id} disabled={out || p.price <= 0} />
            {drawn && (
              <Link href={`/constructor?with=${encodeURIComponent(p.slug)}`} className="rounded-full border border-ink px-7 py-3.5 font-semibold">
                Собрать с этим блокнот
              </Link>
            )}
          </div>

          {specs.length > 0 && (
            <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {p.description && (
            <div className="mt-8 whitespace-pre-line border-t border-line pt-6 leading-relaxed text-ink/85">{p.description}</div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold">Ещё в разделе «{p.type}»</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
