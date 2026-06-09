/**
 * Аналітичний модуль дорожнього руху.
 *
 * Аналізує:
 *  - Історичні GPS-треки водіїв (LocationLog) для оцінки швидкості по сегментах міста
 *  - Поточну годину (peak / off-peak)
 *  - Кількість BUSY водіїв у коридорі (непрямий індикатор завантаженості)
 *  - Відстань, час, геометрію маршруту
 *
 * Видає composite score для кожного маршруту й рекомендує найкращий.
 */
import type { RouteAlternativeOption } from './googleDirections.service';
export interface TrafficAnalysis {
    /** 0–100, вищий = краще (менше заторів, швидше, коротше) */
    score: number;
    adjustedDurationSec: number;
    congestionLevel: 'low' | 'moderate' | 'high';
    avgSpeedKmh: number;
    busyDriversInCorridor: number;
    timePeriod: string;
    insights: string[];
}
export declare function analyzeRoute(option: RouteAlternativeOption): Promise<TrafficAnalysis>;
export declare function analyzeAndRankRoutes(options: RouteAlternativeOption[]): Promise<{
    options: RouteAlternativeOption[];
    recommendedIndex: number;
    analyses: TrafficAnalysis[];
}>;
//# sourceMappingURL=trafficAnalytics.service.d.ts.map