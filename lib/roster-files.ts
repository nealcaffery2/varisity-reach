'use client';

// Reads whatever file a coach drops. Spreadsheets, CSVs and Word tables are
// parsed right here in the browser. Photos, PDFs and free-form documents go
// to the roster-import function, where Claude reads them.

export type FileRead =
  | { kind: 'rows'; rows: unknown[][]; source: string }
  | { kind: 'ai'; file: { name: string; mediaType: string; base64?: string; text?: string }; source: string };

const SHEET = /\.(xlsx|xlsm|xls|ods|numbers)$/i;
const CSV = /\.(csv|tsv|txt)$/i;
const MAX_BYTES = 15 * 1024 * 1024;

export async function readRosterFile(file: File): Promise<FileRead> {
  if (file.size > MAX_BYTES) throw new Error('That file is over 15 MB. Export just the roster page, or take a photo of it.');
  const name = file.name;

  if (CSV.test(name) || file.type === 'text/csv') {
    const { parseCsv } = await import('./roster');
    return { kind: 'rows', rows: parseCsv(await file.text()), source: 'CSV' };
  }

  if (SHEET.test(name)) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    // The sheet with the most filled rows is almost always the roster.
    const sheets = wb.SheetNames.map((n) => XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: false, defval: '' }));
    const rows = sheets.sort((a, b) => b.length - a.length)[0] ?? [];
    return { kind: 'rows', rows, source: 'Spreadsheet' };
  }

  if (/\.docx$/i.test(name)) {
    const mammoth = await import('mammoth');
    const buf = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const table = [...doc.querySelectorAll('table')].sort((a, b) => b.rows.length - a.rows.length)[0];
    if (table && table.rows.length > 1) {
      return { kind: 'rows', rows: [...table.rows].map((r) => [...r.cells].map((c) => c.textContent?.trim() ?? '')), source: 'Word table' };
    }
    const { value: text } = await mammoth.extractRawText({ arrayBuffer: buf });
    return { kind: 'ai', file: { name, mediaType: 'text/plain', text }, source: 'Word document' };
  }

  if (file.type === 'application/pdf' || /\.pdf$/i.test(name)) {
    return { kind: 'ai', file: { name, mediaType: 'application/pdf', base64: await toBase64(file) }, source: 'PDF' };
  }

  if (file.type.startsWith('image/') || /\.(jpe?g|png|heic|webp)$/i.test(name)) {
    return { kind: 'ai', file: { name, mediaType: 'image/jpeg', base64: await shrinkImage(file) }, source: 'Photo' };
  }

  throw new Error('That file type is not supported. Use Excel, CSV, PDF, Word or a photo.');
}

async function toBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Phone photos are 4 to 12 MB. 2000 px on the long side reads just as well and uploads in a second. */
async function shrinkImage(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not read that photo.'))), 'image/jpeg', 0.85));
  return toBase64(blob);
}
