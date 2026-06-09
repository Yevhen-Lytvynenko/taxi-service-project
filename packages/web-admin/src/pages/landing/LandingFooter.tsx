import {
  Box,
  Container,
  Divider,
  Grid,
  IconButton,
  Link as MuiLink,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { Link as RouterLink } from 'react-router-dom';

import { BrandLogo } from '../../components/BrandLogo';
import {
  FOOTER_COMPANY,
  FOOTER_HELP,
  FOOTER_LEGAL,
  FOOTER_SERVICES,
  FOOTER_SOCIAL,
  FOOTER_VACANCIES,
  type FooterLinkItem,
} from './footerContent';
import { STRUM_HQ_ADDRESS_LINE } from './officeLocation';

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  telegram: TelegramIcon,
  youtube: YouTubeIcon,
  linkedin: LinkedInIcon,
} as const;

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function FooterColumn({ title, links }: { title: string; links: FooterLinkItem[] }) {
  return (
    <Box>
      <Typography
        variant="overline"
        sx={{
          color: 'primary.main',
          fontWeight: 800,
          letterSpacing: 1.4,
          display: 'block',
          mb: 2,
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>
      <Stack component="nav" spacing={1.1} aria-label={title}>
        {links.map((item) => (
          <MuiLink
            key={item.label}
            href="#"
            underline="none"
            onClick={(e) => {
              if (item.sectionId) {
                e.preventDefault();
                scrollToSection(item.sectionId);
              }
            }}
            sx={{
              color: 'grey.400',
              fontSize: '0.875rem',
              lineHeight: 1.45,
              transition: 'color 0.2s ease, padding-left 0.2s ease',
              display: 'block',
              '&:hover': {
                color: 'primary.main',
                pl: 0.5,
              },
            }}
          >
            {item.label}
          </MuiLink>
        ))}
      </Stack>
    </Box>
  );
}

type LandingFooterProps = {
  phone: string;
  phoneTel: string;
  email: string;
  year: number;
};

export function LandingFooter({ phone, phoneTel, email, year }: LandingFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        bgcolor: '#0a0a0a',
        color: 'grey.400',
        borderTop: '4px solid',
        borderColor: 'primary.main',
        backgroundImage:
          'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 212, 81, 0.08) 0%, transparent 55%), linear-gradient(180deg, #121212 0%, #0a0a0a 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          <Grid item xs={12} md={4}>
            <BrandLogo
              size={44}
              sx={{
                mb: 2,
                '& .MuiTypography-root': { color: 'common.white' },
              }}
            />
            <Typography variant="body2" sx={{ color: 'grey.500', maxWidth: 320, mb: 2, lineHeight: 1.7 }}>
              Служба таксі Strum — поїздки, доставка та корпоративні рішення в Одесі та області. Прозорі
              тарифи, підтримка 24/7.
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.600', display: 'block', mb: 1.5 }}>
              {STRUM_HQ_ADDRESS_LINE}
            </Typography>
            <Stack spacing={0.5} sx={{ mb: 2.5 }}>
              <MuiLink href={`tel:${phoneTel}`} underline="hover" sx={{ color: 'grey.300', fontSize: '0.9rem' }}>
                {phone}
              </MuiLink>
              <MuiLink href={`mailto:${email}`} underline="hover" sx={{ color: 'grey.300', fontSize: '0.9rem' }}>
                {email}
              </MuiLink>
            </Stack>
            <Typography variant="overline" sx={{ color: 'grey.600', letterSpacing: 1.2, display: 'block', mb: 1 }}>
              Ми в соцмережах
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {FOOTER_SOCIAL.map(({ id, label }) => {
                const Icon = SOCIAL_ICONS[id];
                return (
                  <Tooltip key={id} title={label}>
                    <IconButton
                      href="#"
                      aria-label={label}
                      size="small"
                      sx={{
                        color: 'grey.500',
                        border: '1px solid',
                        borderColor: 'grey.800',
                        borderRadius: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          color: 'primary.main',
                          borderColor: 'primary.main',
                          bgcolor: 'rgba(255, 212, 81, 0.08)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Icon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                );
              })}
            </Stack>
          </Grid>

          <Grid item xs={6} sm={4} md={2}>
            <FooterColumn title="Послуги" links={FOOTER_SERVICES} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FooterColumn title="Допомога" links={FOOTER_HELP} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FooterColumn title="Вакансії" links={FOOTER_VACANCIES} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <FooterColumn title="Компанія" links={FOOTER_COMPANY} />
          </Grid>
        </Grid>

        <Divider sx={{ my: { xs: 4, md: 5 }, borderColor: 'grey.800' }} />

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ color: 'grey.600' }}>
              © {year} Strum Taxi. Усі права захищені.
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700', display: 'block', mt: 0.5 }}>
              Демонстраційний лендінг дипломного проєкту. Посилання в футері не є публічною офертою.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack
              direction="row"
              flexWrap="wrap"
              useFlexGap
              spacing={{ xs: 2, sm: 3 }}
              justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            >
              {FOOTER_LEGAL.map((item) => (
                <MuiLink
                  key={item.label}
                  href="#"
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'grey.500', whiteSpace: 'nowrap', '&:hover': { color: 'primary.main' } }}
                >
                  {item.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'grey.900',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'grey.700' }}>
            Одеса · Україна
          </Typography>
          <MuiLink
            component={RouterLink}
            to="/login"
            variant="caption"
            underline="hover"
            sx={{ color: 'grey.600', fontSize: '0.7rem', '&:hover': { color: 'primary.main' } }}
          >
            Вхід для персоналу
          </MuiLink>
        </Box>
      </Container>
    </Box>
  );
}
