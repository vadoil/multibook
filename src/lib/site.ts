/** Публичные данные магазина: адрес сайта, контакты, реквизиты продавца.
 *  Источник — страницы multi-book.ru/oplata и /contacts (ноябрь 2026). */
export const SITE = {
  name: "Multibook",
  // Новый сайт работает параллельно с multi-book.ru на Tilda — адрес задаётся в .env.
  url: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "Модульные блокноты на дисках: листы снимаются и переставляются, обложки и диски меняются. Готовые блокноты, тетради и детали — или свой блокнот в конструкторе.",
  phone: "+7 999 899-41-14",
  phoneHref: "tel:+79998994114",
  emailOrders: "zakaz@381artwork.ru",
  emailCorporate: "ask@381artwork.ru",
  address: "Московская область, Красногорский район, д. Глухово, ул. Рублёвское Предместье, 7к1, офис 1",
  hours: "Пн–пт, 11:00–20:00",
  ozon: "https://www.ozon.ru/brand/multibook-100511115/",
  seller: {
    name: "Индивидуальный предприниматель Маркова Александра Евгеньевна",
    short: "ИП Маркова А. Е.",
    ogrnip: "316774600332702",
    inn: "773174701860",
  },
} as const;

export const abs = (path: string) => (/^https?:/.test(path) ? path : `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`);
