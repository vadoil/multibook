import Link from "next/link";
import { TYPE_LABELS } from "@/lib/catalog";
import { CategoryGlyph, type CategoryKind } from "./CategoryGlyph";
import type { ConceptName } from "./DesignConcept";

const glyphs: Record<string, CategoryKind> = {
  Тетради: "notebooks", Блокноты: "journals", Обложки: "covers", Блоки: "pages",
  Диски: "discs", Аксессуары: "tools", Фотокниги: "albums",
};

/** Server-rendered navigation uses the existing catalogue labels and hints. */
export function DesignCategories({ concept }: { concept: ConceptName }) {
  return (
    <section id="shop-details" className={`mc-categories mc-categories-${concept}`}>
      <div className="mc-categories-heading">
        <p className="mc-section-note">У каждой детали своё место</p>
        <h2>Блокнот,<br />в котором всё ваше.</h2>
        <p>Начните с готового. Или подберите каждую деталь под себя.</p>
      </div>
      <div className="mc-category-list">
        {TYPE_LABELS.map(({ type, label, hint }) => (
          <Link key={type} href={`/catalog?type=${encodeURIComponent(type)}`} className={`mc-category-tile mc-category-tile-${glyphs[type]}`}>
            <span className="mc-category-graphic"><CategoryGlyph kind={glyphs[type]} /></span>
            <div className="mc-category-caption"><h3>{label}</h3><span>{hint}</span></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg>
          </Link>
        ))}
      </div>
    </section>
  );
}
