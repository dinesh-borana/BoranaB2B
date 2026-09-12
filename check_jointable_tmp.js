const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ quiet: true });

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

(async () => {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name='_CategoryToProduct'
  `);
  console.log('Join table columns:', cols);

  const sample = await prisma.$queryRawUnsafe(`SELECT * FROM "_CategoryToProduct" LIMIT 3`);
  console.log('Sample rows:', sample);

  const cat = await prisma.category.findFirst();
  console.log('Sample category id:', cat && cat.id);

  const prod = await prisma.product.findFirst();
  console.log('Sample product id:', prod && prod.id);

  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
