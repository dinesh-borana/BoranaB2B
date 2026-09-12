const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

(async () => {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name ILIKE '%categor%'
  `);
  console.log('Tables:', tables);
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='Product'
  `);
  console.log('Product columns:', cols.map(c => c.column_name));
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
