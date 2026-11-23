import Link from "next/link";
import { ServiceIcon, type ServiceKind } from "./store/ServiceIcon";
import "./info-page.css";

const sections: { href: string; label: string; kind: ServiceKind }[] = [
  { href: "/delivery", label: "Оплата и доставка", kind: "delivery" },
  { href: "/returns", label: "Обмен и возврат", kind: "returns" },
  { href: "/contacts", label: "Контакты", kind: "contacts" },
  { href: "/corporate", label: "Корпоративным", kind: "corporate" },
  { href: "/privacy", label: "Конфиденциальность", kind: "privacy" },
];

/** Shared presentation only; the supplied article copy is preserved. */
export function InfoPage({ title, lead, children }: { title: string; lead?: React.ReactNode; children: React.ReactNode }) {
  const kind: ServiceKind = title.includes("доставка") ? "delivery" : title.includes("возврат") ? "returns" : title.includes("Контакты") ? "contacts" : title.includes("Политика") ? "privacy" : "corporate";
  return (
    <article className="info-page">
      <header className="info-heading">
        <span className="info-symbol"><ServiceIcon kind={kind} /></span>
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </header>
      <div className="info-layout">
        <nav className="info-nav" aria-label="Информация о магазине">
          {sections.map((s) => <Link key={s.href} href={s.href} aria-current={kind === s.kind ? "page" : undefined}><ServiceIcon kind={s.kind} /><span>{s.label}</span></Link>)}
        </nav>
        <div className="info-content">{children}</div>
      </div>
    </article>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="info-section">
      <h2><ServiceIcon />{title}</h2>
      <div className="info-section-body">
        {children}
      </div>
    </section>
  );
}
