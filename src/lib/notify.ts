import "server-only";
import { formatPrice } from "./money";

/**
 * Уведомления менеджеру. Сейчас — Telegram-бот: TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env.
 * Без настроек пишет только в лог сервера. Ошибки отправки не ломают оформление заказа.
 */
export async function notifyManager(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  console.info(`[notify] ${text.split("\n")[0]}`);
  if (!token || !chat) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(`[notify] Telegram ответил ${res.status}`);
  } catch (e) {
    console.error("[notify] не отправлено:", (e as Error).message);
  }
}

export function newOrderText(o: { number: string; id: number; name: string; phone: string; subtotal: number; delivery: string; city: string | null; items: number }) {
  const site = process.env.SITE_URL ?? "http://localhost:3000";
  return [
    `🛒 Новый заказ № ${o.number} — ${formatPrice(o.subtotal)}`,
    `${o.name}, ${o.phone}`,
    `${o.delivery}${o.city ? `, ${o.city}` : ""} · позиций: ${o.items}`,
    `${site}/admin/orders/${o.id}`,
  ].join("\n");
}
