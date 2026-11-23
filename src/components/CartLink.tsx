"use client";

import Link from "next/link";
import { cartCount, useCart } from "@/lib/cart";

export function CartLink() {
  const n = cartCount(useCart());
  return (
    <Link href="/cart" className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-white" aria-label={n ? `Корзина, ${n} шт` : "Корзина"}>
      Корзина
      {n > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold leading-5">{n}</span>}
    </Link>
  );
}
