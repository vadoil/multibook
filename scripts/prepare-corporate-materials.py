"""Prepare authentic corporate portfolio photographs from the existing Tilda page."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib,json,urllib.request
ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/design/corporate-materials';OUT=ROOT/'public/corporate';OUT.mkdir(exist_ok=True)
titles=[
 'Обложка и фирменные страницы','Обложка с объёмной аппликацией','Страницы с разделителями','Два формата для одного бренда',
 'Оформление обложки','Сменные блоки страниц','Настольный блокнот','Деталь на обложке','Форма под задачу','Фирменная линовка страниц','Сочетание материалов','Обложка крупным планом','Подарочное оформление',
 'Обложка с аппликацией','Золото на тёмной обложке','Фотоальбом на дисках','Блокнот для конференции','Программа и фирменные страницы','Фирменный блокнот в упаковке','Полноцветная обложка','Печать на обложке','Линовка и наполнение','Свой сюжет на обложке','Листы на дисках','Прозрачная обложка']
photos=[];report=[]
for source in json.loads((DOC/'sources.json').read_text()):
 i=source['id'];raw=ROOT/'output/corporate-materials/raw'/f'{i:02}.jpg'
 if not raw.exists():
  raw.parent.mkdir(parents=True,exist_ok=True);raw.write_bytes(urllib.request.urlopen(source['url'],timeout=30).read())
 assert hashlib.sha256(raw.read_bytes()).hexdigest()==source['sha256']
 original=ImageOps.exif_transpose(Image.open(raw)).convert('RGB')
 for kind,size,quality in [('full',(1680,1260),86),('preview',(800,600),82)]:
  image=original.copy();image.thumbnail(size,Image.Resampling.LANCZOS)
  dest=OUT/f'{i:02}-{kind}.webp';image.save(dest,'WEBP',quality=quality,method=6)
  report.append({'file':str(dest.relative_to(ROOT)),'bytes':dest.stat().st_size,'width':image.width,'height':image.height})
 photos.append({'id':i,'group':source['group'],'title':titles[i],'src':f'/corporate/{i:02}-full.webp','preview':f'/corporate/{i:02}-preview.webp','width':next(r['width'] for r in report if r['file'].endswith(f'{i:02}-full.webp')),'height':next(r['height'] for r in report if r['file'].endswith(f'{i:02}-full.webp'))})
(ROOT/'src/components/corporate/photos.json').write_text(json.dumps(photos,ensure_ascii=False,indent=2)+'\n')
(DOC/'asset-check.json').write_text(json.dumps(report,indent=2)+'\n')
print(len(photos),'authentic photos;',sum(r['bytes'] for r in report),'bytes total; hero',next(r['bytes'] for r in report if r['file'].endswith('01-full.webp')),'bytes')
