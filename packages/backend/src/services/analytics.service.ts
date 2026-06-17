import { Prisma } from '@prisma/client';
import { getPlatformCommissionRate } from '../config/env';
import { haversineDistanceKm } from './geocode.service';
import { prisma } from '../lib/prisma';

export interface DateRange {
  from: Date;
  to: Date;
}

function parseRange(from?: string, to?: string): DateRange {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new Error('Invalid from/to date');
  }
  return { from: fromDate, to: toDate };
}

function truncateToUtcHour(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0));
}

/** Заповнює пропуски нулями для неперервного графіка попиту. */
function fillMissingHourlyBuckets(
  series: { bucketUtc: string; orderCount: number }[],
  from: Date,
  to: Date
): { bucketUtc: string; orderCount: number }[] {
  const byHour = new Map<number, number>();
  for (const s of series) {
    byHour.set(truncateToUtcHour(new Date(s.bucketUtc)).getTime(), s.orderCount);
  }
  const start = truncateToUtcHour(from);
  const end = truncateToUtcHour(to);
  const out: { bucketUtc: string; orderCount: number }[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 3600 * 1000) {
    out.push({
      bucketUtc: new Date(t).toISOString(),
      orderCount: byHour.get(t) ?? 0,
    });
  }
  return out;
}

export async function getSummary(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);

  const [
    ordersCount,
    completed,
    cancelled,
    platformFeeRow,
    gmvRow,
    avgRating,
    driverOnline,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: f, lte: t } },
    }),
    prisma.order.count({
      where: {
        status: 'COMPLETED',
        finishedAt: { gte: f, lte: t },
      },
    }),
    prisma.order.count({
      where: {
        status: 'CANCELLED',
        updatedAt: { gte: f, lte: t },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        finishedAt: { gte: f, lte: t },
      },
      _sum: { platformFeeAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        finishedAt: { gte: f, lte: t },
      },
      _sum: { totalPrice: true },
    }),
    prisma.review.aggregate({
      where: { createdAt: { gte: f, lte: t } },
      _avg: { rating: true },
    }),
    prisma.driverProfile.count({ where: { status: 'ONLINE' } }),
  ]);

  return {
    period: { from: f.toISOString(), to: t.toISOString() },
    ordersTotal: ordersCount,
    ordersCompleted: completed,
    ordersCancelled: cancelled,
    gmv: gmvRow._sum.totalPrice?.toString() ?? '0',
    platformFees: platformFeeRow._sum.platformFeeAmount?.toString() ?? '0',
    averageRating: avgRating._avg.rating ?? null,
    driversOnlineNow: driverOnline,
  };
}

export async function getPeaks(from?: string, to?: string, limit = 12) {
  const { from: f, to: t } = parseRange(from, to);
  const lim = Math.min(100, Math.max(1, limit));
  const rows = await prisma.$queryRaw<
    { bucket: Date; order_count: bigint; revenue: Prisma.Decimal | null }[]
  >`
    SELECT date_trunc('hour', o."finishedAt") AS bucket,
           COUNT(*)::bigint AS order_count,
           SUM(o."totalPrice") AS revenue
    FROM orders o
    WHERE o.status = 'COMPLETED'
      AND o."finishedAt" >= ${f} AND o."finishedAt" <= ${t}
    GROUP BY 1
    ORDER BY revenue DESC NULLS LAST
    LIMIT ${lim}
  `;

  return rows.map((r) => ({
    hourUtc: r.bucket.toISOString(),
    orderCount: Number(r.order_count),
    revenue: r.revenue?.toString() ?? '0',
  }));
}

export async function getRouteEfficiency(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);
  const orders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      finishedAt: { gte: f, lte: t },
      plannedRouteDistanceKm: { not: null },
    },
    select: {
      id: true,
      plannedRouteDistanceKm: true,
      actualRouteDistanceKm: true,
      distanceKm: true,
    },
  });

  let extraKmSum = 0;
  let n = 0;
  for (const o of orders) {
    const planned = o.plannedRouteDistanceKm ?? o.distanceKm;
    const actual =
      o.actualRouteDistanceKm ?? planned;
    if (planned > 0) {
      extraKmSum += Math.max(0, actual - planned);
      n++;
    }
  }
  return {
    sampleSize: n,
    averageExtraKmVsPlanned: n ? extraKmSum / n : 0,
    orders: orders.slice(0, 50),
  };
}

