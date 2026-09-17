import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? '';
  const u = new URL(url);
  const isManagedPooler = /neon\.tech|pooler|supabase|render\.com|amazonaws\.com/i.test(u.hostname);

  // Neon/serverless poolers need these flags. Local Postgres does not —
  // applying pgbouncer=true locally caused 30s timeouts and failed logins.
  if (isManagedPooler) {
    if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true');
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '5');
    if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '30');
  }

  return u.toString();
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: { url: resolveDatabaseUrl() },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
