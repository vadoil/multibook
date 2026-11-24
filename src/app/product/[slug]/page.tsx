import { Breadcrumbs } from "@/components/store/Breadcrumbs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";
import { ProductComplements } from "@/components/product/ProductComplements";
import { selectComplements } from "@/components/product/complements";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ServiceIcon } from "@/components/store/ServiceIcon";
import { formatPrice, getProduct, listProducts, relatedProducts } from "@/lib/catalog";
import { FORMATS, formatByDb } from "@/lib/formats";
import { JsonLd } from "@/components/JsonLd";
import { productDescription, productJsonLd, seoTitle, typeLabel } from "@/lib/seo";
import "./product.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p || !p.isActive) return {};
  const title = seoTitle(p.title);
  const description = productDescription(p);
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title, description, url: `/product/${p.slug}`, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p || !p.isActive) notFound();
  const complements = selectComplements(p, listProducts());
  const related = complements ? [] : relatedProducts(p.type, p.id);
  const out = p.stock !== null && p.stock <= 0;
  const fmt = formatByDb(p.attrs.format);
  const drawn =
    p.type === "Диски" ||
    ((p.type === "Обложки" || p.type === "Блоки") && !/9,5/.test(p.title)) ||
    (p.type === "Блокноты" && !!fmt && FORMATS[fmt].mode === "base");
  const specs = Object.entries(p.specs).filter(([k]) => k !== "Тип");

  return (
    <div className="product-page page-shell pt-8">
      <JsonLd data={productJsonLd(p)} />
      <Breadcrumbs items={[{ label: "Каталог", href: "/catalog" }, { label: typeLabel(p.type), href: `/catalog?type=${encodeURIComponent(p.type)}` }, { label: p.shortTitle || p.title }]} />

      <div className="product-layout grid gap-10 lg:grid-cols-2">
        <ProductGallery key={p.id} product={p} />

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

          {(p.ozonUrl || p.wbUrl) && (
            <div className="product-markets">
              <span>Удобнее на маркетплейсе?</span>
              {p.ozonUrl && <a href={p.ozonUrl} target="_blank" rel="noopener nofollow">Купить на Ozon</a>}
              {p.wbUrl && <a href={p.wbUrl} target="_blank" rel="noopener nofollow">Купить на Wildberries</a>}
            </div>
          )}

          <ul className="product-delivery" aria-label="Доставка и оплата">
            <li><ServiceIcon kind="delivery" /><span>Доставка СДЭК по России — в пункт выдачи или курьером; самовывоз из Глухово (Красногорский район)</span></li>
            <li><ServiceIcon kind="privacy" /><span>Оплата картой на сайте, для организаций — по счёту</span></li>
            <li>
              <Link href="/delivery" className="underline underline-offset-2">
                Условия доставки, оплаты и возврата
              </Link>
            </li>
          </ul>

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

      <div className="product-purchase" aria-label="Покупка товара">
        <div className="product-purchase-price">
          <span>{p.attrs.format ?? p.shortTitle}</span>
          <b>{formatPrice(p.price)}</b>
        </div>
        <div className="product-purchase-action"><AddToCart productId={p.id} disabled={out || p.price <= 0} /></div>
      </div>

      {complements && <ProductComplements selection={complements} />}
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
