/** Русское склонение по числу: plural(5, ["товар", "товара", "товаров"]) → "товаров". */
export function plural(n: number, [one, few, many]: [string, string, string]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
