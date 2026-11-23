"""Prepare separate authentic product and environment layers for the hero.

No generated product pixels. Uses the reviewed source URLs, hashes and masks.
Run with Pillow, numpy and OpenCV available (design tooling only).
"""
import hashlib
import io
import json
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/design/paper-hero'
OUT = ROOT / 'public/hero'
CAT = ROOT / 'docs/design/wallpapers'
LIFE = ROOT / 'docs/design/lifestyle-hero'
products = json.loads((CAT / 'sources.json').read_text())['products']
products.update(json.loads((DOC / 'product-overrides.json').read_text()))
sources = json.loads((DOC / 'source-manifest.json').read_text())
mapping = {
    'lifestyle-desk': ('zolotoe-vremya', LIFE / 'environments/art-desk', 'table'),
    'lifestyle-gallery': ('vazhnaya-ptitsa', LIFE / 'environments/gallery-stand', 'stand'),
    'premium-coaching': ('botanika', ROOT / 'docs/design/premium-business/environments/coaching', 'table'),
    'premium-academy': ('vesna', ROOT / 'docs/design/premium-business/environments/academy', 'table'),
    'premium-city-night': ('krasnye-koni', ROOT / 'docs/design/premium-business/environments/city-night', 'table'),
}

def encode(im, filename, size, limit, alpha=False):
    im = im.resize(size, Image.Resampling.LANCZOS).convert('RGBA' if alpha else 'RGB')
    for quality in range(92 if alpha else 84, 43, -3):
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=quality, method=6, exact=alpha)
        if buf.tell() <= limit:
            (OUT / filename).write_bytes(buf.getvalue())
            return {'file': filename, 'width': size[0], 'height': size[1], 'bytes': buf.tell(), 'quality': quality}
    raise RuntimeError('Asset budget: '+filename)

manifest = []; report = []; photo_sources = {}
for scene in sources:
    if scene['id'] not in mapping: continue  # The complete writing/hand scene is removed.
    key, env, pose = mapping[scene['id']]; source = products[key]
    data = urllib.request.urlopen(source['url'], timeout=30).read()
    assert hashlib.sha256(data).hexdigest() == source['sha256'], 'Changed catalogue image'
    photo = Image.open(io.BytesIO(data)).convert('RGBA')
    maskpath = ROOT / source['maskPath'] if source.get('maskPath') else LIFE / 'masks/gold-lying.png' if key == 'zolotoe-vremya' else CAT / 'masks' / source['mask']
    mask = Image.open(maskpath).convert('L')
    # Remove only detached background fragments; the complete cover and discs remain.
    _, labels, stats, _ = cv2.connectedComponentsWithStats((np.array(mask) > 127).astype(np.uint8))
    keep = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    values = np.array(mask); values[labels != keep] = 0
    if key == 'zolotoe-vremya':
        # The refill pack under the real book is not part of the product silhouette.
        # Trace the photographed lower cover edge; do not retain the pack/fragments.
        yy, xx = np.indices(values.shape)
        values[yy > 1790.5 - .3615 * xx] = 0
    mask = Image.fromarray(values).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.35))
    photo.putalpha(mask); photo = photo.crop(mask.getbbox())
    photo.thumbnail((1100, 1100), Image.Resampling.LANCZOS)
    padded = Image.new('RGBA', (photo.width+32, photo.height+32)); padded.alpha_composite(photo, (16,16))
    prefix = 'paper-'+scene['id']
    product_name = prefix+'-product.webp'
    report.append(encode(padded, product_name, padded.size, 170000, alpha=True))
    bg = Image.open(str(env)+'-desktop.webp').convert('RGB')
    mobile = Image.open(str(env)+'-mobile.webp').convert('RGB')
    names = dict(desktop=prefix+'-2048.webp', desktopSmall=prefix+'-1600.webp', mobile=prefix+'-mobile.webp', thumb=prefix+'-thumb.webp')
    report.append(encode(bg, names['desktop'], (2048,1152), 350000))
    report.append(encode(bg, names['desktopSmall'], (1600,900), 200000 if not manifest else 350000))
    report.append(encode(mobile, names['mobile'], (900,1600), 145000 if not manifest else 220000))
    thumb = bg.resize((400,225)).convert('RGBA')
    small = padded.copy(); small.thumbnail((178, 142 if pose == 'stand' else 176), Image.Resampling.LANCZOS)
    thumb.alpha_composite(small, (round(310-small.width/2), round((.69 if pose=='stand' else .91)*225-small.height)))
    report.append(encode(thumb, names['thumb'], (400,225), 35000))
    manifest.append({k:scene[k] for k in ['id','uid','name','alt','tone']} | {k:'/hero/'+v for k,v in names.items()} | {'product':'/hero/'+product_name,'pose':pose})
    photo_sources[key] = {k:source[k] for k in ['uid','name','url','sha256']} | {'mask':str(maskpath.relative_to(ROOT))}
    print(scene['id'])
(OUT / 'wallpapers.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(DOC / 'asset-check.json').write_text(json.dumps(report, indent=2)+'\n')
(DOC / 'sources.json').write_text(json.dumps(photo_sources, ensure_ascii=False, indent=2)+'\n')
