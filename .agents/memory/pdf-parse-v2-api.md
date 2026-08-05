---
name: pdf-parse v2 API
description: pdf-parse v2.4.5 exports a class, not a default function — require pattern and invocation changed from v1.
---

## Rule
pdf-parse v2.4.5 does NOT export a default function. `require('pdf-parse')` returns an object with named exports. The main class is `PDFParse`.

**Correct invocation:**
```ts
const { PDFParse } = require('pdf-parse');
const inst = new PDFParse({ data: buffer, verbosity: 0 });
const result = await inst.getText();
// result: { pages: Array<{ text: string }>, text: string, total: number }
const text = result.pages.map(p => p.text).join('\n');
```

**Why:** v1.x exported `module.exports = function pdfParse(buffer)`. v2.x exports a class via named export. The old `require('pdf-parse')(buffer)` call throws `pdfParse is not a function`.

**How to apply:** Any code that calls `pdfParse(buffer)` must be replaced with the class-based pattern above.
