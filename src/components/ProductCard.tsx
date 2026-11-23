import Link from "next/link";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/catalog";
import { ProductVisual } from "./ProductVisual";

export function ProductCard({ product }: { product: Product }) {
  const out = product.stock !== null && product.stock <= 0;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col gap-3 rounded-[var(--radius-card)] p-2 transition hover:bg-card"
    >
      <div className="transition duration-300 group-hover:-translate-y-1">
        <ProductVisual product={product} index={1} />
      </div>
      <div className="flex flex-col gap-1 px-1 pb-1">
        <span className="text-xs uppercase tracking-wider text-muted">{product.type}</span>
        <span className="line-clamp-2 font-medium leading-snug">{product.shortTitle}</span>
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
