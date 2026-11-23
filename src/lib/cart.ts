"use client";

import { useSyncExternalStore } from "react";
import type { NotebookLook } from "@/components/NotebookPreview";

/** Корзина живёт в браузере (localStorage). Цены здесь не храним: их всегда даёт сервер. */
export type CartLine = { productId: number; qty: number; bundle?: string };
export type CartBundle = { id: string; label: string; look: NotebookLook };
export type Cart = { lines: CartLine[]; bundles: CartBundle[] };

const KEY = "mb-cart-v1";
const EMPTY: Cart = { lines: [], bundles: [] };
export const MAX_QTY = 99;

let cache: Cart | null = null;
const listeners = new Set<() => void>();

function read(): Cart {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    cache = raw && Array.isArray(raw.lines) ? { lines: raw.lines, bundles: raw.bundles ?? [] } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Cart) {
  // Набор без позиций больше не нужен.
  const used = new Set(next.lines.map((l) => l.bundle).filter(Boolean));
  cache = { lines: next.lines, bundles: next.bundles.filter((b) => used.has(b.id)) };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // приватный режим — корзина проживёт до перезагрузки
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null; // другая вкладка изменила корзину
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const clamp = (n: number) => Math.max(0, Math.min(MAX_QTY, Math.round(n)));
const same = (l: CartLine, productId: number, bundle?: string) => l.productId === productId && l.bundle === bundle;

export const cart = {
  add(productId: number, qty = 1) {
    const c = read();
    const hit = c.lines.find((l) => same(l, productId));
    const lines = hit
      ? c.lines.map((l) => (l === hit ? { ...l, qty: clamp(l.qty + qty) } : l))
      : [...c.lines, { productId, qty: clamp(qty) }];
    write({ ...c, lines });
  },
  addBundle(items: { productId: number; qty: number }[], label: string, look: NotebookLook) {
    const c = read();
    const id = `nb-${Date.now().toString(36)}`;
    write({
      lines: [...c.lines, ...items.filter((i) => i.qty > 0).map((i) => ({ productId: i.productId, qty: clamp(i.qty), bundle: id }))],
      bundles: [...c.bundles, { id, label, look }],
    });
  },
  setQty(productId: number, bundle: string | undefined, qty: number) {
    const c = read();
    const lines = c.lines
      .map((l) => (same(l, productId, bundle) ? { ...l, qty: clamp(qty) } : l))
      .filter((l) => l.qty > 0);
    write({ ...c, lines });
  },
  removeBundle(id: string) {
    const c = read();
    write({ ...c, lines: c.lines.filter((l) => l.bundle !== id) });
  },
  /** Убрать позиции, которых больше нет в продаже. */
  drop(productIds: number[]) {
    const c = read();
    write({ ...c, lines: c.lines.filter((l) => !productIds.includes(l.productId)) });
  },
  clear() {
    write(EMPTY);
  },
};

export function useCart(): Cart {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function cartCount(c: Cart) {
  return c.lines.reduce((s, l) => s + l.qty, 0);
}
