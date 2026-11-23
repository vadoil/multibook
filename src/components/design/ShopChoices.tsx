import Link from "next/link";
import { CategoryGlyph } from "./CategoryGlyph";

export function ShopChoices() {
  return (
    <div className="mc-shop-choices" aria-label="Два способа выбрать блокнот">
      <Link href="/catalog" className="mc-shop-choice mc-shop-choice-ready">
        <CategoryGlyph kind="journals" />
        <span>
          <strong>Выбрать готовый</strong>
          <small>Блокноты, тетради, ежедневники</small>
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
      <Link href="/constructor" className="mc-shop-choice">
        <CategoryGlyph kind="pages" />
        <span>
          <strong>Собрать свой</strong>
          <small>Обложка, листы и диски на ваш вкус</small>
        </span>
        <span aria-hidden="true">↗</span>
      </Link>
    </div>
  );
}
