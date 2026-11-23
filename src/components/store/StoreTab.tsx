import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CategoryGlyph, type CategoryKind } from "../design/CategoryGlyph";

const icons: Record<string, CategoryKind> = { Тетради: "notebooks", Блокноты: "journals", Обложки: "covers", Блоки: "pages", Диски: "discs", Аксессуары: "tools", Фотокниги: "albums" };
export function CategoryTabIcon({ type }: { type: string }) { return <CategoryGlyph kind={icons[type] ?? "notebooks"} />; }

type Visual = { icon?: ReactNode; children: ReactNode; className?: string };
export function StoreTabLink({ icon, children, className = "", ...props }: ComponentProps<typeof Link> & Visual) {
  return <Link {...props} className={`store-tab ${className}`}>{icon}{children}</Link>;
}
export function StoreTabButton({ icon, children, className = "", type = "button", ...props }: ComponentProps<"button"> & Visual) {
  return <button {...props} type={type} className={`store-tab ${className}`}>{icon}{children}</button>;
}
