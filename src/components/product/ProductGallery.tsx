"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/db/schema";
import { ProductVisual } from "@/components/ProductVisual";

/** Only the displayed photograph changes; all sources are the catalogue originals. */
export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <ProductVisual product={product} size="large" index={index} />
        {product.images.length > 1 && <span className="product-gallery-count" aria-live="polite">Фото {index + 1} из {product.images.length}</span>}
      </div>
      {product.images.length > 1 && (
        <div className="product-gallery-thumbs" role="group" aria-label="Фотографии товара">
          {product.images.map((src, i) => (
            <button key={`${src}-${i}`} type="button" onClick={() => setIndex(i)} aria-pressed={index === i} aria-label={`Показать фото ${i + 1}: ${product.title}`}>
              <Image src={src} alt={`${product.shortTitle} — фото ${i + 1}`} fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
