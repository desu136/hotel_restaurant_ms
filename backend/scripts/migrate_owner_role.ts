/**
 * One-time migration: rename the OWNER role code → HOTEL_OWNER in the database.
 * Run once:  npx ts-node scripts/migrate_owner_role.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if HOTEL_OWNER already exists
  const existing = await prisma.role.findUnique({ where: { code: 'HOTEL_OWNER' } });

  if (!existing) {
    // Only OWNER exists – rename it
    const updated = await prisma.role.updateMany({
      where: { code: 'OWNER' },
      data:  { code: 'HOTEL_OWNER', name: 'Hotel/Restaurant Owner' },
    });
    console.log(`✅ Renamed ${updated.count} role(s): OWNER → HOTEL_OWNER`);
  } else {
    // HOTEL_OWNER already in DB – delete orphan OWNER role if present
    const deleted = await prisma.role.deleteMany({ where: { code: 'OWNER' } });
    console.log(`ℹ️  HOTEL_OWNER already exists. Removed ${deleted.count} stale OWNER role(s).`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
