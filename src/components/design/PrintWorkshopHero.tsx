import Link from "next/link";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { NotebookFilm } from "./NotebookFilm";
import { ShopChoices } from "./ShopChoices";
import { CategoryGlyph } from "./CategoryGlyph";

export function PrintWorkshopHero({
  product,
  journal = false,
  secondary = false,
}: {
  product?: Product;
  journal?: boolean;
  /** Под обоями на главной: заголовок h2 и без кнопок выбора — они уже на первом экране. */
  secondary?: boolean;
}) {
  const Title = secondary ? "h2" : "h1";
  return (
    <section
      className={`mc-storefront-hero ${journal ? "mc-storefront-journal" : ""}`}
      aria-labelledby="storefront-title"
    >
      <div className="mc-storefront-copy">
        <p className="mc-storefront-kind">
          <span className="mc-small-disc" aria-hidden="true" />
          Модульные блокноты на дисках
        </p>
        <Title id="storefront-title">
          {secondary ? (
            <>
              Лист снимается
              <br />
              и встаёт обратно
            </>
          ) : journal ? (
            <>
              Блокноты,
              <br />
              которые можно
              <br />
              менять.
            </>
          ) : (
            <>
              Ваш блокнот.
              <br />
              Ваш порядок.
            </>
          )}
        </Title>
        <p className="mc-storefront-description">
          Готовые коллекции и конструктор своего блокнота. Снимайте листы,
          добавляйте новые и меняйте их местами — без колец и пружин.
        </p>
        {!secondary && <ShopChoices />}
        <div className="mc-storefront-proof">
          <CategoryGlyph kind="tools" />
          <p>
            <strong>Своя типография</strong>
            <span>Печатаем листы и собираем блокноты у себя.</span>
          </p>
        </div>
      </div>
      <div className="mc-storefront-object">
        <div className="mc-storefront-film">
          <NotebookFilm />
          <span className="mc-storefront-seal">
            Собирается
            <br />
            <b>по-вашему</b>
          </span>
        </div>
        {product && (
          <Link
            href={`/product/${product.slug}`}
            className="mc-storefront-product"
          >
            <span>
              В кадре — «Красные кони»
              <small>Готовый блокнот со сменными листами</small>
            </span>
            <strong>
              {formatPrice(product.price)} <span aria-hidden="true">→</span>
            </strong>
          </Link>
        )}
      </div>
    </section>
  );
}