/** Approximate congestion: average speed (km/h) per coarse grid cell from location_logs. */
export async function getTrafficHexGrid(
  from?: string,
  to?: string,
  cellDegrees = 0.01
) {
  const { from: f, to: t } = parseRange(from, to);

  const logs = await prisma.locationLog.findMany({
    where: { timestamp: { gte: f, lte: t } },
    select: { lat: true, lng: true, speed: true },
    take: 50_000,
  });

  type Cell = { key: string; speedSum: number; speedN: number; count: number };
  const map = new Map<string, Cell>();

  for (const p of logs) {
    const gx = Math.floor(p.lat / cellDegrees);
    const gy = Math.floor(p.lng / cellDegrees);
    const key = `${gx}:${gy}`;
    let c = map.get(key);
    if (!c) {
      c = { key, speedSum: 0, speedN: 0, count: 0 };
      map.set(key, c);
    }
    c.count += 1;
    if (p.speed != null && p.speed > 0) {
      c.speedSum += p.speed;
      c.speedN += 1;
    }
  }

  const features = [...map.values()].map((c) => {
    const avgSpeed = c.speedN > 0 ? c.speedSum / c.speedN : 25;
    const lat0 = Number(c.key.split(':')[0]) * cellDegrees;
    const lng0 = Number(c.key.split(':')[1]) * cellDegrees;
    return {
      type: 'Feature' as const,
      properties: {
        avgSpeedKmh: avgSpeed,
        sampleCount: c.count,
        congestionIndex: Math.max(0, Math.min(1, 1 - avgSpeed / 50)),
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [lng0, lat0],
            [lng0 + cellDegrees, lat0],
            [lng0 + cellDegrees, lat0 + cellDegrees],
            [lng0, lat0 + cellDegrees],
            [lng0, lat0],
          ],
        ],
      },
    };
  });

  return {
    type: 'FeatureCollection' as const,
    features,
  };
}

