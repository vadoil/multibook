import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BindingVideo } from "@/components/guide/BindingVideo";
import { FormatSchemes } from "@/components/guide/FormatSchemes";
import { CategoryTabIcon, StoreTabLink } from "@/components/store/StoreTab";
import "./video.css";

export const metadata: Metadata = {
  title: "Как устроен блокнот — видео, инструкция и форматы",
  description: "Переплёт Т-диск Multibook: настоящее видео, снятие и перестановка листов, схемы форматов, обложек и дисков, подготовка макетов.",
  alternates: { canonical: "/video" },
};

export default function VideoPage() {
  return (
    <div className="guide-page">
      <nav className="guide-breadcrumb" aria-label="Навигация"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Как устроен блокнот</span></nav>
      <section id="guide-video" className="guide-hero" aria-labelledby="guide-title">
        <div className="guide-intro">
          <h1 id="guide-title" className="font-display">Блокнот, который<br />можно менять.</h1>
          <p>Обложки, листы и диски собираются под ваши задачи. Готовые модели — в магазине, своя сборка — в конструкторе.</p>
          <div className="guide-shop-links">
            <StoreTabLink href="/catalog" icon={<CategoryTabIcon type="Тетради" />}>Выбрать готовый</StoreTabLink>
            <StoreTabLink href="/constructor" icon={<CategoryTabIcon type="Обложки" />}>Конструктор</StoreTabLink>
          </div>
        </div>
        <BindingVideo priority />
      </section>

      <nav className="guide-section-links" aria-label="На этой странице">
        <StoreTabLink href="#instructions" icon={<CategoryTabIcon type="Блоки" />}>Как переставить лист</StoreTabLink>
        <StoreTabLink href="#formats" icon={<CategoryTabIcon type="Обложки" />}>Форматы и схемы</StoreTabLink>
        <StoreTabLink href="#print" icon={<CategoryTabIcon type="Аксессуары" />}>Своя печать</StoreTabLink>
      </nav>

      <section id="instructions" className="guide-instructions" aria-labelledby="guide-instructions-title">
        <figure className="guide-instruction-image"><Image src="/guides/remove-sheet.webp" alt="Оригинальная инструкция: возьмите лист у корешка и снимайте с дисков сверху вниз" width={481} height={375} unoptimized /><figcaption>Держите лист ближе к переплёту.</figcaption></figure>
        <div>
          <h2 id="guide-instructions-title" className="font-display">Снять. Переставить.<br />Вернуть на место.</h2>
          <ol className="guide-steps">
            <li><CategoryTabIcon type="Блоки" /><div><h3>Снимите лист</h3><p>Потяните за край у корешка сверху вниз.</p></div></li>
            <li><CategoryTabIcon type="Тетради" /><div><h3>Выберите место</h3><p>Перенесите лист в другой раздел или добавьте новый блок.</p></div></li>
            <li><CategoryTabIcon type="Диски" /><div><h3>Наденьте на диски</h3><p>Совместите отверстия с дисками и аккуратно прижмите.</p></div></li>
          </ol>
        </div>
      </section>

      <section id="formats" className="guide-formats" aria-labelledby="guide-formats-title">
        <div className="guide-section-heading"><CategoryTabIcon type="Обложки" /><h2 id="guide-formats-title" className="font-display">Все детали — на одной схеме.</h2></div>
        <FormatSchemes />
      </section>

      <section id="print" className="guide-print" aria-labelledby="guide-print-title">
        <div><div className="guide-section-heading"><CategoryTabIcon type="Аксессуары" /><h2 id="guide-print-title" className="font-display">Из нашей типографии.<br />С вашим характером.</h2></div><p>Печатаем листы и собираем блокноты сами. Для своего оформления подготовьте макет или обсудите тираж с нами.</p><Link className="guide-corporate-photo" href="/corporate" aria-label="Посмотреть портфолио корпоративных блокнотов"><Image src="/corporate/01-preview.webp" alt="Корпоративный блокнот с объёмной аппликацией на обложке" fill sizes="400px" unoptimized className="object-contain" /></Link><StoreTabLink href="/corporate" icon={<CategoryTabIcon type="Тетради" />}>Блокноты на заказ</StoreTabLink></div>
        <div className="guide-print-notes">
          <details><summary><CategoryTabIcon type="Блоки" />Макет страниц</summary><p>PDF, CMYK Fogra 39, 300 dpi, постранично, без печатных меток. Вылеты — 3 мм, свободное поле у переплёта — 15 мм.</p></details>
          <details><summary><CategoryTabIcon type="Обложки" />Макет обложки</summary><p>Для мягкой — вылеты 3 мм. Для твёрдой — 15 мм на подворот лайнера; форзац меньше итогового формата на 1,5 мм с каждой стороны, плюс вылеты 3 мм.</p></details>
          <details><summary><CategoryTabIcon type="Диски" />Бумага и толщина</summary><p>Бумага — 100–300 г/м². Оставляйте запас на дисках: переполненный блокнот сложнее листать.</p></details>
          <a className="guide-original" href="https://multi-book.ru/video" target="_blank" rel="noopener noreferrer">Исходные материалы Multibook <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </div>
  );
}
