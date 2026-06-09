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

import { prisma } from '../lib/prisma';
import { haversineMeters, polylineLengthMeters } from './route.service';
import type { RouteAlternativeOption } from './googleDirections.service';
import { logger } from '../lib/logger';

// ── Grid-based speed heatmap from GPS logs ──────────────────────────

const GRID_CELL_DEG = 0.003;
const HEATMAP_CACHE_TTL_MS = 5 * 60_000;

interface SpeedCell {
  avgSpeedKmh: number;
  sampleCount: number;
}

let heatmapCache: Map<string, SpeedCell> | null = null;
let heatmapCacheTime = 0;

function cellKey(lat: number, lng: number): string {
  const r = Math.floor(lat / GRID_CELL_DEG);
  const c = Math.floor(lng / GRID_CELL_DEG);
  return `${r}_${c}`;
}

async function buildSpeedHeatmap(): Promise<Map<string, SpeedCell>> {
  const now = Date.now();
  if (heatmapCache && now - heatmapCacheTime < HEATMAP_CACHE_TTL_MS) {
    return heatmapCache;
  }

  const since = new Date(now - 7 * 24 * 60 * 60_000);
  const hourNow = new Date().getUTCHours();
  const hourLo = (hourNow - 2 + 24) % 24;
  const hourHi = (hourNow + 2) % 24;

  const logs = await prisma.locationLog.findMany({
    where: {
      timestamp: { gte: since },
      speed: { not: null, gt: 0 },
    },
    select: { lat: true, lng: true, speed: true, timestamp: true },
    orderBy: { timestamp: 'desc' },
    take: 30_000,
  });

  const cells = new Map<string, { totalSpeed: number; count: number }>();

  for (const log of logs) {
    const h = log.timestamp.getUTCHours();
    const inWindow = hourLo <= hourHi
      ? h >= hourLo && h <= hourHi
      : h >= hourLo || h <= hourHi;
    const weight = inWindow ? 2.0 : 0.5;
    const key = cellKey(log.lat, log.lng);
    const cell = cells.get(key) ?? { totalSpeed: 0, count: 0 };
    cell.totalSpeed += (log.speed ?? 0) * weight;
    cell.count += weight;
    cells.set(key, cell);
  }

  const result = new Map<string, SpeedCell>();
  for (const [key, { totalSpeed, count }] of cells) {
    result.set(key, {
      avgSpeedKmh: totalSpeed / count,
      sampleCount: Math.round(count),
    });
  }

  heatmapCache = result;
  heatmapCacheTime = now;
  return result;
}

// ── Busy drivers in corridor ────────────────────────────────────────

async function countBusyDriversInCorridor(
  coords: Array<[number, number]>,
  corridorMeters = 600
): Promise<number> {
  if (coords.length < 2) return 0;

  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const minLng = Math.min(first[0], last[0]) - 0.008;
  const maxLng = Math.max(first[0], last[0]) + 0.008;
  const minLat = Math.min(first[1], last[1]) - 0.008;
  const maxLat = Math.max(first[1], last[1]) + 0.008;

  const busy = await prisma.driverProfile.findMany({
    where: {
      status: 'BUSY',
      currentLat: { gte: minLat, lte: maxLat },
      currentLng: { gte: minLng, lte: maxLng },
    },
    select: { currentLat: true, currentLng: true },
  });

  let count = 0;
  for (const d of busy) {
    if (d.currentLat == null || d.currentLng == null) continue;
    let minDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const c = coords[i]!;
      const dist = haversineMeters([c[0], c[1]], [d.currentLng, d.currentLat]);
      if (dist < minDist) minDist = dist;
      if (minDist < corridorMeters) break;
    }
    if (minDist < corridorMeters) count++;
  }
  return count;
}

// ── Time-of-day factor ──────────────────────────────────────────────

function getTimePenaltyFactor(): { factor: number; label: string } {
  const h = new Date().getHours();
  if ((h >= 8 && h < 10) || (h >= 17 && h < 20)) {
    return { factor: 1.35, label: 'пік' };
  }
  if ((h >= 7 && h < 8) || (h >= 10 && h < 11) || (h >= 16 && h < 17) || (h >= 20 && h < 21)) {
    return { factor: 1.15, label: 'передпік' };
  }
  if (h >= 23 || h < 6) {
    return { factor: 0.85, label: 'ніч' };
  }
  return { factor: 1.0, label: 'звичайний' };
}

// ── Per-route heatmap traversal ─────────────────────────────────────

function estimateRouteSpeedFromHeatmap(
  coords: Array<[number, number]>,
  heatmap: Map<string, SpeedCell>
): { avgSpeedKmh: number; slowSegments: number; coveredCells: number } {
  if (coords.length < 2) return { avgSpeedKmh: 30, slowSegments: 0, coveredCells: 0 };

  let totalWeight = 0;
  let weightedSpeed = 0;
  let slowSegments = 0;
  let coveredCells = 0;
  const step = Math.max(1, Math.floor(coords.length / 80));

  for (let i = 0; i < coords.length; i += step) {
    const [lng, lat] = coords[i]!;
    const key = cellKey(lat, lng);
    const cell = heatmap.get(key);
    if (cell && cell.sampleCount >= 2) {
      const w = Math.min(cell.sampleCount, 50);
      weightedSpeed += cell.avgSpeedKmh * w;
      totalWeight += w;
      coveredCells++;
      if (cell.avgSpeedKmh < 15) slowSegments++;
    }
  }

  const avgSpeed = totalWeight > 0 ? weightedSpeed / totalWeight : 30;
  return { avgSpeedKmh: avgSpeed, slowSegments, coveredCells };
}

// ── Composite score ────────────────────────────────────────────

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

