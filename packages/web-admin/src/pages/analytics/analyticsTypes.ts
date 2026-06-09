/** Рядок KPI водія з агрегатами для флоту та фінансів. */
export type DriverKpiRow = {
  driverId: string;
  fullName: string;
  vehicle: string;
  verificationStatus: string | null;
  completedTrips: number;
  gmvAttributed: string;
  driverEarningsTotal: string;
  platformFeesTotal: string;
  cancelledTrips: number;
  lossesFromCancelled: string;
  avgCheck: string;
  avgRating: number | null;
  reviewsCount: number;
  passengerKmTotal: string;
  estimatedOnlineHours: number;
  coldKmApprox: number | null;
};

export type AnalyticsRange = {
  fromIso: string;
  toIso: string;
  fromDate: string;
  toDate: string;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  refreshKey: number;
  bumpRefresh: () => void;
};

export function toIsoStartOfDay(d: string): string {
  if (!d) return '';
  const x = new Date(d + 'T00:00:00.000Z');
  return x.toISOString();
}

export function toIsoEndOfDay(d: string): string {
  if (!d) return '';
  const x = new Date(d + 'T23:59:59.999Z');
  return x.toISOString();
}
