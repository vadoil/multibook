import "server-only";
import type { ContentData, ContentItem, ContentKind, ContentStatus, Product } from "@/db/schema";
import { AI_MODEL, aiJson, aiReady } from "./ai";
import { formatPrice } from "./money";
import { SITE } from "./site";

export const KIND_LABELS: Record<ContentKind, string> = { post: "Пост", carousel: "Карусель", reel: "Рилс" };
export const STATUS_LABELS: Record<ContentStatus, string> = { draft: "Черновик", review: "На проверке", approved: "Утверждено", published: "Опубликовано" };

export const ANGLES = [
  { v: "review", label: "Обзор товара", brief: "Покажи товар крупно: что это, из чего сделан, для кого." },
  { v: "how", label: "Как это устроено", brief: "Объясни дисковый переплёт: листы снимаются и встают обратно, блоки и обложки меняются." },
  { v: "planning", label: "Сценарий использования", brief: "Один конкретный сценарий: планирование недели, учёба, рабочие заметки или дневник." },
  { v: "gift", label: "Идея подарка", brief: "Кому и по какому поводу это дарят. Без пафоса, с конкретикой." },
  { v: "kit", label: "Собери свой", brief: "Из каких частей собирается блокнот и что можно поменять потом. Веди в конструктор." },
] as const;
export type Angle = (typeof ANGLES)[number]["v"];

const RULING: Record<string, string> = { grid: "клетка", dot: "точка", line: "линейка", blank: "без линовки", plan: "планер" };

