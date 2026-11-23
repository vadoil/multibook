import "./design-preview/concepts.css";
import "./design-preview/identity.css";
import "./design-preview/storefront.css";
import { DesignConcept } from "@/components/design/DesignConcept";
import { HomeStorefront } from "@/components/store/HomeStorefront";
import { WallpaperHero, type Wallpaper } from "@/components/hero/WallpaperHero";
import { JsonLd } from "@/components/JsonLd";
import wallpapers from "../../public/hero/wallpapers.json";
import { listProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { organizationJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function Home() {
  const all = listProducts();
  const notebooks = all.filter((p) => p.type === "Блокноты" && p.images.length > 0);
  // «Готовая коллекция»: товары с галочкой «на главной» в админке; если их нет — первые блокноты по сортировке.
  const marked = all.filter((p) => p.featured && p.images.length > 0).slice(0, 4);
  const featured = marked.length ? marked : notebooks.slice(0, 4);

  // Обои первого экрана (public/hero/wallpapers.json, собираются scripts/make-wallpapers.mjs).
  // Слайд ведёт на товар по uid Tilda; если товара нет в продаже — просто картинка без ссылки.
  const byUid = new Map(all.map((p) => [p.tildaUid, p]));
  const slides: Wallpaper[] = (wallpapers as (Omit<Wallpaper, "href" | "price"> & { uid?: string })[]).map(({ uid, ...w }) => {
    const p = uid ? byUid.get(uid) : undefined;
    return { ...w, ...(p ? { href: `/product/${p.slug}`, price: formatPrice(p.price) } : {}) };
  });

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <DesignConcept concept="journal" products={featured} embedded hero={<WallpaperHero slides={slides} />} shop={<HomeStorefront products={all} />} categories={null} />
    </>
  );
}
