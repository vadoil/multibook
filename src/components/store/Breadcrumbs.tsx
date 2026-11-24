import Link from "next/link";

export type Crumb = { label: string; href?: string };

/** Хлебные крошки: «Главная» добавляется сама, последний пункт — текущая страница. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Главная", href: "/" }, ...items];
  return (
    <nav aria-label="Хлебные крошки" className="breadcrumbs">
      <ol>
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`}>
              {c.href && !last ? <Link href={c.href}>{c.label}</Link> : <span aria-current={last ? "page" : undefined}>{c.label}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
