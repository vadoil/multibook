import { eq } from "drizzle-orm";
import { strToU8, zipSync } from "fflate";
import { db, schema } from "@/db";
import { currentUser } from "@/lib/auth";
import { composeFinal, composeScript, frameCount } from "@/lib/content";
import { renderFrame } from "@/lib/content-render";

export const dynamic = "force-dynamic";

/** Архив для ручной публикации: картинки, готовый текст и раскадровка. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (u?.role !== "admin") return new Response("Not found", { status: 404 });
  const item = db.select().from(schema.contentItems).where(eq(schema.contentItems.id, Number((await params).id))).get();
  if (!item) return new Response("Not found", { status: 404 });
  const p = item.productId ? (db.select().from(schema.products).where(eq(schema.products.id, item.productId)).get() ?? null) : null;
  const files: Record<string, Uint8Array> = {
    "текст.txt": strToU8(composeFinal(item, p)),
    [item.kind === "reel" ? "раскадровка.txt" : "слайды.txt"]: strToU8(composeScript(item)),
  };
  for (let n = 0; n < frameCount(item); n++) files[`${item.kind === "reel" ? "кадр" : "слайд"}-${String(n + 1).padStart(2, "0")}.png`] = new Uint8Array(await renderFrame(item, p, n));
  const zip = zipSync(files, { level: 0 });
  return new Response(new Uint8Array(zip), {
    headers: { "content-type": "application/zip", "content-disposition": `attachment; filename="multibook-content-${item.id}.zip"` },
  });
}
