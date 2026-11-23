"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/db/schema";
import { formatPrice } from "@/lib/money";
import { PrintWorkshopHero } from "./PrintWorkshopHero";
import { BrandGlyph } from "./BrandGlyph";
import { NotebookFilm } from "./NotebookFilm";
import { ShopChoices } from "./ShopChoices";
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
        <Link href="/constructor">Конструктор</Link>
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
          <Link href="/constructor">Конструктор</Link>
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

function Mechanics({ concept }: { product?: Product; concept: ConceptName }) {
  return (
    <section
      id="how-it-works"
      className={`mc-mechanics mc-mechanics-${concept}`}
    >
      <div className="mc-mechanics-intro">
        <p className="mc-section-note">Как устроен модульный блокнот</p>
        <h2>
          Лист меняет место.
          <br />
          Блокнот остаётся.
        </h2>
        <p>
          Потяните лист у корешка — он снимется с дисков. Прижмите к дискам в
          другом месте — он снова в блокноте.
        </p>
        <div className="mc-mechanics-steps">
          <span>
            <CategoryGlyph kind="pages" />
            Снимайте листы
          </span>
          <span>
            <CategoryGlyph kind="discs" />
            Меняйте порядок
          </span>
          <span>
            <CategoryGlyph kind="journals" />
            Добавляйте новые
          </span>
        </div>
        <Link className="mc-text-button" href="/constructor">
          Попробовать конструктор
          <Arrow />
        </Link>
      </div>
      <div className="mc-mechanism-film">
        <NotebookFilm />
      </div>
    </section>
  );
}

function ConstructorInvite({
  product,
  concept,
}: {
  product?: Product;
  concept: ConceptName;
}) {
  return (
    <section
      className={`mc-constructor-invite mc-constructor-invite-${concept}`}
    >
      <div className="mc-invite-photo">
        {product && (
          <Photo
            product={product}
            index={product.title.includes("Красные кони") ? 3 : 1}
          />
        )}
      </div>
      <div className="mc-invite-copy">
        <p className="mc-section-note">Конструктор блокнота</p>
        <h2>
          Каждая деталь —<br />
          ваш выбор.
        </h2>
        <p>
          Обложка с вашим характером. Удобная линовка. Диски любимого цвета.
          Посмотрите свою сборку и её стоимость до заказа.
        </p>
        <div className="mc-invite-parts" aria-label="Детали конструктора">
          <span>
            <CategoryGlyph kind="covers" />
            Обложка
          </span>
          <span>
            <CategoryGlyph kind="pages" />
            Листы
          </span>
          <span>
            <CategoryGlyph kind="discs" />
            Диски
          </span>
        </div>
        <ButtonLink href="/constructor">Открыть конструктор</ButtonLink>
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
              ? "Готовая коллекция"
              : concept === "play"
                ? "Готовые к вашим планам"
                : "Готовые блокноты и ежедневники"}
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
        <span>
          <CategoryGlyph kind="pages" />
          Листы снимаются и переставляются
        </span>
        <span>
          <CategoryGlyph kind="covers" />
          Обложку можно заменить
        </span>
        <span>
          <CategoryGlyph kind="discs" />
          Детали продаются отдельно
        </span>
      </div>
      <Featured products={products} concept="paper" />
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
      <Categories concept="paper" />
      <ConstructorInvite product={products[0]} concept="paper" />
    </>
  );
}

function Journal({ products }: { products: Product[] }) {
  const horse = products.find((p) => p.title.includes("Красные кони"));
  return (
    <>
      <PrintWorkshopHero product={horse} journal />
      <Featured products={products} concept="journal" />
      <ConstructorInvite product={products[0]} concept="journal" />
      <Mechanics concept="journal" />
      <Categories concept="journal" />
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
          <span className="mc-play-tag">Модульные блокноты на дисках</span>
          <h1>
            Порядок?
            <br />
            По-своему.
          </h1>
          <p>
            Выбирайте готовый блокнот или соберите свой. Листы легко снимать,
            добавлять и переставлять.
          </p>
          <ShopChoices />
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
      <ConstructorInvite product={spring} concept="play" />
    </>
  );
}

export function DesignConcept({
  concept,
  products,
  embedded = false,
}: {
  concept: ConceptName;
  products: Product[];
  embedded?: boolean;
}) {
  return (
    <div className={`mc-root mc-${concept}`}>
      {!embedded && <PreviewNav concept={concept} />}
      {!embedded && <Header concept={concept} />}
      <div className="mc-content">
        {concept === "paper" ? (
          <Paper products={products} />
        ) : concept === "journal" ? (
          <Journal products={products} />
        ) : (
          <Play products={products} />
        )}
      </div>
      {!embedded && <Footer />}
    </div>
  );
}
