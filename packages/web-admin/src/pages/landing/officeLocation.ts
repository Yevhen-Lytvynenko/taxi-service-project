/** Фіктивна адреса головного офісу Strum (Одеса) для лендінгу та демо. */
export const STRUM_HQ = {
  title: 'Головний офіс служби таксі Strum',
  street: 'вул. Дерибасівська, 22',
  building: 'бізнес-центр «Приморський», 4 поверх, офіс 401',
  city: 'м. Одеса, 65000',
  /** [широта, довгота] — центр Дерибасівської, демо-координати */
  position: [46.4847, 30.7412] as [number, number],
  zoom: 16,
  hours: 'Пн–Пт 09:00–18:00 · Сб 10:00–15:00',
} as const;

export const STRUM_HQ_ADDRESS_LINE = `${STRUM_HQ.street}, ${STRUM_HQ.building}, ${STRUM_HQ.city}`;

export function strumHqOpenStreetMapUrl(): string {
  const [lat, lng] = STRUM_HQ.position;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${STRUM_HQ.zoom}/${lat}/${lng}`;
}
