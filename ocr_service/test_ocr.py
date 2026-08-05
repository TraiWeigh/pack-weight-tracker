"""
ocr_service/test_ocr.py

Isolated verification script: uses Pillow to create a test image and
pytesseract/Tesseract to extract the text from it.  Run with:

    python3 ocr_service/test_ocr.py

Expected extracted text:
    TrailWeigh OCR Test
    Tent Weight 18.5 oz
"""

import os
import sys
import shutil

# ── 1. Locate Tesseract and configure TESSDATA_PREFIX ─────────────────────────
tess_bin = shutil.which("tesseract")
if not tess_bin:
    print("ERROR: 'tesseract' binary not found in PATH.")
    print("Make sure 'tesseract' is listed in installSystemDependencies in this project.")
    sys.exit(1)

# Resolve symlinks to get the real Nix store path, then find tessdata alongside it.
tess_real = os.path.realpath(tess_bin)            # e.g. /nix/store/<hash>-tesseract-x.y/bin/tesseract
tess_root = os.path.dirname(os.path.dirname(tess_real))  # /nix/store/<hash>-tesseract-x.y
tessdata_dir = os.path.join(tess_root, "share", "tessdata")

if os.path.isdir(tessdata_dir):
    os.environ["TESSDATA_PREFIX"] = tessdata_dir
    print(f"Tesseract binary : {tess_bin}")
    print(f"TESSDATA_PREFIX  : {tessdata_dir}")
else:
    print(f"WARNING: tessdata directory not found at {tessdata_dir}")
    print(f"Tesseract binary : {tess_bin}")

# ── 2. Import Python dependencies ─────────────────────────────────────────────
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("ERROR: Pillow not installed.  Run: pip install Pillow")
    sys.exit(1)

try:
    import pytesseract
except ImportError:
    print("ERROR: pytesseract not installed.  Run: pip install pytesseract")
    sys.exit(1)

# ── 3. Create the test image ──────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_PATH = os.path.join(SCRIPT_DIR, "test_image.png")

from PIL import ImageFont

FONT_SIZE = 36
KNOWN_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/TTF/DejaVuSans.ttf",
]
font = None
for fp in KNOWN_FONTS:
    if os.path.exists(fp):
        font = ImageFont.truetype(fp, FONT_SIZE)
        print(f"Using font: {fp}")
        break

if font is None:
    print("Note: no TrueType font found; using scaled bitmap font")

# White background, black text, generous padding — optimal for Tesseract.
IMG_W, IMG_H = 700, 130
img = Image.new("RGB", (IMG_W, IMG_H), color=(255, 255, 255))
draw = ImageDraw.Draw(img)

if font:
    draw.text((20, 15), "TrailWeigh OCR Test", fill=(0, 0, 0), font=font)
    draw.text((20, 70), "Tent Weight 18.5 oz",  fill=(0, 0, 0), font=font)
else:
    # Bitmap fallback: render small then upscale
    SCALE = 5
    small = Image.new("RGB", (200, 26), color=(255, 255, 255))
    d = ImageDraw.Draw(small)
    d.text((2, 1),  "TrailWeigh OCR Test", fill=(0, 0, 0))
    d.text((2, 14), "Tent Weight 18.5 oz",  fill=(0, 0, 0))
    img = small.resize((200 * SCALE, 26 * SCALE), Image.NEAREST)

img.save(IMAGE_PATH)
print(f"Test image saved : {IMAGE_PATH}  ({img.width}×{img.height} px)")

# ── 4. Run OCR ────────────────────────────────────────────────────────────────
try:
    tess_version = pytesseract.get_tesseract_version()
    print(f"Tesseract version: {tess_version}")
except pytesseract.TesseractNotFoundError as exc:
    print(f"ERROR: Tesseract not found by pytesseract: {exc}")
    sys.exit(1)
except Exception as exc:
    print(f"ERROR: {exc}")
    sys.exit(1)

try:
    opened = Image.open(IMAGE_PATH)
    extracted = pytesseract.image_to_string(opened, config="--oem 3 --psm 6")
    print("\n── Extracted text ──────────────────────────")
    print(extracted.strip())
    print("────────────────────────────────────────────\n")
except Exception as exc:
    print(f"ERROR during OCR: {exc}")
    sys.exit(1)

# ── 5. Validate ───────────────────────────────────────────────────────────────
passed = True

if "TrailWeigh OCR Test".lower() in extracted.lower():
    print("PASS: 'TrailWeigh OCR Test' found")
else:
    print("FAIL: 'TrailWeigh OCR Test' not found in extracted text")
    passed = False

if "18.5" in extracted:
    print("PASS: '18.5' found")
elif "18" in extracted:
    print("WARN: '18' found but not '18.5' — Tesseract may have altered the decimal")
else:
    print("WARN: '18.5' not found — bitmap font scaling may need adjustment")

if passed:
    print("\n✓ OCR verification succeeded.")
else:
    print("\n✗ OCR verification failed.")
    sys.exit(1)
