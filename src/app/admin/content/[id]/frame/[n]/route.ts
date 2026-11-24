import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { frameCount } from "@/lib/content";
import { type Layer, renderFrame } from "@/lib/content-render";

export const dynamic = "force-dynamic";

/** PNG слайда или кадра. ?layer=bg|text — слои рилса для плеера, ?w=360 — миниатюра, ?dl=1 — скачать. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const u = await currentUser();
  if (u?.role !== "admin") return new Response("Not found", { status: 404 });
  const { id, n } = await params;
  const item = db.select().from(schema.contentItems).where(eq(schema.contentItems.id, Number(id))).get();
  const idx = Number(n);
  if (!item || !Number.isInteger(idx) || idx < 0 || idx >= frameCount(item)) return new Response("Not found", { status: 404 });
  const p = item.productId ? (db.select().from(schema.products).where(eq(schema.products.id, item.productId)).get() ?? null) : null;
  const q = new URL(req.url).searchParams;
  const layer = (["bg", "text"].includes(q.get("layer") ?? "") ? q.get("layer") : "full") as Layer;
  let body = await renderFrame(item, p, idx, layer);
  let type = "image/png";
  const w = Number(q.get("w"));
  if (w >= 80 && w <= 720) {
    body = await sharp(body).resize(w).webp({ quality: 82 }).toBuffer();
    type = "image/webp";
  }
  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": type,
      "cache-control": "private, max-age=3600",
      ...(q.get("dl") ? { "content-disposition": `attachment; filename="multibook-${item.id}-${idx + 1}.png"` } : {}),
    },
  });
}
