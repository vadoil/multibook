// Authentic catalogue pixels + explicit foreground masks + generated surroundings.
// Rebuild: node scripts/make-editorial-wallpapers.mjs
// Requires internet for the original catalogue photographs. No model redraws a product.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const sources = JSON.parse(await fs.readFile("docs/design/wallpapers/sources.json", "utf8"));
const sourceDir = "docs/design/wallpapers";
const out = "public/hero";
await fs.mkdir(out, { recursive: true });
const products = new Map();
for (const [id, p] of Object.entries(sources.products)) {
  const response = await fetch(p.url);
  if (!response.ok) throw new Error(`${p.url}: ${response.status}`);
  const original = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(original).digest("hex") !== p.sha256)
    throw new Error(`Catalogue photograph changed: ${id}; review its mask before rebuilding.`);
  const mask = await sharp(path.join(sourceDir, "masks", p.mask)).extract(p.crop).toColourspace("b-w").raw().toBuffer();
  const rgb = await sharp(original).extract(p.crop).removeAlpha().png().toBuffer();
  const cutout = await sharp(rgb).joinChannel(mask, { raw: { width: p.crop.width, height: p.crop.height, channels: 1 } }).png().toBuffer();
  products.set(id, cutout);
}

async function compose(environment, product, mobile) {
  const width = mobile ? 1080 : 2560;
  const height = mobile ? 1920 : 1440;
  const background = await sharp(environment)
    .resize(width, height, { fit: "cover", position: mobile ? "right" : "centre" })
    .blur(0.65).png().toBuffer();
  const body = await sharp(product).resize({ height: Math.round(height * (mobile ? 0.40 : 0.70)) }).png().toBuffer();
  const { width: pw, height: ph } = await sharp(body).metadata();
  const left = Math.round(width * (mobile ? 0.53 : 0.755) - pw / 2);
  const top = Math.round(height * (mobile ? 0.43 : 0.12));
  const layer = await sharp({ create: { width, height, channels: 4, background: "#00000000" } })
    .composite([{ input: body, left, top }]).png().toBuffer();
  // Contact and broad cast shadows derive only from the original product silhouette.
  const alpha = await sharp(layer).extractChannel(3).toColourspace("b-w").raw().toBuffer();
  const shadow = async (sigma, opacity) => sharp({ create: { width, height, channels: 3, background: "#21170f" } })
    .joinChannel(await sharp(alpha, { raw: { width, height, channels: 1 } }).blur(sigma).linear(opacity).toColourspace("b-w").raw().toBuffer(),
      { raw: { width, height, channels: 1 } }).png().toBuffer();
  const placeShadow = async (buffer, dx, dy) => sharp(buffer)
    .extract({ left: 0, top: 0, width: width - dx, height: height - dy }).png().toBuffer();
  return sharp(background).composite([
    { input: await placeShadow(await shadow(24, 0.30), 18, 22), left: 18, top: 22 },
    { input: await placeShadow(await shadow(3, 0.30), 3, 5), left: 3, top: 5 },
    { input: layer, left: 0, top: 0 },
  ]).png().toBuffer();
}

async function webp(buffer, filename, width, height, limit) {
  for (let quality = 82; quality >= 55; quality -= 3) {
    const image = await sharp(buffer).resize(width, height).webp({ quality, effort: 6 }).toBuffer();
    if (image.length <= limit) {
      await fs.writeFile(path.join(out, filename), image);
      return { filename, bytes: image.length, quality, width, height };
    }
  }
  throw new Error(`Image exceeds budget: ${filename}`);
}

const manifest = [], report = [];
for (const [i, scene] of sources.scenes.entries()) {
  const p = sources.products[scene.product];
  const environment = path.join(sourceDir, "environments", `${scene.environment}.webp`);
  const desktop = await compose(environment, products.get(scene.product), false);
  const mobile = await compose(environment, products.get(scene.product), true);
  const { channels } = await sharp(environment).resize(1, 1).stats();
  const tone = "#" + channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("");
  const names = { desktop: `${scene.id}-2560.webp`, desktopSmall: `${scene.id}-1600.webp`, mobile: `${scene.id}-mobile.webp`, thumb: `${scene.id}-thumb.webp` };
  report.push(await webp(desktop, names.desktop, 2560, 1440, i ? 350000 : 200000));
  report.push(await webp(desktop, names.desktopSmall, 1600, 900, i ? 350000 : 200000));
  report.push(await webp(mobile, names.mobile, 1080, 1920, i ? 350000 : 200000));
  report.push(await webp(desktop, names.thumb, 400, 225, 35000));
  manifest.push({ id: scene.id, uid: p.uid, name: p.name, alt: scene.alt, tone,
    ...Object.fromEntries(Object.entries(names).map(([key, name]) => [key, `/hero/${name}`])) });
  console.log(scene.id);
}
await fs.writeFile(path.join(out, "wallpapers.json"), JSON.stringify(manifest, null, 2) + "\n");
await fs.writeFile(path.join(sourceDir, "asset-check.json"), JSON.stringify(report, null, 2) + "\n");
