import type { Product } from "@/db/schema";
import { TYPE_LABELS } from "./catalog";
import { formatPrice } from "./money";
import { abs, SITE } from "./site";

/** Короткий заголовок для <title>: кавычки-«ёлочки», без точки в конце, ≤ 60 символов по границе слова. */
export function seoTitle(title: string, max = 60) {
  let t = title.replace(/"([^"]*)"/g, "«$1»").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();
  if (t.length > max) {
    t = t.slice(0, max).replace(/[\s,;:–—-]+\S*$/, "");
    // Не обрываем на предлоге или союзе: «…«Красные кони» в» → «…«Красные кони»».
    t = t.replace(/(\s+(в|во|с|со|к|и|из|на|для|по|от|до|без|а|или))+$/i, "");
  }
  return t;
}

export const typeLabel = (type: string) => TYPE_LABELS.find((t) => t.type === type)?.label ?? type;

/** Описание товара для сниппета: что это, цена, чем удобно, доставка — ≤ 160 символов. */
export function productDescription(p: Product) {
  const head = `${seoTitle(p.title, 90)} — ${formatPrice(p.price).replace(/ /g, " ")}.`;
  const tail =
    p.type === "Диски"
      ? " Диски для дискового переплёта Multibook."
      : p.type === "Блоки"
        ? " Сменный блок листов: снимается и переставляется на дисках."
        : p.type === "Обложки"
          ? " Сменная обложка для блокнота на дисках."
          : " Листы снимаются и переставляются, обложку и диски можно сменить.";
  const ship = " Доставка СДЭК по России.";
  let d = head + tail;
  if (d.length + ship.length <= 160) d += ship;
  return d.length > 160 ? d.slice(0, 157).replace(/\s+\S*$/, "") + "…" : d;
}

export function productJsonLd(p: Product) {
  const out = p.stock !== null && p.stock <= 0;
  const url = abs(`/product/${p.slug}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title.replace(/"([^"]*)"/g, "«$1»"),
      image: p.images.slice(0, 6),
      ...(p.description ? { description: p.description.slice(0, 1000) } : {}),
      ...(p.sku ? { sku: p.sku } : {}),
      brand: { "@type": "Brand", name: SITE.name },
      category: typeLabel(p.type),
      offers: {
        "@type": "Offer",
        url,
        price: (p.price / 100).toFixed(2),
        priceCurrency: "RUB",
        availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: SITE.name },
      },
    },
    breadcrumbsJsonLd([
      { name: "Главная", path: "/" },
      { name: "Каталог", path: "/catalog" },
      { name: typeLabel(p.type), path: `/catalog?type=${encodeURIComponent(p.type)}` },
      { name: seoTitle(p.title, 80), path: `/product/${p.slug}` },
    ]),
  ];
}

export function breadcrumbsJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function organizationJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: abs("/icon.svg"),
      telephone: SITE.phone.replace(/[^\d+]/g, ""),
      email: SITE.emailOrders,
      address: { "@type": "PostalAddress", addressCountry: "RU", streetAddress: SITE.address },
      sameAs: [SITE.ozon],
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: SITE.url, inLanguage: "ru" },
  ];
}
