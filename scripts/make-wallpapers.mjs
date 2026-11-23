// Обои для первого экрана главной: из портретных студийных фото каталога (блокнот на крафте)
// собираем широкие кадры 16:9 и вертикальные 9:16. Сам товар не дорисовываем: фото ставится как есть,
// а поле вокруг продолжается размытым крафтом с зерном бумаги, края фото растушёвываются.
//
//   node scripts/make-wallpapers.mjs          → public/hero/*.webp + public/hero/wallpapers.json + public/og.jpg
//
// Список кадров — WALLPAPERS ниже: фото из каталога (URL Tilda) и uid товара, на который ведёт слайд.
// Новые обои от дизайнера можно положить в public/hero/ и дописать в wallpapers.json вручную
// (поля как у сгенерированных; uid — необязателен).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("public/hero");
const WALLPAPERS = [
  {
    id: "botanika",
    uid: "760853733322",
    name: "Ботаника",
    alt: "Блокнот «Ботаника» из эко-замши с зелёными дисками и резинкой на крафтовой бумаге",
    src: "https://static.tildacdn.com/stor3361-6135-4739-a638-306237373065/f5c9fa685143fc9a9f2eda1417e89cb5.jpg",
  },
  {
    id: "krasnye-koni",
    uid: "763698818122",
    name: "Красные кони",
    alt: "Блокнот «Красные кони»: оливковая эко-замша, красные кони и красные диски",
    src: "https://static.tildacdn.com/stor3035-6530-4761-a362-343663636332/22272e7bd0c8f545179c2a5f178388c4.jpg",
  },
  {
    id: "zolotoe-vremya",
    uid: "556041946942",
    name: "Золотое время",
    alt: "Блокнот «Золотое время» с золотым гербом-часами, ручкой и сменным блоком",
    src: "https://static.tildacdn.com/stor3936-3331-4361-a662-363261303433/cabc1d1e4d6ebb383c4be5ddf1d4ca7e.jpg",
  },
  {
    id: "vesna",
    uid: "725111859732",
    name: "Весна",
    alt: "Светлый блокнот «Весна» с веткой и птицей на обложке",
    src: "https://static.tildacdn.com/stor3237-6664-4764-b136-353830393732/21b79bc02db40c37c8d95a3f005784e6.jpg",
  },
  {
    id: "vazhnaya-ptitsa",
    uid: "937894370012",
    name: "Важная птица",
    alt: "Чёрный блокнот «Важная птица» с золотым тиснением и золотыми дисками",
    src: "https://static.tildacdn.com/stor3433-3139-4532-a133-666131306635/fa57d291c21934bc6c985f0cbe13d876.jpg",
  },
];

/** Средний цвет полосы кадра — по нему тонируем продолженный фон и интерфейс поверх. */
async function meanColor(img, region) {
  const { channels } = await img.clone().extract(region).stats();
  return channels.slice(0, 3).map((c) => Math.round(c.mean));
}
const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");

/** Зерно бумаги: случайный шум, накладывается мягким светом. */
function grain(w, h, amount = 26) {
  const buf = Buffer.alloc(w * h);
  for (let i = 0; i < buf.length; i++) buf[i] = 128 + Math.round((Math.random() - 0.5) * amount * 2);
  return sharp(buf, { raw: { width: w, height: h, channels: 1 } }).blur(0.6).png().toBuffer();
}

/** Маска с растушёвкой краёв (доли ширины/высоты). */
function featherMask(w, h, { left = 0, right = 0, top = 0, bottom = 0 }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="x" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="${left ? 0 : 1}"/>
        <stop offset="${left}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="${1 - right}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="1" stop-color="#fff" stop-opacity="${right ? 0 : 1}"/>
      </linearGradient>
      <linearGradient id="y" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${top ? 0 : 1}"/>
        <stop offset="${top}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="${1 - bottom}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="1" stop-color="#fff" stop-opacity="${bottom ? 0 : 1}"/>
      </linearGradient>
      <mask id="m"><rect width="100%" height="100%" fill="url(#y)"/></mask>
    </defs>
    <rect width="100%" height="100%" fill="url(#x)" mask="url(#m)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).resize(w, h).extractChannel("alpha").toBuffer();
}

