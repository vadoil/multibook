import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Golos_Text } from "next/font/google";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { MobileTabBar } from "@/components/store/MobileTabBar";
import { SITE } from "@/lib/site";
import "./globals.css";
import "./store.css";
import "./mobile-app.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-concept-sans",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-concept-serif",
});
const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-concept-hand",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eee7db",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Multibook — модульные блокноты на дисках",
    template: "%s · Multibook",
  },
  description:
    "Готовые блокноты, тетради и планеры со сменными листами — или свой блокнот в конструкторе. Листы снимаются и переставляются, обложки и диски меняются.",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "ru_RU",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Блокнот Multibook на дисках" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${golos.variable} ${cormorant.variable} ${caveat.variable}`}
    >
      <body className="store-body min-h-dvh flex flex-col">
        <a href="#main" className="store-skip">
          К содержанию
        </a>
        <StoreHeader />
        <main id="main" className="store-main flex-1">
          {children}
        </main>
        <StoreFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
