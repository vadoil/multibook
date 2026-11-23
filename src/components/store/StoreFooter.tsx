import Link from "next/link";
import { SITE } from "@/lib/site";
import { BrandGlyph } from "../design/BrandGlyph";

export function StoreFooter() {
  return (
    <footer className="store-footer" id="contacts">
      <div className="store-footer-top">
        <div className="store-footer-intro">
          <BrandGlyph />
          <p>
            Модульные блокноты на дисках
            <br />
            со сменными листами.
          </p>
        </div>
        <nav aria-label="Меню в подвале">
          <Link href="/catalog">Магазин</Link>
          <Link href="/constructor">Конструктор</Link>
          <Link href="/#how-it-works">Как устроен блокнот</Link>
          <Link href="/delivery">Оплата и доставка</Link>
          <Link href="/returns">Обмен и возврат</Link>
          <Link href="/corporate">Корпоративным</Link>
          <Link href="/account">Личный кабинет</Link>
        </nav>
        <div className="store-footer-contacts">
          <a href={SITE.phoneHref}>{SITE.phone}</a>
          <a href={`mailto:${SITE.emailOrders}`}>{SITE.emailOrders}</a>
          <a href={SITE.ozon} target="_blank" rel="noopener noreferrer">
            Мы на Ozon <span aria-hidden="true">↗</span>
          </a>
          <Link href="/contacts">Контакты и адрес</Link>
        </div>
      </div>
      <div className="store-footer-wordmark" translate="no" aria-hidden="true">
        multibook
      </div>
      <div className="store-footer-bottom">
        <span>
          {SITE.seller.short} · ОГРНИП {SITE.seller.ogrnip} · ИНН {SITE.seller.inn}
        </span>
        <Link href="/privacy">Политика конфиденциальности</Link>
      </div>
    </footer>
  );
}
