import Link from "next/link";
import { BrandGlyph } from "@/components/design/BrandGlyph";

export const metadata = {
  title: "Три направления Multibook",
  robots: { index: false, follow: false },
};

export default function ConceptsIndex() {
  return (
    <div className="mc-index">
      <Link className="mc-wordmark" href="/design-preview">
        <BrandGlyph />
        multibook
      </Link>
      <p className="mc-index-label">Три взгляда на один блокнот</p>
      <h1>
        Как будет выглядеть
        <br />
        ваша следующая глава?
      </h1>
      <div className="mc-index-grid">
        {[
          {
            id: "paper",
            n: "01",
            title: "Бумажная мастерская",
            text: "Тактильная бумага. Живые детали. Тёплый характер.",
          },
          {
            id: "journal",
            n: "02",
            title: "Предметный журнал",
            text: "Редакционная композиция. Фотография. Тихая роскошь.",
          },
          {
            id: "play",
            n: "03",
            title: "Конструктор идей",
            text: "Модули. Цвет. Свобода собирать по-своему.",
          },
        ].map((c) => (
          <Link
            key={c.id}
            href={`/design-preview/${c.id}`}
            className={`mc-index-card mc-index-${c.id}`}
          >
            <span>{c.n}</span>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <span className="mc-index-open">
              Открыть концепцию <span aria-hidden>↗</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mc-index-note">
        Дизайн-превью на настоящих фотографиях Multibook. Каталог, конструктор и
        корзина доступны по ссылкам.
      </p>
    </div>
  );
}
