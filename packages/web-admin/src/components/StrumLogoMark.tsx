import { Box, type SxProps, type Theme } from '@mui/material';
import { BRAND_LOGO_SRC } from '../config/brand';

type StrumLogoMarkProps = {
  size?: number;
  sx?: SxProps<Theme>;
};

/**
 * Знак Strum з `public/vite.svg`.
 * Редагуйте лише файл у public — не дублюйте SVG у коді.
 */
export function StrumLogoMark({ size = 36, sx }: StrumLogoMarkProps) {
  return (
    <Box
      component="img"
      src={BRAND_LOGO_SRC}
      alt=""
      aria-hidden
      sx={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        ...sx,
      }}
    />
  );
}
