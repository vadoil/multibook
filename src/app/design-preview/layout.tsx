import { notFound } from "next/navigation";

export const metadata = { robots: { index: false, follow: false } };

/** Песочница концептов Codex. В продакшене закрыта; открыть — DESIGN_PREVIEW=1. */
export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production" && process.env.DESIGN_PREVIEW !== "1") notFound();
  return <div className="mc-preview">{children}</div>;
}
