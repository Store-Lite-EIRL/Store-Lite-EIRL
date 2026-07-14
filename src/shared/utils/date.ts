/**
 * Formats a date as a Spanish (Argentina) relative string.
 *
 * | Condition                 | Output                      |
 * |---------------------------|-----------------------------|
 * | Same calendar day (D=0)   | "Hoy"                       |
 * | 1 day ago (D=1)           | "Ayer"                      |
 * | 2–6 days ago              | "Hace {n} días"             |
 * | 7–29 days ago             | "Hace {n} semanas"          |
 * | 30+ days ago              | "dd/mm/aaaa"                |
 * | Future date (same day)    | "Hoy"                       |
 * | Future date (other)       | "dd/mm/aaaa"                |
 * | Invalid date              | "dd/mm/aaaa"                |
 */
/** Formats a single date component as zero-padded string. */
function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

/** Formats a Date as zero-padded dd/mm/aaaa. */
function formatAbsolute(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const month = d.toLocaleDateString('es-AR', { month: 'short' });
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

export function formatRelativeDate(date: Date | string): string {
  // Normalize input
  const d = typeof date === 'string' ? new Date(date) : date;

  // Handle invalid dates — return a safe placeholder (follows dd/mm/aaaa pattern)
  if (Number.isNaN(d.getTime())) {
    return '00/00/0000';
  }

  // Normalize to midnight for calendar-day comparison
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';

  // Future dates (diffDays < 0) & 30+ days ago → absolute format
  if (diffDays < 0 || diffDays >= 30) {
    return formatAbsolute(d);
  }

  if (diffDays < 7) return `Hace ${diffDays} días`;

  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
}
