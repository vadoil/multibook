"use client";

import Link from "next/link";
import { cartCount, useCart } from "@/lib/cart";

export function CartLink({ current }: { current?: "page" | "location" } = {}) {
  const n = cartCount(useCart());
  return (
    <Link
      href="/cart"
      className="store-cart"
      aria-current={current}
      aria-label={n ? `Корзина, ${n} шт` : "Корзина"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M5 7h14l1 14H4L5 7Z" />
        <path d="M8 9V6a4 4 0 0 1 8 0v3" />
      </svg>
      <span className="store-cart-label">Корзина</span>
      {n > 0 && <span className="store-cart-count">{n}</span>}
    </Link>
  );
}
