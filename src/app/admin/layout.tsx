import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { deliveryMode } from "@/lib/delivery";
import { paymentMode } from "@/lib/payments";

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
  const pay = paymentMode();
  const ship = deliveryMode();
  const tg = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  return (
    <div data-admin-surface className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
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
      <div className="flex flex-wrap gap-2 pt-3 text-xs">
        {[
          { label: "Оплата", mode: pay === "yookassa" ? "ЮKassa" : pay === "demo" ? "демо — без денег" : "выключена", live: pay === "yookassa" },
          { label: "Доставка", mode: ship === "cdek" ? (process.env.CDEK_TEST === "1" ? "СДЭК, тестовый контур" : "СДЭК") : "демо-расчёт", live: ship === "cdek" && process.env.CDEK_TEST !== "1" },
          { label: "Уведомления", mode: tg ? "Telegram" : "только лог сервера", live: tg },
        ].map((i) => (
          <span key={i.label} className={`rounded-full px-3 py-1 ${i.live ? "bg-ok/15 text-ok" : "bg-warn/15 text-warn"}`}>
            {i.label}: {i.mode}
          </span>
        ))}
      </div>
      <div className="pt-6">{children}</div>
    </div>
  );
}
