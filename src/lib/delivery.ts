import "server-only";
import type { DeliveryMethod } from "@/db/schema";

/**
 * Расчёт доставки СДЭК.
 * - Есть CDEK_CLIENT_ID и CDEK_CLIENT_SECRET → API СДЭК v2 (CDEK_TEST=1 — их тестовый контур api.edu.cdek.ru).
 * - Нет ключей → демо-расчёт по простой формуле, помечается demo: true.
 * Отправка — со склада/ПВЗ в городе CDEK_FROM_CITY_CODE (44 — Москва).
 */
export type DeliveryQuote = { price: number; eta: string; demo: boolean; city: string } | { error: string };

export function deliveryMode(): "cdek" | "demo" {
  return process.env.CDEK_CLIENT_ID && process.env.CDEK_CLIENT_SECRET ? "cdek" : "demo";
}

/** Примерный вес посылки по типам товаров, граммы. Уточнить у владельца — и лучше хранить вес в товаре. */
const WEIGHT: Record<string, number> = { Тетради: 450, Блокноты: 400, Обложки: 300, Блоки: 250, Диски: 40, Аксессуары: 100, Фотокниги: 1200 };
export function parcelWeight(items: { type: string; qty: number }[]) {
  return Math.max(200, items.reduce((s, i) => s + (WEIGHT[i.type] ?? 300) * i.qty, 0) + 100); // +100 г упаковка
}

const days = (a: number, b: number) => (a === b ? `${a} дн.` : `${a}–${b} дн.`);

function demoQuote(city: string, method: DeliveryMethod, grams: number): DeliveryQuote {
  const base = method === "cdek-door" ? 49000 : 29000;
  const extra = Math.max(0, Math.ceil((grams - 500) / 500)) * 4000;
  const near = /москв|подмоск|химки|балаших|мытищ|люберц|красногорск|одинцов/i.test(city);
  return { price: base + extra + (near ? 0 : 10000), eta: near ? days(1, 2) : days(3, 6), demo: true, city };
}

// ——— API СДЭК v2 ———
const base = () => (process.env.CDEK_TEST === "1" ? "https://api.edu.cdek.ru" : "https://api.cdek.ru");
let token: { value: string; until: number } | null = null;

async function cdekToken() {
  if (token && token.until > Date.now()) return token.value;
  const res = await fetch(`${base()}/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.CDEK_CLIENT_ID!, client_secret: process.env.CDEK_CLIENT_SECRET! }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`СДЭК авторизация ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  token = { value: j.access_token, until: Date.now() + (j.expires_in - 60) * 1000 };
  return token.value;
}

async function cdek<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await cdekToken()}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`СДЭК ${path} ${res.status}`);
  return (await res.json()) as T;
}

type Tariff = { tariff_code: number; delivery_mode: number; delivery_sum: number; period_min: number; period_max: number };

async function cdekQuote(city: string, method: DeliveryMethod, grams: number): Promise<DeliveryQuote> {
  const found = await cdek<{ code: number; city: string; region?: string }[]>(`/v2/location/cities?${new URLSearchParams({ city, country_codes: "RU", size: "1" })}`);
  if (!found.length) return { error: "СДЭК не нашёл такой город — проверьте название" };
  const list = await cdek<{ tariff_codes?: Tariff[] }>("/v2/calculator/tarifflist", {
    method: "POST",
    body: JSON.stringify({
      from_location: { code: Number(process.env.CDEK_FROM_CITY_CODE ?? 44) },
      to_location: { code: found[0].code },
      packages: [{ weight: grams, length: 25, width: 20, height: 6 }],
    }),
  });
  // Режимы СДЭК: 4 — склад→склад (до ПВЗ), 3 — склад→дверь.
  const wanted = method === "cdek-door" ? [3] : [4];
  const best = (list.tariff_codes ?? []).filter((t) => wanted.includes(t.delivery_mode)).sort((a, b) => a.delivery_sum - b.delivery_sum)[0];
  if (!best) return { error: "СДЭК не возит этим способом в этот город" };
  return { price: Math.ceil(best.delivery_sum) * 100, eta: days(best.period_min, best.period_max), demo: false, city: found[0].city };
}

export async function quoteDelivery(city: string, method: DeliveryMethod, items: { type: string; qty: number }[]): Promise<DeliveryQuote> {
  const c = city.trim().slice(0, 80);
  if (method === "other") return { error: "Способ обсудим по телефону" };
  if (c.length < 2) return { error: "Укажите город" };
  const grams = parcelWeight(items);
  if (deliveryMode() === "demo") return demoQuote(c, method, grams);
  try {
    return await cdekQuote(c, method, grams);
  } catch (e) {
    console.error("[cdek]", (e as Error).message);
    return { error: "Не удалось связаться со СДЭК — менеджер посчитает доставку при подтверждении" };
  }
}