export async function getFinanceOpex(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);

  const [maintenance, payroll, opex, driverPayouts] = await Promise.all([
    prisma.vehicleMaintenanceRecord.aggregate({
      where: { serviceDate: { gte: f, lte: t } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payrollAccrual.aggregate({
      where: { createdAt: { gte: f, lte: t } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.operatingExpense.aggregate({
      where: { expenseDate: { gte: f, lte: t } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: f, lte: t },
        type: 'ORDER_EARNING',
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    fleetMaintenance: {
      total: maintenance._sum.amount?.toString() ?? '0',
      records: maintenance._count,
    },
    payrollAccruals: {
      total: payroll._sum.amount?.toString() ?? '0',
      records: payroll._count,
    },
    operatingExpenses: {
      total: opex._sum.amount?.toString() ?? '0',
      records: opex._count,
    },
    driverPayoutsOrders: {
      total: driverPayouts._sum.amount?.toString() ?? '0',
      transactions: driverPayouts._count,
    },
  };
}

export async function computeActualKmForOrder(orderId: string): Promise<number> {
  const logs = await prisma.locationLog.findMany({
    where: { orderId },
    orderBy: { timestamp: 'asc' },
    select: { lat: true, lng: true },
  });
  let km = 0;
  for (let i = 1; i < logs.length; i++) {
    const a = logs[i - 1]!;
    const b = logs[i]!;
    km += haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);
  }
  return km;
}

/** Погодинний попит за часом створення замовлення (усі статуси). */
export async function getDemandHourlySeries(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);
  const rows = await prisma.$queryRaw<{ bucket: Date; order_count: bigint }[]>`
    SELECT date_trunc('hour', o."createdAt") AS bucket,
           COUNT(*)::bigint AS order_count
    FROM orders o
    WHERE o."createdAt" >= ${f} AND o."createdAt" <= ${t}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return fillMissingHourlyBuckets(
    rows.map((r) => ({
      bucketUtc: r.bucket.toISOString(),
      orderCount: Number(r.order_count),
    })),
    f,
    t
  );
}

/** Автоматичні «години пік» — години з кількістю замовлень вище середнього + k×σ. */
export async function getPeakHoursDetected(from?: string, to?: string) {
  const series = await getDemandHourlySeries(from, to);
  if (series.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      threshold: 0,
      peaks: [] as { bucketUtc: string; orderCount: number; zScore: number }[],
    };
  }
  const counts = series.map((s) => s.orderCount);
  const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance =
    counts.reduce((acc, c) => acc + (c - mean) ** 2, 0) / Math.max(1, counts.length);
  const std = Math.sqrt(variance);
  const threshold = mean + (std > 0.01 ? std : mean * 0.25);
  const peaks = series
    .filter((s) => s.orderCount >= threshold && s.orderCount > 0)
    .map((s) => ({
      bucketUtc: s.bucketUtc,
      orderCount: s.orderCount,
      zScore: std > 0.01 ? (s.orderCount - mean) / std : 0,
    }))
    .sort((a, b) => b.orderCount - a.orderCount);
  return { mean, stdDev: std, threshold, peaks };
}

/**
 * Спрощений прогноз на наступні 168 годин: база — середнє по (день тижня × година) з історії,
 * множники вихідних та «святкових» дат (статичний список UA для 2026 як приклад).
 */
export async function getDemandForecast(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);
  const history = await prisma.$queryRaw<{ dow: number; hr: number; avg_cnt: number }[]>`
    SELECT EXTRACT(DOW FROM bucket)::int AS dow,
           EXTRACT(HOUR FROM bucket)::int AS hr,
           AVG(cnt)::float AS avg_cnt
    FROM (
      SELECT date_trunc('hour', o."createdAt") AS bucket,
             COUNT(*)::float AS cnt
      FROM orders o
      WHERE o."createdAt" >= ${f} AND o."createdAt" <= ${t}
      GROUP BY 1
    ) sub
    GROUP BY 1, 2
  `;

  const key = (dow: number, hr: number) => `${dow}:${hr}`;
  const heat = new Map<string, number>();
  for (const r of history) {
    heat.set(key(r.dow, r.hr), r.avg_cnt);
  }

  const holidayDates = new Set([
    '2026-01-01',
    '2026-01-07',
    '2026-03-08',
    '2026-04-20',
    '2026-05-01',
    '2026-05-09',
    '2026-06-23',
    '2026-06-28',
    '2026-08-24',
    '2026-10-14',
    '2026-12-25',
  ]);

  const globalAvg =
    history.length > 0
      ? history.reduce((acc, r) => acc + r.avg_cnt, 0) / history.length
      : 1;

  const serverNow = Date.now();
  const anchor = new Date(Math.min(serverNow, t.getTime()));

  const forecast: { bucketUtc: string; predictedOrders: number; isWeekend: boolean; isHoliday: boolean }[] = [];
  for (let h = 0; h < 168; h++) {
    const d = new Date(anchor.getTime() + h * 3600 * 1000);
    const dow = d.getUTCDay();
    const hr = d.getUTCHours();
    const ymd = d.toISOString().slice(0, 10);
    const base = heat.get(key(dow, hr)) ?? globalAvg;
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = holidayDates.has(ymd);
    let mult = 1;
    if (isWeekend) mult *= 1.12;
    if (isHoliday) mult *= 1.18;
    forecast.push({
      bucketUtc: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hr, 0, 0)).toISOString(),
      predictedOrders: Math.max(0, Math.round(base * mult * 10) / 10),
      isWeekend,
      isHoliday,
    });
  }

  return {
    methodology:
      'baseline = avg hourly buckets by (weekday × hour) over selected period; next 168h from min(now, period end); weekend ×1.12; UA holidays ×1.18',
    methodologyUk:
      'Середнє замовлень за годину для кожної пари «день тижня × година», прогноз на 168 год вперед від кінця періоду (або від зараз), коригування на вихідні (+12%) та свята (+18%).',
    historyBuckets: history.length,
    forecastAnchorUtc: anchor.toISOString(),
    forecast,
  };
}

/** Динамічне surge: середній коефіцієнт по годинах (створення замовлення). */
export async function getSurgeTimeSeries(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);
  const rows = await prisma.$queryRaw<{
    bucket: Date;
    avg_surge: number | null;
    order_count: bigint;
    avg_price: Prisma.Decimal | null;
  }[]>`
    SELECT date_trunc('hour', o."createdAt") AS bucket,
           AVG(o."surgeMultiplier")::float AS avg_surge,
           COUNT(*)::bigint AS order_count,
           AVG(o."totalPrice") AS avg_price
    FROM orders o
    WHERE o."createdAt" >= ${f} AND o."createdAt" <= ${t}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({
    bucketUtc: r.bucket.toISOString(),
    avgSurge: r.avg_surge ?? 1,
    orderCount: Number(r.order_count),
    avgCheck: r.avg_price?.toString() ?? '0',
  }));
}

/** Теплова сітка попиту (pickup) та середній чек по клітинках. */
export async function getPickupDemandGrid(from?: string, to?: string, cellDegrees = 0.012) {
  const { from: f, to: t } = parseRange(from, to);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: f, lte: t } },
    select: { pickupLat: true, pickupLng: true, totalPrice: true, status: true },
    take: 25_000,
  });

  type Cell = { count: number; sumPrice: number; completed: number };
  const grid = new Map<string, Cell>();
  for (const o of orders) {
    const gx = Math.floor(o.pickupLat / cellDegrees);
    const gy = Math.floor(o.pickupLng / cellDegrees);
    const k = `${gx}:${gy}`;
    let c = grid.get(k);
    if (!c) {
      c = { count: 0, sumPrice: 0, completed: 0 };
      grid.set(k, c);
    }
    c.count += 1;
    c.sumPrice += Number(o.totalPrice);
    if (o.status === 'COMPLETED') c.completed += 1;
  }

  const cells = [...grid.entries()].map(([key, c]) => {
    const [gx, gy] = key.split(':').map(Number);
    const lat0 = gx! * cellDegrees;
    const lng0 = gy! * cellDegrees;
    return {
      key,
      lat: lat0 + cellDegrees / 2,
      lng: lng0 + cellDegrees / 2,
      orderCount: c.count,
      avgCheck: c.count ? c.sumPrice / c.count : 0,
      completedRatio: c.count ? c.completed / c.count : 0,
      intensity: c.count,
    };
  });

  const profitable = [...cells].sort((a, b) => b.avgCheck - a.avgCheck).slice(0, 15);
  const hotspots = [...cells].sort((a, b) => b.orderCount - a.orderCount).slice(0, 15);

  const features = cells.map((cell) => {
    const lat0 = cell.lat - cellDegrees / 2;
    const lng0 = cell.lng - cellDegrees / 2;
    return {
      type: 'Feature' as const,
      properties: {
        orderCount: cell.orderCount,
        avgCheck: cell.avgCheck,
        completedRatio: cell.completedRatio,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [lng0, lat0],
            [lng0 + cellDegrees, lat0],
            [lng0 + cellDegrees, lat0 + cellDegrees],
            [lng0, lat0 + cellDegrees],
            [lng0, lat0],
          ],
        ],
      },
    };
  });

  return {
    type: 'FeatureCollection' as const,
    cellDegrees,
    features,
    topProfitableZones: profitable,
    topHotspots: hotspots,
  };
}

