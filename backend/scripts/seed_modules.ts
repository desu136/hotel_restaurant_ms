import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_MODULES = [
  { code: 'HOTEL', name: 'Hotel Management', description: 'Rooms, guests, reservations, room service', is_active: true },
  { code: 'RESTAURANT', name: 'Restaurant POS', description: 'Tables, QR menu, ordering, kitchen display, cashier billing', is_active: true },
];

const DEFAULT_SETTINGS = [
  { key: 'platform_name', value: 'HospitalityHub', description: 'The name of the platform' },
  { key: 'allow_public_registration', value: 'true', description: 'Enable/disable public tenant registration' },
  { key: 'trial_days_default', value: '14', description: 'Default number of trial days' },
];

async function main() {
  console.log('Seeding default modules...');
  for (const m of DEFAULT_MODULES) {
    await prisma.module.upsert({
      where: { code: m.code },
      update: {},
      create: m,
    });
  }

  console.log('Seeding default platform settings...');
  for (const s of DEFAULT_SETTINGS) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Link basic/pro/trial plans to the seeded modules
  const plans = await prisma.subscriptionPlan.findMany();
  const dbModules = await prisma.module.findMany();

  console.log('Linking plans to modules...');
  for (const plan of plans) {
    for (const mod of dbModules) {
      const exists = await prisma.planModule.findUnique({
        where: {
          plan_id_module_id: {
            plan_id: plan.id,
            module_id: mod.id,
          },
        },
      });
      if (!exists) {
        await prisma.planModule.create({
          data: {
            plan_id: plan.id,
            module_id: mod.id,
          },
        });
      }
    }
  }

  console.log('✅ Modules and settings seeded successfully!');
}

main()
  .catch((err) => {
    console.error('Failed seeding modules:', err);
  })
  .finally(() => {
    prisma.$disconnect();
  });
