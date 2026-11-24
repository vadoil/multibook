import "server-only";

/**
 * Публикация утверждённого контента в соцсети. Ключи — только в .env на сервере.
 * Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHANNEL_ID (бот должен быть админом канала).
 * ВКонтакте: VK_ACCESS_TOKEN (права wall, photos) + VK_GROUP_ID (число без минуса).
 * В публикациях нет персональных данных — только тексты и фото товара.
 */
export const CHANNELS = [
  { v: "telegram", label: "Telegram-канал", ready: () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHANNEL_ID), env: "TELEGRAM_BOT_TOKEN и TELEGRAM_CHANNEL_ID" },
  { v: "vk", label: "ВКонтакте", ready: () => !!(process.env.VK_ACCESS_TOKEN && process.env.VK_GROUP_ID), env: "VK_ACCESS_TOKEN и VK_GROUP_ID" },
] as const;
export type Channel = (typeof CHANNELS)[number]["v"];

const png = (b: Buffer) => new Blob([new Uint8Array(b)], { type: "image/png" });

async function telegram(text: string, images: Buffer[]) {
  const api = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  const chat = process.env.TELEGRAM_CHANNEL_ID!;
  const caption = text.length <= 1024 ? text : "";
  const fd = new FormData();
  fd.set("chat_id", chat);
  let method = "sendMessage";
  if (images.length === 1) {
    method = "sendPhoto";
    fd.set("photo", png(images[0]), "1.png");
    if (caption) fd.set("caption", caption);
  } else if (images.length > 1) {
    method = "sendMediaGroup";
    const batch = images.slice(0, 10);
    fd.set("media", JSON.stringify(batch.map((_, i) => ({ type: "photo", media: `attach://f${i}`, ...(i === 0 && caption ? { caption } : {}) }))));
    batch.forEach((b, i) => fd.set(`f${i}`, png(b), `${i + 1}.png`));
  } else fd.set("text", text);
  const res = await fetch(`${api}/${method}`, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) });
  const j = (await res.json()) as { ok: boolean; description?: string };
  if (!j.ok) throw new Error(`Telegram: ${j.description ?? res.status}`);
  // Длинный текст не помещается в подпись к фото — отправляем его следом отдельным сообщением.
  if (images.length && !caption) {
    const r2 = await fetch(`${api}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4096) }), signal: AbortSignal.timeout(20_000) });
    const j2 = (await r2.json()) as { ok: boolean; description?: string };
    if (!j2.ok) throw new Error(`Telegram: ${j2.description ?? r2.status}`);
  }
}

async function vkCall<T>(method: string, params: Record<string, string>): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: process.env.VK_ACCESS_TOKEN!, v: "5.199" });
  const res = await fetch(`https://api.vk.com/method/${method}`, { method: "POST", body, signal: AbortSignal.timeout(30_000) });
  const j = (await res.json()) as { response?: T; error?: { error_msg: string } };
  if (j.error || j.response === undefined) throw new Error(`ВКонтакте (${method}): ${j.error?.error_msg ?? res.status}`);
  return j.response;
}

async function vk(text: string, images: Buffer[]) {
  const group = process.env.VK_GROUP_ID!.replace(/^-/, "");
  const attachments: string[] = [];
  for (const [i, b] of images.slice(0, 10).entries()) {
    const { upload_url } = await vkCall<{ upload_url: string }>("photos.getWallUploadServer", { group_id: group });
    const fd = new FormData();
    fd.set("photo", png(b), `${i + 1}.png`);
    const up = (await (await fetch(upload_url, { method: "POST", body: fd, signal: AbortSignal.timeout(60_000) })).json()) as { server: number; photo: string; hash: string };
    const saved = await vkCall<{ id: number; owner_id: number }[]>("photos.saveWallPhoto", { group_id: group, server: String(up.server), photo: up.photo, hash: up.hash });
    attachments.push(`photo${saved[0].owner_id}_${saved[0].id}`);
  }
  await vkCall("wall.post", { owner_id: `-${group}`, from_group: "1", message: text, attachments: attachments.join(",") });
}

export async function publish(channel: Channel, text: string, images: Buffer[]) {
  const c = CHANNELS.find((x) => x.v === channel);
  if (!c?.ready()) throw new Error("Канал не подключён");
  if (channel === "telegram") await telegram(text, images);
  else await vk(text, images);
}
