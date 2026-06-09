import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/**
 * Візуал тарифів UKLON-style: іконки за замовчуванням.
 * Щоб підставити свої картинки — задайте `imageUrl` (https) для коду тарифу; тоді рендериться `Image`, а не іконка.
 */
export type TariffVisualSpec = {
  icon: IconName;
  imageUrl?: string | null;
};

export const TARIFF_VISUAL: Record<string, TariffVisualSpec> = {
  ECONOMY: { icon: 'car-outline', imageUrl: null },
  STANDARD: { icon: 'car-side', imageUrl: null },
  COMFORT: { icon: 'car-seat-cooler', imageUrl: null },
  BUSINESS: { icon: 'briefcase-outline', imageUrl: null },
  MINIVAN: { icon: 'car-estate', imageUrl: null },
  DELIVERY: { icon: 'package-variant-closed', imageUrl: null },
  EXPRESS: { icon: 'flash-outline', imageUrl: null },
};

export function getTariffVisual(code: string): TariffVisualSpec {
  return TARIFF_VISUAL[code] ?? { icon: 'taxi', imageUrl: null };
}
