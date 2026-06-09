import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { BRAND_NAME } from '../config/brand';
import { StrumLogoMark } from './StrumLogoMark';

type BrandLogoProps = {
  /** Висота літери «S» (іконка) та масштаб напису «trum» */
  size?: number;
  /** Показати «trum» поруч (іконка замінює «S») */
  showName?: boolean;
  sx?: SxProps<Theme>;
};

export function BrandLogo({ size = 36, showName = true, sx }: BrandLogoProps) {
  const fontSize = Math.round(size * 0.85);
  const rest = BRAND_NAME.slice(1);

  return (
    <Box
      role={showName ? undefined : 'img'}
      aria-label={showName ? undefined : BRAND_NAME}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showName ? '0.04em' : 0,
        lineHeight: 1,
        ...sx,
      }}
    >
      <StrumLogoMark size={size} />
      {showName && (
        <Typography
          component="span"
          aria-label={BRAND_NAME}
          sx={{
            fontWeight: 800,
            letterSpacing: 2,
            lineHeight: 1,
            color: 'text.primary',
            fontSize,
          }}
        >
          {rest}
        </Typography>
      )}
    </Box>
  );
}
