"""Compress the original Multibook instructions without changing their artwork."""
from pathlib import Path
import hashlib, json, urllib.request
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/design/how-it-works'
OUT = ROOT / 'public/guides'
OUT.mkdir(parents=True, exist_ok=True)
report = []
for source in json.loads((DOC / 'sources.json').read_text()):
    cached = ROOT / 'output/how-it-works' / source['url'].rsplit('/', 1)[1]
    if not cached.exists():
        cached.parent.mkdir(parents=True, exist_ok=True)
        cached.write_bytes(urllib.request.urlopen(source['url'], timeout=30).read())
    assert hashlib.sha256(cached.read_bytes()).hexdigest() == source['sha256']
    image = Image.open(cached).convert('RGB')
    image.thumbnail((1680, 1000), Image.Resampling.LANCZOS)
    target = OUT / source['file']
    image.save(target, 'WEBP', quality=91, method=6)
    report.append({'file': str(target.relative_to(ROOT)), 'width': image.width, 'height': image.height, 'bytes': target.stat().st_size})
(DOC / 'asset-check.json').write_text(json.dumps(report, indent=2) + '\n')
print(len(report), 'original images;', sum(x['bytes'] for x in report), 'bytes')
