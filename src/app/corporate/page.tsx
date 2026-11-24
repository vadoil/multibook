import type { Metadata } from "next";
import Link from "next/link";
import { CorporateGallery } from "@/components/corporate/CorporateGallery";
import photos from "@/components/corporate/photos.json";
import { CategoryTabIcon, StoreTabLink } from "@/components/store/StoreTab";
import { ServiceIcon } from "@/components/store/ServiceIcon";
import { SITE } from "@/lib/site";
import "./corporate.css";

export const metadata: Metadata = {
  title: "Корпоративные блокноты",
  description:
    "Блокноты Multibook с вашим брендом: обложки, блоки и диски под задачу, своя типография. Сувениры для клиентов и фирменные блокноты для команды.",
  alternates: { canonical: "/corporate" },
};

function MailIcon() {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="7" width="24" height="18" rx="2" /><path d="m5 9 11 8L27 9" /></svg>;
}

export default function CorporatePage() {
  const portfolio = photos.filter(photo => photo.group === "portfolio").sort((a, b) => Number(b.id === 1) - Number(a.id === 1));
  const details = photos.filter(photo => photo.group === "details");
  return (
    <div className="corporate-page">
      <nav className="corporate-breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Блокноты на заказ</span></nav>
      <section className="corporate-hero" aria-labelledby="corporate-title">
        <div className="corporate-hero-title"><p className="corporate-maker"><ServiceIcon kind="corporate" />Печатаем и собираем сами</p><h1 id="corporate-title" className="font-display">Блокноты<br />с вашим брендом.</h1></div>
        <div className="corporate-hero-gallery"><CorporateGallery photos={portfolio} label="Портфолио корпоративных блокнотов" /></div>
        <div className="corporate-hero-copy"><p>Сувенир для клиентов или фирменный блокнот для команды. Дисковый переплёт позволяет собрать блокнот под задачу: свои обложки, страницы и диски.</p><div className="corporate-actions"><a className="store-tab corporate-primary" href={`mailto:${SITE.emailCorporate}`}><MailIcon />Обсудить тираж</a><StoreTabLink href="#details" icon={<CategoryTabIcon type="Обложки" />}>Варианты оформления</StoreTabLink></div></div>
      </section>

      <section className="corporate-custom" aria-labelledby="corporate-custom-title">
        <div className="corporate-section-heading"><ServiceIcon kind="corporate" /><h2 id="corporate-custom-title" className="font-display">Что можно сделать</h2></div>
        <ul className="corporate-options">
          <li><CategoryTabIcon type="Обложки" /><span>Мягкие и твёрдые обложки с логотипом и фирменными цветами</span></li>
          <li><CategoryTabIcon type="Блоки" /><span>Свои страницы: планеры, чек-листы, бланки, разделители и рубрикаторы</span></li>
          <li><CategoryTabIcon type="Диски" /><span>Диски нужного цвета и диаметра под толщину блока</span></li>
          <li><ServiceIcon kind="delivery" /><span>Подарочная упаковка и сборка тиража</span></li>
        </ul>
        <div className="corporate-config"><p>Материалы и отделку можно выбрать в корпоративном конфигураторе нашей типографии.</p><a href="https://381artwork.ru/multibook_config" target="_blank" rel="noopener noreferrer" className="store-tab"><CategoryTabIcon type="Аксессуары" />Корпоративный конфигуратор <span aria-hidden="true">↗</span></a></div>
      </section>

      <section id="details" className="corporate-details" aria-labelledby="corporate-details-title">
        <div className="corporate-section-heading"><CategoryTabIcon type="Обложки" /><div><h2 id="corporate-details-title" className="font-display">Multibook в деталях</h2><p>Фактура обложки, печать, страницы и упаковка — рассмотрите наши работы крупно.</p></div></div>
        <CorporateGallery photos={details} label="Варианты оформления Multibook" variant="details" />
      </section>

      <section id="corporate-contact" className="corporate-contact" aria-labelledby="corporate-contact-title">
        <div><div className="corporate-section-heading"><MailIcon /><h2 id="corporate-contact-title" className="font-display">Как обсудить заказ</h2></div><p>Пришлите тираж, сроки, макеты или идею.</p><p>Печатаем в собственной типографии Артворк №381. Чтобы прикинуть состав, соберите образец в конструкторе и пришлите ссылку на сборку.</p><div className="corporate-actions"><StoreTabLink href="/constructor" icon={<CategoryTabIcon type="Тетради" />}>Собрать образец</StoreTabLink><StoreTabLink href="/video" icon={<CategoryTabIcon type="Блоки" />}>Инструкция и макеты для печати</StoreTabLink></div></div>
        <div className="corporate-contact-card"><a href={`mailto:${SITE.emailCorporate}`} className="corporate-email"><MailIcon />{SITE.emailCorporate}</a><a href={SITE.phoneHref} className="corporate-phone">{SITE.phone}</a><p>{SITE.hours}</p><p>Организациям выставляем счёт; оплата по безналичному расчёту.</p></div>
      </section>
      <a href="https://multi-book.ru/corporatives" target="_blank" rel="noopener noreferrer" className="corporate-original">Исходное портфолио Multibook <span aria-hidden="true">↗</span></a>
    </div>
  );
}
