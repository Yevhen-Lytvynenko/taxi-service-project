import { io } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const SERVER_URL = 'http://localhost:4000';
const DRIVER_COUNT = 5;

const BASE_LAT = 46.4825;
const BASE_LNG = 30.7233;

interface SimDriver {
  id: string;
  lat: number;
  lng: number;
  latDir: number;
  lngDir: number;
  socket: ReturnType<typeof io>;
}

async function main() {
  const profiles = await prisma.driverProfile.findMany({
    select: { id: true },
    take: DRIVER_COUNT
  });

  if (profiles.length === 0) {
    console.error('No drivers found. Create drivers first (e.g. via web-admin or seed).');
    process.exit(1);
  }

  const drivers: SimDriver[] = profiles.map((p) => ({
    id: p.id,
    lat: BASE_LAT + (Math.random() - 0.5) * 0.02,
    lng: BASE_LNG + (Math.random() - 0.5) * 0.02,
    latDir: (Math.random() - 0.5) * 0.0005,
    lngDir: (Math.random() - 0.5) * 0.0005,
    socket: io(SERVER_URL)
  }));

  console.log(`Starting simulation for ${drivers.length} drivers...`);

  drivers.forEach((driver) => {
    driver.socket.on('connect', () => {
      console.log(`Driver ${driver.id} connected [${driver.socket.id}]`);
      driver.socket.emit('join_room', `driver_tracking_${driver.id}`);
      driver.socket.emit('join_room', `driver_${driver.id}`);
    });
  });

  setInterval(() => {
    drivers.forEach((driver) => {
      driver.lat += driver.latDir;
      driver.lng += driver.lngDir;

      if (Math.abs(driver.lat - BASE_LAT) > 0.05) driver.latDir *= -1;
      if (Math.abs(driver.lng - BASE_LNG) > 0.05) driver.lngDir *= -1;

      driver.socket.emit('update_location', {
        driverId: driver.id,
        lat: driver.lat,
        lng: driver.lng,
        status: 'ONLINE'
      });
    });
    process.stdout.write('.');
  }, 2000);
}

main()
  .then(() => {})
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
