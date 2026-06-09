/**
 * One-off: fill Review.subjectUserId from driver profile user id.
 * Run: npx tsx scripts/backfill-review-subjects.ts
 */
import { prisma } from '../src/lib/prisma';

async function main() {
  const n = await prisma.$executeRaw`
    UPDATE reviews r
    SET "subjectUserId" = u.id
    FROM driver_profiles dp
    JOIN users u ON u.id = dp."userId"
    WHERE r."driverId" = dp.id AND r."subjectUserId" IS NULL
  `;
  console.log('Updated rows:', n);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
