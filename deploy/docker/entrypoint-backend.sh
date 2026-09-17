#!/bin/sh
set -e
cd /app/backend
echo "▶ prisma db push"
npx prisma db push --skip-generate
echo "▶ seed super admin"
npx tsx scripts/seed_admin.ts
if [ "${SEED_DEMO:-true}" = "true" ]; then
  echo "▶ seed demo data"
  npx tsx scripts/seed.ts || echo "demo seed skipped/failed (admin seed already applied)"
fi
echo "▶ starting API"
exec node dist/index.js
