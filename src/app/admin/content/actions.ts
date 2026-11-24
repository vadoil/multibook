"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { CONTENT_KINDS, CONTENT_STATUSES, type ContentKind, type ContentStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { ANGLES, type Angle, composeFinal, frameCount, generateContent, normalizeData } from "@/lib/content";
import { renderFrame } from "@/lib/content-render";
import { CHANNELS, type Channel, publish } from "@/lib/publish";

// Каждое действие само проверяет права.

const getItem = (id: number) => db.select().from(schema.contentItems).where(eq(schema.contentItems.id, id)).get();
const getProduct = (id: number | null) => (id ? (db.select().from(schema.products).where(eq(schema.products.id, id)).get() ?? null) : null);
const msg = (id: number, key: "ok" | "error", text: string) => `/admin/content/${id}?${key}=${encodeURIComponent(text.slice(0, 300))}`;

export async function createContent(fd: FormData) {
  const admin = await requireAdmin();
  const productId = Number(fd.get("productId"));
  const kind = String(fd.get("kind")) as ContentKind;
  const angle = (ANGLES.find((a) => a.v === fd.get("angle"))?.v ?? "review") as Angle;
  const p = getProduct(productId);
  if (!p || !CONTENT_KINDS.includes(kind)) redirect("/admin/content?error=" + encodeURIComponent("Выберите товар и формат"));
  const g = await generateContent(p, kind, angle, String(fd.get("note") ?? ""));
  const now = new Date();
  const row = db
    .insert(schema.contentItems)
    .values({ productId: p.id, kind, title: g.title, angle, data: g.data, source: g.source, createdBy: admin.email, createdAt: now, updatedAt: now })
    .returning({ id: schema.contentItems.id })
    .get();
  revalidatePath("/admin/content");
  redirect(g.warning ? msg(row.id, "error", `ИИ не ответил, собран черновик по шаблону. ${g.warning}`) : `/admin/content/${row.id}`);
}

export async function regenerateContent(id: number, fd: FormData) {
  await requireAdmin();
  const item = getItem(id);
  const p = getProduct(item?.productId ?? null);
  if (!item || !p) redirect("/admin/content");
  const g = await generateContent(p, item.kind, (item.angle as Angle) ?? "review", String(fd.get("note") ?? ""));
  db.update(schema.contentItems)
    .set({ title: g.title, data: { ...g.data, template: item.data.template }, source: g.source, status: "draft", updatedAt: new Date() })
    .where(eq(schema.contentItems.id, id))
    .run();
  redirect(g.warning ? msg(id, "error", `ИИ не ответил, собран черновик по шаблону. ${g.warning}`) : msg(id, "ok", "Новый вариант готов"));
}

export async function saveContent(id: number, fd: FormData) {
  await requireAdmin();
  const item = getItem(id);
  if (!item) redirect("/admin/content");
  const p = getProduct(item.productId);
  const s = (k: string) => String(fd.get(k) ?? "");
  const count = Math.min(8, Number(fd.get("count")) || 0);
  const rows = Array.from({ length: count }, (_, i) => i);
  let slides = rows.map((i) => ({ title: s(`slide_title_${i}`), text: s(`slide_text_${i}`), image: Number(s(`slide_image_${i}`)) }));
  let scenes = rows.map((i) => ({ seconds: Number(s(`scene_seconds_${i}`)), image: Number(s(`scene_image_${i}`)), overlay: s(`scene_overlay_${i}`), voice: s(`scene_voice_${i}`) }));
  const op = s("op");
  if (op === "add") {
    slides = [...slides, { title: "Новый слайд", text: "", image: 0 }];
    scenes = [...scenes, { seconds: 3, image: 0, overlay: "Новый кадр", voice: "" }];
  } else if (op.startsWith("del:") && count > 1) {
    const k = Number(op.slice(4));
    slides = slides.filter((_, i) => i !== k);
    scenes = scenes.filter((_, i) => i !== k);
  }
  const data = normalizeData(
    { hook: s("hook"), caption: s("caption"), cta: s("cta"), hashtags: s("hashtags").split(/[\s,]+/), template: s("template") as "photo", music: s("music"), slides, scenes },
    item.kind,
    p ?? { images: [] },
  );
  db.update(schema.contentItems)
    .set({ title: s("title").trim().slice(0, 120) || item.title, data, updatedAt: new Date() })
    .where(eq(schema.contentItems.id, id))
    .run();
  revalidatePath("/admin/content");
  redirect(msg(id, "ok", "Сохранено, превью обновлено"));
}

export async function setContentStatus(id: number, status: ContentStatus) {
  await requireAdmin();
  if (!CONTENT_STATUSES.includes(status)) return;
  db.update(schema.contentItems).set({ status, updatedAt: new Date() }).where(eq(schema.contentItems.id, id)).run();
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}`);
}

export async function deleteContent(id: number) {
  await requireAdmin();
  db.delete(schema.contentItems).where(eq(schema.contentItems.id, id)).run();
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function publishContent(id: number, channel: Channel) {
  await requireAdmin();
  const item = getItem(id);
  if (!item) redirect("/admin/content");
  const label = CHANNELS.find((c) => c.v === channel)?.label ?? channel;
  // Публикуем только утверждённое: это уходит наружу и назад не возвращается.
  if (item.status !== "approved" && item.status !== "published") redirect(msg(id, "error", "Сначала утвердите материал"));
  const p = getProduct(item.productId);
  try {
    const images: Buffer[] = [];
    for (let n = 0; n < frameCount(item); n++) images.push(await renderFrame(item, p, n));
    await publish(channel, composeFinal(item, p), images);
  } catch (e) {
    redirect(msg(id, "error", `Не опубликовано: ${(e as Error).message}`));
  }
  db.update(schema.contentItems)
    .set({ status: "published", publishedTo: [...new Set([...item.publishedTo, label])], updatedAt: new Date() })
    .where(eq(schema.contentItems.id, id))
    .run();
  revalidatePath("/admin/content");
  redirect(msg(id, "ok", `Опубликовано: ${label}`));
}
