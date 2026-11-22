import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Product } from "@/db/schema";

/** Scroll-linked photographic layers. Every part is a crop of the original catalogue photos. */
export function PrintWorkshopHero({ product }: { product?: Product }) {
  const cover = product?.images[3];
  const spread = product?.images[4];
  return (
    <section className="mc-print-scroll" aria-labelledby="print-hero-title">
      <div className="mc-print-pin">
        <div className="mc-print-copy">
          <p className="mc-section-note">
            <span className="mc-small-disc" aria-hidden="true" />
            Своя типография. Ваши идеи.
          </p>
          <h1 id="print-hero-title">
            Мы печатаем.
            <br />
            Вы создаёте.
          </h1>
          <p>
            Печатаем листы и собираем блокноты у себя.
            <br />А дальше — ваша история. Меняйте обложки,
            <br className="mc-desktop-break" /> переставляйте страницы,
            начинайте новое.
          </p>
          <div className="mc-hero-buttons">
            <Link className="mc-button" href="/constructor">
              Собрать свой блокнот <span aria-hidden="true">↗</span>
            </Link>
            <Link className="mc-quiet-link" href="/catalog">
              Выбрать готовый
            </Link>
          </div>
          <div className="mc-print-scroll-cue">
            <span aria-hidden="true">↓</span>
            <p>
              Листайте вниз.
              <br />
              <b>Хорошие вещи собираются из деталей.</b>
            </p>
          </div>
        </div>
        <div className="mc-print-visual">
          <span className="mc-print-coordinate mc-print-coordinate-top">
            Multibook / Своя типография
          </span>
          <div
            className="mc-assembly"
            role="img"
            aria-label="Сборка настоящего блокнота «Красные кони»: печатные листы, красные диски, обложка и открытый разворот. Анимация управляется прокруткой."
          >
            {cover && spread ? (
              <>
                <div className="mc-assembly-object" aria-hidden="true">
                  {[0, 1, 2].map((n) => (
                    <div
                      key={n}
                      className={`mc-real-paper mc-real-paper-${n}`}
                      style={
                        {
                          "--mc-paper-image": `url("${spread}")`,
                        } as CSSProperties
                      }
                    />
                  ))}
                  <div className="mc-real-cover">
                    <Image
                      src={cover}
                      alt=""
                      fill
                      unoptimized
                      priority
                      sizes="(max-width:700px) 100vw, 50vw"
                    />
                  </div>
                  {[25, 32.1, 39.6, 62.2, 69.3, 76.7].map((y, n) => (
                    <div
                      key={y}
                      className={`mc-real-disc mc-real-disc-${n}`}
                      style={{ "--mc-disc-y": `${y}%` } as CSSProperties}
                    >
                      <Image
                        src={cover}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width:700px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                  <div
                    className="mc-real-leaf"
                    style={
                      {
                        "--mc-paper-image": `url("${spread}")`,
                      } as CSSProperties
                    }
                  />
                </div>
                <div className="mc-assembly-spread" aria-hidden="true">
                  <Image
                    src={spread}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width:700px) 100vw, 50vw"
                  />
                </div>
              </>
            ) : (
              <p className="mc-assembly-empty">
                Здесь собирается ваш Multibook
              </p>
            )}
          </div>
          <span className="mc-print-stamp">
            Печатаем сами.
            <br />
            <b>Собираем для вас.</b>
          </span>
          <div className="mc-assembly-stages" aria-hidden="true">
            <span className="mc-stage mc-stage-paper">
              <i>01</i> Всё начинается с листа
            </span>
            <span className="mc-stage mc-stage-discs">
              <i>02</i> Диски соединяют детали
            </span>
            <span className="mc-stage mc-stage-cover">
              <i>03</i> Обложка добавляет характер
            </span>
            <span className="mc-stage mc-stage-open">
              <i>04</i> Перелистните. Или переставьте.
            </span>
          </div>
          <div className="mc-print-progress" aria-hidden="true">
            <span />
          </div>
          <span className="mc-print-coordinate mc-print-coordinate-bottom">
            От печатного листа до вашего блокнота
          </span>
        </div>
      </div>
    </section>
  );
}
