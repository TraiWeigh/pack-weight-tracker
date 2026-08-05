#!/usr/bin/env python3
"""
ocr_service/image_ocr.py

Called by the TrailWeigh API server (Node.js) as a subprocess.

Usage:
  python3 ocr_service/image_ocr.py <absolute-path-to-image>

Protocol:
  stdout — JSON: {"success": true,  "text": "...", "selected_psm": 6}
               or  {"success": false, "error": "human-readable message"}
  stderr — development diagnostics (never shown to end users)
  exit 0 — always (caller inspects the JSON success flag)
"""
import sys
import os
import json
import shutil

# ── 1. Locate Tesseract and set TESSDATA_PREFIX ───────────────────────────────
tess_bin = shutil.which("tesseract")
if not tess_bin:
    print(json.dumps({"success": False, "error": "Tesseract binary not found in PATH"}))
    sys.exit(0)

tess_real = os.path.realpath(tess_bin)
tess_root = os.path.dirname(os.path.dirname(tess_real))
tessdata_dir = os.path.join(tess_root, "share", "tessdata")
if os.path.isdir(tessdata_dir):
    os.environ["TESSDATA_PREFIX"] = tessdata_dir
    print(f"[ocr] TESSDATA_PREFIX={tessdata_dir}", file=sys.stderr)
else:
    print(f"[ocr] WARNING: tessdata dir not found at {tessdata_dir}", file=sys.stderr)

# ── 2. Import Python dependencies ─────────────────────────────────────────────
try:
    from PIL import Image, ImageOps, ImageFilter
except ImportError as e:
    print(json.dumps({"success": False, "error": f"Pillow not installed: {e}"}))
    sys.exit(0)

try:
    import pytesseract
except ImportError as e:
    print(json.dumps({"success": False, "error": f"pytesseract not installed: {e}"}))
    sys.exit(0)

# ── 3. Resolve image path from argv ──────────────────────────────────────────
if len(sys.argv) < 2:
    print(json.dumps({"success": False, "error": "No image path provided (usage: image_ocr.py <path>)"}))
    sys.exit(0)

img_path = sys.argv[1]
print(f"[ocr] reading image from {img_path}", file=sys.stderr)

if not os.path.exists(img_path):
    print(json.dumps({"success": False, "error": f"Image file not found: {img_path}"}))
    sys.exit(0)

file_size = os.path.getsize(img_path)
print(f"[ocr] file size = {file_size} bytes", file=sys.stderr)
if file_size == 0:
    print(json.dumps({"success": False, "error": "Image file is empty"}))
    sys.exit(0)

# ── 4. Open and validate image ────────────────────────────────────────────────
try:
    # verify() checks for corruption; re-open because verify() exhausts the file stream
    with Image.open(img_path) as probe:
        probe.verify()
    img = Image.open(img_path)
    img.load()  # force-decode into memory
except Exception as e:
    print(json.dumps({"success": False, "error": f"Cannot open image: {e}"}))
    sys.exit(0)

print(f"[ocr] mode={img.mode} size={img.size}", file=sys.stderr)
print(f"[ocr] decoded image dimensions: {img.size[0]}x{img.size[1]}", file=sys.stderr)

# ── 5. Correct EXIF orientation (handles rotated phone photos) ────────────────
try:
    img = ImageOps.exif_transpose(img)
except Exception:
    pass

# ── 6. Composite onto white background ───────────────────────────────────────
#     (transparent regions confuse Tesseract — it reads them as black blobs)
def to_white_rgb(src: Image.Image) -> Image.Image:
    if src.mode in ('RGBA', 'LA'):
        bg = Image.new('RGB', src.size, (255, 255, 255))
        if src.mode == 'RGBA':
            bg.paste(src, mask=src.split()[3])
        else:
            bg.paste(src, mask=src.split()[1])
        return bg
    elif src.mode == 'P':
        src = src.convert('RGBA')
        bg = Image.new('RGB', src.size, (255, 255, 255))
        bg.paste(src, mask=src.split()[3])
        return bg
    elif src.mode != 'RGB':
        return src.convert('RGB')
    return src.copy()

img = to_white_rgb(img)

# ── 7. Upscale for better OCR on small / cropped images ──────────────────────
#     Use 2× for medium, 3× for very small; cap at MAX_LONG on the long side.
w, h = img.size
short_side = min(w, h)
long_side  = max(w, h)
MAX_LONG   = 4000

if short_side < 400:
    factor = 3
