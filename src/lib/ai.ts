import "server-only";

/**
 * ИИ-роутер (OpenAI-совместимый API). Ключ — только в .env на сервере:
 * NORDROUTER_API_KEY, NORDROUTER_BASE_URL (по умолчанию https://nordrouter.com/v1), NORDROUTER_MODEL.
 */
const BASE = (process.env.NORDROUTER_BASE_URL || "https://nordrouter.com/v1").replace(/\/$/, "");
export const AI_MODEL = process.env.NORDROUTER_MODEL || "anthropic/claude-opus-5.5";

export const aiReady = () => !!process.env.NORDROUTER_API_KEY;

/** Запрос к модели с ответом в JSON. Бросает ошибку с понятным текстом. */
export async function aiJson<T>(system: string, user: string, maxTokens = 2500): Promise<T> {
  const key = process.env.NORDROUTER_API_KEY;
  if (!key) throw new Error("Не задан NORDROUTER_API_KEY");
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      temperature: 0.8,
      response_format: { type: "json_object" },
      // Одним сообщением: так ведут себя одинаково все модели роутера.
      // 24.11.2026: маршрут anthropic/claude-sonnet-5.5 обрезал длинные запросы — по умолчанию стоит opus-5.5.
      messages: [{ role: "user", content: `${system}\n\n———\n\n${user}` }],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`ИИ-роутер ответил ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { choices?: { finish_reason?: string; message?: { content?: string | { type?: string; text?: string }[] } }[] };
  const c = json.choices?.[0]?.message?.content ?? "";
  const text = typeof c === "string" ? c : c.map((x) => x.text ?? "").join("");
  // Модель иногда оборачивает JSON в ```json — берём то, что между первой { и последней }.
  const from = text.indexOf("{");
  const to = text.lastIndexOf("}");
  if (from < 0 || to <= from) {
    console.error("[ai] не JSON:", json.choices?.[0]?.finish_reason, JSON.stringify(json).slice(0, 600));
    throw new Error(`ИИ вернул ответ не в JSON (${json.choices?.[0]?.finish_reason ?? "нет ответа"})`);
  }
  if (process.env.AI_DEBUG) console.info("[ai] ответ:", text.slice(0, 1500));
  return JSON.parse(text.slice(from, to + 1)) as T;
}

export async function aiBalance(): Promise<number | null> {
  const key = process.env.NORDROUTER_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${BASE}/account/balance`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const j = (await res.json()) as { balance_usd?: number };
    return typeof j.balance_usd === "number" ? j.balance_usd : null;
  } catch {
    return null;
  }
}
