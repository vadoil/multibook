"use client";

import Link from "next/link";
import { useState } from "react";
import { cart, useCart } from "@/lib/cart";

export function AddToCart({ productId, disabled }: { productId: number; disabled?: boolean }) {
  const inCart = useCart().lines.some((l) => l.productId === productId && !l.bundle);
  const [added, setAdded] = useState(false);

  if (disabled)
    return (
      <button type="button" disabled className="rounded-full bg-ink px-7 py-3.5 font-semibold text-white opacity-50">
        Нет в наличии
      </button>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => {
          cart.add(productId);
          setAdded(true);
        }}
        className="rounded-full bg-ink px-7 py-3.5 font-semibold text-white transition active:scale-95"
      >
        {added ? "Добавлено ✓ Ещё одну" : "В корзину"}
      </button>
      {(added || inCart) && (
        <Link href="/cart" className="self-center text-sm font-medium underline underline-offset-4">
          Перейти в корзину →
        </Link>
      )}
    </>
  );
}
