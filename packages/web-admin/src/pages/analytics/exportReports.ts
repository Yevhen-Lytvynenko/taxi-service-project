import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TextRun,
} from 'docx';

function rowsToMatrix(rows: Record<string, unknown>[]): { head: string[]; body: string[][] } {
  if (!rows.length) return { head: [], body: [] };
  const head = Object.keys(rows[0]!);
  const body = rows.map((r) => head.map((h) => String(r[h] ?? '')));
  return { head, body };
}

export function exportXlsx(rows: Record<string, unknown>[], fileBase: string) {
  const { head, body } = rowsToMatrix(rows);
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${fileBase}.xlsx`);
}

export function exportPdfTable(
  title: string,
  rows: Record<string, unknown>[],
  fileBase: string,
  maxRows = 40
) {
  const { head, body } = rowsToMatrix(rows.slice(0, maxRows));
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  autoTable(doc, {
    head: [head],
    body,
    startY: 22,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [255, 193, 7] },
  });
  doc.save(`${fileBase}.pdf`);
}

export async function exportDocxTable(title: string, rows: Record<string, unknown>[], fileBase: string) {
  const { head, body } = rowsToMatrix(rows.slice(0, 200));
  const headerRow = new TableRow({
    children: head.map(
      (h) =>
        new TableCell({
          width: { size: 3000 / head.length, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
        })
    ),
  });
  const dataRows = body.map(
    (line) =>
      new TableRow({
        children: line.map(
          (cell) =>
            new TableCell({
              width: { size: 3000 / head.length, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun(cell)] })],
            })
        ),
      })
  );
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })] }),
          new Paragraph({ text: '' }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
        ],
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileBase}.docx`);
}
