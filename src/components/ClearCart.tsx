"use client";

import { useEffect } from "react";
import { cart } from "@/lib/cart";

/** После оформления заказа корзину очищаем один раз. */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  return null;
}