/** Факты о товаре — единственный источник правды для модели. */
function facts(p: Product): string {
  const a = p.attrs;
  const lines = [
    `Название: ${p.title}`,
    `Тип: ${p.type}`,
    `Цена: ${formatPrice(p.price)}`,
    a.format && `Формат: ${a.format}`,
    a.material && `Материал обложки: ${a.material}`,
    a.sheets && `Листов: ${a.sheets}`,
    a.ruling && `Линовка: ${RULING[a.ruling] ?? a.ruling}`,
    a.diameter && `Диаметр дисков: ${a.diameter} мм`,
    ...Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`),
    p.description && `Описание из карточки: ${p.description.replace(/\s+/g, " ").slice(0, 1200)}`,
    `Фотографий товара: ${p.images.length} (индексы 0…${Math.max(0, p.images.length - 1)}; 0 — главное фото)`,
  ];
  return lines.filter(Boolean).join("\n");
}

const SYSTEM = `Ты редактор соцсетей бренда Multibook: модульные блокноты, тетради и ежедневники на дисках. Листы снимаются и встают обратно, обложки, блоки листов и диски меняются. Производство в России, продаём на своём сайте, Ozon и Wildberries.

Голос: спокойный, предметный, тёплый. Пишем на «вы». Как хороший продавец в канцелярской лавке: показывает вещь и говорит, чем она удобна.

Жёсткие правила:
- Только факты из карточки товара. Не выдумывай размеры, материалы, количество листов, скидки, сроки, отзывы и цифры. Нет факта — не пиши о нём.
- Товар в центре: крупно, конкретно, один сценарий на единицу контента.
- Первая строка останавливает прокрутку конкретикой, а не восклицанием.
- Запрещено: «это не просто X, это Y», перечни «без X, без Y, без Z», риторические вопросы с ответом, «погрузитесь», «идеальный», «уникальный», «незаменимый», длинное тире, строка из одного слова на каждую строчку, эмодзи в начале каждой строки.
- Эмодзи: не больше двух на текст, можно ни одного.
- Хэштеги: 4–6, по-русски, без пробелов, без #, конкретные (например «блокнотнадисках», «ежедневник», «планирование»).
- Текст на слайдах и в кадрах короткий: заголовок до 34 знаков, текст до 110 знаков, надпись в кадре рилса до 38 знаков.
- Отвечай только JSON без пояснений.`;

type Raw = Partial<ContentData> & { title?: string };

const SHAPES: Record<ContentKind, string> = {
  post: `{"title": "рабочее название для списка", "hook": "первая строка поста, до 60 знаков", "caption": "текст поста, 350–600 знаков, 2–3 абзаца через \\n\\n", "cta": "призыв, до 60 знаков", "hashtags": ["..."], "slides": [{"title": "заголовок на картинке, до 34 знаков", "text": "подзаголовок, до 70 знаков", "image": 0}]}`,
  carousel: `{"title": "рабочее название", "hook": "заголовок обложки, до 34 знаков", "caption": "подпись под каруселью, 250–450 знаков", "cta": "призыв, до 60 знаков", "hashtags": ["..."], "slides": [{"title": "до 34 знаков", "text": "до 110 знаков", "image": 0}]}
Слайдов 5–6: первый — обложка с крючком, дальше по одной мысли на слайд, последний — что сделать дальше. Индексы фото чередуй, если фотографий несколько.`,
  reel: `{"title": "рабочее название", "hook": "надпись первого кадра, до 34 знаков", "caption": "подпись под видео, 150–300 знаков", "cta": "призыв, до 60 знаков", "hashtags": ["..."], "music": "настроение музыки одной фразой", "scenes": [{"seconds": 3, "image": 0, "overlay": "надпись в кадре, до 38 знаков", "voice": "закадровый текст этого кадра, одно предложение"}]}
Сцен 5–6, всего 15–22 секунды. Первая сцена 2–3 секунды с крючком, последняя — призыв. Индексы фото чередуй.`,
};

const clip = (s: unknown, n: number) => String(s ?? "").replace(/—/g, "–").trim().slice(0, n);

/** Приводит ответ модели (или шаблон) к строгой форме: длины, индексы фото, обязательные поля. */
export function normalizeData(raw: Raw, kind: ContentKind, p: Pick<Product, "images">): ContentData {
  const img = (i: unknown) => Math.min(Math.max(0, Number(i) || 0), Math.max(0, p.images.length - 1));
  const slides = (Array.isArray(raw.slides) ? raw.slides : []).slice(0, 8).map((s) => ({ title: clip(s?.title, 60), text: clip(s?.text, 160), image: img(s?.image) }));
  const scenes = (Array.isArray(raw.scenes) ? raw.scenes : []).slice(0, 8).map((s) => ({
    seconds: Math.min(8, Math.max(2, Number(s?.seconds) || 3)),
    image: img(s?.image),
    overlay: clip(s?.overlay, 60),
    voice: clip(s?.voice, 240),
  }));
  const hook = clip(raw.hook, 90);
  return {
    hook,
    caption: clip(raw.caption, 2200),
    cta: clip(raw.cta, 120),
    hashtags: (Array.isArray(raw.hashtags) ? raw.hashtags : []).map((h) => clip(h, 40).replace(/^#/, "").replace(/\s+/g, "")).filter(Boolean).slice(0, 8),
    template: raw.template === "paper" || raw.template === "ink" ? raw.template : "photo",
    slides: kind === "reel" ? [] : slides.length ? slides : [{ title: hook, text: "", image: 0 }],
    scenes: kind === "reel" ? (scenes.length ? scenes : [{ seconds: 3, image: 0, overlay: hook, voice: "" }]) : [],
    music: raw.music ? clip(raw.music, 120) : undefined,
  };
}

/** Запасной вариант без ИИ: собирает черновик из полей карточки. */
function templateDraft(p: Product, kind: ContentKind): Raw {
  const a = p.attrs;
  const name = p.shortTitle || p.title;
  const bits = [a.format && `Формат ${a.format}`, a.material && `обложка: ${a.material}`, a.sheets && `${a.sheets} листов`, a.ruling && `линовка: ${RULING[a.ruling]}`].filter(Boolean) as string[];
  const about = bits.length ? `${bits.join(", ")}.` : "";
  const n = Math.max(1, p.images.length);
  const base = {
    title: `${KIND_LABELS[kind]}: ${name}`,
    hook: name.slice(0, 34),
    caption: `${name}. ${about}\n\nЛисты держатся на дисках: их можно снять, переставить и вернуть обратно. Когда блок закончится, обложка останется, а листы поменяете на новые.\n\nЦена ${formatPrice(p.price)}.`,
    cta: "Посмотреть и заказать на сайте",
    hashtags: ["блокнотнадисках", "multibook", "ежедневник", "планирование"],
  };
  if (kind === "reel")
    return {
      ...base,
      music: "спокойная акустика, тёплая",
      scenes: [
        { seconds: 3, image: 0, overlay: name.slice(0, 38), voice: `Это ${name}.` },
        { seconds: 3, image: 1 % n, overlay: "Листы снимаются", voice: "Листы держатся на дисках и снимаются без колец и замков." },
        { seconds: 3, image: 2 % n, overlay: "И встают обратно", voice: "Переставьте их в любом порядке и верните на место." },
        { seconds: 3, image: 3 % n, overlay: about.slice(0, 38) || "Блок можно заменить", voice: about || "Когда блок закончится, поставьте новый." },
        { seconds: 3, image: 0, overlay: `${formatPrice(p.price)} на сайте`, voice: "Ссылка в описании." },
      ],
    };
  if (kind === "carousel")
    return {
      ...base,
      slides: [
        { title: name.slice(0, 34), text: "Блокнот на дисках", image: 0 },
        { title: "Листы снимаются", text: "Достаньте лист, перенесите в другой раздел и верните обратно.", image: 1 % n },
        { title: "Блок меняется", text: "Закончились листы — ставите новый блок в ту же обложку.", image: 2 % n },
        { title: "Что внутри", text: about || "Обложка, блок листов и диски.", image: 3 % n },
        { title: formatPrice(p.price), text: "Заказать на сайте с доставкой СДЭК.", image: 0 },
      ],
    };
  return { ...base, slides: [{ title: name.slice(0, 34), text: about.slice(0, 70), image: 0 }] };
}

export async function generateContent(p: Product, kind: ContentKind, angle: Angle, note: string): Promise<{ title: string; data: ContentData; source: string; warning?: string }> {
  const brief = ANGLES.find((x) => x.v === angle)?.brief ?? ANGLES[0].brief;
  if (aiReady()) {
    try {
      const raw = await aiJson<Raw>(
        SYSTEM,
        `Сделай ${KIND_LABELS[kind].toLowerCase()} для ВКонтакте, Telegram и Instagram по этой карточке товара.\n\nУгол подачи: ${brief}${note ? `\nПожелание редактора: ${note.slice(0, 400)}` : ""}\n\nКарточка товара:\n${facts(p)}\n\nФорма ответа (JSON):\n${SHAPES[kind]}`,
      );
      return { title: clip(raw.title, 120) || `${KIND_LABELS[kind]}: ${p.shortTitle}`, data: normalizeData(raw, kind, p), source: AI_MODEL };
    } catch (e) {
      const raw = templateDraft(p, kind);
      return { title: raw.title!, data: normalizeData(raw, kind, p), source: "шаблон", warning: (e as Error).message };
    }
  }
  const raw = templateDraft(p, kind);
  return { title: raw.title!, data: normalizeData(raw, kind, p), source: "шаблон" };
}

export const productLink = (p: Pick<Product, "slug"> | null) => (p ? `${SITE.url}/product/${p.slug}` : SITE.url);

/** Единое поле: готовый текст публикации — его копируют, скачивают или отправляют в соцсеть. */
export function composeFinal(item: Pick<ContentItem, "kind" | "data">, p: Pick<Product, "slug"> | null): string {
  const d = item.data;
  const tags = d.hashtags.map((h) => `#${h}`).join(" ");
  const head = item.kind === "post" ? [d.hook, d.caption] : [d.caption];
  return [...head, [d.cta, productLink(p)].filter(Boolean).join("\n"), tags].filter(Boolean).join("\n\n");
}

/** Раскадровка рилса или тексты слайдов — для файла в архиве и для тех, кто монтирует сам. */
export function composeScript(item: Pick<ContentItem, "kind" | "data" | "title">): string {
  const d = item.data;
  if (item.kind === "reel") {
    let t = 0;
    const rows = d.scenes.map((s, i) => {
      const from = t;
      t += s.seconds;
      return `Кадр ${i + 1} (${from}–${t} с), фото ${s.image + 1}\nНадпись: ${s.overlay}\nГолос: ${s.voice}`;
    });
    return [`${item.title}`, `Длительность: ${t} с. Формат 9:16.`, d.music ? `Музыка: ${d.music}` : "", ...rows].filter(Boolean).join("\n\n");
  }
  return [item.title, ...d.slides.map((s, i) => `Слайд ${i + 1}, фото ${s.image + 1}\n${s.title}\n${s.text}`)].join("\n\n");
}

export const frameCount = (item: Pick<ContentItem, "kind" | "data">) => (item.kind === "reel" ? item.data.scenes.length : item.data.slides.length);
