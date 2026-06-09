import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material';
import LocalTaxiOutlinedIcon from '@mui/icons-material/LocalTaxiOutlined';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentsIcon from '@mui/icons-material/Payments';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { BrandWatermark } from '../../components/BrandWatermark';
import { ImagePlaceholder } from './ImagePlaceholder';
import { OfficeMap } from './OfficeMap';
import { LandingFooter } from './LandingFooter';
import { LandingHeader, LANDING_HEADER_SPACER } from './LandingHeader';

const HERO_HEADER_PAD = { xs: 11, sm: 12 };
import { STRUM_HQ, STRUM_HQ_ADDRESS_LINE, strumHqOpenStreetMapUrl } from './officeLocation';

const CONTACT_PHONE = '+38 (033) 414 14 14';
const CONTACT_PHONE_TEL = '+38 (033) 414 14 14';
const CONTACT_EMAIL = 'support@strum.taxi';
const CURRENT_YEAR = new Date().getFullYear();

const carClasses = [
  { code: 'ECONOMY', title: 'Economy', desc: 'Оптимально для щоденних поїздок містом без зайвих витрат.' },
  { code: 'STANDARD', title: 'Standard', desc: 'Зручний баланс ціни та комфорту для регулярних поїздок.' },
  { code: 'COMFORT', title: 'Comfort', desc: 'Більше простору та приємніших деталей для ділових та сімейних поїздок.' },
  { code: 'BUSINESS', title: 'Business', desc: 'Представницький клас для важливих зустрічей та подій.' },
  { code: 'MINIVAN', title: 'Minivan', desc: 'До 7 пасажирів або багажу для аеропорту та подорожей.' },
  { code: 'DELIVERY', title: 'Delivery', desc: 'Кур’єрська доставка документів та невеликих відправлень.' },
  { code: 'EXPRESS', title: 'Express', desc: 'Пріоритетний підбір водія, коли час на вагу золота.' },
];

const services = [
  {
    title: 'Міські поїздки',
    text: 'Швидке подання авто за хвилини. Зручне замовлення з додатку чи підтримки 24/7.',
    icon: <LocalTaxiOutlinedIcon sx={{ fontSize: 40 }} />,
    img: '/landing/service-city.png',
  },
  {
    title: 'Трансфер і аеропорт',
    text: 'Зустріч з табличкою, контроль часу рейсу та допомога з багажем за домовленістю.',
    icon: <FlightTakeoffIcon sx={{ fontSize: 40 }} />,
    img: '/landing/service-airport.png',
  },
  {
    title: 'Доставка',
    text: 'Окремий тариф для відправлень «від дверей до дверей» з відстеженням статусу.',
    icon: <Inventory2Icon sx={{ fontSize: 40 }} />,
    img: '/landing/delivery.png',
  },
  {
    title: 'Корпоративним клієнтам',
    text: 'Зведена звітність, фіксовані маршрути та персональний менеджер для вашої компанії.',
    icon: <BusinessCenterIcon sx={{ fontSize: 40 }} />,
    img: '/landing/service-business.png',
  },
];

const advantages = [
  { title: 'Швидке подання', text: 'Підбираємо найближчого доступного водія з урахуванням класу авто.', icon: <SpeedIcon fontSize="large" color="primary" /> },
  { title: 'Прозора ціна', text: 'Бачите орієнтовну вартість до підтвердження поїздки, без прихованих доплат.', icon: <PaymentsIcon fontSize="large" color="primary" /> },
  { title: 'Безпека', text: 'Перевірені водії, підтримка під час поїздки та можливість поділитися поїздкою близьким.', icon: <SecurityIcon fontSize="large" color="primary" /> },
  { title: 'Підтримка', text: 'Оператори та чат у додатку допоможуть змінити маршрут або вирішити незручності.', icon: <HeadsetMicIcon fontSize="large" color="primary" /> },
];

const steps = [
  { n: '1', title: 'Замовлення', text: 'Вкажіть «звідки» та «куди», оберіть клас авто та спосіб оплати.' },
  { n: '2', title: 'Водій у дорозі', text: 'Отримуєте контакт і час прибуття, бачите рух на карті.' },
  { n: '3', title: 'Поїздка', text: 'Комфортний маршрут, при потребі зупинки за узгодженням.' },
  { n: '4', title: 'Оплата й чек', text: 'Готівка, картка або бонуси — підсумок поїздки завжди у додатку.' },
];

