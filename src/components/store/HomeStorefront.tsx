import Link from "next/link";
import type { Product } from "@/db/schema";
import { TYPE_LABELS } from "@/lib/catalog";
import { ProductCard, PRODUCT_PHOTO_INDEX } from "../ProductCard";
import { CategoryTabIcon, StoreTabLink } from "./StoreTab";
import "./shop.css";


/** A real shop shelf replaces the second explanatory hero. No invented items. */
export function HomeStorefront({ products }: { products: Product[] }) {
  const notebooks = products.filter((p) => p.type === "Блокноты" && p.images.length && p.tildaUid in PRODUCT_PHOTO_INDEX);
  const exerciseBooks = products.filter((p) => p.type === "Тетради" && p.images.length);
  const marked = products.filter((p) => p.featured && (p.type === "Тетради" || p.type === "Блокноты") && p.images.length);
  const ready = [...new Map([...marked, ...notebooks.slice(0, 4), ...exerciseBooks.slice(0, 4)].map((p) => [p.id, p])).values()].slice(0, 8);
  return (
    <section className="home-shop" id="shop" aria-labelledby="home-shop-title">
      <div className="home-shop-heading">
        <div><h2 id="home-shop-title">Выберите готовый.</h2><p>Ежедневники, тетради и всё, чем их можно дополнить.</p></div>
        <Link className="shop-all" href="/catalog">Весь магазин <span aria-hidden="true">↗</span></Link>
      </div>
      <nav className="home-shop-categories" aria-label="Что ищете в магазине">
        {TYPE_LABELS.filter(({type})=>products.some((p)=>p.type===type)).map(({type,label})=>(
          <StoreTabLink href={`/catalog?type=${encodeURIComponent(type)}`} key={type} icon={<CategoryTabIcon type={type} />}>
            <span>{type === "Блокноты" ? "Ежедневники" : label}</span>
          </StoreTabLink>
        ))}
      </nav>
      <div className="home-shop-products">
        {ready.map((p)=><ProductCard key={p.id} product={p}
          displayName={p.type === "Блокноты" ? p.title.match(/["«]([^"»]+)["»]/)?.[1] : `Тетрадь ${p.attrs.format ?? ""}`}
          detail={[p.attrs.format, p.type === "Блокноты" ? p.attrs.material : p.attrs.color].filter(Boolean).join(" / ")} />)}
      </div>
      <div className="home-shop-bottom">
        <Link className="shop-all" href="/catalog?type=%D0%A2%D0%B5%D1%82%D1%80%D0%B0%D0%B4%D0%B8">Все готовые тетради <span aria-hidden="true">↗</span></Link>
        <Link className="shop-all" href="/catalog?type=%D0%91%D0%BB%D0%BE%D0%BA%D0%BD%D0%BE%D1%82%D1%8B">Все ежедневники <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
