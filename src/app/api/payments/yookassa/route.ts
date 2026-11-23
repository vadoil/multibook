import { handleYookassaWebhook } from "@/lib/payments";

/**
 * Адрес для уведомлений ЮKassa: https://multi-book.ru/api/payments/yookassa
 * (в личном кабинете ЮKassa → Интеграция → HTTP-уведомления, события payment.succeeded и payment.canceled).
 * Отвечаем 200 всегда, кроме сбоя проверки, — иначе ЮKassa будет повторять уведомление.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("bad json", { status: 400 });
  }
  try {
    await handleYookassaWebhook(body);
    return new Response("ok");
  } catch (e) {
    console.error("[yookassa] вебхук:", (e as Error).message);
    return new Response("retry", { status: 500 });
  }
}
