/// <reference types="node" />
import { randomUUID } from 'crypto';
import { PrismaClient, type OrderStatus, type CancellationReason, type Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ODESSA_ADDRESSES, clampToOdessaDriveBounds } from '../src/data/odessa-addresses';
import {
  DEMO_SHOWCASE_CLIENT_PHONE,
  DEMO_SHOWCASE_DRIVER_PHONE,
  resetPresentationDemoUsers,
} from '../src/lib/demoUsersReset';
import { haversineDistanceKm } from '../src/services/geocode.service';

const prisma = new PrismaClient();

function frand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function onlineDriverCoords(driverIndex: number): { currentLat: number; currentLng: number } {
  const base = ODESSA_ADDRESSES[driverIndex % ODESSA_ADDRESSES.length]!;
  const c = clampToOdessaDriveBounds(
    base.lat + (Math.random() - 0.5) * 0.003,
    base.lng + (Math.random() - 0.5) * 0.003
  );
  return { currentLat: c.lat, currentLng: c.lng };
}

const DEMO_PASSWORD = 'demo';
const CLIENT_NAMES = [
  'Петренко Іван',
  'Коваленко Марія',
  'Шевченко Олександр',
  'Бондаренко Анна',
  'Ткаченко Михайло',
  'Кравченко Олена',
  'Мельник Віктор',
  'Коваль Юлія',
  'Савченко Андрій',
  'Бойко Дмитро',
  'Марченко Катерина',
  'Лисенко Сергій',
  'Гончаренко Наталія',
  'Сидоренко Ігор',
  'Павленко Валерія',
  'Олійник Роман',
  'Тарасенко Вікторія',
  'Пономаренко Олег',
  'Кулік Світлана',
  'Кравчук Денис',
];

const DRIVER_NAMES = [
  'Іваненко Володимир',
  'Семенов Максим',
  'Грищенко Станіслав',
  'Кириченко Артем',
  'Євсеєнко Вадим',
  'Захарченко Богдан',
  'Колесник Кирило',
  'Попов Руслан',
  'Соколов Геннадій',
  'Федоров Олексій',
  'Морозов Микола',
  'Волков Павло',
  'Смирнов Ілля',
  'Козлов Тарас',
  'Новиков Гліб',
  'Фролов Євген',
  'Орлов Артем',
  'Соловйов Ростислав',
  'Михайлов Денис',
  'Васильєв Віталій',
  'Петров Костянтин',
  'Семенов Олександр',
  'Голубєв Іван',
  'Виноградов Юрій',
  'Богданов Андрій',
  'Воронов Михайло',
  'Федоров Сергій',
  'Міхайлов Дмитро',
  'Беляєв Олег',
  'Тарасов Віталій',
  'Белов Артем',
  'Комаров Роман',
  'Кузнєцов Ігор',
  'Козлов Валерій',
  'Іллін Олексій',
  'Максимов Владислав',
  'Поляков Богдан',
  'Сорокін Гліб',
  'Виноградов Євген',
  'Кузьмін Костянтин',
  'Павлов Руслан',
  'Семенов Тарас',
  'Голубєв Павло',
  'Виноградов Микола',
  'Богданов Ілля',
  'Воронов Кирило',
  'Федоров Артем',
  'Міхайлов Євген',
  'Беляєв Станіслав',
  'Тарасов Максим',
];

const CAR_MODELS = ['Toyota Camry', 'Volkswagen Passat', 'Hyundai Sonata', 'Skoda Octavia', 'Kia Optima'];
const CAR_COLORS = ['Чорний', 'Сірий', 'Білий', 'Сріблястий', 'Блакитний'];

