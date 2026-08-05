import { Router } from 'express';
import OpenAI from 'openai';

const router = Router();

const SYSTEM_PROMPT = `You are a backpacking gear analyst. Extract product details from the content and return ONLY valid JSON — no markdown, no explanation.

Return exactly this shape:
{
  "sub": "<short gear type, e.g. 'Tent', 'Sleeping Bag', 'Stove', 'Rain Jacket', 'Trekking Poles'>",
  "desc": "<product name and key model info, concise, e.g. 'Big Agnes Copper Spur HV UL2'>",
  "weightOz": <weight in oz as a decimal number — convert from grams by dividing by 28.35, from lbs by multiplying by 16. Use 0 if unknown.>,
  "category": "<exactly one of: Backpack, Shelter, Sleep, Clothing Packed, Kitchen, Electronics, Toiletries, Med Kit, Repair Kit, Hydration, Clothing Worn, Dog Pack, Expendables>"
}`;

router.post('/scan-gear', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'OPENAI_API_KEY is not configured on this server.',
      code: 'no_api_key',
    });
  }

  const openai = new OpenAI({ apiKey });
  const { type, url, base64, mimeType } = req.body ?? {};

  try {
    if (type === 'url') {
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'url is required', code: 'missing_url' });
      }

      // Fetch the product page server-side (avoids CORS)
      let html = '';
      try {
        const resp = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
          signal: AbortSignal.timeout(12000),
        });
        html = await resp.text();
      } catch (fetchErr: any) {
        return res.status(502).json({ error: `Could not fetch URL: ${fetchErr.message}`, code: 'fetch_error' });
      }

      // Strip scripts/styles/tags → plain text, cap at 8 000 chars
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract gear details from this product page text:\n\n${text}` },
        ],
        max_tokens: 300,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      return res.json(JSON.parse(raw));

    } else if (type === 'image') {
      // Image and screenshot scanning is no longer supported.
      return res.status(400).json({
        error: 'Image scanning is not supported. Use the Scan Gear List panel to upload a PDF, Word, Excel, or Numbers file instead.',
        code: 'unsupported_type',
      });
    }

    return res.status(400).json({ error: 'type must be "url"', code: 'invalid_type' });

  } catch (err: any) {
    console.error('[scan-gear]', err?.message);
    return res.status(500).json({ error: err?.message ?? 'Scan failed', code: 'scan_error' });
  }
});

export default router;
