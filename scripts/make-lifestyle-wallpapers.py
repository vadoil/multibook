"""Reproduce lifestyle composites without synthesising any product pixels.

Requires Pillow, numpy and OpenCV, used only at design/build time.
Generated environments/hand are separate layers; catalogue photo hashes checked.
"""
import hashlib
import json
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / 'docs/design/lifestyle-hero'
OUT = ROOT / 'public/hero'

def original(spec):
    data = urllib.request.urlopen(spec['url'], timeout=30).read()
    assert hashlib.sha256(data).hexdigest() == spec['sha256'], 'Changed catalogue source'
    import io
    return Image.open(io.BytesIO(data)).convert('RGB')

def masked(spec):
    im = original(spec)
    alpha = Image.open(DOC / 'masks' / spec['mask']).convert('L')
    im = im.convert('RGBA'); im.putalpha(alpha)
    return im.crop(alpha.getbbox())

def composite_shadow(bg, layer, offset=(8, 16), blur=14, opacity=.28):
    alpha = layer.getchannel('A').filter(ImageFilter.GaussianBlur(blur)).point(lambda p: round(p * opacity))
    shadow = Image.new('RGBA', bg.size, '#21120b'); shadow.putalpha(alpha)
    bg.alpha_composite(shadow, offset)
    bg.alpha_composite(layer)

def project(photo, size, corners):
    src = np.array([[0, 0], [photo.width, 0], [photo.width, photo.height], [0, photo.height]], np.float32)
    matrix = cv2.getPerspectiveTransform(src, np.array(corners, np.float32))
    # Premultiplied colour prevents dark halos on antialiased product edges.
    rgba = np.asarray(photo).astype(np.float32) / 255
    rgba[:, :, :3] *= rgba[:, :, 3:4]
    warped = cv2.warpPerspective(rgba, matrix, size, flags=cv2.INTER_CUBIC)
    warped[:, :, :3] = np.divide(warped[:, :, :3], warped[:, :, 3:4], out=np.zeros_like(warped[:, :, :3]), where=warped[:, :, 3:4] > .001)
    return Image.fromarray(np.uint8(np.clip(warped, 0, 1) * 255), 'RGBA')

def encode(im, name, size, limit):
    import io
    im = im.convert('RGB').resize(size, Image.Resampling.LANCZOS)
    for quality in range(85, 54, -3):
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=quality, method=6)
        if buf.tell() <= limit:
            (OUT / name).write_bytes(buf.getvalue())
            return {'file': name, 'bytes': buf.tell(), 'width': size[0], 'height': size[1], 'quality': quality}
    raise RuntimeError('Asset budget exceeded: ' + name)

def compose(scene, mobile, sources):
    w, h = (1080, 1920) if mobile else (2560, 1440)
    suffix = 'mobile' if mobile else 'desktop'
    bg = Image.open(DOC / 'environments' / f"{scene['environment']}-{suffix}.webp").convert('RGBA').resize((w, h), Image.Resampling.LANCZOS)
    photo = masked(sources[scene['photo']])
    if scene['pose'] == 'desk':
        # Use a genuine lying product angle, including real thickness and pen.
        ph = round(h * (.39 if mobile else .48)); pw = round(photo.width * ph / photo.height)
        photo = photo.resize((pw, ph), Image.Resampling.LANCZOS)
        left, top = round(w * (.55 if mobile else .755) - pw/2), round(h * (.40 if mobile else .31))
        layer = Image.new('RGBA', (w, h)); layer.alpha_composite(photo, (left, top))
        composite_shadow(bg, layer, blur=10)
    elif scene['pose'] == 'stand':
        ph = round(h * (.32 if mobile else .48)); pw = round(photo.width * ph / photo.height)
        photo = photo.resize((pw, ph), Image.Resampling.LANCZOS)
        left, top = (round(w * (.55 if mobile else .73) - pw / 2), round(h * (.675 if mobile else .69) - ph))
        layer = Image.new('RGBA', (w, h)); layer.alpha_composite(photo, (left, top))
        # Only a contact shadow on the marble top, never a silhouette on the room.
        contact = Image.new('RGBA', (w, h)); from PIL import ImageDraw
        ImageDraw.Draw(contact).ellipse((left-4, top+ph-10, left+pw+12, top+ph+14), fill=(25, 16, 9, 90))
        bg.alpha_composite(contact.filter(ImageFilter.GaussianBlur(10))); bg.alpha_composite(layer)
    else:
        # Real open book extends past right/bottom of this close-up composition.
        corners = [(240, 870), (1210, 870), (1210, 2050), (240, 2050)] if mobile else [(1450, 460), (2700, 460), (2700, 1900), (1450, 1900)]
        composite_shadow(bg, project(photo, (w, h), corners), blur=12)
        hand = Image.open(DOC / 'environments/writing-hand.png').convert('RGBA')
        hw = round(w * (.82 if mobile else .42)); hh = round(hand.height * hw / hand.width)
        hand = hand.resize((hw, hh), Image.Resampling.LANCZOS)
        # Original hand nib is at (.20w, .91h); keep it on the real white page.
        pen = (round(w*.66), round(h*.625)) if mobile else (round(w*.80), round(h*.64))
        layer = Image.new('RGBA', (w, h)); layer.alpha_composite(hand, (pen[0]-round(hw*.20), pen[1]-round(hh*.91)))
        composite_shadow(bg, layer, offset=(3, 9), blur=8, opacity=.20)
    return bg

def main():
    sources = json.loads((DOC / 'sources.json').read_text())
    scenes = json.loads((DOC / 'scenes.json').read_text())
    manifest = []; report = []
    for i, scene in enumerate(scenes):
        desktop = compose(scene, False, sources); mobile = compose(scene, True, sources)
        name = scene['id']; names = dict(desktop=f'{name}-2048.webp', desktopSmall=f'{name}-1600.webp', mobile=f'{name}-mobile.webp', thumb=f'{name}-thumb.webp')
        limit = 200000 if i == 0 else 350000
        report.append(encode(desktop, names['desktop'], (2048,1152), 350000))
        report.append(encode(desktop, names['desktopSmall'], (1600,900), limit))
        report.append(encode(mobile, names['mobile'], (1080,1920), limit))
        report.append(encode(desktop, names['thumb'], (400,225), 35000))
        manifest.append({k:scene[k] for k in ['id','uid','name','alt','tone']} | {k:'/hero/'+v for k,v in names.items()})
        print(name)
    # Three recognisable business environments complement the new photographic poses.
    previous = json.loads((DOC / 'previous-manifest.json').read_text())
    manifest += [s for s in previous if s['id'] in ['premium-coaching','premium-city-night','premium-academy']]
    (OUT / 'wallpapers.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    (DOC / 'asset-check.json').write_text(json.dumps(report, indent=2)+'\n')

if __name__ == '__main__': main()
