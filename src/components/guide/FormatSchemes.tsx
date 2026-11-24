"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { CategoryTabIcon, StoreTabButton } from "../store/StoreTab";

const schemes = [
  { title: "Блоки листов", icon: "Блоки", file: "paper-formats", note: "Размеры блоков и цвета бумаги.", alt: "Схема форматов: А4 — 210 × 297 мм, А5 плюс — 160 × 210 мм, евро — 95 × 210 мм, мини-евро — 85 × 160 мм, мини-куба — 85 × 95 мм" },
  { title: "Обложки и закладки", icon: "Обложки", file: "covers-and-tabs", note: "Обложка защищает листы и выступающие вкладки.", alt: "Схема передней и задней обложки, прозрачного рубрикатора и закладки с размерами" },
  { title: "Совместимость", icon: "Тетради", file: "perforation", note: "Шаг отверстий одинаковый у разных форматов.", alt: "Совмещение перфорации листов разных форматов: шаг 25 мм и глубина 10 мм" },
  { title: "Большие и маленькие", icon: "Блокноты", file: "sizes-together", note: "Маленькие листы можно использовать в большом блокноте.", alt: "Схема размещения мини-листов на дисках большого блокнота" },
  { title: "Диски", icon: "Диски", file: "disc-sizes", note: "На схеме — бумага 100 г/м². Для выбранных блоков ориентируйтесь на подсказку конструктора.", alt: "Исходная схема диаметров дисков и вместимости для бумаги плотностью 100 граммов на квадратный метр" },
];

export function FormatSchemes() {
  const [index, setIndex] = useState(0);
  const id = useId();
  const selected = schemes[index];
  return (
    <div className="guide-schemes">
      <div className="guide-scheme-tabs" role="group" aria-label="Выберите схему">
        {schemes.map((scheme, i) => <StoreTabButton key={scheme.file} icon={<CategoryTabIcon type={scheme.icon} />} aria-pressed={index === i} aria-controls={id} onClick={() => setIndex(i)}>{scheme.title}</StoreTabButton>)}
      </div>
      <figure id={id} className="guide-scheme">
        <a href={`/guides/${selected.file}.webp`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть схему «${selected.title}» в полном размере, в новой вкладке`}>
          <Image key={selected.file} src={`/guides/${selected.file}.webp`} alt={selected.alt} width={1680} height={862} sizes="100vw" unoptimized />
        </a>
        <figcaption><span aria-live="polite">{selected.note}</span><a className="guide-zoom-link" href={`/guides/${selected.file}.webp`} target="_blank" rel="noopener noreferrer">Открыть крупно <span aria-hidden="true">↗</span></a></figcaption>
      </figure>
      <dl className="guide-format-sizes" aria-label="Размеры блоков Multibook">
        {[["А4", "210 × 297 мм"], ["А5 плюс", "160 × 210 мм"], ["Евро", "95 × 210 мм"], ["Мини-евро", "85 × 160 мм"], ["Мини-куба", "85 × 95 мм"]].map(([name, size]) => <div key={name}><dt>{name}</dt><dd>{size}</dd></div>)}
      </dl>
    </div>
  );
}
