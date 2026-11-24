"""Prepare small, genuine catalogue photos without changing product content.

Sources and hashes are reviewed in docs/design/constructor-carousels.
Requires Pillow only; the site gains no runtime dependency.
"""
import hashlib, io, json, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/design/constructor-carousels'
OUT = ROOT / 'public/constructor-assets/accessories'
OUT.mkdir(parents=True, exist_ok=True)
manifest = {}; report = []
for source in json.loads((DOC / 'accessory-sources.json').read_text()):
    cache = ROOT / 'output/constructor-refresh/cache' / source['sha256']
    data = cache.read_bytes() if cache.exists() else urllib.request.urlopen(source['url'], timeout=30).read()
    assert hashlib.sha256(data).hexdigest() == source['sha256'], source['url']
    im = Image.open(io.BytesIO(data)).convert('RGB')
    im.thumbnail((480, 640), Image.Resampling.LANCZOS)
    path = OUT / (source['uid'] + '.webp')
    im.save(path, 'WEBP', quality=85, method=6)
    manifest[source['url']] = '/constructor-assets/accessories/' + path.name
    report.append({'uid': source['uid'], 'file': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size})
(ROOT / 'src/components/constructor/accessory-photos.json').write_text(json.dumps(manifest, indent=2) + '\n')
(DOC / 'accessory-asset-check.json').write_text(json.dumps(report, indent=2) + '\n')
print(len(report), 'authentic photographs;', sum(item['bytes'] for item in report), 'bytes')
