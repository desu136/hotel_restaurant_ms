import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      // Append Neon-friendly connection pool parameters if not already present
      url: (() => {
        const url = process.env.DATABASE_URL ?? '';
        const u = new URL(url);
        // Neon pooler requires pgbouncer=true for prepared statement compatibility
        if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true');
        // Limit pool size to avoid exhausting Neon's serverless connection quota
        if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '5');
        // Extend pool timeout for Neon cold-start delays
        if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '30');
        return u.toString();
      })(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