/** Кадр W×H: продолженный крафт + фото высотой ph в точке (cx — центр по горизонтали, py — верх). */
async function compose(photo, tone, W, H, { ph, cx, py, feather }) {
  const meta = await photo.metadata();
  const pw = Math.round((meta.width / meta.height) * ph);
  // Фон — только из крафтовых краёв снимка (левая и правая полосы по 5%), растянутых на кадр:
  // так сохраняется студийный свет сверху вниз, но в фон не попадают «призраки» самого товара.
  const strip = Math.round(meta.width * 0.05);
  const half = Math.ceil(W / 2);
  const side = async (left) =>
    photo
      .clone()
      .extract({ left, top: 0, width: strip, height: meta.height })
      .resize(half, H, { fit: "fill" })
      .toBuffer();
  const edges = await sharp({ create: { width: W, height: H, channels: 3, background: { r: tone[0], g: tone[1], b: tone[2] } } })
    .composite([
      { input: await side(0), left: 0, top: 0 },
      { input: await side(meta.width - strip), left: W - half, top: 0 },
    ])
    .png()
    .toBuffer();
  const bg = await sharp(edges)
    .blur(Math.max(W, H) / 30)
    .composite([
      { input: { create: { width: W, height: H, channels: 4, background: { r: tone[0], g: tone[1], b: tone[2], alpha: 0.25 } } } },
      { input: await grain(W, H), blend: "soft-light" },
    ])
    .toBuffer();
  const body = await photo.clone().resize(pw, ph).removeAlpha().toBuffer();
  const mask = await featherMask(pw, ph, feather);
  const cut = await sharp(body).joinChannel(mask).png().toBuffer();
  const left = Math.round(cx - pw / 2);
  // Часть фото может выйти за кадр — обрезаем, чтобы composite не ругался.
  const sx = Math.max(0, -left);
  const sy = Math.max(0, -py);
  const vw = Math.min(pw - sx, W - Math.max(0, left));
  const vh = Math.min(ph - sy, H - Math.max(0, py));
  const visible = await sharp(cut).extract({ left: sx, top: sy, width: vw, height: vh }).toBuffer();
  // Сводим слои в буфер: иначе resize в цепочке применится до composite.
  const flat = await sharp(bg).composite([{ input: visible, left: Math.max(0, left), top: Math.max(0, py) }]).png().toBuffer();
  return sharp(flat);
}

await fs.mkdir(OUT, { recursive: true });
const manifest = [];
for (const w of WALLPAPERS) {
  process.stdout.write(`${w.id}… `);
  const res = await fetch(w.src);
  if (!res.ok) throw new Error(`${w.src}: ${res.status}`);
  const photo = sharp(Buffer.from(await res.arrayBuffer())).rotate();
  const { width, height } = await photo.metadata();
  const strip = Math.round(width * 0.06);
  const l = await meanColor(photo, { left: 0, top: Math.round(height * 0.3), width: strip, height: Math.round(height * 0.4) });
  const r = await meanColor(photo, { left: width - strip, top: Math.round(height * 0.3), width: strip, height: Math.round(height * 0.4) });
  const tone = l.map((v, i) => Math.round((v + r[i]) / 2));

  // Десктоп 16:9: фото справа, слева — продолженный крафт под заголовок.
  const W = 2560, H = 1440;
  const desk = await compose(photo, tone, W, H, { ph: Math.round(H * 0.94), cx: W * 0.72, py: Math.round(H * 0.04), feather: { left: 0.24, right: 0.2, top: 0.12, bottom: 0.1 } });
  await desk.clone().webp({ quality: 80 }).toFile(path.join(OUT, `${w.id}-2560.webp`));
  await desk.clone().resize(1600, 900).webp({ quality: 80 }).toFile(path.join(OUT, `${w.id}-1600.webp`));
  await desk.clone().resize(400, 225).webp({ quality: 70 }).toFile(path.join(OUT, `${w.id}-thumb.webp`));
  if (manifest.length === 0)
    await desk.clone().resize(1200, 630, { fit: "cover", position: "right" }).jpeg({ quality: 82 }).toFile(path.resolve("public/og.jpg"));

  // Телефон 9:16: фото снизу, сверху — продолженный крафт под заголовок.
  const MW = 1080, MH = 1920;
  const mob = await compose(photo, tone, MW, MH, { ph: Math.round(MW * 0.96 * (height / width)), cx: MW / 2, py: Math.round(MH * 0.37), feather: { left: 0.08, right: 0.08, top: 0.2, bottom: 0.04 } });
  await mob.webp({ quality: 78 }).toFile(path.join(OUT, `${w.id}-mobile.webp`));

  manifest.push({
    id: w.id,
    uid: w.uid,
    name: w.name,
    alt: w.alt,
    tone: hex(tone),
    desktop: `/hero/${w.id}-2560.webp`,
    desktopSmall: `/hero/${w.id}-1600.webp`,
    mobile: `/hero/${w.id}-mobile.webp`,
    thumb: `/hero/${w.id}-thumb.webp`,
  });
  console.log(hex(tone));
}
await fs.writeFile(path.join(OUT, "wallpapers.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Готово: ${manifest.length} обоев в ${OUT}`);
