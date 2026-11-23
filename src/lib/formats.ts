/**
 * Форматы конструктора. w/h — размер страницы в единицах превью (viewBox 360×440),
 * discs — сколько дисков рисовать на корешке.
 * mode "parts": собираем из обложки, блока и дисков (А5 — обложки продаются отдельно).
 * mode "base": берём готовый мини-блокнот (в нём уже есть блок и диски) и добавляем запасные блоки.
 */
export const FORMATS = {
  a5: { key: "a5", label: "А5", size: "148 × 210 мм", db: "А5", w: 280, h: 380, discs: 8, mode: "parts" },
  euro: { key: "euro", label: "Мини евро", size: "85 × 160 мм", db: "85х160", w: 196, h: 370, discs: 6, mode: "base" },
  cube: { key: "cube", label: "Мини куб", size: "85 × 95 мм", db: "85х95", w: 250, h: 280, discs: 4, mode: "base" },
} as const;

export type FormatKey = keyof typeof FORMATS;
export type Format = (typeof FORMATS)[FormatKey];
export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];

export function formatByDb(db?: string): FormatKey | undefined {
  return FORMAT_KEYS.find((k) => FORMATS[k].db === db);
}