const SECTION_SCROLL_MARGIN = { xs: '80px', sm: '96px' };

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LandingPage() {
  const [heroOk, setHeroOk] = useState(true);

  return (
    <>
      <LandingHeader onNavigate={scrollToId} />
      {/* Hero — одразу під хедером, без світлої смуги */}
      <Box
        id="top"
        sx={{
          position: 'relative',
          minHeight: { xs: '72vh', md: '78vh' },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          scrollMarginTop: LANDING_HEADER_SPACER,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(120deg, #1a1a1a 0%, #2d2d2d 45%, #1a1a1a 100%)',
            zIndex: 0,
          }}
        />
        {heroOk && (
          <Box
            component="img"
            src="/landing/hero.jpg"
            alt=""
            onError={() => setHeroOk(false)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.45,
              zIndex: 1,
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent 55%)',
            zIndex: 2,
          }}
        />
        <Container
          maxWidth="lg"
          sx={{ position: 'relative', zIndex: 3, py: 6, pt: HERO_HEADER_PAD, pb: { xs: 6, md: 8 } }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  color: 'common.white',
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '3rem' },
                  lineHeight: 1.15,
                  mb: 2,
                }}
              >
                Надійне таксі та сервіс подання авто в одному додатку
              </Typography>
              <Typography variant="h6" sx={{ color: 'grey.300', fontWeight: 400, mb: 3, maxWidth: 520 }}>
                Strum — це швидкі поїздки містом, трансфери, корпоративні рішення та доставка. Прозора
                ціна, підтримка 24/7 і водії, яким можна довіряти.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  sx={{ color: 'common.black' }}
                >
                  Зателефонувати
                </Button>
                <Button variant="outlined" size="large" sx={{ borderColor: 'grey.400', color: 'common.white' }} onClick={() => scrollToId('apps')}>
                  Завантажити додаток
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <ImagePlaceholder
                src="/landing/hero-side.png"
                label="Місце під банер або колаж (hero-side.jpg)"
                ratio={4 / 3}
                
              />
            </Grid>
      
          </Grid>
        </Container>
      </Box>

      <BrandWatermark
        variant="tile"
        opacity={0.035}
        sx={{
          bgcolor: 'background.default',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Services */}
      <Box id="services" sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: SECTION_SCROLL_MARGIN }}>
        <Container maxWidth="lg">
          <Typography variant="overline" color="primary" fontWeight={700}>
            Що пропонуємо
          </Typography>
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 1 }}>
            Послуги для будь-яких поїздок
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
            Від щоденних поїздок на роботу до великих контрактів — підберемо клас авто, водія і формат
            обслуговування під ваш запит.
          </Typography>
          <Grid container spacing={3}>
            {services.map((s) => (
              <Grid item xs={12} sm={6} key={s.title}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <ImagePlaceholder src={s.img} label={s.title} ratio={16 / 9} />
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Box sx={{ color: 'primary.main' }}>{s.icon}</Box>
                      <Typography variant="h6" component="h3" fontWeight={700}>
                        {s.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {s.text}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Decorative strip */}
      <Box sx={{ py: 6, bgcolor: 'primary.main', color: 'common.black' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6} padding={5}>
              <ImagePlaceholder src="/landing/strip-promo.png" label="Промо-блок (strip-promo.jpg)" ratio={1 /1} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Почніть з першої поїздки сьогодні
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.85 }}>
                Завантажте додаток Strum, збережіть улюблені адреси та отримуйте бонуси за активність. Для
                компаній — окремі умови та звітність.
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Tariffs */}
      <Box id="tariffs" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper', scrollMarginTop: SECTION_SCROLL_MARGIN }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 1 }}>
            Класи автомобілів
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
            Оберіть рівень комфорту та вартості. Фінальна ціна залежить від маршруту, часу та динаміки попиту
            — у додатку ви бачите оцінку до підтвердження замовлення.
          </Typography>
          <Grid container spacing={2}>
            {carClasses.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.code}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" fontWeight={700}>
                      {c.code}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {c.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {c.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Advantages */}
      <Box id="advantages" sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: SECTION_SCROLL_MARGIN }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 4, textAlign: 'center' }}>
            Чому обирають Strum
          </Typography>
          <Grid container spacing={3}>
            {advantages.map((a) => (
              <Grid item xs={12} sm={6} md={3} key={a.title}>
                <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'center' }} textAlign={{ xs: 'left', md: 'center' }}>
                  {a.icon}
                  <Typography variant="h6" fontWeight={700}>
                    {a.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {a.text}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How it works */}
      <Box id="how" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.100', scrollMarginTop: SECTION_SCROLL_MARGIN }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 1 }}>
            Як це працює
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Чотири прості кроки від ідеї «потрібно їхати» до завершеної поїздки.
          </Typography>
          <Grid container spacing={2}>
            {steps.map((st) => (
              <Grid item xs={12} sm={6} md={3} key={st.n}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h3" color="primary.main" fontWeight={800}>
                      {st.n}
                    </Typography>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {st.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {st.text}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 4, width: '100%', height: '100%' }}>
            <ImagePlaceholder src="/landing/zakaz-steps.png" label="Ілюстрація процесу (how-it-works.jpg)" ratio={25 / 9} />
          </Box>
        </Container>
      </Box>

      {/* Apps */}
      <Box id="apps" sx={{ py: { xs: 6, md: 10 }, scrollMarginTop: SECTION_SCROLL_MARGIN }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
                Мобільні додатки
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Замовлюйте поїздки, діліться маршрутом із близькими та керуйте способом оплати зі смартфона.
                Скоро тут з’являться посилання на App Store та Google Play.
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" startIcon={<PhoneIphoneIcon />} disabled sx={{ opacity: 0.7 }}>
                  App Store (незабаром)
                </Button>
                <Button variant="outlined" startIcon={<PhoneIphoneIcon />} disabled sx={{ opacity: 0.7 }}>
                  Google Play (незабаром)
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <ImagePlaceholder src="/landing/apps-mockup.png" label="Скріншоти додатку (apps-mockup.jpg)" ratio={1} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contacts */}
      <Box id="contacts" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.900', color: 'grey.100', scrollMarginTop: SECTION_SCROLL_MARGIN }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" sx={{ fontWeight: 800, mb: 2, color: 'common.white' }}>
            Контакти та підтримка
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" paragraph sx={{ color: 'grey.400' }}>
                Маєте питання щодо поїздки, співпраці або ЗМІ? Напишіть або зателефонуйте — команда Strum на
                зв’язку.
              </Typography>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 0.5 }}>
                Телефон
              </Typography>
              <MuiLink href={`tel:${CONTACT_PHONE_TEL}`} color="inherit" underline="hover" variant="body1">
                {CONTACT_PHONE}
              </MuiLink>
              <Typography variant="h6" sx={{ color: 'primary.main', mt: 2, mb: 0.5 }}>
                Email
              </Typography>
              <MuiLink href={`mailto:${CONTACT_EMAIL}`} color="inherit" underline="hover">
                {CONTACT_EMAIL}
              </MuiLink>
              <Typography variant="h6" sx={{ color: 'primary.main', mt: 3, mb: 0.5 }}>
                {STRUM_HQ.title}
              </Typography>
              <Typography variant="body1" sx={{ color: 'grey.300' }}>
                {STRUM_HQ_ADDRESS_LINE}
              </Typography>
              <Typography variant="body2" sx={{ color: 'grey.500', mt: 0.5 }}>
                {STRUM_HQ.hours}
              </Typography>
              <MuiLink
                href={strumHqOpenStreetMapUrl()}
                target="_blank"
                rel="noopener noreferrer"
                color="primary"
                underline="hover"
                variant="body2"
                sx={{ display: 'inline-block', mt: 1 }}
              >
                Відкрити на OpenStreetMap
              </MuiLink>
            </Grid>
            <Grid item xs={12} md={6}>
              <OfficeMap />
            </Grid>
          </Grid>
        </Container>
      </Box>

      <LandingFooter
        phone={CONTACT_PHONE}
        phoneTel={CONTACT_PHONE_TEL}
        email={CONTACT_EMAIL}
        year={CURRENT_YEAR}
      />
      </BrandWatermark>
    </>
  );
}
