/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ODESSA_ADDRESSES, clampToOdessaDriveBounds } from '../src/data/odessa-addresses';

const prisma = new PrismaClient();

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

  // Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedAdmin },
    create: {
      username: 'admin',
      password: hashedAdmin,
      fullName: 'Admin',
      phone: '+380000000001',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created/updated');

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

  // Demo client: phone +380991111111, password demo
  await prisma.user.upsert({
    where: { phone: '+380991111111' },
    update: { password: hashedDemo, fullName: 'Демо Клієнт', role: 'CLIENT' },
    create: {
      fullName: 'Демо Клієнт',
      phone: '+380991111111',
      password: hashedDemo,
      role: 'CLIENT',
    },
  });
  console.log('Demo client created/updated');

  // Demo driver: username demodriver, phone +380992222222, password demo
  const demoDriverUser = await prisma.user.upsert({
    where: { phone: '+380992222222' },
    update: { password: hashedDemo, fullName: 'Демо Водій', username: 'demodriver', role: 'DRIVER' },
    create: {
      fullName: 'Демо Водій',
      username: 'demodriver',
      phone: '+380992222222',
      password: hashedDemo,
      role: 'DRIVER',
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
      data: { licenseNumber: 'DEMO000001' },
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
        },
      });
    }
  }
  console.log('50 drivers created/updated');

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