/** Денний розріз фінансів (завершені замовлення). */
export async function getFinancialDailySeries(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);
  const rows = await prisma.$queryRaw<{
    bucket: Date;
    trips: bigint;
    gmv: Prisma.Decimal | null;
    fees: Prisma.Decimal | null;
    driver_earn: Prisma.Decimal | null;
  }[]>`
    SELECT date_trunc('day', o."finishedAt") AS bucket,
           COUNT(*)::bigint AS trips,
           SUM(o."totalPrice") AS gmv,
           SUM(o."platformFeeAmount") AS fees,
           SUM(o."driverEarningAmount") AS driver_earn
    FROM orders o
    WHERE o.status = 'COMPLETED'
      AND o."finishedAt" >= ${f} AND o."finishedAt" <= ${t}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({
    dayUtc: r.bucket.toISOString().slice(0, 10),
    trips: Number(r.trips),
    gmv: r.gmv?.toString() ?? '0',
    platformFees: r.fees?.toString() ?? '0',
    driverEarnings: r.driver_earn?.toString() ?? '0',
  }));
}

/** Рядки для експорту (агреговані завершені поїздки по днях — вже є в daily; додамо плоский список замовлень скорочено). */
export async function getOrdersExportRows(from?: string, to?: string, limit = 5000) {
  const { from: f, to: t } = parseRange(from, to);
  const lim = Math.min(20_000, Math.max(1, limit));
  const rows = await prisma.order.findMany({
    where: {
      createdAt: { gte: f, lte: t },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      finishedAt: true,
      totalPrice: true,
      platformFeeAmount: true,
      driverEarningAmount: true,
      surgeMultiplier: true,
      pickupAddress: true,
      dropoffAddress: true,
      paymentMethod: true,
      client: { select: { fullName: true, phone: true } },
      driver: { select: { user: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: lim,
  });
  return rows.map((o) => ({
    id: o.id,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    finishedAt: o.finishedAt?.toISOString() ?? '',
    totalPrice: o.totalPrice.toString(),
    platformFee: o.platformFeeAmount?.toString() ?? '',
    driverEarning: o.driverEarningAmount?.toString() ?? '',
    surge: o.surgeMultiplier,
    pickup: o.pickupAddress,
    dropoff: o.dropoffAddress,
    payment: o.paymentMethod,
    client: o.client.fullName,
    clientPhone: o.client.phone,
    driver: o.driver?.user.fullName ?? '',
  }));
}

/** KPI водіїв за період (завершені поїздки, сума, виплати, комісія, скасування, рейтинг). */
export async function getDriverKpis(from?: string, to?: string) {
  const { from: f, to: t } = parseRange(from, to);
  const commissionRate = getPlatformCommissionRate();

  /** Якщо в БД немає platformFee/driverEarning (старі записи), рахуємо як при COMPLETED у order.controller. */
  const completedRows = await prisma.$queryRaw<
    Array<{
      driver_id: string;
      completed_count: bigint;
      gmv_sum: Prisma.Decimal | null;
      fee_sum: Prisma.Decimal | null;
      earn_sum: Prisma.Decimal | null;
      km_sum: number | null;
    }>
  >`
    SELECT
      o."driverId"::text AS driver_id,
      COUNT(*)::bigint AS completed_count,
      SUM(o."totalPrice") AS gmv_sum,
      SUM(
        ROUND(
          COALESCE(
            o."platformFeeAmount",
            o."totalPrice"::numeric * ${commissionRate}
          )::numeric,
          2
        )
      ) AS fee_sum,
      SUM(
        ROUND(
          (
            COALESCE(
              o."driverEarningAmount",
              o."totalPrice"::numeric
                - COALESCE(
                    o."platformFeeAmount",
                    o."totalPrice"::numeric * ${commissionRate}
                  )
            )
          )::numeric,
          2
        )
      ) AS earn_sum,
      SUM(COALESCE(o."actualRouteDistanceKm", o."distanceKm", 0)::double precision) AS km_sum
    FROM orders o
    WHERE o.status = 'COMPLETED'
      AND o."finishedAt" >= ${f}
      AND o."finishedAt" <= ${t}
      AND o."driverId" IS NOT NULL
    GROUP BY o."driverId"
  `;

  const completedMap = new Map<
    string,
    { trips: number; gross: number; fees: number; earn: number; km: number }
  >();
  for (const r of completedRows) {
    completedMap.set(r.driver_id, {
      trips: Number(r.completed_count),
      gross: Number(r.gmv_sum ?? 0),
      fees: Number(r.fee_sum ?? 0),
      earn: Number(r.earn_sum ?? 0),
      km: Number(r.km_sum ?? 0),
    });
  }

  const cancelled = await prisma.order.groupBy({
    by: ['driverId'],
    where: {
      status: 'CANCELLED',
      updatedAt: { gte: f, lte: t },
      driverId: { not: null },
    },
    _count: { id: true },
    _sum: { totalPrice: true },
  });

  const cancelledMap = new Map(
    cancelled
      .filter((o) => o.driverId)
      .map((o) => [
        o.driverId!,
        {
          count: o._count.id,
          lost: Number(o._sum.totalPrice ?? 0),
        },
      ])
  );

  const driverIds = [...new Set([...completedMap.keys(), ...cancelledMap.keys()])];
  const profiles = await prisma.driverProfile.findMany({
    where: { id: { in: driverIds } },
    include: {
      user: { select: { fullName: true } },
      vehicle: { select: { model: true, plateNumber: true } },
    },
  });
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const reviewAgg = await prisma.review.groupBy({
    by: ['driverId'],
    where: { driverId: { not: null } },
    _avg: { rating: true },
    _count: { id: true },
  });
  const reviewMap = new Map(reviewAgg.map((r) => [r.driverId, r]));

  const onlineLogs = await prisma.$queryRaw<{ driver_id: string; hours_est: number }[]>`
    SELECT
      ll."driverId"::text AS driver_id,
      LEAST(168, COUNT(*) / 60.0)::float AS hours_est
    FROM location_logs ll
    WHERE ll.timestamp >= ${f} AND ll.timestamp <= ${t}
    GROUP BY ll."driverId"
  `;
  const onlineMap = new Map(onlineLogs.map((r) => [r.driver_id, r.hours_est]));

  return driverIds
    .map((id) => {
      const c = completedMap.get(id);
      const cx = cancelledMap.get(id);
      const p = profileMap.get(id);
      const rev = reviewMap.get(id);
      const trips = c?.trips ?? 0;
      const gross = c?.gross ?? 0;
      const earn = c?.earn ?? 0;
      const fees = c?.fees ?? 0;
      const kmPassenger = c?.km ?? 0;
      const estOnline = onlineMap.get(id) ?? 0;
      const coldKmEstimate =
        estOnline > 0.5 ? Math.max(0, estOnline * 18 - kmPassenger) : null;
      const cancelledTrips = cx?.count ?? 0;
      const lostGmv = cx?.lost ?? 0;
      return {
        driverId: id,
        fullName: p?.user.fullName ?? '—',
        vehicle: p?.vehicle ? `${p.vehicle.model} ${p.vehicle.plateNumber}` : '—',
        verificationStatus: p?.verificationStatus ?? null,
        completedTrips: trips,
        gmvAttributed: gross.toFixed(2),
        driverEarningsTotal: earn.toFixed(2),
        platformFeesTotal: fees.toFixed(2),
        cancelledTrips,
        lossesFromCancelled: lostGmv.toFixed(2),
        avgCheck: trips ? (gross / trips).toFixed(2) : '0',
        avgRating: rev?._avg.rating ?? null,
        reviewsCount: rev?._count.id ?? 0,
        passengerKmTotal: kmPassenger.toFixed(1),
        estimatedOnlineHours: Math.round(estOnline * 10) / 10,
        coldKmApprox: coldKmEstimate != null ? Math.round(coldKmEstimate * 10) / 10 : null,
      };
    })
    .sort((a, b) => b.completedTrips - a.completedTrips || Number(b.gmvAttributed) - Number(a.gmvAttributed));
}

