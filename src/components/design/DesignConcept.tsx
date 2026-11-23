"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { PrintWorkshopHero } from "./PrintWorkshopHero";
import { BrandGlyph } from "./BrandGlyph";
import { CategoryGlyph, type CategoryKind } from "./CategoryGlyph";

export type ConceptName = "paper" | "journal" | "play";
const concepts = [
  { id: "paper", n: "01", name: "Бумажная мастерская" },
  { id: "journal", n: "02", name: "Предметный журнал" },
  { id: "play", n: "03", name: "Конструктор идей" },
] as const;

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"} />
    </svg>
  );
}

function PreviewNav({ concept }: { concept: ConceptName }) {
  return (
    <nav className="mc-preview-nav" aria-label="Визуальные концепции">
      <Link href="/design-preview">Концепции Multibook</Link>
      <div>
        {concepts.map((c) => (
          <Link
            key={c.id}
            href={`/design-preview/${c.id}`}
            aria-current={c.id === concept ? "page" : undefined}
          >
            <span>{c.n}</span>
            <span className="mc-preview-name"> {c.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Header({ concept }: { concept: ConceptName }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="mc-header">
      <Link
        href={`/design-preview/${concept}`}
        className="mc-wordmark"
        aria-label="Multibook, главная концепции"
      >
        <BrandGlyph />
        multibook
      </Link>
      <nav className="mc-desktop-nav" aria-label="Основное меню">
        <Link href="/catalog">Магазин</Link>
        <Link href="/constructor">Собрать свой</Link>
        <a href="#how-it-works">Идея Multibook</a>
      </nav>
      <div className="mc-header-actions">
        <Link
          href="/account"
          className="mc-account"
          aria-label="Личный кабинет"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
        </Link>
        <Link href="/cart" className="mc-cart" aria-label="Корзина">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 7h14l1 14H4L5 7Z" />
            <path d="M8 9V6a4 4 0 0 1 8 0v3" />
          </svg>
          <span>Корзина</span>
        </Link>
        <button
          ref={trigger}
          className="mc-menu-toggle"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="concept-menu"
          onClick={() => setOpen(!open)}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d={open ? "m5 5 14 14M5 19 19 5" : "M4 8h16M4 16h16"} />
          </svg>
        </button>
      </div>
      {open && (
        <nav
          id="concept-menu"
          className="mc-mobile-nav"
          aria-label="Мобильное меню"
        >
          <Link href="/catalog">Магазин</Link>
          <Link href="/constructor">Собрать свой блокнот</Link>
          <a href="#how-it-works" onClick={() => setOpen(false)}>
            Как работает переплёт
          </a>
          <Link href="/account">Личный кабинет</Link>
        </nav>
      )}
    </header>
  );
}

function Photo({
  product,
  index = 1,
  className = "",
  priority = false,
}: {
  product: Product;
  index?: number;
  className?: string;
  priority?: boolean;
}) {
  const src = product.images[index] ?? product.images[0];
  return (
    <div className={`mc-photo ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={product.title}
          fill
          unoptimized
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 700px) 100vw, 50vw"
        />
      ) : (
        <span>Фотография скоро появится</span>
      )}
    </div>
  );
}

function Gallery({
  products,
  concept,
}: {
  products: Product[];
  concept: ConceptName;
}) {
  const [index, setIndex] = useState(0);
  const product = products[index];
  if (!product)
    return (
      <div className="mc-gallery-empty">Скоро здесь появятся блокноты</div>
    );
  return (
    <div
      className={`mc-gallery mc-gallery-${concept}`}
      role="region"
      aria-roledescription="карусель"
      aria-label="Блокноты Multibook"
    >
      <Link
        href={`/product/${product.slug}`}
        className="mc-gallery-image"
        aria-label={`Подробнее: ${product.title}`}
      >
        <Photo
          key={product.id}
          product={product}
          index={product.title.includes("Красные кони") ? 3 : 1}
          priority
        />
      </Link>
      <div className="mc-gallery-caption">
        <div aria-live="polite">
          <p>
            {product.title.match(/["«]([^"»]+)["»]/)?.[1] ?? product.shortTitle}
          </p>
          <span>{formatPrice(product.price)}</span>
        </div>
        <div className="mc-gallery-controls">
          <button
            type="button"
            onClick={() =>
              setIndex((index + products.length - 1) % products.length)
            }
            aria-label="Предыдущий блокнот"
          >
            <span aria-hidden>←</span>
          </button>
          <span aria-hidden>
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(products.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setIndex((index + 1) % products.length)}
            aria-label="Следующий блокнот"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ButtonLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`mc-button ${secondary ? "mc-button-secondary" : ""}`}
      href={href}
    >
      {children}
      <Arrow />
    </Link>
  );
}

function Mechanics({
  product,
  concept,
}: {
  product?: Product;
  concept: ConceptName;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <section
      id="how-it-works"
      className={`mc-mechanics mc-mechanics-${concept}`}
    >
      <div className="mc-mechanics-intro">
        <p className="mc-section-note">Маленькая деталь. Большая свобода.</p>
        <h2>
          Всё держится
          <br />
          на дисках.
        </h2>
        <p>
          Потяните лист у корешка — он снимется. Поставьте в другое место — он
          снова в блокноте. Планы меняются, и это нормально.
        </p>
        <button
          className="mc-text-button"
          onClick={() => setPlaying(!playing)}
          aria-pressed={playing}
        >
          {playing ? "Остановить движение" : "Посмотреть, как это работает"}
          <Arrow />
        </button>
      </div>
      <div className={`mc-mechanism ${playing ? "mc-is-playing" : ""}`}>
        {product && (
          <Photo product={product} index={4} className="mc-mechanism-photo" />
        )}
        <div className="mc-mechanism-copy">
          <span className="mc-motion-label">
            {playing ? "Лист меняет место" : "Листы можно переставлять"}
          </span>
          <div className="mc-motion-track" aria-hidden="true">
            <span>Снять</span>
            <i />
            <span>Переставить</span>
            <i />
            <span>Продолжить</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Featured({
  products,
  concept,
}: {
  products: Product[];
  concept: ConceptName;
}) {
  return (
    <section className={`mc-featured mc-featured-${concept}`} id="collection">
      <div className="mc-section-heading">
        <div>
          <p className="mc-section-note">Уже собраны. Осталось выбрать.</p>
          <h2>
            {concept === "journal"
              ? "Вещи с характером"
              : concept === "play"
                ? "Найдётся ваш."
                : "Для ваших больших планов"}
          </h2>
        </div>
        <Link className="mc-text-button" href="/catalog?type=Блокноты">
          Весь магазин
          <Arrow />
        </Link>
      </div>
      <div className="mc-product-grid">
        {products.map((p, i) => (
          <Link key={p.id} className="mc-product" href={`/product/${p.slug}`}>
            <div className="mc-product-photo">
              <Photo
                product={p}
                index={
                  p.title.includes("Красные кони")
                    ? 3
                    : p.title.includes("Весна")
                      ? 2
                      : 1
                }
              />
              {i === 0 && <span className="mc-product-label">Эко-замша</span>}
              <span className="mc-product-open" aria-hidden="true">
                <Arrow diagonal />
              </span>
            </div>
            <div className="mc-product-info">
              <h3>{p.title.match(/["«]([^"»]+)["»]/)?.[1] ?? p.shortTitle}</h3>
              <span>{formatPrice(p.price)}</span>
            </div>
            <p className="mc-product-detail">
              {p.attrs.format ?? "Блокнот"} · Сменные листы
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Categories({ concept }: { concept: ConceptName }) {
  const categories: {
    type: string;
    title: string;
    hint: string;
    kind: CategoryKind;
  }[] = [
    {
      type: "Тетради",
      title: "Тетради",
      hint: "Готовые модульные тетради",
      kind: "notebooks",
    },
    {
      type: "Блокноты",
      title: "Блокноты",
      hint: "Для идей и планов",
      kind: "journals",
    },
    {
      type: "Обложки",
      title: "Обложки",
      hint: "Снаружи — ваш характер",
      kind: "covers",
    },
    {
      type: "Блоки",
      title: "Блоки листов",
      hint: "Клетка, точка, линейка",
      kind: "pages",
    },
    {
      type: "Диски",
      title: "Диски",
      hint: "Соединяют всё вместе",
      kind: "discs",
    },
    {
      type: "Аксессуары",
      title: "Аксессуары",
      hint: "Нужные мелочи",
      kind: "tools",
    },
    {
      type: "Фотокниги",
      title: "Фотоальбомы",
      hint: "Для ваших историй",
      kind: "albums",
    },
  ];
  return (
    <section
      id="shop-details"
      className={`mc-categories mc-categories-${concept}`}
    >
      <div className="mc-categories-heading">
        <p className="mc-section-note">У каждой детали своё место</p>
        <h2>
          Блокнот,
          <br />в котором всё ваше.
        </h2>
        <p>Начните с готового. Или подберите каждую деталь под себя.</p>
      </div>
      <div className="mc-category-list">
        {categories.map((c) => (
          <Link
            key={c.type}
            href={`/catalog?type=${encodeURIComponent(c.type)}`}
            className={`mc-category-tile mc-category-tile-${c.kind}`}
          >
            <span className="mc-category-graphic">
              <CategoryGlyph kind={c.kind} />
            </span>
            <div className="mc-category-caption">
              <h3>{c.title}</h3>
              <span>{c.hint}</span>
            </div>
            <Arrow diagonal />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mc-footer">
      <div className="mc-footer-top">
        <p>
          Место для мыслей.
          <br />И для новых версий себя.
        </p>
        <div>
          <a href="tel:+79998994114">+7 999 899-41-14</a>
          <a
            href="https://www.ozon.ru/brand/multibook-100511115/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Мы на Ozon <span aria-hidden>↗</span>
          </a>
        </div>
        <nav aria-label="Меню в подвале">
          <Link href="/catalog">Магазин</Link>
          <Link href="/constructor">Конструктор</Link>
          <Link href="/account">Личный кабинет</Link>
        </nav>
      </div>
      <div className="mc-footer-wordmark" aria-hidden="true">
        multibook
        <span>
          <BrandGlyph />
        </span>
      </div>
      <div className="mc-footer-bottom">
        <span>Модульные блокноты на дисках</span>
        <span>Собирайте по-своему.</span>
      </div>
    </footer>
  );
}

function Paper({ products }: { products: Product[] }) {
  return (
    <>
      <PrintWorkshopHero
        product={products.find((p) => p.title.includes("Красные кони"))}
      />
      <div className="mc-paper-promise">
        <span>Один блокнот. Много возможностей.</span>
        <span>Листы снимаются</span>
        <span>Детали меняются</span>
        <span>Идеи остаются</span>
      </div>
      <section className="mc-print-story">
        <div>
          <p className="mc-section-note">Сделано у нас. Придумано вами.</p>
          <h2>
            Мы любим бумагу.
            <br />И умеем с ней работать.
          </h2>
          <p>
            Multibook начинается в нашей типографии. Мы печатаем листы и
            собираем из деталей блокноты, которые можно менять вместе с планами.
          </p>
          <Link className="mc-text-button" href="/constructor">
            Посмотреть, что можно собрать
            <Arrow />
          </Link>
        </div>
        <div className="mc-print-story-gallery">
          <Gallery products={products} concept="paper" />
        </div>
      </section>
      <Mechanics
        product={products.find((p) => p.title.includes("Красные кони"))}
        concept="paper"
      />
      <Featured products={products} concept="paper" />
      <Categories concept="paper" />
      <section className="mc-paper-cta">
        <span className="mc-section-note">Ваш следующий любимый блокнот</span>
        <h2>
          Начните с себя.
          <br />
          Остальное соберётся.
        </h2>
        <ButtonLink href="/constructor">Открыть конструктор</ButtonLink>
        <span className="mc-handwriting">
          Обложка + листы + диски = ваш Multibook
        </span>
      </section>
    </>
  );
}

function Journal({ products }: { products: Product[] }) {
  const horse = products.find((p) => p.title.includes("Красные кони"));
  const botanic = products.find((p) => p.title.includes("БОТАНИКА"));
  return (
    <>
      <section className="mc-journal-hero">
        <div className="mc-journal-title">
          <p>
            Предметы для мыслей
            <br />и повседневных ритуалов
            <Link href="/catalog" className="mc-journal-head-cta">
              Найти свой блокнот ↗
            </Link>
          </p>
          <h1>
            Свобода
            <br />
            между строк.
          </h1>
          <span className="mc-journal-edition">
            Multibook
            <br />
            На дисках. По-вашему.
          </span>
        </div>
        <div className="mc-journal-spread">
          <div className="mc-journal-side">
            <span className="mc-journal-side-note">
              Блокнот подстраивается под жизнь.
            </span>
            {botanic && (
              <Link href={`/product/${botanic.slug}`}>
                <Photo product={botanic} index={4} priority />
                <span>
                  «Ботаника»<small>{formatPrice(botanic.price)}</small>
                </span>
              </Link>
            )}
            <p>
              Листы можно переставить.
              <br />
              Мысли — отпустить.
            </p>
            <a
              href="#how-it-works"
              className="mc-round-link"
              aria-label="Как работает переплёт"
            >
              <Arrow />
            </a>
          </div>
          <div className="mc-journal-main">
            {horse && (
              <Link href={`/product/${horse.slug}`}>
                <Photo product={horse} index={3} priority />
                <span className="mc-journal-photo-label">
                  «Красные кони»<span>{formatPrice(horse.price)}</span>
                </span>
              </Link>
            )}
            <span className="mc-journal-margin">
              Тактильность. Характер. Ваш порядок.
            </span>
          </div>
        </div>
        <div className="mc-journal-bottom">
          <p>
            Меняйте страницы, обложки, планы.
            <br />
            Пусть любимый блокнот остаётся с вами.
          </p>
          <ButtonLink href="/catalog">Найти свой Multibook</ButtonLink>
          <Link href="/constructor" className="mc-quiet-link">
            Или собрать с нуля
          </Link>
        </div>
      </section>
      <section className="mc-journal-manifesto">
        <span className="mc-section-note">Хорошие вещи дают свободу</span>
        <p>
          Для списков, которые растут.
          <br />
          Для идей, которым тесно.
          <br />
          Для жизни, у которой
          <br />
          <em>нет чистовика.</em>
        </p>
        <span>Multibook / Идея простого порядка</span>
      </section>
      <Featured products={products} concept="journal" />
      <Mechanics product={horse} concept="journal" />
      <Categories concept="journal" />
      <section className="mc-journal-cta">
        <p className="mc-section-note">Новая глава начинается с вас</p>
        <h2>
          Ничего лишнего.
          <br />
          Всё по-своему.
        </h2>
        <ButtonLink href="/constructor">Собрать свой блокнот</ButtonLink>
      </section>
    </>
  );
}

function Play({ products }: { products: Product[] }) {
  const horse = products.find((p) => p.title.includes("Красные кони"));
  const spring = products.find((p) => p.title.includes("Весна"));
  return (
    <>
      <section className="mc-play-hero">
        <div className="mc-play-heading">
          <span className="mc-play-tag">Ваши мысли. Ваши правила.</span>
          <h1>
            Порядок?
            <br />
            По-своему.
          </h1>
          <p>
            Блокнот — конструктор.
            <br />
            Для всего, что у вас в голове.
          </p>
          <ButtonLink href="/constructor">Давайте соберём</ButtonLink>
        </div>
        <div className="mc-play-board">
          <div className="mc-play-red">
            <span>
              Меньше рамок.
              <br />
              Больше идей.
            </span>
            <span className="mc-play-flower" aria-hidden="true">
              ✳
            </span>
          </div>
          <div className="mc-play-main-photo">
            {horse && (
              <Link href={`/product/${horse.slug}`}>
                <Photo product={horse} index={1} priority />
              </Link>
            )}
            <span className="mc-play-photo-tag">Блокнот с характером</span>
          </div>
          <div className="mc-play-small-photo">
            {spring && (
              <Link href={`/product/${spring.slug}`}>
                <Photo product={spring} index={2} priority />
              </Link>
            )}
          </div>
          <div className="mc-play-note">
            <span className="mc-handwriting">
              Планы меняются?
              <br />
              Переставьте лист.
            </span>
            <a
              href="#how-it-works"
              aria-label="Посмотреть, как переставляются листы"
            >
              <Arrow diagonal />
            </a>
          </div>
          <span className="mc-play-sticker">
            Можно
            <br />
            по-другому!
          </span>
        </div>
      </section>
      <div className="mc-play-marquee" aria-hidden="true">
        <span>снимайте</span>
        <i>✳</i>
        <span>меняйте</span>
        <i>✳</i>
        <span>собирайте</span>
        <i>✳</i>
        <span>повторяйте</span>
      </div>
      <Categories concept="play" />
      <Featured products={products} concept="play" />
      <Mechanics product={horse} concept="play" />
      <section className="mc-play-cta">
        <span aria-hidden="true">✳</span>
        <div>
          <p className="mc-section-note">Выбирайте. Сочетайте. Меняйте.</p>
          <h2>
            Ваш блокнот.
            <br />
            Ваша сборка.
          </h2>
        </div>
        <ButtonLink href="/constructor">Попробовать конструктор</ButtonLink>
      </section>
    </>
  );
}

export function DesignConcept({
  concept,
  products,
}: {
  concept: ConceptName;
  products: Product[];
}) {
  return (
    <div className={`mc-root mc-${concept}`}>
      <PreviewNav concept={concept} />
      <Header concept={concept} />
      <div className="mc-content">
        {concept === "paper" ? (
          <Paper products={products} />
        ) : concept === "journal" ? (
          <Journal products={products} />
        ) : (
          <Play products={products} />
        )}
      </div>
      <Footer />
    </div>
  );
}
