/**
 * Статичні адреси Одеси для емуляції (без геокодування Nominatim).
 * Межі міста: lat 46.38–46.58, lng 30.55–30.85
 */
export interface OdessaAddress {
  lat: number;
  lng: number;
  displayName: string;
}

export const ODESSA_ADDRESSES: OdessaAddress[] = [
  { lat: 46.4852, lng: 30.7406, displayName: 'вул. Дерибасівська, 1, Одеса' },
  { lat: 46.4875, lng: 30.7334, displayName: 'Приморський бульвар, 1, Одеса' },
  { lat: 46.4701, lng: 30.7402, displayName: 'пл. Соборна, 1, Одеса' },
  { lat: 46.4756, lng: 30.7278, displayName: 'вул. Преображенська, 20, Одеса' },
  { lat: 46.4698, lng: 30.7422, displayName: 'вул. Строганівський міст, Одеса' },
  { lat: 46.4912, lng: 30.7489, displayName: 'вул. Гоголя, 12, Одеса' },
  { lat: 46.4723, lng: 30.7356, displayName: 'вул. Рішельєвська, 33, Одеса' },
  { lat: 46.4789, lng: 30.7512, displayName: 'вул. Грецька, 48, Одеса' },
  { lat: 46.4845, lng: 30.7556, displayName: 'вул. Канатна, 78, Одеса' },
  { lat: 46.4623, lng: 30.748, displayName: 'пр. Шевченка, 2, Одеса' },
  { lat: 46.4589, lng: 30.7489, displayName: 'вул. Академіка Глушка, 1, Одеса' },
  { lat: 46.4512, lng: 30.7356, displayName: 'вул. Аркадіївська, 1, Аркадія' },
  /** Трохи північніше берегової лінії, щоб OSRM не тягнув у воду */
  { lat: 46.4465, lng: 30.7415, displayName: 'Аркадія, набережна, Одеса' },
  { lat: 46.4556, lng: 30.7223, displayName: 'вул. Малиновського, 36, Одеса' },
  { lat: 46.4689, lng: 30.7189, displayName: 'вул. Торгова, 1, Одеса' },
  { lat: 46.4712, lng: 30.7089, displayName: 'пл. Ринкова, Одеса' },
  { lat: 46.4789, lng: 30.6989, displayName: 'вул. Старопортофранківська, 33, Одеса' },
  { lat: 46.4856, lng: 30.6889, displayName: 'Пересип, вул. Балтійська, 12, Одеса' },
  { lat: 46.4923, lng: 30.7012, displayName: 'вул. Рівненська, 5, Одеса' },
  { lat: 46.4989, lng: 30.7123, displayName: 'вул. Мельникова, 22, Одеса' },
  { lat: 46.5056, lng: 30.7256, displayName: 'вул. Астрономічна, 1, Одеса' },
  { lat: 46.5123, lng: 30.7389, displayName: 'вул. Толбухіна, 135, Одеса' },
  { lat: 46.5089, lng: 30.7512, displayName: 'пр. Добровольського, 142, Одеса' },
  { lat: 46.5023, lng: 30.752, displayName: 'вул. Академіка Воробйова, 5, Одеса' },
  { lat: 46.4956, lng: 30.748, displayName: 'вул. Космонавтів, 70, Одеса' },
  /** Східніше 30,76 — лиман/море на карті; координати зсунуті в безпечну міську зону */
  { lat: 46.4889, lng: 30.742, displayName: 'вул. Маршала Жукова, 12, Одеса' },
  { lat: 46.4823, lng: 30.736, displayName: 'вул. Адміральський пр., 1, Одеса' },
  { lat: 46.4756, lng: 30.732, displayName: 'вул. Агарова, 5, Одеса' },
  { lat: 46.4689, lng: 30.734, displayName: 'вул. Пастера, 27, Одеса' },
  { lat: 46.4623, lng: 30.726, displayName: 'пр. Небесної Сотні, 77, Одеса' },
  { lat: 46.4556, lng: 30.7123, displayName: 'вул. Ланжеронівська, 2, Одеса' },
  { lat: 46.4489, lng: 30.6989, displayName: 'вул. Пушкінська, 33, Одеса' },
  { lat: 46.4423, lng: 30.6856, displayName: 'вул. Софіївська, 25, Одеса' },
  { lat: 46.4356, lng: 30.6723, displayName: 'вул. Щепкіна, 12, Одеса' },
  { lat: 46.4289, lng: 30.6589, displayName: 'вул. Жуковського, 19, Одеса' },
  { lat: 46.4223, lng: 30.6456, displayName: 'вул. Тираспольська, 1, Одеса' },
  { lat: 46.4156, lng: 30.6323, displayName: 'вул. Преображенська, 72, Одеса' },
  { lat: 46.4389, lng: 30.6189, displayName: 'вул. Старосінна площа, 5, Одеса' },
  { lat: 46.4323, lng: 30.6056, displayName: 'вул. Новосільського, 68, Одеса' },
  { lat: 46.4256, lng: 30.5923, displayName: 'вул. Овідіопольська дорога, 1, Одеса' },
];



/** Широкі межі (довідково) */
export const ODESSA_BOUNDS = {
  latMin: 46.38,
  latMax: 46.58,
  lngMin: 30.55,
  lngMax: 30.85,
};

/**
 * Межі емуляції: тільки суходіл (без відкритого моря на схід і південь від Одеси).
 * Східніше ~30,76 на середніх широтах — акваторія. Південь: обрізаємо «відкрите море»
 * лише разом із великою довготою (кламп точок у демоні). Західні низькі широти — суходіл.
 */
export const ODESSA_DRIVE_BOUNDS = {
  latMin: 46.412,
  latMax: 46.516,
  lngMin: 30.588,
  /** Північ — можна ближче до 30,76; південь ріже maxLngOnLandForLat */
  lngMax: 30.756,
};

/**
 * На півдні міста берег іде на північний схід — велика довгота при низькій широті дає лиман/море
 * всередині «прямокутника». Обмежуємо схід залежно від широти.
 */
function maxLngOnLandForLat(lat: number): number {
  if (lat >= 46.508) return 30.756;
  if (lat >= 46.488) return 30.752;
  if (lat >= 46.472) return 30.742;
  if (lat >= 46.458) return 30.732;
  if (lat >= 46.445) return 30.722;
  return 30.712;
}

export function clampToOdessaDriveBounds(lat: number, lng: number): { lat: number; lng: number } {
  let clat = Math.max(ODESSA_DRIVE_BOUNDS.latMin, Math.min(ODESSA_DRIVE_BOUNDS.latMax, lat));
  let clng = Math.max(ODESSA_DRIVE_BOUNDS.lngMin, Math.min(ODESSA_DRIVE_BOUNDS.lngMax, lng));
  const lngCap = maxLngOnLandForLat(clat);
  if (clng > lngCap) {
    clng = lngCap;
  }
  if (clng > 30.728 && clat < 46.445) {
    clat = Math.max(clat, 46.445);
  }
  return { lat: clat, lng: clng };
}
