import assert from "node:assert/strict";
import test from "node:test";
import type { Product } from "../../../src/db/schema";
import { selectComplements } from "../../../src/components/product/complements";

function item(id: number, patch: Partial<Product> = {}): Product {
  return {
    id,
    tildaUid: String(id),
    slug: `fixture-${id}`,
    title: "Товар",
    shortTitle: "Товар",
    type: "Блоки",
    price: 10000,
    priceOld: null,
    sku: null,
    stock: null,
    description: null,
    specs: {},
    attrs: { format: "А5", ruling: "grid" },
    images: ["fixture.jpg"],
    sourceUrl: null,
    isActive: true,
    sortOrder: id,
    featured: false,
    lockedAt: null,
    importedAt: new Date(0),
    updatedAt: new Date(0),
    ...patch,
  };
}

test("Для А5 показываются дополнения своего формата и наборы из восьми дисков", () => {
  const product = item(1, { type: "Тетради" });
  const result = selectComplements(product, [
    product,
    item(2),
    item(3, { attrs: { format: "85х95", ruling: "dot" } }),
    item(4, { attrs: { ruling: "line" } }),
    item(5, { attrs: { format: "А4", ruling: "line" } }),
    item(6, { stock: 0, attrs: { format: "А5", ruling: "dot" } }),
    item(7, { isActive: false }),
    item(8, { price: 0 }),
    item(9, { images: [] }),
    item(11, { type: "Обложки", attrs: { format: "А5" } }),
    item(12, { type: "Обложки", attrs: { format: "А4" } }),
    item(13, { type: "Диски", attrs: { pack: 8, diameter: 18 } }),
    item(14, { type: "Диски", attrs: { pack: 100, diameter: 18 } }),
    item(15, { type: "Диски", attrs: { pack: 6, diameter: 18 } }),
    item(16, { type: "Диски", attrs: { pack: 8, diameter: 24 } }),
  ]);
  assert.equal(result?.format, "А5");
  assert.deepEqual(
    result?.groups.flatMap((group) => group.items.map((p) => p.id)),
    [2, 11, 13, 16],
  );
});

test("Мини-форматы не получают блоки А5 или наборы из восьми дисков", () => {
  const product = item(1, { type: "Блокноты", attrs: { format: "85х95" } });
  const result = selectComplements(product, [
    item(2),
    item(3, { attrs: { format: "85х95", ruling: "grid" } }),
    item(4, { type: "Диски", attrs: { pack: 8, diameter: 18 } }),
    item(5, { type: "Диски", attrs: { pack: 4, diameter: 18 } }),
  ]);
  assert.equal(result?.format, "Мини куб");
  assert.deepEqual(
    result?.groups.flatMap((group) => group.items.map((p) => p.id)),
    [3, 5],
  );
});

test("Формат без признаков совместимости не угадывается", () => {
  assert.equal(
    selectComplements(item(1, { attrs: {}, title: "Неизвестный блокнот" }), [
      item(2),
    ]),
    undefined,
  );
  assert.equal(
    selectComplements(
      item(1, { attrs: { format: "А4" }, title: "Тетрадь А5" }),
      [item(2)],
    ),
    undefined,
  );
  assert.equal(
    selectComplements(item(1, { type: "Аксессуары", title: "А5" }), [item(2)]),
    undefined,
  );
  assert.equal(
    selectComplements(
      item(1, { attrs: {}, title: "Тетрадь A5 «Сам дизайнер»" }),
      [item(2)],
    )?.format,
    "А5",
  );
});
