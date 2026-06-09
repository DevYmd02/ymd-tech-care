/**
 * Formats a number as Thai currency (e.g. 1234.5 -> "1,234.50")
 */
export function fmtMoneyTH(val: number | string | null | undefined): string {
  if (val == null || val === '') return '0.00';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.00';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats a number as a Thai integer (e.g. 1234 -> "1,234")
 */
export function fmtIntTH(val: number | string | null | undefined): string {
  if (val == null || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('th-TH', {
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a date string (ISO or YYYY-MM-DD) as dd/mm/yyyy
 */
export function fmtDate(val: string | null | undefined): string {
  if (!val) return '-';
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return val;
  }
}
