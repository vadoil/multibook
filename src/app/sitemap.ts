import type { MetadataRoute } from "next";
import { countByType, listProducts, TYPE_LABELS } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${SITE.url}${p}`;
  const counts = countByType();
  const pages = ["/", "/catalog", "/constructor", "/delivery", "/returns", "/contacts", "/corporate", "/privacy"].map((p) => ({
    url: u(p),
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : p === "/catalog" || p === "/constructor" ? 0.9 : 0.4,
  }));
  const categories = TYPE_LABELS.filter((t) => counts[t.type]).map((t) => ({
    url: u(`/catalog?type=${encodeURIComponent(t.type)}`),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  const products = listProducts().map((p) => ({
    url: u(`/product/${p.slug}`),
    lastModified: p.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    images: p.images.slice(0, 1),
  }));
  return [...pages, ...categories, ...products];
}
