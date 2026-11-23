import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Админка", template: "%s · Админка" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/import", label: "Импорт из Tilda" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <span className="mr-2 font-display text-lg font-bold">Админка</span>
        <nav aria-label="Админка" className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm hover:bg-card">
              {n.label}
            </Link>
          ))}
          <span className="rounded-full px-3 py-1.5 text-sm text-muted" title="Этап 4: нужен ключ ИИ-роутера">
            Контент-завод · скоро
          </span>
        </nav>
        <span className="ml-auto text-sm text-muted">{admin.email}</span>
      </div>
      <div className="pt-6">{children}</div>
    </div>
  );
}
