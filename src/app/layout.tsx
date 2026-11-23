import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-unbounded", weight: ["500", "700"] });

export const metadata: Metadata = {
  title: { default: "Multibook — модульные блокноты на дисках", template: "%s · Multibook" },
  description:
    "Блокноты, тетради и планеры с дисковым переплётом: листы снимаются и переставляются, блоки и обложки меняются. Соберите свой в конструкторе.",
};

const nav = [
  { href: "/catalog", label: "Каталог" },
  { href: "/constructor", label: "Конструктор" },
  { href: "/how-it-works", label: "Как это работает" },
  { href: "/corporate", label: "Корпоративным" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          К содержанию
        </a>
        <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
            <Link href="/" className="font-display text-lg font-bold tracking-tight">
              MULTIBOOK
            </Link>
            <nav aria-label="Основное меню" className="hidden gap-5 whitespace-nowrap text-[15px] lg:flex">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-ink/80 transition hover:text-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2 whitespace-nowrap text-[15px]">
              <Link href="/catalog" className="rounded-full px-3 py-2 hover:bg-card lg:hidden">
                Каталог
              </Link>
              <Link href="/account" className="rounded-full px-3 py-2 hover:bg-card">
                Кабинет
              </Link>
              <Link href="/cart" className="rounded-full bg-ink px-4 py-2 text-white">
                Корзина
              </Link>
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="mt-24 border-t border-line">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-muted sm:grid-cols-3 sm:px-6">
            <div>
              <p className="font-display text-ink">MULTIBOOK</p>
              <p className="mt-2">Модульные блокноты, тетради и альбомы на дисках.</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link href="/delivery">Оплата и доставка</Link>
              <Link href="/contacts">Контакты</Link>
              <Link href="/privacy">Политика конфиденциальности</Link>
            </div>
            <div className="flex flex-col gap-1">
              <a href="tel:+79998994114">+7 999 899-41-14</a>
              <a href="https://www.ozon.ru/brand/multibook-100511115/" rel="noopener" target="_blank">
                Multibook на Ozon
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
