"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartLink } from "../CartLink";

function TabIcon({ kind }: { kind: "shop" | "constructor" | "account" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === "shop" ? <><rect x="3.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="14.5" y="3.5" width="6" height="6" rx="1.5" /><rect x="3.5" y="14.5" width="6" height="6" rx="1.5" /><rect x="14.5" y="14.5" width="6" height="6" rx="1.5" /></>
        : kind === "constructor" ? <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="var(--color-card)" /><circle cx="16" cy="12" r="2" fill="var(--color-card)" /><circle cx="10" cy="18" r="2" fill="var(--color-card)" /></>
        : <><circle cx="12" cy="7.5" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>}
    </svg>
  );
}

/** Persistent public-shop navigation. Reuses the existing reactive cart link. */
export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  const shop = pathname === "/" || pathname.startsWith("/catalog") || pathname.startsWith("/product/");
  const constructor = pathname.startsWith("/constructor");
  const account = pathname.startsWith("/account");
  const cart = pathname === "/cart" ? "page" : /^\/(order|pay)\//.test(pathname) ? "location" : undefined;
  return (
    <nav className="mobile-tabbar" aria-label="Быстрый доступ">
      <Link href="/catalog" aria-current={shop ? pathname === "/catalog" ? "page" : "location" : undefined}>
        <TabIcon kind="shop" /><span>Магазин</span>
      </Link>
      <Link href="/constructor" aria-current={constructor ? "page" : undefined}>
        <TabIcon kind="constructor" /><span>Конструктор</span>
      </Link>
      <CartLink current={cart} />
      <Link href="/account" aria-current={account ? "page" : undefined}>
        <TabIcon kind="account" /><span>Кабинет</span>
      </Link>
    </nav>
  );
}
