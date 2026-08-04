import { Router } from 'express';
import multer from 'multer';

/* eslint-disable @typescript-eslint/no-require-imports */
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
const XLSX: typeof import('xlsx') = require('xlsx');
const mammoth: typeof import('mammoth') = require('mammoth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const importGearRouter = Router();
export default importGearRouter;

// ── Weight parsing ────────────────────────────────────────────────────────────

interface WeightResult { oz: number; warning: boolean }

function parseWeightToOz(value: string | number): WeightResult {
  const str = String(value).trim();
  const m = str.match(/(\d+(?:\.\d+)?)\s*(oz|g(?:rams?)?|lbs?|pounds?|kg(?:s|ilograms?)?)?$/i);
  if (!m) return { oz: 0, warning: true };
  const val = parseFloat(m[1]);
  const unit = (m[2] ?? 'oz').toLowerCase();
  let oz: number;
  if (unit.startsWith('g'))               oz = val / 28.3495; // grams
  else if (unit.startsWith('lb') || unit.startsWith('pound')) oz = val * 16;
  else if (unit.startsWith('kg') || unit.startsWith('kilo'))  oz = val * 35.274;
  else                                     oz = val; // oz
  oz = Math.round(oz * 100) / 100;
  return { oz, warning: oz <= 0 || oz > 700 };
}

// ── Extracted item shape ──────────────────────────────────────────────────────

interface ExtractedItem {
  sub: string;       // Type
  desc: string;      // Description
  weightOz: number;
  warning: boolean;
}

// ── Text-based heuristic extraction ──────────────────────────────────────────

const WEIGHT_RE = /(\d+(?:\.\d+)?)\s*(oz|g(?:rams?)?|lbs?|pounds?|kg(?:s|ilograms?)?)(?=\b|\s|$)/i;

const SKIP_LINE_RE = /^(total|grand\s*total|base\s*weight|sub\s*total|sum\b|clothing\b|weight\b|type\b|description\b|category\b|item\b|gear\b|name\b|qty\b|quantity\b|#\b)/i;

function extractFromText(text: string): ExtractedItem[] {
  const results: ExtractedItem[] = [];
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 3);

  for (const line of lines) {
    if (SKIP_LINE_RE.test(line)) continue;

    const wm = line.match(WEIGHT_RE);
    if (!wm) continue;

    const val = parseFloat(wm[1]);
    const unit = wm[2].toLowerCase();
    let oz: number;
    if (unit.startsWith('g'))               oz = val / 28.3495;
    else if (unit.startsWith('lb') || unit.startsWith('pound')) oz = val * 16;
    else if (unit.startsWith('kg'))         oz = val * 35.274;
    else                                    oz = val;
    oz = Math.round(oz * 100) / 100;
    if (oz <= 0) continue;

    // Strip weight token from line
    const rest = line
      .replace(wm[0], '')
      .replace(/\([^)]*\)/g, '')        // remove parenthetical notes
      .replace(/[|,]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!rest) continue;

    // Split into type + description (tab / 2+ spaces / ' - ' are column separators)
    let sub = '', desc = '';
    const parts = rest.split(/\t|  +|\s+-\s+/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      sub  = parts[0].slice(0, 60);
      desc = parts.slice(1).join(' ').slice(0, 200);
    } else {
      const spIdx = rest.search(/\s/);
      if (spIdx > 0 && spIdx <= 20) {
        sub  = rest.slice(0, spIdx).slice(0, 60);
        desc = rest.slice(spIdx + 1).trim().slice(0, 200);
      } else {
        desc = rest.slice(0, 200);
      }
    }

    results.push({ sub, desc, weightOz: oz, warning: oz > 500 || (!desc && !sub) });
  }

  return results;
}

// ── XLSX / Numbers structured extraction ─────────────────────────────────────

function extractFromWorkbook(wb: ReturnType<typeof XLSX.read>): ExtractedItem[] {
  const results: ExtractedItem[] = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    const header = (rows[0] as string[]).map(h => String(h ?? '').toLowerCase().trim());

    let typeCol = -1, descCol = -1, weightCol = -1;
    header.forEach((h, i) => {
      if (typeCol   === -1 && /^(type|sub|item|gear|name|product)/.test(h)) typeCol   = i;
      if (descCol   === -1 && /^(desc|detail|note|model|spec|brand)/.test(h)) descCol = i;
      if (weightCol === -1 && /weight|wt\b|oz\b|gram|lb\b/.test(h))         weightCol = i;
    });

    if (weightCol === -1) {
      // No weight column found — fall back to CSV text parsing
      results.push(...extractFromText(XLSX.utils.sheet_to_csv(sheet)));
      continue;
    }

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] as unknown[];
      const rawW = row[weightCol];
      if (rawW === '' || rawW === null || rawW === undefined) continue;

      const { oz, warning } = parseWeightToOz(rawW as string | number);
      if (oz <= 0) continue;

      const sub  = typeCol  >= 0 ? String(row[typeCol]  ?? '').trim().slice(0, 60)  : '';
      let desc = '';
      if (descCol >= 0) {
        desc = String(row[descCol] ?? '').trim();
      } else {
        // Concatenate non-type non-weight cells
        desc = (row as unknown[])
          .filter((_, i) => i !== typeCol && i !== weightCol)
          .map(v => String(v ?? '').trim())
          .filter(Boolean)
          .join(' ');
      }
      desc = desc.slice(0, 200);

      if (!desc && !sub) continue;
      results.push({ sub, desc, weightOz: oz, warning: warning || oz > 500 });
    }
  }

  return results;
}

// ── Route ─────────────────────────────────────────────────────────────────────

importGearRouter.post('/api/import-gear', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { mimetype, originalname, buffer } = req.file;
  const ext = (originalname.split('.').pop() ?? '').toLowerCase();

  try {
    let items: ExtractedItem[] = [];

    if (ext === 'pdf' || mimetype === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      items = extractFromText(parsed.text);

    } else if (ext === 'docx' || ext === 'doc' || mimetype?.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer });
      items = extractFromText(result.value);

    } else if (['xlsx', 'xls', 'numbers'].includes(ext)) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      items = extractFromWorkbook(wb);

    } else {
      res.status(400).json({ error: `Unsupported file type: .${ext}. Accepted: PDF, Word (.docx), Excel (.xlsx), Numbers` });
      return;
    }

    // Deduplicate exact matches
    const seen = new Set<string>();
    const deduped = items.filter(it => {
      const key = `${it.sub}|${it.desc}|${it.weightOz}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.json({ items: deduped.slice(0, 150) });
  } catch (err: any) {
    console.error('[import-gear]', err);
    res.status(500).json({ error: err?.message ?? 'Failed to parse file' });
  }
});
