import type { Product } from "@/db/schema";
import coverPhotos from "./cover-photos.json";

/** Display order only: the catalogue's image array is never changed. */
export function productPhotos(product: Pick<Product, "images" | "tildaUid">): string[] {
  const preferred = (coverPhotos as Record<string, string>)[product.tildaUid];
  const first = preferred ? product.images.indexOf(preferred) : -1;
  if (first <= 0) return product.images;
  return [product.images[first], ...product.images.slice(0, first), ...product.images.slice(first + 1)];
}

export function showsCover(product: Pick<Product, "type" | "title">): boolean {
  return ["Тетради", "Блокноты", "Обложки", "Фотокниги"].includes(product.type)
    || (product.type === "Распродажа" && /блокнот|тетрад|облож/i.test(product.title));
}

/** Keep the existing premium selection on the home page. */
export const PREMIUM_NOTEBOOK_UIDS = new Set(["556041946942", "725111859732", "763698818122", "937894370012", "760853733322"]);
