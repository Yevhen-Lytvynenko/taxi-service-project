import { Box, type SxProps, type Theme } from '@mui/material';
import { BRAND_LOGO_SRC } from '../config/brand';

type BrandWatermarkProps = {
  children: React.ReactNode;
  /** Повторюваний візерунок або одне велике лого по центру */
  variant?: 'tile' | 'center';
  opacity?: number;
  sx?: SxProps<Theme>;
};

/**
 * Обгортка з напівпрозорим фоновим логотипом (водяний знак).
 * Не перехоплює кліки — pointer-events: none на шарі водяного знака.
 */
export function BrandWatermark({
  children,
  variant = 'tile',
  opacity,
  sx,
}: BrandWatermarkProps) {
  const tileOpacity = opacity ?? 0.045;
  const centerOpacity = opacity ?? 0.07;

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: 'inherit',
        isolation: 'isolate',
        overflow: variant === 'tile' ? 'hidden' : undefined,
        '& > *:not([data-watermark])': { position: 'relative', zIndex: 1 },
        ...sx,
      }}
    >
      <Box
        data-watermark
        aria-hidden
        sx={{
          position: 'absolute',
          inset: variant === 'tile' ? '-35%' : 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `url(${BRAND_LOGO_SRC})`,
          backgroundRepeat: variant === 'tile' ? 'repeat' : 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: variant === 'tile' ? '96px 96px' : 'min(50vw, 380px)',
          opacity: variant === 'tile' ? tileOpacity : centerOpacity,
          transform: variant === 'tile' ? 'rotate(-14deg)' : undefined,
        }}
      />
      {children}
    </Box>
  );
}
