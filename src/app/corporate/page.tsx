import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Корпоративные блокноты",
  description:
    "Блокноты Multibook с вашим брендом: обложки, блоки и диски под задачу, своя типография. Сувениры для клиентов и фирменные блокноты для команды.",
  alternates: { canonical: "/corporate" },
};

// Работы из портфолио страницы multi-book.ru/corporatives (настоящие фото выполненных заказов).
const T = "https://static.tildacdn.com/";
const WORKS = [
  "tild6538-6366-4138-b137-643462326636/VIP_0003_4.jpg",
  "tild6535-3532-4930-b635-343635633838/blocknot7.jpg",
  "tild6565-3731-4264-b232-626237366434/zamsha_0002__11.jpg",
  "tild6132-6635-4166-a635-666131346365/multibook_phs__0012_.jpg",
  "tild3639-3037-4864-b630-386230353434/blocknot1.jpg",
  "tild3930-3235-4538-b735-646632663262/mb__0008____-115.jpg",
  "tild3538-3434-4438-b463-663739643064/Multibook_nissa_0001.jpg",
  "tild3161-3066-4263-a261-393232343933/blocknot2.jpg",
  "tild3432-6363-4338-a636-366436366337/zamsha_0010__5.jpg",
  "tild6430-3961-4139-b436-623932383136/blocknot3.jpg",
  "tild3833-6533-4562-a535-366536633230/blocknot12.jpg",
  "tild6661-3937-4234-a434-643762616339/blocknot18.jpg",
];

export default function CorporatePage() {
  return (
    <InfoPage
      title="Multibook для вашего бренда"
      lead="Сувенир для аудитории бренда или фирменное издание для команды. Дисковый переплёт даёт больше свободы, чем обычный: свои обложки, страницы и диски в любой комбинации."
    >
      <InfoSection title="Портфолио">
        <ul className="work-gallery">
          {WORKS.map((w, i) => (
            <li key={w}>
              <Image src={T + w} alt={`Корпоративный блокнот Multibook, работа ${i + 1}`} fill sizes="(max-width: 700px) 50vw, 240px" />
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Что можно сделать">
        <ul>
          <li>Обложки с логотипом и фирменными цветами, мягкие и твёрдые</li>
          <li>Свои страницы: планеры, чек-листы, бланки, разделители и рубрикаторы</li>
          <li>Диски нужного цвета и диаметра под толщину блока</li>
          <li>Подарочная упаковка и сборка тиража</li>
        </ul>
        <p>
          Печатаем в собственной типографии Artwork №381. Чтобы прикинуть состав, соберите образец в{" "}
          <Link href="/constructor">конструкторе</Link> и пришлите ссылку на сборку. Все варианты комплектации тиража — в{" "}
          <a href="https://381artwork.ru/multibook_config" target="_blank" rel="noopener">
            конфигураторе типографии
          </a>
          .
        </p>
        <p>
          Готовите макеты сами? Размеры, вылеты и формат файлов — в разделе{" "}
          <Link href="/how-it-works">«Как устроен блокнот»</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Как обсудить заказ">
        <ul>
          <li>
            Почта: <a href={`mailto:${SITE.emailCorporate}`}>{SITE.emailCorporate}</a> — тираж, сроки, макеты или идея
          </li>
          <li>
            Телефон: <a href={SITE.phoneHref}>{SITE.phone}</a>, {SITE.hours.toLowerCase()}
          </li>
        </ul>
        <p>Организациям выставляем счёт; оплата по безналичному расчёту.</p>
      </InfoSection>
    </InfoPage>
  );
}
