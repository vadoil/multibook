import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Оплата и доставка",
  description: "Доставка блокнотов Multibook СДЭК по России — в пункт выдачи или курьером, самовывоз из Глухово. Оплата картой на сайте, для организаций — по счёту.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <InfoPage title="Оплата и доставка" lead="Работаем по 100% предоплате. Стоимость доставки видна в корзине, как только вы укажете город.">
      <InfoSection title="Доставка">
        <ul>
          <li>
            <b>СДЭК, пункт выдачи</b> — по всей России. Укажите город и адрес пункта при оформлении.
          </li>
          <li>
            <b>СДЭК, курьер</b> — до двери.
          </li>
          <li>
            <b>Самовывоз</b> — {SITE.address}. {SITE.hours}. На территорию посёлка нужен пропуск: пришлите нам ФИО или марку и
            номер автомобиля по SMS или на почту.
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Оплата">
        <ul>
          <li>
            <b>Частным покупателям</b> — картой на сайте после подтверждения заказа; при самовывозе — картой или наличными в
            офисе.
          </li>
          <li>
            <b>Организациям</b> — по счёту. Счёт действителен 3 дня с момента выставления. Реквизиты для счёта напишите в
            комментарии к заказу или пришлите на <a href={`mailto:${SITE.emailCorporate}`}>{SITE.emailCorporate}</a>.
          </li>
        </ul>
      </InfoSection>
      <InfoSection title="Подтверждение заказа">
        <p>
          После оформления мы свяжемся с вами, чтобы подтвердить заказ. Заказы обрабатываем ежедневно с 11:00 до 20:00. Статус
          заказа виден по ссылке, которую вы получите после оформления, а если вы вошли в кабинет — в{" "}
          <Link href="/account">личном кабинете</Link>.
        </p>
      </InfoSection>
      <InfoSection title="Обмен и возврат">
        <p>
          Условия — на странице <Link href="/returns">«Обмен и возврат»</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
