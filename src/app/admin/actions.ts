"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orders";

// Каждое действие само проверяет права: server action можно вызвать в обход страницы.

function logEvent(orderId: number, by: string, text: string) {
  db.insert(schema.orderEvents).values({ orderId, at: new Date(), by, text }).run();
}

const toKop = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").replace(/\s/g, "").replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n < 10_000_000 ? Math.round(n * 100) : NaN;
};

export async function setOrderStatus(orderId: number, status: OrderStatus) {
  const admin = await requireAdmin();
  if (!ORDER_STATUSES.includes(status)) return;
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o || o.status === status) return;
  db.update(schema.orders).set({ status, updatedAt: new Date() }).where(eq(schema.orders.id, orderId)).run();
  logEvent(orderId, admin.email, `Статус: ${STATUS_LABELS[o.status]} → ${STATUS_LABELS[status]}`);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function setDelivery(orderId: number, fd: FormData) {
  const admin = await requireAdmin();
  const price = toKop(fd.get("delivery"));
  if (Number.isNaN(price)) return;
  const o = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!o) return;
  db.update(schema.orders)
    .set({ deliveryPrice: price, total: o.subtotal + (price ?? 0), updatedAt: new Date() })
    .where(eq(schema.orders.id, orderId))
    .run();
  logEvent(orderId, admin.email, price === null ? "Стоимость доставки сброшена" : `Доставка: ${formatPrice(price)}`);
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function saveManagerNote(orderId: number, fd: FormData) {
  const admin = await requireAdmin();
  const note = String(fd.get("note") ?? "").trim().slice(0, 2000);
  db.update(schema.orders).set({ managerNote: note || null, updatedAt: new Date() }).where(eq(schema.orders.id, orderId)).run();
  logEvent(orderId, admin.email, "Заметка обновлена");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function saveProduct(productId: number, fd: FormData) {
  await requireAdmin();
  const s = (k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
  const price = toKop(fd.get("price"));
  const priceOld = toKop(fd.get("priceOld"));
  const stockRaw = s("stock", 10);
  const stock = stockRaw === "" ? null : Number(stockRaw);
  const sortOrder = Number(s("sortOrder", 10) || 0);
  if (price === null || Number.isNaN(price) || Number.isNaN(priceOld) || (stock !== null && (!Number.isInteger(stock) || stock < 0)) || !Number.isInteger(sortOrder))
    redirect(`/admin/products/${productId}?error=1`);
  const title = s("title", 300);
  if (!title) redirect(`/admin/products/${productId}?error=1`);

  const now = new Date();
  db.update(schema.products)
    .set({
      title,
      shortTitle: s("shortTitle", 200) || title,
      price,
      priceOld,
      stock,
      sortOrder,
      description: s("description", 20000) || null,
      isActive: fd.get("isActive") === "on",
      featured: fd.get("featured") === "on",
      lockedAt: now, // теперь импорт из Tilda эти поля не трогает
      updatedAt: now,
    })
    .where(eq(schema.products.id, productId))
    .run();
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function unlockProduct(productId: number) {
  await requireAdmin();
  db.update(schema.products).set({ lockedAt: null }).where(eq(schema.products.id, productId)).run();
  revalidatePath(`/admin/products/${productId}`);
}

export async function toggleProduct(productId: number, active: boolean) {
  await requireAdmin();
  const now = new Date();
  db.update(schema.products).set({ isActive: active, lockedAt: now, updatedAt: now }).where(eq(schema.products.id, productId)).run();
  revalidatePath("/admin/products");
}

export type ImportState = { result?: string; warnings?: string[]; error?: string };

export async function runImport(_: ImportState): Promise<ImportState> {
  await requireAdmin();
  try {
    const { runTildaImport } = await import("@/lib/import-tilda");
    const r = await runTildaImport();
    revalidatePath("/", "layout");
    return {
      result: `Получено ${r.total}: новых ${r.created}, обновлено ${r.updated}, с ручными правками ${r.locked}, отключено ${r.deactivated}`,
      warnings: r.warnings,
    };
  } catch (e) {
    return { error: `Импорт не удался: ${(e as Error).message}` };
  }
}