export async function analyzeRoute(
  option: RouteAlternativeOption
): Promise<TrafficAnalysis> {
  const heatmap = await buildSpeedHeatmap();
  const { avgSpeedKmh, slowSegments, coveredCells } = estimateRouteSpeedFromHeatmap(
    option.coordinates,
    heatmap
  );

  const busyDrivers = await countBusyDriversInCorridor(option.coordinates);
  const timeFactor = getTimePenaltyFactor();

  const baseSec = option.durationInTrafficSeconds || option.durationSeconds;

  const congestionPenalty = busyDrivers >= 5 ? 1.20 : busyDrivers >= 2 ? 1.08 : 1.0;

  const slowPenalty = slowSegments >= 4 ? 1.18 : slowSegments >= 2 ? 1.08 : 1.0;

  const heatmapSpeedFactor =
    coveredCells >= 3 && avgSpeedKmh < 18 ? 1.22 :
    coveredCells >= 3 && avgSpeedKmh < 25 ? 1.10 : 1.0;

  const adjustedDurationSec = Math.round(
    baseSec * timeFactor.factor * congestionPenalty * slowPenalty * heatmapSpeedFactor
  );

  const congestionLevel: TrafficAnalysis['congestionLevel'] =
    busyDrivers >= 5 || slowSegments >= 4 ? 'high' :
    busyDrivers >= 2 || slowSegments >= 2 ? 'moderate' : 'low';

  const distKm = option.distanceMeters / 1000;
  const durationMin = adjustedDurationSec / 60;
  const distScore = Math.max(0, 100 - distKm * 6);
  const timeScore = Math.max(0, 100 - durationMin * 4);
  const congScore = congestionLevel === 'low' ? 100 : congestionLevel === 'moderate' ? 55 : 15;
  const speedScore = Math.min(100, avgSpeedKmh * 2.5);

  const score = Math.round(
    timeScore * 0.40 +
    distScore * 0.20 +
    congScore * 0.25 +
    speedScore * 0.15
  );

  const insights: string[] = [];
  if (congestionLevel === 'high') {
    insights.push('Висока завантаженість на маршруті');
  } else if (congestionLevel === 'moderate') {
    insights.push('Помірний трафік');
  } else {
    insights.push('Вільна дорога');
  }

  if (timeFactor.label === 'пік') {
    insights.push('Годин-пік — очікуються затримки');
  } else if (timeFactor.label === 'ніч') {
    insights.push('Нічний час — дороги вільні');
  }

  if (coveredCells >= 3 && avgSpeedKmh > 0) {
    insights.push(`Середня швидкість ≈${Math.round(avgSpeedKmh)} км/г (за GPS)`);
  }

  if (busyDrivers >= 3) {
    insights.push(`${busyDrivers} активних авто в коридорі`);
  }

  if (slowSegments >= 3) {
    insights.push(`${slowSegments} повільних ділянок`);
  }

  return {
    score,
    adjustedDurationSec,
    congestionLevel,
    avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
    busyDriversInCorridor: busyDrivers,
    timePeriod: timeFactor.label,
    insights,
  };
}

// ── Main entry: analyze all options, rank, enrich ──────────────

export async function analyzeAndRankRoutes(
  options: RouteAlternativeOption[]
): Promise<{
  options: RouteAlternativeOption[];
  recommendedIndex: number;
  analyses: TrafficAnalysis[];
}> {
  if (options.length === 0) {
    return { options: [], recommendedIndex: 0, analyses: [] };
  }

  const analyses = await Promise.all(options.map(analyzeRoute));

  const scored = options.map((opt, i) => ({
    opt,
    analysis: analyses[i]!,
    originalIdx: i,
  }));
  scored.sort((a, b) => b.analysis.score - a.analysis.score);

  const ranked = scored.map(({ opt, analysis }, i) => {
    const minDur = Math.max(1, Math.round(analysis.adjustedDurationSec / 60));
    const km = (opt.distanceMeters / 1000).toFixed(1);

    const congLabel =
      analysis.congestionLevel === 'low' ? '🟢' :
      analysis.congestionLevel === 'moderate' ? '🟡' : '🔴';

    if (i === 0) {
      opt.label = `Рекомендовано (${analysis.score}/100)`;
    } else {
      opt.label = `Варіант ${i + 1} (${analysis.score}/100)`;
    }

    opt.pros = [];
    opt.cons = [];

    opt.pros.push(`~${minDur} хв, ${km} км ${congLabel}`);

    if (analysis.congestionLevel === 'low') {
      opt.pros.push('Вільна дорога');
    }
    if (analysis.avgSpeedKmh >= 30) {
      opt.pros.push(`Швидкість ~${Math.round(analysis.avgSpeedKmh)} км/г`);
    }

    if (analysis.congestionLevel === 'high') {
      opt.cons.push('Затори на маршруті');
    }
    if (analysis.busyDriversInCorridor >= 3) {
      opt.cons.push(`Багато авто на дорозі`);
    }
    if (analysis.timePeriod === 'пік') {
      opt.cons.push('Година-пік');
    }

    opt.pros = opt.pros.slice(0, 2);
    opt.cons = opt.cons.slice(0, 2);

    opt.durationInTrafficSeconds = analysis.adjustedDurationSec;

    opt.summary =
      analysis.insights.slice(0, 2).join(' · ') ||
      opt.summary;

    return opt;
  });

  ranked.forEach((o, idx) => {
    o.id = String(idx);
  });

  logger.debug(
    {
      routeCount: ranked.length,
      scores: analyses.map((a) => a.score),
      timePeriod: analyses[0]?.timePeriod,
    },
    'Traffic analytics: routes analyzed & ranked'
  );

  return {
    options: ranked,
    recommendedIndex: 0,
    analyses: scored.map((s) => s.analysis),
  };
}
