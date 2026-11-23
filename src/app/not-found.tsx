import Image from "next/image";
import Link from "next/link";
import { TYPE_LABELS } from "@/lib/catalog";
import { CategoryGlyph, type CategoryKind } from "@/components/design/CategoryGlyph";
import "./not-found.css";

const glyphs: CategoryKind[] = ["notebooks", "journals", "covers", "pages", "discs", "tools", "albums"];

export default function NotFound() {
  return (
    <section className="not-found">
      <div className="not-found-copy">
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1>Страница не найдена.</h1>
        <p>Проверьте адрес или загляните в магазин. Здесь можно выбрать готовый блокнот и собрать свой.</p>
        <div className="not-found-actions">
          <Link href="/catalog">Перейти в магазин</Link>
          <Link href="/constructor">Конструктор</Link>
        </div>
      </div>
      <div className="not-found-photo"><Image src="/hero/premium-city-1600.webp" alt="Ежедневник «Важная птица» на фоне Москва-Сити" fill sizes="(max-width: 760px) 100vw, 45vw" priority /></div>
      <nav className="not-found-categories" aria-label="Категории магазина">
        {TYPE_LABELS.map((t, i) => <Link key={t.type} href={`/catalog?type=${encodeURIComponent(t.type)}`}><CategoryGlyph kind={glyphs[i]} /><span>{t.label}</span></Link>)}
      </nav>
    </section>
  );
}
