import Link from "next/link";
import { BrandGlyph } from "../design/BrandGlyph";

export function StoreFooter() {
  return (
    <footer className="store-footer" id="contacts">
      <div className="store-footer-top">
        <div className="store-footer-intro">
          <BrandGlyph />
          <p>
            Модульные блокноты.
            <br />
            Место для ваших идей.
          </p>
        </div>
        <nav aria-label="Меню в подвале">
          <Link href="/catalog">Магазин</Link>
          <Link href="/constructor">Конструктор</Link>
          <Link href="/#how-it-works">Как устроен блокнот</Link>
          <Link href="/account">Личный кабинет</Link>
          <a
            href="https://multi-book.ru/oplata"
            target="_blank"
            rel="noopener noreferrer"
          >
            Оплата и доставка ↗
          </a>
          <a
            href="https://multi-book.ru/corporatives"
            target="_blank"
            rel="noopener noreferrer"
          >
            Корпоративным ↗
          </a>
        </nav>
        <div className="store-footer-contacts">
          <a href="tel:+79998994114">+7 999 899-41-14</a>
          <a
            href="https://www.ozon.ru/brand/multibook-100511115/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Мы на Ozon <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://multi-book.ru/contacts"
            target="_blank"
            rel="noopener noreferrer"
          >
            Контакты и адрес <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="store-footer-wordmark" translate="no" aria-hidden="true">
        multibook
      </div>
      <div className="store-footer-bottom">
        <span>Своя типография. Собираем для вас.</span>
        <a
          href="https://multi-book.ru/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Политика конфиденциальности
        </a>
      </div>
    </footer>
  );
}
