"""Rectify authentic catalogue cover photos; never generate or redraw artwork.

Requires Pillow, numpy and OpenCV in a design-tools environment. Runtime has
no new dependencies. Source URL, SHA256 and reviewed corners are recorded.
"""
import hashlib, io, json, urllib.request
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageOps, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
DOC=ROOT/'docs/design/constructor-details'
OUT=ROOT/'public/constructor-assets/covers'
OUT.mkdir(parents=True,exist_ok=True)
manifest={};report=[];thumbs=[]
for source in json.loads((DOC/'sources.json').read_text()):
 entry={k:source[k] for k in ['binding','discs','accessory'] if k in source}
 for face,spec in source['faces'].items():
  cache=ROOT/'output/constructor-refresh/cache'/spec['sha256']
  if cache.exists(): data=cache.read_bytes()
  else:
   data=urllib.request.urlopen(spec['url'],timeout=30).read()
   cache.parent.mkdir(parents=True,exist_ok=True);cache.write_bytes(data)
  assert hashlib.sha256(data).hexdigest()==spec['sha256'],spec['url']
  im=Image.open(io.BytesIO(data)).convert('RGB')
  quad=np.float32(spec['quad'])*np.float32([im.width,im.height])
  target=np.float32([[0,0],[839,0],[839,1139],[0,1139]])
  matrix=cv2.getPerspectiveTransform(quad,target)
  result=Image.fromarray(cv2.warpPerspective(np.array(im),matrix,(840,1140),flags=cv2.INTER_CUBIC))
  path=OUT/spec['filename'];result.save(path,'WEBP',quality=86,method=6)
  entry[face]='/constructor-assets/covers/'+spec['filename']
  report.append({'uid':source['uid'],'face':face,'file':str(path.relative_to(ROOT)),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
  thumbs.append((source['uid']+' '+face,result))
 manifest[source['catalogueImage']]=entry
(ROOT/'src/components/constructor/cover-artwork.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(DOC/'asset-check.json').write_text(json.dumps(report,indent=2)+'\n')
sheet=Image.new('RGB',(1200,230*((len(thumbs)+7)//8)),'#eee6d8');d=ImageDraw.Draw(sheet)
for i,(name,im) in enumerate(thumbs):
 thumb=ImageOps.contain(im,(140,195));x=i%8*150;y=i//8*230
 sheet.paste(thumb,(x,y));d.text((x,y+198),name,fill='black')
sheet.save(DOC/'artwork-contact.jpg',quality=85)
print(f'{len(manifest)} products / {len(report)} textures / {sum(r["bytes"] for r in report)} bytes')

disc_manifest={};disc_report=[]
disc_out=ROOT/'public/constructor-assets/discs';disc_out.mkdir(parents=True,exist_ok=True)
for source in json.loads((DOC/'disc-sources.json').read_text()):
 cache=ROOT/'output/constructor-refresh/cache'/source['sha256']
 data=cache.read_bytes() if cache.exists() else urllib.request.urlopen(source['url'],timeout=30).read()
 assert hashlib.sha256(data).hexdigest()==source['sha256']
 im=Image.open(io.BytesIO(data)).convert('RGB');im.thumbnail((480,640),Image.Resampling.LANCZOS)
 path=disc_out/source['filename'];im.save(path,'WEBP',quality=84,method=6)
 disc_manifest[source['url']]='/constructor-assets/discs/'+source['filename']
 disc_report.append({'uid':source['uid'],'file':str(path.relative_to(ROOT)),'bytes':path.stat().st_size})
(ROOT/'src/components/constructor/disc-photos.json').write_text(json.dumps(disc_manifest,indent=2)+'\n')
(DOC/'disc-asset-check.json').write_text(json.dumps(disc_report,indent=2)+'\n')
print(f'{len(disc_report)} authentic disc photographs / {sum(r["bytes"] for r in disc_report)} bytes')
