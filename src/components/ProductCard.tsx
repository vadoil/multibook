import Link from "next/link";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/catalog";
import { ProductVisual } from "./ProductVisual";
import { showsCover } from "./product/photos";

export function ProductCard({ product, photoIndex, displayName, detail }: { product: Product; photoIndex?: number; displayName?: string; detail?: string }) {
  const out = product.stock !== null && product.stock <= 0;
  const name = product.type === "Блокноты" ? product.title.match(/["«]([^"»]+)["»]/)?.[1] : undefined;
  const kind = product.type === "Блокноты" ? /еженедельник/i.test(product.title) ? "Еженедельник" : /ежедневник/i.test(product.title) ? "Ежедневник" : "Блокнот" : product.type;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="shop-product-card group flex flex-col gap-3 rounded-[var(--radius-card)] p-2 transition hover:bg-card"
    >
      <div className="transition duration-300 group-hover:-translate-y-1">
        <ProductVisual product={product} index={photoIndex ?? (showsCover(product) ? 0 : 1)} />
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1">
        <span className="shop-product-type text-xs text-muted">{kind}</span>
        <span className="line-clamp-2 font-medium leading-snug">{displayName ?? name ?? product.shortTitle}</span>
        {detail && <span className="text-xs text-muted">{detail}</span>}
        <span className="mt-1 flex items-baseline gap-2">
          <b className="text-lg">{formatPrice(product.price)}</b>
          {product.priceOld && product.priceOld > product.price && (
            <s className="text-sm text-muted">{formatPrice(product.priceOld)}</s>
          )}
          {out && <span className="text-sm text-warn">нет в наличии</span>}
        </span>
      </div>
    </Link>
  );
}
