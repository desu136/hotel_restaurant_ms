import { prisma } from '../src/lib/prisma';

async function main() {
  const latestTenants = await prisma.tenant.findMany({
    orderBy: { created_at: 'desc' },
    take: 5,
    include: {
      users: {
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  console.log('--- LATEST 5 TENANTS & USERS ---');
  for (const t of latestTenants) {
    console.log(`Tenant ID: ${t.id} | Name: ${t.business_name} | Email: ${t.email} | Status: ${t.status} | Created: ${t.created_at}`);
    for (const u of t.users) {
      console.log(`  -> User ID: ${u.id} | Email: ${u.email} | Status: ${u.status} | Hash: ${u.password_hash.substring(0, 20)}... | Roles: ${u.roles.map(r => r.role.code).join(', ')}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
