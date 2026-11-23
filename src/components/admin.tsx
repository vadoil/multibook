import type { OrderStatus } from "@/db/schema";

export const STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-accent text-white",
  confirmed: "bg-[#2b5f8a] text-white",
  paid: "bg-ok text-white",
  shipped: "bg-[#6a4c93] text-white",
  done: "bg-line text-ink",
  cancelled: "bg-paper text-muted line-through",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${STATUS_TONE[status]}`}>{label}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

export const input = "w-full rounded-xl border border-line bg-card px-3 py-2.5 outline-none transition focus:border-ink";

export const fmtDate = (d: Date) => d.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
