// Built-in image_gen produced only the interiors, never a product.
// Rebuild authentic catalogue composites: node scripts/make-premium-wallpapers.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";

const sourceDir = "docs/design/premium-business";
const catalogueDir = "docs/design/wallpapers";
const { products } = JSON.parse(await fs.readFile(path.join(catalogueDir, "sources.json"), "utf8"));
const scenes = JSON.parse(await fs.readFile(path.join(sourceDir, "scenes.json"), "utf8"));
const out = "public/hero";
const cutouts = new Map();
for (const id of new Set(scenes.map((s) => s.product))) {
  const p = products[id];
  const response = await fetch(p.url);
  if (!response.ok) throw new Error(`${p.url}: ${response.status}`);
  const original = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(original).digest("hex") !== p.sha256) throw new Error(`Review changed original: ${id}`);
  const mask = await sharp(path.join(catalogueDir, "masks", p.mask)).extract(p.crop).toColourspace("b-w").raw().toBuffer();
  const rgb = await sharp(original).extract(p.crop).removeAlpha().png().toBuffer();
  cutouts.set(id, await sharp(rgb).joinChannel(mask, { raw: { width: p.crop.width, height: p.crop.height, channels: 1 } }).png().toBuffer());
}

async function compose(environment, product, mobile) {
  const width = mobile ? 1080 : 2560, height = mobile ? 1920 : 1440;
  const bg = await sharp(environment).resize(width, height, { fit: "cover" }).blur(0.5).png().toBuffer();
  const body = await sharp(product).resize({ height: Math.round(height * (mobile ? 0.34 : 0.58)) }).png().toBuffer();
  const { width: pw, height: ph } = await sharp(body).metadata();
  const left = Math.round(width * (mobile ? 0.61 : 0.77) - pw / 2);
  const top = Math.round(height * (mobile ? 0.45 : 0.27));
  // A flattened shadow on the table anchors the real upright product without
  // casting its full silhouette onto the distant skyline or office background.
  const sh = Math.round(ph * 0.12);
  const silhouette = await sharp(body).extractChannel(3).toColourspace("b-w").raw().toBuffer();
  const alpha = await sharp(silhouette, { raw: { width: pw, height: ph, channels: 1 } })
    .resize(pw, sh).blur(12).linear(0.24).toColourspace("b-w").raw().toBuffer();
  const shadow = await sharp({ create: { width: pw, height: sh, channels: 3, background: "#291b13" } })
    .joinChannel(alpha, { raw: { width: pw, height: sh, channels: 1 } }).png().toBuffer();
  return sharp(bg).composite([
    { input: shadow, left: left + 10, top: top + ph - Math.round(sh * 0.5) },
    { input: body, left, top },
  ]).png().toBuffer();
}

async function webp(buffer, filename, width, height, limit) {
  for (let quality = 82; quality >= 55; quality -= 3) {
    const encoded = await sharp(buffer).resize(width, height).webp({ quality, effort: 6 }).toBuffer();
    if (encoded.length <= limit) {
      await fs.writeFile(path.join(out, filename), encoded);
      return { filename, width, height, bytes: encoded.length, quality };
    }
  }
  throw new Error(`Budget exceeded: ${filename}`);
}

await fs.mkdir(out, { recursive: true });
const manifest = [], report = [];
for (const [i, scene] of scenes.entries()) {
  const p = products[scene.product];
  const env = (type) => path.join(sourceDir, "environments", `${scene.environment}-${type}.webp`);
  const desktop = await compose(env("desktop"), cutouts.get(scene.product), false);
  const mobile = await compose(env("mobile"), cutouts.get(scene.product), true);
  const { channels } = await sharp(env("desktop")).resize(1, 1).stats();
  const tone = "#" + channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, "0")).join("");
  const names = { desktop: `${scene.id}-2560.webp`, desktopSmall: `${scene.id}-1600.webp`, mobile: `${scene.id}-mobile.webp`, thumb: `${scene.id}-thumb.webp` };
  report.push(await webp(desktop, names.desktop, 2560, 1440, i ? 350000 : 200000));
  report.push(await webp(desktop, names.desktopSmall, 1600, 900, i ? 350000 : 200000));
  report.push(await webp(mobile, names.mobile, 1080, 1920, i ? 350000 : 200000));
  report.push(await webp(desktop, names.thumb, 400, 225, 35000));
  manifest.push({ id: scene.id, uid: p.uid, name: p.name, alt: scene.alt, tone,
    ...Object.fromEntries(Object.entries(names).map(([key, filename]) => [key, `/hero/${filename}`])) });
  console.log(scene.id);
}
await fs.writeFile(path.join(out, "wallpapers.json"), JSON.stringify(manifest, null, 2) + "\n");
await fs.writeFile(path.join(sourceDir, "asset-check.json"), JSON.stringify(report, null, 2) + "\n");
