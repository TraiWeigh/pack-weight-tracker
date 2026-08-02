import jsPDF from 'jspdf';
import { PackState, CATEGORY_ORDER } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from './weightUtils';

const DOG_PACK = 'Dog Pack';
const ML = 14;   // margin left
const MR = 196;  // right edge (210 - 14)
const CW = MR - ML; // content width

function calcTotals(data: PackState, system: UnitSystem) {
  let baseOz = 0, dogOz = 0, expOz = 0;
  CATEGORY_ORDER.forEach(cat => {
    (data[cat] || []).filter(i => i.checked).forEach(item => {
      const oz = calcTotalOz(item.weightOz, item.qty);
      if (cat === DOG_PACK) dogOz += oz;
      else if (item.expendable) expOz += oz;
      else baseOz += oz;
    });
  });
  return { baseOz, dogOz, expOz, grandOz: baseOz + dogOz + expOz };
}

export function generatePackPDF(data: PackState, system: UnitSystem): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const lu = largeUnit(system);
  const su = smallUnit(system);
  const { baseOz, dogOz, grandOz } = calcTotals(data, system);

  let y = 18;

  // ── Title ─────────────────────────────────────────────────
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

  // ── Weight Summary Box ────────────────────────────────────
  doc.setFillColor(244, 248, 244);
  doc.setDrawColor(190, 210, 190);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CW, 14, 2, 2, 'FD');
  const col = CW / 3;
  const summaryRows = [
    { label: 'Base Weight', oz: baseOz },
    { label: 'Dog Pack',    oz: dogOz  },
    { label: 'Grand Total', oz: grandOz },
  ];
  summaryRows.forEach(({ label, oz }, i) => {
    const cx = ML + col * i + col / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    doc.text(label, cx, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(25, 25, 25);
    doc.text(`${formatWeight(oz, system, 'large')} ${lu}`, cx, y + 11.5, { align: 'center' });
  });
  y += 19;

  // ── Categories ────────────────────────────────────────────
  CATEGORY_ORDER.forEach(cat => {
    const items = (data[cat] || []).filter(i => i.checked);
    if (items.length === 0) return;
    if (y > 262) { doc.addPage(); y = 18; }

    // Category header bar
    doc.setFillColor(50, 85, 50);
    doc.rect(ML, y, CW, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(cat.toUpperCase(), ML + 3, y + 4.5);
    y += 9;

    // Column labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('TYPE', ML + 6, y);
    doc.text('DESCRIPTION', ML + 38, y);
    doc.text('WEIGHT', MR, y, { align: 'right' });
    y += 4.5;

    items.forEach((item, idx) => {
      if (y > 277) { doc.addPage(); y = 18; }

      // Alternating row tint
      if (idx % 2 === 0) {
        doc.setFillColor(249, 253, 249);
        doc.rect(ML, y - 3.2, CW, 5.8, 'F');
      }

      // Checkbox outline
      doc.setDrawColor(70, 115, 70);
      doc.setLineWidth(0.35);
      doc.rect(ML + 0.5, y - 3.2, 3.5, 3.5);
      // Checkmark
      doc.setDrawColor(35, 100, 45);
      doc.setLineWidth(0.55);
      doc.line(ML + 1, y - 1.5, ML + 2, y - 0.4);
      doc.line(ML + 2, y - 0.4, ML + 3.8, y - 3.0);

      // Type
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(85, 85, 85);
      const typeStr = item.sub || '';
      doc.text(typeStr.length > 14 ? typeStr.slice(0, 13) + '…' : typeStr, ML + 6, y);

      // Description
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 20, 20);
      const desc = item.desc || '—';
      doc.text(desc, ML + 38, y, { maxWidth: CW - 72 });

      // Weight
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(45, 85, 45);
      const wt = `${formatWeight(calcTotalOz(item.weightOz, item.qty), system, 'small')} ${su}`;
      doc.text(wt, MR, y, { align: 'right' });

      y += 5.8;
    });
    y += 4;
  });

  // ── Footer on every page ──────────────────────────────────
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

export async function sharePackList(data: PackState, system: UnitSystem) {
  const blob = generatePackPDF(data, system);
  const file = new File([blob], 'pack-checklist.pdf', { type: 'application/pdf' });

  // Try Web Share API (works on mobile + modern desktop)
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'TrailWeigh Pack Checklist',
      text: 'My pack checklist from TrailWeigh.',
    });
    return;
  }

  // Fallback: download the PDF, then open mail client
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pack-checklist.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setTimeout(() => {
    window.location.href =
      'mailto:?subject=Pack%20Checklist&body=Please%20find%20the%20pack%20checklist%20PDF%20attached.';
  }, 600);
}
