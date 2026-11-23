import type { ProductAttrs, ProductType } from "@/db/schema";
import { PRODUCT_TYPES } from "@/db/schema";

/** Цвет по слову в названии. Порядок важен: составные цвета раньше простых. */
const COLORS: [RegExp, string, string][] = [
  [/розов\S* золот/i, "#d6a08b", "розовое золото"],
  [/розов\S* серебр/i, "#d7b7b2", "розовое серебро"],
  [/т[её]мно-сер/i, "#4b4e52", "тёмно-серый"],
  [/золот/i, "#c9a24e", "золото"],
  [/серебр|алюмин/i, "#c3c5c7", "серебро"],
  [/асфальт/i, "#4a4c4f", "асфальт"],
  [/ч[её]рн/i, "#1f1f20", "чёрный"],
  [/прозрачн/i, "#dfe9ef", "прозрачный"],
  [/бел/i, "#f3f1ea", "белый"],
  [/голуб/i, "#7fb3d8", "голубой"],
  [/бирюз/i, "#3fb3ad", "бирюзовый"],
  [/сирен/i, "#b39ad5", "сиреневый"],
  [/красн/i, "#c8302a", "красный"],
  [/хурм/i, "#d4622a", "хурма"],
  [/оранж|рыж/i, "#e0702a", "оранжевый"],
  [/охр/i, "#c69a3c", "охра"],
  [/ж[её]лт/i, "#efc63a", "жёлтый"],
  [/зел[её]н|салат/i, "#3e9658", "зелёный"],
  [/олив/i, "#6c7143", "оливковый"],
  [/жасмин/i, "#eee2c4", "жасмин"],
  [/беж|песоч/i, "#d8c4a3", "бежевый"],
  [/коричн/i, "#6b4a33", "коричневый"],
  [/крафт/i, "#b98f5e", "крафт"],
  [/розов/i, "#e7a2b4", "розовый"],
  [/сер/i, "#8c8e8b", "серый"],
];

export function detectColor(text: string): { name: string; hex: string } | undefined {
  for (const [re, hex, name] of COLORS) if (re.test(text)) return { name, hex };
  return undefined;
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function slugify(text: string, maxWords = 8): string {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => TRANSLIT[c] ?? "")
    .replace(/[^a-z0-9]+/g, "-")
    .split("-")
    .filter(Boolean)
    .slice(0, maxWords)
    .join("-");
}

/** Латинская A → кириллическая А, единый вид форматов. */
export function normalizeFormat(raw?: string): string | undefined {
  if (!raw) return undefined;
  const v = raw.replace(/A/g, "А").trim();
  const m = v.match(/85х(160|95)/);
  if (m) return `85х${m[1]}`;
  return v;
}

/** Тип из характеристики «Тип»; если её нет — по названию (в Tilda у части товаров тип не заполнен). */
export function parseType(chars: Record<string, string>, title = ""): ProductType {
  const t = chars["Тип"];
  if ((PRODUCT_TYPES as readonly string[]).includes(t)) return t as ProductType;
  if (/^обложк|обложек/i.test(title)) return "Обложки";
  if (/^блок/i.test(title)) return "Блоки";
  if (/^диски/i.test(title)) return "Диски";
  if (/коробк|руч[еко]|дырокол|уголк|клеев/i.test(title)) return "Аксессуары";
  return "Прочее";
}

export function isTestProduct(title: string): boolean {
  // \b в JS не работает с кириллицей, поэтому «Тест1» ловим отдельно: название в кавычках целиком «Тест» + цифры.
  return /\btest\b|тестов|["«]\s*тест\s*\d*\s*["»]/i.test(title);
}

function cap(s: string): string {
  const v = s.trim().replace(/^[\s,.;:–-]+|[\s,.;]+$/g, "");
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** Свойства и короткое название из заголовка и характеристик. */
export function normalizeProduct(
  title: string,
  type: ProductType,
  chars: Record<string, string>,
): { attrs: ProductAttrs; shortTitle: string } {
  const attrs: ProductAttrs = {};
  const format = normalizeFormat(chars["Формат"]);
  if (format) attrs.format = format;
  if (chars["Материал обложки"]) attrs.material = chars["Материал обложки"];
  const color = detectColor(title);
  if (color) {
    attrs.color = color.name;
    attrs.colorHex = color.hex;
  }
  let shortTitle = title;

  if (type === "Обложки") {
    const paren = title.match(/\(([^)]+)\)/)?.[1] ?? "";
    const name = title.match(/[«"]([^»"]+)[»"]/)?.[1] ?? "Обложка";
    attrs.isSet = /комплект/i.test(title);
    attrs.print = /принт/i.test(title);
    const c = detectColor(paren || title);
    if (c) Object.assign(attrs, { color: c.name, colorHex: c.hex });
    const detail = paren
      ? paren.replace(/принт\/экокожа\s*/i, "принт ").toLowerCase()
      : (title.split(",")[1] ?? "").trim();
    shortTitle = `«${name}»${detail ? `, ${detail}` : ""}`;
  }

  if (type === "Блоки") {
    if (/А5|A5/.test(title)) attrs.format = "А5";
    const s = title.match(/(\d+)\s*л(?:\.|иста|ист)/);
    if (s) attrs.sheets = Number(s[1]);
    attrs.paper = /кремов/i.test(title) ? "cream" : "white";
    const rule = `${chars["Разметка"] ?? ""} ${title}`;
    attrs.ruling = /клетк/i.test(rule)
      ? "grid"
      : /точк/i.test(rule)
        ? "dot"
        : /линейк/i.test(rule)
          ? "line"
          : /нелин|без лин/i.test(rule)
            ? "blank"
            : "plan";
    let tail = s ? title.slice(title.indexOf(s[0]) + s[0].length) : title.replace(/^Блок.*?(А5|A5)\.?,?/i, "");
    if (/9,5х21/.test(title)) tail = "Задачи на контроле, узкий 9,5×21 см";
    tail = tail.replace(/\(дизайн дня блок\)/i, "").replace(/блокнот/i, "");
    shortTitle = cap(tail) || cap(chars["Разметка"] ?? "Блок");
    delete attrs.color;
    delete attrs.colorHex;
  }

  if (type === "Диски") {
    const d = title.match(/d-?\s*(\d{2})/i);
    if (d) attrs.diameter = Number(d[1]);
    const pack = title.match(/(\d+)\s*шт/);
    attrs.pack = pack ? Number(pack[1]) : 8;
    attrs.metal = /алюмин/i.test(title);
    attrs.finish = /перламутр/i.test(title)
      ? "перламутровые"
      : /матов/i.test(title)
        ? "матовые"
        : /глянц/i.test(title)
          ? "глянцевые"
          : undefined;
    attrs.finishKind = /прозрачн/i.test(title)
      ? "clear"
      : attrs.metal || /металлик|пластик\s+(золото|серебро|розовое)/i.test(title)
        ? "metal"
        : /перламутр/i.test(title)
          ? "pearl"
          : /глянц/i.test(title)
            ? "gloss"
            : "matte";
    if (/золотист/i.test(title)) Object.assign(attrs, { color: "золото", colorHex: "#c9a24e" });
    const plural = attrs.color?.replace(/(ый|ой)$/, "ые").replace(/ий$/, "ие");
    shortTitle = cap(
      [plural ?? "диски", attrs.finish, attrs.metal ? "алюминий" : undefined]
        .filter(Boolean)
        .join(", "),
    );
  }

  return { attrs, shortTitle };
}

/** Описание Tilda → безопасный текст с абзацами (без HTML). */
export function plainDescription(html?: string): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || undefined;
}
