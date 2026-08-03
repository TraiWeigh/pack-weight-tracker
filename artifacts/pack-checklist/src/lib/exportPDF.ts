import jsPDF from 'jspdf';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from './weightUtils';

const ML = 14;   // margin left
const MR = 196;  // right edge (210 - 14)
const CW = MR - ML;

function calcTotals(
  data: PackState,
  categoryOrder: string[],
  categoryMeta: Record<string, CategoryMeta>,
) {
  let baseOz = 0;
  const nonBase: { name: string; oz: number }[] = [];

  categoryOrder.forEach(cat => {
    const items = (data[cat] || []).filter(i => i.checked);
    const catOz = items.reduce((s, item) => s + calcTotalOz(item.weightOz, item.qty), 0);
    const countsToBase = categoryMeta[cat]?.countsToBase ?? true;
    if (countsToBase) {
      baseOz += catOz;
    } else {
      nonBase.push({ name: cat, oz: catOz });
    }
  });

  const grandOz = baseOz + nonBase.reduce((s, c) => s + c.oz, 0);
  return { baseOz, nonBase, grandOz };
}

export function generatePackPDF(
  data: PackState,
  system: UnitSystem,
  categoryOrder: string[],
  categoryMeta: Record<string, CategoryMeta>,
): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const lu = largeUnit(system);
  const su = smallUnit(system);
  const { baseOz, nonBase, grandOz } = calcTotals(data, categoryOrder, categoryMeta);

  let y = 18;

  // ── Title ──────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(45, 90, 45);
  doc.text('TrailWeigh', ML, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(130, 130, 130);
  doc.text('Pack Checklist', ML + 42, y - 0.5);
  y += 5;
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), ML, y);
  y += 8;

  // ── Weight Summary Box ─────────────────────────────────────
  const summaryRows: { label: string; oz: number }[] = [
    { label: 'Base Weight', oz: baseOz },
    ...nonBase.filter(c => c.oz > 0).map(c => ({ label: c.name, oz: c.oz })),
    { label: 'Grand Total', oz: grandOz },
  ];
  const col = CW / summaryRows.length;

  doc.setFillColor(244, 248, 244);
  doc.setDrawColor(190, 210, 190);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CW, 14, 2, 2, 'FD');

  summaryRows.forEach(({ label, oz }, i) => {
    const cx = ML + col * i + col / 2;
    const isGrand = label === 'Grand Total';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(label, cx, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isGrand ? 12 : 10);
    doc.setTextColor(isGrand ? 45 : 25, isGrand ? 90 : 25, isGrand ? 45 : 25);
    doc.text(`${formatWeight(oz, system, 'large')} ${lu}`, cx, y + 11.5, { align: 'center' });
  });
  y += 19;

  // ── Categories ─────────────────────────────────────────────
  categoryOrder.forEach(cat => {
    const items = (data[cat] || []).filter(i => i.checked);
    if (items.length === 0) return;
    if (y > 262) { doc.addPage(); y = 18; }

    doc.setFillColor(50, 85, 50);
    doc.rect(ML, y, CW, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(cat.toUpperCase(), ML + 3, y + 4.5);
    y += 9;

    const subHdr  = (categoryMeta[cat]?.subLabel  || 'Type').toUpperCase();
    const descHdr = (categoryMeta[cat]?.descLabel || 'Description').toUpperCase();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(subHdr, ML + 6, y);
    doc.text(descHdr, ML + 38, y);
    doc.text('WEIGHT', MR, y, { align: 'right' });
    y += 4.5;

    items.forEach((item, idx) => {
      if (y > 277) { doc.addPage(); y = 18; }

      if (idx % 2 === 0) {
        doc.setFillColor(249, 253, 249);
        doc.rect(ML, y - 3.2, CW, 5.8, 'F');
      }

      doc.setDrawColor(70, 115, 70);
      doc.setLineWidth(0.35);
      doc.rect(ML + 0.5, y - 3.2, 3.5, 3.5);
      doc.setDrawColor(35, 100, 45);
      doc.setLineWidth(0.55);
      doc.line(ML + 1, y - 1.5, ML + 2, y - 0.4);
      doc.line(ML + 2, y - 0.4, ML + 3.8, y - 3.0);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(85, 85, 85);
      const typeStr = item.sub || '';
      doc.text(typeStr.length > 14 ? typeStr.slice(0, 13) + '…' : typeStr, ML + 6, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      doc.text(item.desc || '—', ML + 38, y, { maxWidth: CW - 72 });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 85, 45);
      doc.text(
        `${formatWeight(calcTotalOz(item.weightOz, item.qty), system, 'small')} ${su}`,
        MR, y, { align: 'right' }
      );

      y += 5.8;
    });
    y += 4;
  });

  // ── Footer on every page ───────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 170);
    doc.line(ML, 287, MR, 287);
    doc.text(`TrailWeigh Pack Checklist  •  Page ${p} of ${pages}`, ML, 291);
    doc.text(new Date().toLocaleDateString(), MR, 291, { align: 'right' });
  }

  return doc.output('blob') as Blob;
}

export function sharePackList(
  data: PackState,
  system: UnitSystem,
  categoryOrder: string[],
  categoryMeta: Record<string, CategoryMeta>,
) {
  const blob = generatePackPDF(data, system, categoryOrder, categoryMeta);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pack-checklist.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
