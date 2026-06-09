export type SavedPlaceRow = { id: string; label: string; address: string; lat: number; lng: number };
export type PeerMini = { id: string; fullName: string; role: string };

export type QuoteTariffRow = {
  code: string;
  title: string;
  subtitle: string;
  totalPrice: number;
};

export type QuoteResponse = {
  distanceKm: number;
  plannedRouteDistanceKm: number;
  plannedRouteDurationMin: number;
  surgeMultiplier: number;
  /** Геометрія маршруту OSRM: [lng, lat][] */
  routePolyline: [number, number][] | null;
  tariffs: QuoteTariffRow[];
};

export const CLIENT_PREFS: { id: string; label: string }[] = [
  { id: 'NO_MUSIC', label: 'Без музики' },
  { id: 'QUIET_CHAT', label: 'Тиха поїздка' },
  { id: 'AC_ON', label: 'Кондиціонер' },
  { id: 'HELP_LUGGAGE', label: 'Допомога з багажем' },
  { id: 'PET_OK', label: 'З твариною' },
  { id: 'CHILD_SEAT', label: 'Дитяче крісло' },
  { id: 'MEET_SIGN', label: 'Зустріч з табличкою' },
  { id: 'DOOR_SERVICE', label: 'Під’їзд до дверей' },
];

export const CREATE_ORDER_STEPS = 2;
