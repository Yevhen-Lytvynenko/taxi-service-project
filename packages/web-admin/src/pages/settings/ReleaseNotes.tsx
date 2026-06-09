import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

type ReleaseItem = {
  version: string;
  date: string;
  tags?: Array<{ label: string; color?: 'success' | 'warning' | 'info' | 'primary' | 'error' }>;
  highlights: string[];
};

const releases: ReleaseItem[] = [
  {
    version: '0.8.0',
    date: '2026-04-18',
    tags: [
      { label: 'UI', color: 'primary' },
      { label: 'Admin', color: 'info' },
    ],
    highlights: [
      'Уніфікована таблиця `AppDataGrid` на всіх сторінках: пошук, фільтри, сортування, видимість колонок, експорт XLSX/CSV/JSON.',
      'Іконка GPS у рядку водія → сторінка стежування у реальному часі.',
      'Іконка чату у замовленнях, чатах і відгуках → бульбашковий інтерфейс переписки (TripChatDialog).',
      'Меню розбите на три секції: «Операції (ІС)» → «Аналітика (демо)» → «Налаштування».',
      'Сторінки налаштувань: профіль адміністратора, матриця ролей (WIP), нотатки релізу.',
    ],
  },
  {
    version: '0.7.0',
    date: '2026-04-10',
    tags: [{ label: 'Analytics', color: 'success' }],
    highlights: [
      'Аналітичний модуль розбитий на окремі розділи: прогноз попиту, surge-ціноутворення, гео-теплокарти, автопарк, фінанси.',
      'Додано опис метрик і технічні нотатки (`docs/analytics-module-overview.md`).',
    ],
  },
  {
    version: '0.6.0',
    date: '2026-03-25',
    tags: [{ label: 'Mobile', color: 'warning' }],
    highlights: [
      'Мобільні застосунки клієнта і водія: компактний інтерфейс в стилі Uber.',
      'Авто-статус ARRIVED/COMPLETED за GPS у драйвер-апп.',
      'Чат клієнт ↔ водій з історією на беку і дзвінок по телефону.',
    ],
  },
];

export const ReleaseNotes = () => (
  <Box sx={{ width: '100%', maxWidth: 960 }}>
    <Typography variant="h4" fontWeight={700} gutterBottom>
      Нотатки релізу
    </Typography>
    <Typography variant="body2" color="text.secondary" paragraph>
      Короткий огляд змін по релізах адмін-панелі і сервісу в цілому.
    </Typography>

    <Stack spacing={2}>
      {releases.map((r) => (
        <Card key={r.version} variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography variant="h6">v{r.version}</Typography>
              <Typography variant="body2" color="text.secondary">
                · {r.date}
              </Typography>
              <Box sx={{ flex: 1 }} />
              {r.tags?.map((t) => (
                <Chip key={t.label} label={t.label} color={t.color ?? 'default'} size="small" />
              ))}
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <List dense disablePadding>
              {r.highlights.map((h, i) => (
                <ListItem key={i} sx={{ alignItems: 'flex-start' }}>
                  <ListItemText primary={h} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}
    </Stack>
  </Box>
);
