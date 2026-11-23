"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CartLink } from "../CartLink";
import { StoreNavIcon } from "./StoreNavIcon";

/** Persistent public-shop navigation. Reuses the existing reactive cart link. */
export function MobileTabBar() {
  const pathname = usePathname();
  const [constructorHref, setConstructorHref] = useState("/constructor");
  const rememberConstructor = useCallback(() => {
    if (window.location.pathname === "/constructor") setConstructorHref(window.location.pathname + window.location.search);
  }, []);
  useEffect(() => {
    if (pathname !== "/constructor") return;
    rememberConstructor();
    const rememberBeforeNavigation = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) rememberConstructor();
    };
    document.addEventListener("click", rememberBeforeNavigation, true);
    return () => document.removeEventListener("click", rememberBeforeNavigation, true);
  }, [pathname, rememberConstructor]);
  if (pathname.startsWith("/admin")) return null;
  const shop = pathname === "/" || pathname.startsWith("/catalog") || pathname.startsWith("/product/");
  const constructor = pathname === "/constructor";
  const account = pathname.startsWith("/account");
  const cart = pathname === "/cart" ? "page" : /^\/(order|pay)\//.test(pathname) ? "location" : undefined;
  return (
    <nav className="mobile-tabbar" aria-label="Быстрый доступ">
      <Link href="/catalog" aria-current={shop ? pathname === "/catalog" ? "page" : "location" : undefined}>
        <StoreNavIcon kind="shop" /><span>Магазин</span>
      </Link>
      <Link
        href={constructorHref}
        aria-current={constructor ? "page" : undefined}
        onFocus={rememberConstructor}
        onPointerEnter={rememberConstructor}
        onPointerDown={rememberConstructor}
        onClick={(event) => {
          if (constructor && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: "auto" });
          }
        }}
      >
        <StoreNavIcon kind="constructor" /><span>Конструктор</span>
      </Link>
      <CartLink current={cart} />
      <Link href="/account" aria-current={account ? "page" : undefined}>
        <StoreNavIcon kind="account" /><span>Кабинет</span>
      </Link>
    </nav>
  );
}
