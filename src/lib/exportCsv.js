// Small CSV helpers (no dependencies).

// Escape one cell: quote when needed, double inner quotes, and neutralise
// spreadsheet formulas (=, +, -, @) so user-typed titles can't run in Excel.
export function csvCell(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const csvRow = (cells) => cells.map(csvCell).join(',');

// Builds the file in the browser and triggers a download.
// The BOM makes Excel read UTF-8 (accents, ñ, etc.) correctly.
export function downloadCsv(filename, rows) {
  const content = '\uFEFF' + rows.map(csvRow).join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
