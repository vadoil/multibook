import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Корпоративные блокноты",
  description:
    "Блокноты Multibook с вашим брендом: обложки, блоки и диски под задачу, своя типография. Сувениры для клиентов и фирменные блокноты для команды.",
  alternates: { canonical: "/corporate" },
};

export default function CorporatePage() {
  return (
    <InfoPage
      title="Multibook для вашего бренда"
      lead="Сувенир для клиентов или фирменный блокнот для команды. Дисковый переплёт позволяет собрать блокнот под задачу: свои обложки, страницы и диски."
    >
      <InfoSection title="Что можно сделать">
        <ul>
          <li>Обложки с логотипом и фирменными цветами</li>
          <li>Свои страницы: планеры, чек-листы, бланки, разделители</li>
          <li>Диски нужного цвета и диаметра под толщину блока</li>
          <li>Подарочная упаковка и сборка тиража</li>
        </ul>
        <p>
          Печатаем в собственной типографии. Чтобы прикинуть состав, соберите образец в{" "}
          <Link href="/constructor">конструкторе</Link> и пришлите ссылку на сборку.
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
