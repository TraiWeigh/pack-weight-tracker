#!/usr/bin/env python3
"""
ocr_service/image_ocr.py

Called by the TrailWeigh API server (Node.js) as a subprocess.

Protocol:
  stdin  — base64-encoded image bytes
  stdout — extracted text (UTF-8)
  stderr — human-readable error details (not shown to end users)
  exit 0 — success (stdout may be empty if image contains no text)
  exit 1 — hard failure (Tesseract missing, corrupt file, etc.)
"""

import sys
import os
import base64
import shutil
import io

# ── 1. Locate Tesseract and set TESSDATA_PREFIX ───────────────────────────────
tess_bin = shutil.which("tesseract")
if not tess_bin:
    print("Tesseract binary not found in PATH", file=sys.stderr)
    sys.exit(1)

tess_real = os.path.realpath(tess_bin)
tess_root = os.path.dirname(os.path.dirname(tess_real))
tessdata_dir = os.path.join(tess_root, "share", "tessdata")
if os.path.isdir(tessdata_dir):
    os.environ["TESSDATA_PREFIX"] = tessdata_dir

# ── 2. Import Python dependencies ─────────────────────────────────────────────
try:
    from PIL import Image, ImageOps, ImageEnhance, ImageFilter
except ImportError:
    print("Pillow not installed", file=sys.stderr)
    sys.exit(1)

try:
    import pytesseract
except ImportError:
    print("pytesseract not installed", file=sys.stderr)
    sys.exit(1)

# ── 3. Read image from stdin (base64-encoded) ─────────────────────────────────
raw_b64 = sys.stdin.buffer.read()
if not raw_b64.strip():
    print("No data received on stdin", file=sys.stderr)
    sys.exit(1)

try:
    img_bytes = base64.b64decode(raw_b64)
except Exception as e:
    print(f"Base64 decode error: {e}", file=sys.stderr)
    sys.exit(1)

# ── 4. Open and validate image ────────────────────────────────────────────────
try:
    img = Image.open(io.BytesIO(img_bytes))
    img.verify()                          # checks for truncated / corrupt files
    img = Image.open(io.BytesIO(img_bytes))  # re-open after verify() exhausts the stream
except Exception as e:
    print(f"Cannot open image: {e}", file=sys.stderr)
    sys.exit(1)

# ── 5. Preprocess image ───────────────────────────────────────────────────────

# 5a. Correct EXIF orientation (rotated phone photos)
try:
    img = ImageOps.exif_transpose(img)
except Exception:
    pass  # EXIF data missing or unreadable — continue with original

# 5b. Convert to RGB (handles RGBA, P/palette, L/greyscale, CMYK, etc.)
if img.mode not in ("RGB", "L"):
    img = img.convert("RGB")

# 5c. Upscale if short side is below the minimum for reliable OCR.
#     Cap the long side at 4000 px to keep Tesseract runtime reasonable.
MIN_SHORT = 900
MAX_LONG  = 4000
w, h = img.size
short_side = min(w, h)
long_side  = max(w, h)

if short_side < MIN_SHORT:
    scale = MIN_SHORT / short_side
    # Don't blow past the maximum long-side limit
    if long_side * scale > MAX_LONG:
        scale = MAX_LONG / long_side
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)
elif long_side > MAX_LONG:
    scale = MAX_LONG / long_side
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    img = img.resize((new_w, new_h), Image.LANCZOS)

# 5d. Auto-contrast (stretches the histogram — helps faint text become sharper)
img = ImageOps.autocontrast(img, cutoff=2)

# 5e. Gentle sharpening (preserves character edges without over-sharpening
#     JPEG artefacts which would confuse Tesseract)
img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))

# ── 6. Run OCR ────────────────────────────────────────────────────────────────
CFG_MAIN     = "--oem 3 --psm 6"   # assume a single uniform block of text
CFG_FALLBACK = "--oem 3 --psm 11"  # sparse text — better for scattered screenshots

def _usable(text: str) -> bool:
    """True when the text contains at least 20 non-whitespace chars and a digit."""
    stripped = text.replace(" ", "").replace("\n", "").replace("\t", "")
    return len(stripped) >= 20 and any(c.isdigit() for c in stripped)

try:
    text_main = pytesseract.image_to_string(img, config=CFG_MAIN).strip()
except pytesseract.TesseractNotFoundError as e:
    print(f"Tesseract not found: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"Tesseract error (main): {e}", file=sys.stderr)
    sys.exit(1)

if _usable(text_main):
    text = text_main
else:
    try:
        text_fb = pytesseract.image_to_string(img, config=CFG_FALLBACK).strip()
    except Exception as e:
        print(f"Tesseract error (fallback): {e}", file=sys.stderr)
        text_fb = ""
    # Choose whichever result has more content
    text = text_main if len(text_main) >= len(text_fb) else text_fb

# ── 7. Light post-processing of OCR output ───────────────────────────────────
import re

# Collapse multiple spaces on each line (keeps line breaks intact)
text = re.sub(r'[ \t]+', ' ', text)
# Remove trailing spaces from each line
text = re.sub(r' +\n', '\n', text)
# Collapse 3+ blank lines to 2 (keeps paragraph structure without excess gaps)
text = re.sub(r'\n{3,}', '\n\n', text)

print(text)
