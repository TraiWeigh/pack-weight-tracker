import { Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';

// These packages must stay as require() — they are CJS-only or have no ESM default export.
// The build banner makes globalThis.require available at runtime.
/* eslint-disable @typescript-eslint/no-require-imports */
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
const XLSX: typeof import('xlsx') = require('xlsx');
const mammoth: typeof import('mammoth') = require('mammoth');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const DEFAULT_CATEGORIES = [
  'Backpack','Shelter','Sleep','Clothing Packed','Kitchen',
  'Electronics','Toiletries','Med Kit','Repair Kit','Hydration',
  'Clothing Worn','Dog Pack','Expendables',
];

function buildPrompt(categoryOrder: string[]) {
  const cats = categoryOrder.join(', ');
  return `You are a backpacking gear expert. Read this packing list and extract every gear item you can find.

Return ONLY valid JSON with no markdown or extra text:
{
  "items": [
    {
      "sub": "<short gear type, e.g. 'Tent', 'Sleeping Bag', 'Rain Jacket', 'Stove'>",
      "desc": "<item name / description>",
      "weightOz": <weight in oz as decimal. Convert grams ÷ 28.35, lbs × 16. Use 0 if not listed>,
      "category": "<exactly one of: ${cats}>"
    }
  ]
}

Extract every item listed. If an item has multiple components, list each separately. Be thorough.`;
}

async function extractText(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const ext = (originalname.split('.').pop() ?? '').toLowerCase();

  if (mimetype === 'application/pdf' || ext === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text as string;
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx' || ext === 'doc'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel' ||
    mimetype === 'text/csv' ||
    ext === 'xlsx' || ext === 'xls' || ext === 'numbers' || ext === 'csv'
  ) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    workbook.SheetNames.forEach(name => {
      const sheet = workbook.Sheets[name];
      text += XLSX.utils.sheet_to_txt(sheet) + '\n';
    });
    return text;
  }

  throw new Error(`Unsupported file type (.${ext}). Upload a PDF, Word doc (.docx), or spreadsheet (.xlsx, .numbers, .csv).`);
}

router.post('/import-gear', upload.single('file'), async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'OPENAI_API_KEY not configured.', code: 'no_api_key' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.', code: 'missing_file' });
  }

  let categoryOrder: string[] = DEFAULT_CATEGORIES;
  try {
    if (req.body.categoryOrder) categoryOrder = JSON.parse(req.body.categoryOrder);
  } catch { /* use default */ }

  try {
    const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!rawText.trim()) {
      return res.status(422).json({ error: 'Could not extract any text from this file.', code: 'empty_text' });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildPrompt(categoryOrder) },
        { role: 'user', content: `Extract all gear items from this packing list:\n\n${rawText.slice(0, 14000)}` },
      ],
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      return res.status(422).json({ error: 'No gear items found in this file.', code: 'no_items' });
    }

    return res.json({ items: parsed.items });

  } catch (err: any) {
    console.error('[import-gear]', err?.message);
    const code = err.message?.includes('Unsupported') ? 'unsupported_type' : 'import_error';
    return res.status(code === 'unsupported_type' ? 400 : 500).json({
      error: err?.message ?? 'Import failed.',
      code,
    });
  }
});

export default router;