elif short_side < 900:
    factor = 2
else:
    factor = 1

if factor > 1 and long_side * factor > MAX_LONG:
    factor = max(1, MAX_LONG // long_side)

if factor > 1:
    new_w = w * factor
    new_h = h * factor
    img = img.resize((new_w, new_h), Image.LANCZOS)
    print(f"[ocr] upscaled {factor}× to {new_w}x{new_h}", file=sys.stderr)
elif long_side > MAX_LONG:
    scale = MAX_LONG / long_side
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    print(f"[ocr] downscaled to {new_w}x{new_h}", file=sys.stderr)

# ── 8. Build preprocessing variants ──────────────────────────────────────────
#     Limited set per spec: RGB autocontrast, grayscale sharpen, high-contrast B&W.
#     All returned as RGB so pytesseract receives a consistent format.

def make_variants(base: Image.Image):
    """Return up to 3 distinct preprocessed images + names."""
    variants = []

    # V1 — RGB with autocontrast (works well for colour screenshots)
    v1 = ImageOps.autocontrast(base, cutoff=1)
    variants.append(('rgb-ac', v1))

    # V2 — Grayscale with autocontrast + sharpening (improves faint table text)
    gray = ImageOps.grayscale(base)
    gray_ac = ImageOps.autocontrast(gray, cutoff=2)
    gray_sharp = gray_ac.filter(ImageFilter.UnsharpMask(radius=1.5, percent=200, threshold=2))
    variants.append(('gray-sharp', gray_sharp.convert('RGB')))

    # V3 — High-contrast B&W (helpful when background/foreground contrast is low)
    gray2_ac = ImageOps.autocontrast(ImageOps.grayscale(base), cutoff=0)
    bw = gray2_ac.point(lambda p: 255 if p > 145 else 0, '1').convert('RGB')
    variants.append(('bw', bw))

    return variants

variants = make_variants(img)

# ── 9. OCR ────────────────────────────────────────────────────────────────────
CFG_PSM6  = "--oem 3 --psm 6 -c preserve_interword_spaces=1"
CFG_PSM11 = "--oem 3 --psm 11 -c preserve_interword_spaces=1"

def _score(text: str) -> int:
    """
    Quality score for OCR output.
    Gear lists have numbers (weights), item names, and unit words.
    Digits are weighted more heavily since weight values are the key signal.
    """
    s = text.replace(' ', '').replace('\n', '').replace('\t', '')
    if not s:
        return 0
    digits = sum(1 for c in s if c.isdigit())
    alpha  = sum(1 for c in s if c.isalpha())
    return alpha + digits * 3

best_text    = ""
best_score   = 0
selected_psm = 6

# psm6 on each variant (3 runs)
for vname, variant in variants:
    try:
        t = pytesseract.image_to_string(variant, config=CFG_PSM6).strip()
        sc = _score(t)
        print(f"[ocr] {vname}/psm6: {len(t)} chars  score={sc}", file=sys.stderr)
        if sc > best_score:
            best_text  = t
            best_score = sc
            selected_psm = 6
    except pytesseract.TesseractNotFoundError as e:
        print(json.dumps({"success": False, "error": f"Tesseract not found: {e}"}))
        sys.exit(0)
    except Exception as e:
        print(f"[ocr] {vname}/psm6 failed: {e}", file=sys.stderr)

# psm11 on the primary variant only (1 additional run)
try:
    t11 = pytesseract.image_to_string(variants[0][1], config=CFG_PSM11).strip()
    sc11 = _score(t11)
    print(f"[ocr] rgb-ac/psm11: {len(t11)} chars  score={sc11}", file=sys.stderr)
    if sc11 > best_score:
        best_text    = t11
        best_score   = sc11
        selected_psm = 11
except Exception as e:
    print(f"[ocr] psm11 failed: {e}", file=sys.stderr)

text = best_text
print(f"[ocr] final text: {len(text)} chars, psm={selected_psm}  score={best_score}", file=sys.stderr)
if text:
    print(f"[ocr] first 120: {repr(text[:120])}", file=sys.stderr)

# ── 10. Light post-processing ──────────────────────────────────────────────────
import re
text = re.sub(r'[ \t]+', ' ', text)
text = re.sub(r' +\n', '\n', text)
text = re.sub(r'\n{3,}', '\n\n', text)

# ── 11. Output JSON result ────────────────────────────────────────────────────
print(json.dumps({"success": True, "text": text, "selected_psm": selected_psm}))
