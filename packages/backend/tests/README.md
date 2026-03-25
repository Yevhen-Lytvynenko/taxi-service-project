# API-тести (ПР7)

## Передумови

- PostgreSQL доступний за `DATABASE_URL` у `packages/backend/.env`
- Схема та дані: `npx prisma db push` та `npx prisma db seed`

## Запуск

З каталогу `packages/backend`:

```bash
npm run test
```

Або з кореня монорепо: `npm run test` (прокидається в backend).

Тести `emulation-guard` і сценарії логіну з валідним `admin` **потребують** робочої БД після seed.
