/**
 * Короткий підпис для UI з повного рядка адреси (як у БД / Nominatim).
 * Без зміни даних на сервері.
 */
export function shortOrderAddress(full: string | null | undefined): string {
  if (full == null || typeof full !== 'string') return '';
  const dn = full.trim();
  if (!dn) return '';

  const parts = dn
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const filtered = parts.filter(
    (p) => !/^\d{5}(-\d{4})?$/.test(p) && !/^(Україна|Ukraine)$/i.test(p)
  );

  if (filtered.length >= 2) {
    return `${filtered[0]}, ${filtered[1]}`;
  }
  return filtered[0] || dn;
}
