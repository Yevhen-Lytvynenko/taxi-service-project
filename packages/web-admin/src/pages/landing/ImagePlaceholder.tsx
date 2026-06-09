import { useState } from 'react';
import { Box, Typography } from '@mui/material';

type ImagePlaceholderProps = {
  /** Відносний URL у `public/landing/`, напр. `/landing/service-city.jpg` */
  src?: string;
  /** Ширина / висота (напр. 16/9) */
  ratio?: number;
  label: string;
};

/** Плейсхолдер під фото: показує зображення, якщо файл є; інакше — підпис на сірому фоні. */
export function ImagePlaceholder({ src, ratio = 16 / 9, label }: ImagePlaceholderProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);
  const showImg = src && !failed;
  const paddingTop = `${(1 / ratio) * 100}%`;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        pt: paddingTop,
        bgcolor: 'grey.200',
        borderRadius: 2,
        overflow: 'hidden',
        background: showImg && !loaded ? 'grey.300' : 'transparent',
      }}
    >
      {showImg ? (
        <Box
          component="img"
          src={src}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        />
      ) : null}
      {(!showImg || !loaded) && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            background: showImg && !loaded ? 'grey.300' : 'linear-gradient(135deg, #eee 0%, #e0e0e0 100%)',
          }}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {label}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
