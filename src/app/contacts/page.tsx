import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Контакты",
  description: `Multibook: телефон ${SITE.phone}, почта ${SITE.emailOrders}. Самовывоз из Глухово, Красногорский район, пн–пт 11:00–20:00.`,
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  return (
    <InfoPage title="Контакты">
      <InfoSection title="Блокноты для себя">
        <ul>
          <li>
            Телефон: <a href={SITE.phoneHref}>{SITE.phone}</a>
          </li>
          <li>
            Почта: <a href={`mailto:${SITE.emailOrders}`}>{SITE.emailOrders}</a>
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Корпоративные блокноты">
        <ul>
          <li>
            Телефон: <a href={SITE.phoneHref}>{SITE.phone}</a>
          </li>
          <li>
            Почта: <a href={`mailto:${SITE.emailCorporate}`}>{SITE.emailCorporate}</a>
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Адрес и часы работы">
        <p>{SITE.address}</p>
        <p>{SITE.hours}</p>
        <p>
          И пешим гостям, и автомобилистам нужен пропуск на территорию посёлка. Закажите его: пришлите SMS или письмо с ФИО или
          маркой и номером автомобиля.
        </p>
      </InfoSection>
      <InfoSection title="Реквизиты">
        <p>
          {SITE.seller.name}
          <br />
          ОГРНИП {SITE.seller.ogrnip} · ИНН {SITE.seller.inn}
        </p>
      </InfoSection>
      <InfoSection title="Мы на маркетплейсах">
        <p>
          <a href={SITE.ozon} target="_blank" rel="noopener noreferrer">
            Multibook на Ozon
          </a>
        </p>
      </InfoSection>
    </InfoPage>
  );
}
