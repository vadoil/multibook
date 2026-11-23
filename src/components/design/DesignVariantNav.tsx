"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreTabLink } from "../store/StoreTab";
import { StoreNavIcon } from "../store/StoreNavIcon";

const variants = [
  { id: "paper", number: "1", name: "Бумажная мастерская" },
  { id: "journal", number: "2", name: "Предметный журнал" },
  { id: "play", number: "3", name: "Конструктор идей" },
];

/** Navigation for the explicitly enabled design preview only. */
export function DesignVariantNav() {
  const pathname = usePathname();
  return (
    <nav className="design-variant-nav" aria-label="Варианты дизайна">
      <div className="design-variant-inner">
        <Link href="/design-preview" prefetch={false} className="design-variant-index" aria-label="Все варианты дизайна">
          <span className="design-variant-desktop">Варианты дизайна</span>
          <span className="design-variant-mobile">Дизайн</span>
        </Link>
        <div className="design-variant-choices">
          {variants.map((variant) => (
            <StoreTabLink
              key={variant.id}
              href={`/design-preview/${variant.id}`}
              prefetch={false}
              className="store-tab-compact"
              aria-label={`Вариант ${variant.number}: ${variant.name}`}
              aria-current={pathname === `/design-preview/${variant.id}` ? "page" : undefined}
            >
              <b>{variant.number}</b>
              <span className="design-variant-desktop">{variant.name}</span>
            </StoreTabLink>
          ))}
        </div>
        <StoreTabLink href="/" prefetch={false} icon={<StoreNavIcon kind="shop" />} className="store-tab-compact design-variant-store" aria-label="Вариант с интерьерными фонами" aria-current={pathname === "/" ? "page" : undefined}>
          <span>С фонами</span>
        </StoreTabLink>
      </div>
    </nav>
  );
}
