/** Копейки → «1 209 ₽» (неразрывный пробел перед знаком). Общая для сервера и клиента. */
export function formatPrice(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}
