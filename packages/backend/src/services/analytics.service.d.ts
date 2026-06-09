export interface DateRange {
    from: Date;
    to: Date;
}
export declare function getSummary(from?: string, to?: string): Promise<{
    period: {
        from: string;
        to: string;
    };
    ordersTotal: number;
    ordersCompleted: number;
    ordersCancelled: number;
    gmv: string;
    platformFees: string;
    averageRating: number | null;
    driversOnlineNow: number;
}>;
export declare function getPeaks(from?: string, to?: string, limit?: number): Promise<{
    hourUtc: string;
    orderCount: number;
    revenue: string;
}[]>;
export declare function getRouteEfficiency(from?: string, to?: string): Promise<{
    sampleSize: number;
    averageExtraKmVsPlanned: number;
    orders: {
        id: string;
        distanceKm: number;
        plannedRouteDistanceKm: number | null;
        actualRouteDistanceKm: number | null;
    }[];
}>;
/** Approximate congestion: average speed (km/h) per coarse grid cell from location_logs. */
export declare function getTrafficHexGrid(from?: string, to?: string, cellDegrees?: number): Promise<{
    type: "FeatureCollection";
    features: {
        type: "Feature";
        properties: {
            avgSpeedKmh: number;
            sampleCount: number;
            congestionIndex: number;
        };
        geometry: {
            type: "Polygon";
            coordinates: number[][][];
        };
    }[];
}>;
export declare function getFinanceOpex(from?: string, to?: string): Promise<{
    fleetMaintenance: {
        total: string;
        records: number;
    };
    payrollAccruals: {
        total: string;
        records: number;
    };
    operatingExpenses: {
        total: string;
        records: number;
    };
    driverPayoutsOrders: {
        total: string;
        transactions: number;
    };
}>;
export declare function computeActualKmForOrder(orderId: string): Promise<number>;
/** Погодинний попит за часом створення замовлення (усі статуси). */
export declare function getDemandHourlySeries(from?: string, to?: string): Promise<{
    bucketUtc: string;
    orderCount: number;
}[]>;
/** Автоматичні «години пік» — години з кількістю замовлень вище середнього + k×σ. */
export declare function getPeakHoursDetected(from?: string, to?: string): Promise<{
    mean: number;
    stdDev: number;
    threshold: number;
    peaks: {
        bucketUtc: string;
        orderCount: number;
        zScore: number;
    }[];
}>;
/**
 * Спрощений прогноз на наступні 168 годин: база — середнє по (день тижня × година) з історії,
 * множники вихідних та «святкових» дат (статичний список UA для 2026 як приклад).
 */
export declare function getDemandForecast(from?: string, to?: string): Promise<{
    methodology: string;
    historyBuckets: number;
    forecastAnchorUtc: string;
    forecast: {
        bucketUtc: string;
        predictedOrders: number;
        isWeekend: boolean;
        isHoliday: boolean;
    }[];
}>;
/** Динамічне surge: середній коефіцієнт по годинах (створення замовлення). */
export declare function getSurgeTimeSeries(from?: string, to?: string): Promise<{
    bucketUtc: string;
    avgSurge: number;
    orderCount: number;
    avgCheck: string;
}[]>;
/** Теплова сітка попиту (pickup) та середній чек по клітинках. */
export declare function getPickupDemandGrid(from?: string, to?: string, cellDegrees?: number): Promise<{
    type: "FeatureCollection";
    cellDegrees: number;
    features: {
        type: "Feature";
        properties: {
            orderCount: number;
            avgCheck: number;
            completedRatio: number;
        };
        geometry: {
            type: "Polygon";
            coordinates: number[][][];
        };
    }[];
    topProfitableZones: {
        key: string;
        lat: number;
        lng: number;
        orderCount: number;
        avgCheck: number;
        completedRatio: number;
        intensity: number;
    }[];
    topHotspots: {
        key: string;
        lat: number;
        lng: number;
        orderCount: number;
        avgCheck: number;
        completedRatio: number;
        intensity: number;
    }[];
}>;
/** Денний розріз фінансів (завершені замовлення). */
export declare function getFinancialDailySeries(from?: string, to?: string): Promise<{
    dayUtc: string;
    trips: number;
    gmv: string;
    platformFees: string;
    driverEarnings: string;
}[]>;
/** Рядки для експорту (агреговані завершені поїздки по днях — вже є в daily; додамо плоский список замовлень скорочено). */
export declare function getOrdersExportRows(from?: string, to?: string, limit?: number): Promise<{
    id: string;
    status: import(".prisma/client").$Enums.OrderStatus;
    createdAt: string;
    finishedAt: string;
    totalPrice: string;
    platformFee: string;
    driverEarning: string;
    surge: number;
    pickup: string;
    dropoff: string;
    payment: import(".prisma/client").$Enums.PaymentMethod;
    client: string;
    clientPhone: string;
    driver: string;
}[]>;
/** KPI водіїв за період (завершені поїздки, сума, виплати, комісія, скасування, рейтинг). */
export declare function getDriverKpis(from?: string, to?: string): Promise<{
    driverId: string;
    fullName: string;
    vehicle: string;
    verificationStatus: import(".prisma/client").$Enums.DriverVerificationStatus | null;
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
}[]>;
//# sourceMappingURL=analytics.service.d.ts.map