import type { Product } from "../../db/schema";
import { FORMATS, formatByDb } from "../../lib/formats";

/** A presentation-only selection from the existing catalogue; no product attributes are changed. */
export function selectComplements(product: Product, catalogue: Product[]) {
  const format = product.attrs.format
    ? formatByDb(product.attrs.format)
    : /(?:^|[^\p{L}\p{N}])[AА]5(?=$|[^\p{L}\p{N}])/iu.test(product.title)
      ? "a5"
      : undefined;
  if (
    !format ||
    !["Тетради", "Блокноты", "Обложки", "Блоки"].includes(product.type)
  )
    return undefined;
  const config = FORMATS[format];
  const available = catalogue.filter(
    (item) =>
      item.id !== product.id &&
      item.isActive &&
      item.price > 0 &&
      (item.stock === null || item.stock > 0) &&
      item.images.length > 0,
  );
  const sameFormat = available.filter(
    (item) => item.attrs.format === config.db,
  );
  const blocks = sameFormat.filter((item) => item.type === "Блоки");
  const selectedBlocks = ["grid", "dot", "line", "plan", "blank"]
    .flatMap((ruling) => {
      const item = blocks.find((block) => block.attrs.ruling === ruling);
      return item ? [item] : [];
    })
    .slice(0, 4);
  const byColour = (items: Product[]) =>
    [...items].sort(
      (a, b) =>
        Number(b.attrs.color === product.attrs.color && !!product.attrs.color) -
        Number(a.attrs.color === product.attrs.color && !!product.attrs.color),
    );
  const covers = byColour(
    sameFormat.filter((item) => item.type === "Обложки"),
  ).slice(0, 2);
  const discs = byColour(
    available.filter(
      (item) => item.type === "Диски" && item.attrs.pack === config.discs,
    ),
  );
  const selectedDiscs = [18, 24].flatMap((diameter) => {
    const item = discs.find((disc) => disc.attrs.diameter === diameter);
    return item ? [item] : [];
  });
  return {
    format: config.label,
    groups: [
      {
        kind: "pages" as const,
        title: `Блоки листов ${config.label}`,
        hint: "Клетка, точка, линейка или планер — добавьте нужные страницы.",
        items: selectedBlocks,
      },
      {
        kind: "covers" as const,
        title: `Обложки ${config.label}`,
        hint: "Новый цвет и фактура для вашего блокнота.",
        items: covers,
      },
      {
        kind: "discs" as const,
        title: "Диски для переплёта",
        hint: `Наборы по ${config.discs} шт. Выберите диаметр под толщину блока.`,
        items: selectedDiscs,
      },
    ].filter((group) => group.items.length > 0),
  };
}
