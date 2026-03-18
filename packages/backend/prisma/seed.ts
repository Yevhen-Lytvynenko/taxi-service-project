/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Admin',
      phone: '+380000000001',
      role: 'ADMIN',
    },
  });

  console.log('Admin user created/updated');

  // Тариф ECONOMY для замовлень
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
