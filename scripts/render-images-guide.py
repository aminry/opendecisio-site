#!/usr/bin/env python3
"""Builds the photographs of the Images guide's figures from two openly licensed originals.

  DECISIO_PHOTO_SOURCES=<folder holding parcel-original.jpg and mug-original.jpg> python3 scripts/render-images-guide.py

The originals are on Wikimedia Commons (their pages, authors, licences and sha256 are in public/media/images-guide/credits.json,
which this script reads and rewrites). The output is deterministic: the same originals give the same bytes.
Outputs, in public/media/images-guide/: mug.jpg and parcel.jpg (3:2), parcel-square.jpg, parcel-label.jpg, and
budget-<n>.jpg, the label of the parcel as a model reading the square at budget n sees it.
"""
import hashlib, json, os, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/media/images-guide'
SRC = Path(os.environ.get('DECISIO_PHOTO_SOURCES', ''))
credits = json.loads((OUT / 'credits.json').read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

def load(name):
    path = SRC / f'{name}-original.jpg'
    if sha(path) != credits['photos'][name]['sourceSha256']:
        sys.exit(f'{path} is not the original credits.json names')
    return Image.open(path).convert('RGB')

def save(im, name, q):
    im.save(OUT / name, 'JPEG', quality=q, optimize=True, progressive=True, subsampling=0)

parcel, mug = load('parcel'), load('mug')
save(mug.resize((1200, 800), Image.LANCZOS), 'mug.jpg', 84)
save(parcel.resize((1200, 800), Image.LANCZOS), 'parcel.jpg', 84)
# The square the budget figure reads: the parcel and its label, 1,900 pixels a side in the original.
sq = parcel.crop((917, 426, 917 + 1900, 426 + 1900))
save(sq.resize((480, 480), Image.LANCZOS), 'parcel-square.jpg', 86)
save(parcel.crop((1550, 880, 2450, 1480)).resize((480, 320), Image.LANCZOS), 'parcel-label.jpg', 86)

# What a model sees of the label at each budget: the square is scaled so that its area fills the budget and each side is cut
# to a multiple of 48 (docs/api.md, "What an image costs"); the label's region of that picture is shown at one size.
budgets = {70: 8, 140: 11, 280: 16, 560: 23, 1120: 33}
region = (0.395, 0.335, 0.575, 0.425)
for b, blocks in budgets.items():
    side = blocks * 48
    small = sq.resize((side, side), Image.LANCZOS)
    box = tuple(round(v * side) for v in (region[0], region[1], region[2], region[3]))
    crop = small.crop(box)
    crop = crop.resize((256, 128), Image.NEAREST if crop.width < 256 else Image.LANCZOS)
    save(crop, f'budget-{b}.jpg', 90)

# The box on the mug, as fractions of the 3:2 photograph (the teal pixels' bounding box, rounded to two decimals).
small = mug.resize((1200, 801), Image.LANCZOS)
a = np.asarray(small.convert('HSV')).astype(float)
h, s, v = a[..., 0] * 360 / 255, a[..., 1] / 255, a[..., 2] / 255
mask = (h > 160) & (h < 210) & (s > 0.22) & (v > 0.12)
lab, n = ndimage.label(ndimage.binary_closing(mask, iterations=6))
k = 1 + int(np.argmax(ndimage.sum(mask, lab, range(1, n + 1))))
ys, xs = np.where(lab == k)
box = {'top': round(float(ys.min()) / 801, 2), 'bottom': round(float(ys.max() + 1) / 801, 2), 'left': round(float(xs.min()) / 1200, 2), 'right': round(float(xs.max() + 1) / 1200, 2)}
credits['mugBox'] = box
credits['assets'] = {p.name: sha(p) for p in sorted(OUT.glob('*.jpg'))}
(OUT / 'credits.json').write_text(json.dumps(credits, indent=2) + '\n')
print('mug box', box)
for name, digest in credits['assets'].items():
    print(name, (OUT / name).stat().st_size, digest[:12])
