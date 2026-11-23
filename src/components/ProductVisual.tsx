import Image from "next/image";
import type { Product } from "@/db/schema";

/** Фото товара из каталога (первое из галереи). Финальные картинки пользователь подготовит сам. */
export function ProductVisual({ product, size = "card", index = 0 }: { product: Product; size?: "card" | "large"; index?: number }) {
  const img = product.images[index] ?? product.images[0];
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] bg-[#efe9df]">
      {img ? (
        <Image
          src={img}
          alt={product.title}
          fill
          sizes={size === "large" ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover"
          priority={size === "large"}
        />
      ) : (
        <div className="grid h-full place-items-center text-sm text-muted">Фото скоро</div>
      )}
    </div>
  );
}
