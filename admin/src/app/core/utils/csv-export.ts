export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/**
 * Build a CSV string from rows + column definitions and trigger a browser download.
 * Pure client-side — no backend or external dependency needed.
 */
export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  const escape = (val: string | number | null | undefined): string => {
    const s = val === null || val === undefined ? '' : String(val);
    // Wrap in quotes and double any embedded quotes when the value has a comma, quote or newline
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = columns.map(c => escape(c.header)).join(',');
  const dataLines = rows.map(row => columns.map(c => escape(c.value(row))).join(','));
  const csv = [headerLine, ...dataLines].join('\r\n');

  // Prepend BOM so Excel opens UTF-8 correctly
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
