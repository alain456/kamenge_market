/**
 * Formats a number into Burundian Francs (BIF) string
 * Example: 1545000 -> "1 545 000 BIF"
 */
export function formatBIF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' BIF';
}

/**
 * Formats a date string or Date object to readable French format
 * Example: "2026-08-26" -> "26 août 2026"
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Short date format e.g. "26/08/2026"
 */
export function formatDateShort(dateString: string | Date): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
