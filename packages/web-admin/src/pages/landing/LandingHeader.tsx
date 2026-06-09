import {
  AppBar,
  Button,
  Container,
  Stack,
  Toolbar,
  useScrollTrigger,
} from '@mui/material';
import { BrandLogo } from '../../components/BrandLogo';

const HEADER_OFFSET = { xs: 72, sm: 88 };

type LandingHeaderProps = {
  onNavigate: (sectionId: string) => void;
};

export function LandingHeader({ onNavigate }: LandingHeaderProps) {
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={scrolled ? 6 : 0}
      sx={{
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 2,
        bgcolor: scrolled ? 'background.paper' : 'transparent',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        borderBottom: '2px solid',
        borderColor: scrolled ? 'primary.main' : 'transparent',
        boxShadow: scrolled ? undefined : 'none',
        transition: 'background-color 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '& .MuiButton-text': {
          color: scrolled ? 'text.primary' : 'common.white',
        },
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar disableGutters sx={{ px: { xs: 2, sm: 3 }, minHeight: HEADER_OFFSET }}>
          <BrandLogo
            size={64}
            sx={{
              mr: { xs: 1.5, md: 4 },
              flexShrink: 0,
              ...(!scrolled && {
                '& .MuiTypography-root': { color: 'common.white' },
              }),
            }}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ ml: 'auto', display: { xs: 'none', md: 'flex' }, mr: 2 }}
          >
            <Button color="inherit" size="small" onClick={() => onNavigate('services')}>
              Послуги
            </Button>
            <Button color="inherit" size="small" onClick={() => onNavigate('tariffs')}>
              Тарифи
            </Button>
            <Button color="inherit" size="small" onClick={() => onNavigate('how')}>
              Як працює
            </Button>
            <Button color="inherit" size="small" onClick={() => onNavigate('contacts')}>
              Контакти
            </Button>
          </Stack>
          <Button variant="contained" size="small" onClick={() => onNavigate('contacts')}>
            Замовити
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

/** Відступ під фіксований хедер (для контенту сторінки) */
export const LANDING_HEADER_SPACER = HEADER_OFFSET;