async function main() {
  const hashedAdmin = await bcrypt.hash('admin', 10);
  const hashedDemo = await bcrypt.hash(DEMO_PASSWORD, 10);

  const orAdmin = await prisma.officeRole.upsert({
    where: { slug: 'system-admin' },
    update: {
      displayName: 'Адміністратор',
      legacyRole: 'ADMIN',
      isSystem: true,
    },
    create: {
      slug: 'system-admin',
      displayName: 'Адміністратор',
      legacyRole: 'ADMIN',
      isSystem: true,
      permissions: {},
    },
  });
  const orManager = await prisma.officeRole.upsert({
    where: { slug: 'system-manager' },
    update: {
      displayName: 'Менеджер',
      legacyRole: 'MANAGER',
      isSystem: true,
    },
    create: {
      slug: 'system-manager',
      displayName: 'Менеджер',
      legacyRole: 'MANAGER',
      isSystem: true,
      permissions: {},
    },
  });
  const orDispatcher = await prisma.officeRole.upsert({
    where: { slug: 'system-dispatcher' },
    update: {
      displayName: 'Диспетчер',
      legacyRole: 'DISPATCHER',
      isSystem: true,
    },
    create: {
      slug: 'system-dispatcher',
      displayName: 'Диспетчер',
      legacyRole: 'DISPATCHER',
      isSystem: true,
      permissions: {},
    },
  });
  const orAccountant = await prisma.officeRole.upsert({
    where: { slug: 'system-accountant' },
    update: {
      displayName: 'Бухгалтер',
      legacyRole: 'ACCOUNTANT',
      isSystem: true,
    },
    create: {
      slug: 'system-accountant',
      displayName: 'Бухгалтер',
      legacyRole: 'ACCOUNTANT',
      isSystem: true,
      permissions: {},
    },
  });
  console.log('Office roles (system) upserted');

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedAdmin, officeRoleId: orAdmin.id },
    create: {
      username: 'admin',
      password: hashedAdmin,
      fullName: 'Admin',
      phone: '+380000000001',
      role: 'ADMIN',
      officeRoleId: orAdmin.id,
    },
  });
  console.log('Admin user created/updated');

  await prisma.user.upsert({
    where: { username: 'accountant' },
    update: {
      password: hashedDemo,
      role: 'ACCOUNTANT',
      fullName: 'Бухгалтер Демо',
      officeRoleId: orAccountant.id,
    },
    create: {
      username: 'accountant',
      password: hashedDemo,
      fullName: 'Бухгалтер Демо',
      phone: '+380000000002',
      role: 'ACCOUNTANT',
      officeRoleId: orAccountant.id,
    },
  });
  console.log('Accountant demo user created/updated (login: accountant / demo)');

  await prisma.user.upsert({
    where: { username: 'manager' },
    update: {
      password: hashedDemo,
      role: 'MANAGER',
      fullName: 'Менеджер Демо',
      officeRoleId: orManager.id,
    },
    create: {
      username: 'manager',
      password: hashedDemo,
      fullName: 'Менеджер Демо',
      phone: '+380000000003',
      role: 'MANAGER',
      officeRoleId: orManager.id,
    },
  });
  console.log('Manager demo user (login: manager / demo)');

  await prisma.user.upsert({
    where: { username: 'dispatcher' },
    update: {
      password: hashedDemo,
      role: 'DISPATCHER',
      fullName: 'Диспетчер Демо',
      officeRoleId: orDispatcher.id,
    },
    create: {
      username: 'dispatcher',
      password: hashedDemo,
      fullName: 'Диспетчер Демо',
      phone: '+380000000004',
      role: 'DISPATCHER',
      officeRoleId: orDispatcher.id,
    },
  });
  console.log('Dispatcher demo user (login: dispatcher / demo)');

  // ECONOMY tariff
  await prisma.tariff.upsert({
    where: { name: 'ECONOMY' },
    update: {},
    create: {
      name: 'ECONOMY',
      basePrice: 50,
      pricePerKm: 7,
      pricePerMin: 2,
      minPrice: 70,
    },
  });
  console.log('ECONOMY tariff created/updated');

  await prisma.tariff.upsert({
    where: { name: 'STANDARD' },
    update: {},
    create: {
      name: 'STANDARD',
      basePrice: 57,
      pricePerKm: 8,
      pricePerMin: 2.2,
      minPrice: 78,
    },
  });
  console.log('STANDARD tariff created/updated');

  await prisma.tariff.upsert({
    where: { name: 'COMFORT' },
    update: {},
    create: {
      name: 'COMFORT',
      basePrice: 65,
      pricePerKm: 9,
      pricePerMin: 2.5,
      minPrice: 85,
    },
  });
  await prisma.tariff.upsert({
    where: { name: 'BUSINESS' },
    update: {},
    create: {
      name: 'BUSINESS',
      basePrice: 85,
      pricePerKm: 13,
      pricePerMin: 3.5,
      minPrice: 120,
    },
  });
  await prisma.tariff.upsert({
    where: { name: 'MINIVAN' },
    update: {},
    create: {
      name: 'MINIVAN',
      basePrice: 55,
      pricePerKm: 7.5,
      pricePerMin: 2,
      minPrice: 72,
    },
  });
  await prisma.tariff.upsert({
    where: { name: 'DELIVERY' },
    update: {},
    create: {
      name: 'DELIVERY',
      basePrice: 45,
      pricePerKm: 8.5,
      pricePerMin: 2.2,
      minPrice: 75,
    },
  });
  await prisma.tariff.upsert({
    where: { name: 'EXPRESS' },
    update: {},
    create: {
      name: 'EXPRESS',
      basePrice: 70,
      pricePerKm: 9.5,
      pricePerMin: 3,
      minPrice: 95,
    },
  });
  console.log('ECONOMY / STANDARD / COMFORT / BUSINESS / MINIVAN / DELIVERY / EXPRESS tariffs ensured');

  // Демо для презентації: 1 клієнт + 1 водій (пароль demo). Історія/рейтинги скидаються в кінці seed і при старті з DEMO_RESET_ON_START.
  await prisma.user.upsert({
    where: { phone: DEMO_SHOWCASE_CLIENT_PHONE },
    update: {
      password: hashedDemo,
      fullName: 'Демо Клієнт',
      role: 'CLIENT',
      rating: 5.0,
    },
    create: {
      fullName: 'Демо Клієнт',
      phone: DEMO_SHOWCASE_CLIENT_PHONE,
      password: hashedDemo,
      role: 'CLIENT',
      rating: 5.0,
    },
  });
  console.log('Demo client created/updated');

  // Demo driver: username demodriver
  const demoDriverUser = await prisma.user.upsert({
    where: { phone: DEMO_SHOWCASE_DRIVER_PHONE },
    update: {
      password: hashedDemo,
      fullName: 'Демо Водій',
      username: 'demodriver',
      role: 'DRIVER',
      rating: 5.0,
    },
    create: {
      fullName: 'Демо Водій',
      username: 'demodriver',
      phone: DEMO_SHOWCASE_DRIVER_PHONE,
      password: hashedDemo,
      role: 'DRIVER',
      rating: 5.0,
    },
  });

  const existingDemoDriver = await prisma.driverProfile.findUnique({
    where: { userId: demoDriverUser.id },
    include: { vehicle: true },
  });

  if (!existingDemoDriver) {
    const demoDriver = await prisma.driverProfile.create({
      data: {
        userId: demoDriverUser.id,
        licenseNumber: 'DEMO000001',
        status: 'OFFLINE',
        balance: 0,
        verificationStatus: 'APPROVED',
      },
    });
    await prisma.vehicle.create({
      data: {
        driverId: demoDriver.id,
        model: 'Toyota Camry',
        color: 'Чорний',
        plateNumber: 'AA 0000 AA',
        productionYear: 2020,
        carClass: 'ECONOMY',
      },
    });
  } else {
    await prisma.driverProfile.update({
      where: { id: existingDemoDriver.id },
      data: {
        licenseNumber: 'DEMO000001',
        verificationStatus: 'APPROVED',
        balance: 0,
      },
    });
  }
  console.log('Demo driver created/updated');

  // 20 clients
  for (let i = 0; i < CLIENT_NAMES.length; i++) {
    const fullName = CLIENT_NAMES[i]!;
    const phone = `+38099${String(3000000 + i).padStart(7, '0')}`;
    await prisma.user.upsert({
      where: { phone },
      update: { password: hashedDemo, fullName, role: 'CLIENT' },
      create: {
        fullName,
        phone,
        password: hashedDemo,
        role: 'CLIENT',
      },
    });
  }
  console.log('20 clients created/updated');

  // 50 drivers (40 ONLINE, 10 OFFLINE)
  for (let i = 0; i < DRIVER_NAMES.length; i++) {
    const fullName = DRIVER_NAMES[i]!;
    const phone = `+38099${String(4000000 + i).padStart(7, '0')}`;
    const licenseNumber = `OD${String(100000 + i).padStart(6, '0')}`;
    const plateNumber = `AA ${String(1000 + i).padStart(4, '0')} AA`;
    const status = i < 40 ? 'ONLINE' : 'OFFLINE';

    const user = await prisma.user.upsert({
      where: { phone },
      update: { password: hashedDemo, fullName, role: 'DRIVER' },
      create: {
        fullName,
        phone,
        password: hashedDemo,
        role: 'DRIVER',
      },
    });

    const existingProfile = await prisma.driverProfile.findUnique({
      where: { userId: user.id },
    });

    if (!existingProfile) {
      const coords = status === 'ONLINE' ? onlineDriverCoords(i) : null;
      const driver = await prisma.driverProfile.create({
        data: {
          userId: user.id,
          licenseNumber,
          status,
          currentLat: coords?.currentLat ?? null,
          currentLng: coords?.currentLng ?? null,
          verificationStatus: 'APPROVED',
        },
      });
      await prisma.vehicle.create({
        data: {
          driverId: driver.id,
          model: CAR_MODELS[i % CAR_MODELS.length]!,
          color: CAR_COLORS[i % CAR_COLORS.length]!,
          plateNumber,
          productionYear: 2018 + (i % 5),
          carClass: 'ECONOMY',
        },
      });
    } else {
      const coords = status === 'ONLINE' ? onlineDriverCoords(i) : null;
      await prisma.driverProfile.update({
        where: { id: existingProfile.id },
        data: {
          licenseNumber,
          status,
          currentLat: status === 'ONLINE' ? coords!.currentLat : existingProfile.currentLat,
          currentLng: status === 'ONLINE' ? coords!.currentLng : existingProfile.currentLng,
          verificationStatus: 'APPROVED',
        },
      });
    }
  }
  console.log('50 drivers created/updated');

  // Демо-навантаження: замовлення, чати (клієнт ↔ водій), відгуки, виплати, GPS-треки, ОВОР, ТО, зарплати
  await prisma.review.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.locationLog.deleteMany({});
  await prisma.order.deleteMany({});

  const economyTariff = await prisma.tariff.findUnique({ where: { name: 'ECONOMY' } });
  if (!economyTariff) throw new Error('ECONOMY tariff missing');

  await prisma.payrollAccrual.deleteMany({});
  await prisma.operatingExpense.deleteMany({});
  await prisma.vehicleMaintenanceRecord.deleteMany({});

  const DEMO_STAFF = [
    { fullName: 'Диспетчер Центральний', phone: '+380670001001', dept: 'Диспетчеризація', salary: 19500 },
    { fullName: 'Менеджер з якості', phone: '+380670001002', dept: 'Операції', salary: 24000 },
    { fullName: 'Фінансовий контролер', phone: '+380670001003', dept: 'Фінанси', salary: 28000 },
    { fullName: 'Координатор флоту', phone: '+380670001004', dept: 'Автопарк', salary: 22000 },
  ];

  for (let si = 0; si < DEMO_STAFF.length; si++) {
    const s = DEMO_STAFF[si]!;
    const role = si === 1 ? 'MANAGER' : si === 2 ? 'ACCOUNTANT' : 'DISPATCHER';
    const u = await prisma.user.upsert({
      where: { phone: s.phone },
      update: { fullName: s.fullName, role, password: hashedDemo },
      create: {
        fullName: s.fullName,
        phone: s.phone,
        password: hashedDemo,
        role,
      },
    });
    const ep = await prisma.employeeProfile.findUnique({ where: { userId: u.id } });
    if (!ep) {
      await prisma.employeeProfile.create({
        data: {
          userId: u.id,
          department: s.dept,
          salary: s.salary,
        },
      });
    } else {
      await prisma.employeeProfile.update({
        where: { id: ep.id },
        data: { department: s.dept, salary: s.salary },
      });
    }
  }

  const payrollUsers = await prisma.user.findMany({
    where: { employeeProfile: { isNot: null } },
    include: { employeeProfile: true },
  });
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setUTCDate(periodStart.getUTCDate() - 30);
  for (const u of payrollUsers) {
    const sal = Number(u.employeeProfile?.salary ?? 20000);
    await prisma.payrollAccrual.create({
      data: {
        userId: u.id,
        periodStart,
        periodEnd,
        amount: sal,
        type: 'SALARY',
        description: 'Нарахування ЗП (демо-період)',
      },
    });
    if (Math.random() > 0.5) {
      await prisma.payrollAccrual.create({
        data: {
          userId: u.id,
          periodStart,
          periodEnd,
          amount: Math.round(frand(800, 3500) * 100) / 100,
          type: 'BONUS',
          description: 'Премія за KPI (демо)',
        },
      });
    }
  }

  const opexRows = [
    { category: 'Офіс та оренда', amount: 42000, description: 'Оренда одеського офісу' },
    { category: 'Реклама', amount: 18500, description: 'Google / соцмережі' },
    { category: 'Сервери та ПЗ', amount: 9600, description: 'Хмара, ліцензії' },
    { category: 'Звʼязок', amount: 3200, description: 'Корпоративна мобільна' },
    { category: 'Юридичні', amount: 11000, description: 'Супровід договорів' },
  ];
  for (const ox of opexRows) {
    await prisma.operatingExpense.create({
      data: {
        category: ox.category,
        amount: ox.amount,
        description: ox.description,
        expenseDate: periodStart,
      },
    });
  }

  const vehiclesForMaint = await prisma.vehicle.findMany({ take: 18, include: { driver: true } });
  for (const v of vehiclesForMaint) {
    await prisma.vehicleMaintenanceRecord.create({
      data: {
        vehicleId: v.id,
        serviceType: 'ТО + мастило',
        amount: Math.round(frand(2500, 6800) * 100) / 100,
        odometerKm: 45000 + Math.floor(Math.random() * 80000),
        vendor: 'Демо-Автосервіс',
        notes: `Авто ${v.plateNumber} — планове ТО`,
        serviceDate: periodStart,
      },
    });
    if (Math.random() > 0.4) {
      await prisma.vehicleMaintenanceRecord.create({
        data: {
          vehicleId: v.id,
          serviceType: 'Шини / геометрія',
          amount: Math.round(frand(1200, 4500) * 100) / 100,
          vendor: 'Шинний центр (демо)',
          serviceDate: new Date(periodEnd.getTime() - 5 * 86400000),
        },
      });
    }
  }

  const clientRows = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      phone: { not: DEMO_SHOWCASE_CLIENT_PHONE },
    },
    orderBy: { createdAt: 'asc' },
    take: 30,
  });
  const driverRows = await prisma.driverProfile.findMany({
    where: {
      verificationStatus: 'APPROVED',
      user: { phone: { not: DEMO_SHOWCASE_DRIVER_PHONE } },
    },
    include: { user: true },
    take: 45,
  });

  if (clientRows.length === 0 || driverRows.length === 0) {
    console.warn('Skip demo orders: no clients or drivers');
    console.log('Seed completed.');
    return;
  }

  function tariffTotals(distanceKm: number, minutesEst: number) {
    if (!economyTariff) throw new Error('ECONOMY tariff missing');
    const base = Number(economyTariff.basePrice);
    const perKm = Number(economyTariff.pricePerKm);
    const perMin = Number(economyTariff.pricePerMin);
    const minPrice = Number(economyTariff.minPrice);
    const raw = base + distanceKm * perKm + minutesEst * perMin;
    const preSurge = Math.max(minPrice, Math.round(raw * 100) / 100);
    return { preSurge };
  }

  const locationBatch: {
    driverId: string;
    orderId: string;
    lat: number;
    lng: number;
    speed: number;
    timestamp: Date;
  }[] = [];

  const CHAT_SNIPPETS: { client: string; driver: string }[] = [
    { client: 'Ви вже біля підʼїзду?', driver: 'Так, чорний Camry, номер на борту' },
    { client: 'Чи можна з дитячим кріслом?', driver: 'Так, є крісло, чекаю на точці' },
    { client: 'Заблуктів біля входу в ТЦ', driver: 'Підʼїжджаю до центральних дверей' },
    { client: 'Оплата карткою ок?', driver: 'Так, термінал є' },
    { client: 'Можна відкласти старт на 5 хв?', driver: 'Зрозумів, чекаю без лічильника' },
  ];

  for (let oi = 0; oi < 135; oi++) {
    const daysBack = Math.floor(Math.random() * 46);
    const createdAt = new Date();
    createdAt.setUTCDate(createdAt.getUTCDate() - daysBack);
    createdAt.setUTCHours(6 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 59), 0, 0);

    const p = pick(ODESSA_ADDRESSES);
    let d = pick(ODESSA_ADDRESSES);
    let guard = 0;
    while (d.displayName === p.displayName && guard++ < 8) d = pick(ODESSA_ADDRESSES);

    const pickupLat = p.lat;
    const pickupLng = p.lng;
    const dropoffLat = d.lat;
    const dropoffLng = d.lng;
    const distanceKm = Math.max(1.2, haversineDistanceKm(pickupLat, pickupLng, dropoffLat, dropoffLng));
    const minutesEst = Math.max(5, Math.round(distanceKm * 2.2));

    const hour = createdAt.getUTCHours();
    const peak = hour >= 8 && hour <= 10 || hour >= 17 && hour <= 20;
    const surgeMultiplier = Math.round((peak ? frand(1.15, 1.55) : frand(1, 1.18)) * 100) / 100;

    const { preSurge } = tariffTotals(distanceKm, minutesEst);
    const totalNum = Math.round(preSurge * surgeMultiplier * 100) / 100;

    const roll = Math.random();
    let status: OrderStatus;
    let cancelReason: CancellationReason | null = null;
    if (roll < 0.7) status = 'COMPLETED';
    else if (roll < 0.83) status = 'CANCELLED';
    else if (roll < 0.9) status = 'IN_PROGRESS';
    else if (roll < 0.95) status = 'ACCEPTED';
    else status = 'SEARCHING';

    if (status === 'CANCELLED') {
      cancelReason = pick([
        'CLIENT_REQUEST',
        'DRIVER_REQUEST',
        'NO_DRIVERS_AVAILABLE',
        'PLATFORM',
        'OTHER',
      ] as CancellationReason[]);
    }

    const client = pick(clientRows);
    const driver =
      status === 'SEARCHING' ? null : status === 'CANCELLED' && Math.random() < 0.35 ? null : pick(driverRows);

    const driverId = driver?.id ?? null;
    const plannedRouteDistanceKm = distanceKm * (0.94 + Math.random() * 0.04);
    const actualRouteDistanceKm =
      status === 'COMPLETED' ? distanceKm * (0.98 + Math.random() * 0.12) : null;

    let startedAt: Date | null = null;
    let finishedAt: Date | null = null;
    let platformFeeAmount: number | null = null;
    let driverEarningAmount: number | null = null;

    if (status === 'COMPLETED' || status === 'IN_PROGRESS' || status === 'ACCEPTED') {
      startedAt = new Date(createdAt.getTime() + (3 + Math.random() * 8) * 60000);
    }
    if (status === 'COMPLETED' && driverId) {
      finishedAt = new Date((startedAt ?? createdAt).getTime() + (12 + Math.random() * 35) * 60000);
      platformFeeAmount = Math.round(totalNum * 0.12 * 100) / 100;
      driverEarningAmount = Math.round(totalNum * 0.8 * 100) / 100;
    }

    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        driverId,
        tariffId: economyTariff.id,
        pickupAddress: p.displayName,
        pickupLat,
        pickupLng,
        dropoffAddress: d.displayName,
        dropoffLat,
        dropoffLng,
        distanceKm,
        totalPrice: totalNum,
        paymentMethod: Math.random() > 0.35 ? 'CARD' : 'CASH',
        status,
        surgeMultiplier,
        plannedRouteDistanceKm,
        actualRouteDistanceKm,
        platformFeeAmount,
        driverEarningAmount,
        cancellationReason: cancelReason,
        cancelledByRole:
          status === 'CANCELLED' ? pick(['CLIENT', 'DRIVER', 'DISPATCHER'] as Role[]) : null,
        startedAt,
        finishedAt,
      },
    });

    if (driverId && Math.random() > 0.15) {
      const pair = pick(CHAT_SNIPPETS);
      const t0 = createdAt.getTime();
      let hist: { id: string; role: string; text: string; sentAt: string }[] = [
        {
          id: randomUUID(),
          role: 'CLIENT',
          text: pair.client,
          sentAt: new Date(t0 + 60000).toISOString(),
        },
        {
          id: randomUUID(),
          role: 'DRIVER',
          text: pair.driver,
          sentAt: new Date(t0 + 120000).toISOString(),
        },
      ];
      if (Math.random() > 0.5) {
        hist.push({
          id: randomUUID(),
          role: 'CLIENT',
          text: 'Дякую!',
          sentAt: new Date(t0 + 180000).toISOString(),
        });
      }
      await prisma.chat.create({
        data: {
          orderId: order.id,
          history: hist,
        },
      });
    }

    if (status === 'COMPLETED' && driverId && driverEarningAmount != null) {
      await prisma.transaction.create({
        data: {
          driverId,
          orderId: order.id,
          amount: driverEarningAmount,
          type: 'ORDER_EARNING',
        },
      });
    }

    if (status === 'COMPLETED' && driverId && Math.random() > 0.45) {
      const rating = Math.random() > 0.2 ? 5 : 4;
      await prisma.review.create({
        data: {
          orderId: order.id,
          authorId: client.id,
          driverId,
          subjectUserId: driver!.user.id,
          rating,
          comment:
            rating === 5
              ? pick(['Чисте авто, акуратно їхав', 'Швидко приїхав, рекомендую', 'Приємний водій'])
              : pick(['Нормально, але затримка 5 хв', 'Добре, але кондиціонер не працював']),
        },
      });
    }

    if (
      status === 'COMPLETED' &&
      driverId &&
      finishedAt &&
      startedAt &&
      Math.random() > 0.35
    ) {
      const steps = 10 + Math.floor(Math.random() * 10);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const lat = pickupLat + (dropoffLat - pickupLat) * t + frand(-0.0004, 0.0004);
        const lng = pickupLng + (dropoffLng - pickupLng) * t + frand(-0.0004, 0.0004);
        const c = clampToOdessaDriveBounds(lat, lng);
        const ts = new Date(
          startedAt.getTime() + (finishedAt.getTime() - startedAt.getTime()) * (s / steps)
        );
        locationBatch.push({
          driverId,
          orderId: order.id,
          lat: c.lat,
          lng: c.lng,
          speed: frand(18, 48),
          timestamp: ts,
        });
      }
    }
  }

  for (let di = 0; di < 22; di++) {
    const d = pick(driverRows);
    await prisma.transaction.create({
      data: {
        driverId: d.id,
        amount: Math.round(frand(200, 2500) * 100) / 100,
        type: 'DEPOSIT',
      },
    });
  }

  while (locationBatch.length > 0) {
    const chunk = locationBatch.splice(0, 500);
    await prisma.locationLog.createMany({ data: chunk });
  }

  console.log('Demo orders, chats, reviews, transactions & location logs created');

  await resetPresentationDemoUsers(prisma);
  console.log(
    `Демо-пара для презентації: клієнт ${DEMO_SHOWCASE_CLIENT_PHONE}, водій ${DEMO_SHOWCASE_DRIVER_PHONE} (пароль ${DEMO_PASSWORD}) — без історії, рейтинг 5.0`
  );
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
