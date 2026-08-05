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

# ── 5. Preprocess ─────────────────────────────────────────────────────────────

# 5a. Correct EXIF orientation (handles rotated phone photos)
try:
    img = ImageOps.exif_transpose(img)
except Exception:
    pass

# 5b. Composite transparent images onto a solid white background
#     (transparent regions confuse Tesseract — it reads them as black blobs)
if img.mode in ('RGBA', 'LA'):
    bg = Image.new('RGB', img.size, (255, 255, 255))
    if img.mode == 'RGBA':
        bg.paste(img, mask=img.split()[3])   # alpha channel as mask
    else:
        bg.paste(img, mask=img.split()[1])   # LA: channel 1 is alpha
    img = bg
elif img.mode == 'P':
    # Palette mode — check for transparency
    img = img.convert('RGBA')
    bg = Image.new('RGB', img.size, (255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    img = bg
elif img.mode != 'RGB':
    img = img.convert('RGB')

# 5c. Resize: upscale small images for better OCR; cap very large ones
MIN_SHORT = 900
MAX_LONG  = 4000
w, h = img.size
short_side = min(w, h)
long_side  = max(w, h)

if short_side < MIN_SHORT:
    scale = MIN_SHORT / short_side
    if long_side * scale > MAX_LONG:
        scale = MAX_LONG / long_side
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    print(f"[ocr] upscaled to {new_w}x{new_h}", file=sys.stderr)
elif long_side > MAX_LONG:
    scale = MAX_LONG / long_side
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)
    print(f"[ocr] downscaled to {new_w}x{new_h}", file=sys.stderr)

# 5d. Auto-contrast (stretches histogram — improves faint text)
img = ImageOps.autocontrast(img, cutoff=2)

# 5e. Gentle sharpening (helps character edges without over-sharpening JPEG artifacts)
img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))

# ── 6. OCR ────────────────────────────────────────────────────────────────────
CFG_MAIN     = "--oem 3 --psm 6"   # uniform block of text
CFG_FALLBACK = "--oem 3 --psm 11"  # sparse text layout

def _usable(text: str) -> bool:
    """Return True when text contains ≥20 non-whitespace chars and at least one digit."""
    stripped = text.replace(" ", "").replace("\n", "").replace("\t", "")
    return len(stripped) >= 20 and any(c.isdigit() for c in stripped)

selected_psm = 6
try:
    text_main = pytesseract.image_to_string(img, config=CFG_MAIN).strip()
    print(f"[ocr] psm6: {len(text_main)} chars", file=sys.stderr)
except pytesseract.TesseractNotFoundError as e:
    print(json.dumps({"success": False, "error": f"Tesseract not found: {e}"}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({"success": False, "error": f"Tesseract error: {e}"}))
    sys.exit(0)

if _usable(text_main):
    text = text_main
else:
    try:
        text_fb = pytesseract.image_to_string(img, config=CFG_FALLBACK).strip()
        print(f"[ocr] psm11: {len(text_fb)} chars", file=sys.stderr)
    except Exception as e:
        print(f"[ocr] psm11 failed: {e}", file=sys.stderr)
        text_fb = ""
    if len(text_fb) > len(text_main):
        text = text_fb
        selected_psm = 11
    else:
        text = text_main

print(f"[ocr] final text: {len(text)} chars, psm={selected_psm}", file=sys.stderr)
if text:
    print(f"[ocr] first 120 chars: {repr(text[:120])}", file=sys.stderr)

# ── 7. Light post-processing ──────────────────────────────────────────────────
import re
text = re.sub(r'[ \t]+', ' ', text)
text = re.sub(r' +\n', '\n', text)
text = re.sub(r'\n{3,}', '\n\n', text)

# ── 8. Output JSON result ─────────────────────────────────────────────────────
print(json.dumps({"success": True, "text": text, "selected_psm": selected_psm}))
