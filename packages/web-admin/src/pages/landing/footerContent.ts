export type FooterLinkItem = {
  label: string;
  /** Якщо задано — плавний скрол до секції лендінгу */
  sectionId?: string;
};

export const FOOTER_SERVICES: FooterLinkItem[] = [
  { label: 'Міські поїздки', sectionId: 'services' },
  { label: 'Трансфер і аеропорт', sectionId: 'services' },
  { label: 'Доставка', sectionId: 'services' },
  { label: 'Корпоративним клієнтам', sectionId: 'services' },
  { label: 'Тарифи та класи авто', sectionId: 'tariffs' },
  { label: 'Мобільні додатки', sectionId: 'apps' },
];

export const FOOTER_HELP: FooterLinkItem[] = [
  { label: 'Центр допомоги' },
  { label: 'Як замовити поїздку', sectionId: 'how' },
  { label: 'Оплата та чеки' },
  { label: 'Безпека поїздки' },
  { label: 'Втрачені речі' },
  { label: 'Скарги та зворотний зв’язок', sectionId: 'contacts' },
  { label: 'Питання для водіїв' },
  { label: 'Контакти підтримки', sectionId: 'contacts' },
];

export const FOOTER_VACANCIES: FooterLinkItem[] = [
  { label: 'Водій таксі' },
  { label: 'Диспетчер' },
  { label: 'Оператор кол-центру' },
  { label: 'Менеджер корпоративних клієнтів' },
  { label: 'Спеціаліст автопарку' },
  { label: 'Маркетолог' },
  { label: 'HR-менеджер' },
  { label: 'Бухгалтер' },
];

export const FOOTER_COMPANY: FooterLinkItem[] = [
  { label: 'Про Strum' },
  { label: 'Наші переваги', sectionId: 'advantages' },
  { label: 'Партнерам' },
  { label: 'ЗМІ та прес-центр' },
  { label: 'Блог' },
  { label: 'Інвесторам' },
];

export const FOOTER_LEGAL: FooterLinkItem[] = [
  { label: 'Політика конфіденційності' },
  { label: 'Умови користування' },
  { label: 'Публічна оферта' },
  { label: 'Cookies' },
];

export const FOOTER_SOCIAL = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
] as const;
