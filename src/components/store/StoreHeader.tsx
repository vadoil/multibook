"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CartLink } from "../CartLink";
import { BrandGlyph } from "../design/BrandGlyph";
import { StoreNavIcon, type StoreNavKind } from "./StoreNavIcon";

const navigation = [
  { href: "/catalog", label: "Магазин", icon: "shop" },
  { href: "/constructor", label: "Конструктор", icon: "constructor" },
  { href: "/#how-it-works", label: "Как устроен блокнот", icon: "binding" },
];

export function StoreHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const closeFromTabs = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest(".mobile-tabbar a")) setOpen(false);
    };
    window.addEventListener("keydown", close);
    document.addEventListener("click", closeFromTabs);
    return () => {
      window.removeEventListener("keydown", close);
      document.removeEventListener("click", closeFromTabs);
    };
  }, [open]);
  const current = (href: string) =>
    pathname === href ||
    (href === "/catalog" && pathname.startsWith("/product/"));
  return (
    <header className="store-header">
      <div className="store-header-inner">
        <Link
          href="/"
          className="store-wordmark"
          aria-label="Multibook — главная"
          onClick={() => setOpen(false)}
        >
          <BrandGlyph />
          <span translate="no">multibook</span>
        </Link>
        <nav className="store-navigation" aria-label="Основное меню">
          {navigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.icon === "constructor" ? "store-nav-constructor" : undefined}
              aria-current={current(link.href) ? "page" : undefined}
            >
              <StoreNavIcon kind={link.icon as StoreNavKind} />{link.label}
            </Link>
          ))}
        </nav>
        <div className="store-header-actions">
          <Link
            href="/account"
            className="store-account"
            aria-label="Личный кабинет"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
            </svg>
          </Link>
          <CartLink />
          <button
            ref={toggle}
            type="button"
            className="store-menu-toggle"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="store-mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d={open ? "m5 5 14 14M5 19 19 5" : "M4 8h16M4 16h16"} />
            </svg>
            <span>{open ? "Закрыть" : "Меню"}</span>
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="store-mobile-menu"
          className="store-mobile-menu"
          aria-label="Мобильное меню"
        >
          {navigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={link.icon === "constructor" ? "store-nav-constructor" : undefined}
              aria-current={current(link.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <StoreNavIcon kind={link.icon as StoreNavKind} /><span>{link.label}</span>
            </Link>
          ))}
          <Link href="/account" onClick={() => setOpen(false)}>
            <StoreNavIcon kind="account" /><span>Личный кабинет</span>
          </Link>
          <Link href="/contacts" onClick={() => setOpen(false)}>
            <StoreNavIcon kind="contacts" /><span>Контакты</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
