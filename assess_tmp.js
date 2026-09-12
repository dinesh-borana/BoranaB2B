const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ quiet: true });

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

(async () => {
  const products = await prisma.product.findMany({ take: 28, select: { id: true, sku: true } });
  const categories = await prisma.category.findMany({ take: 2, select: { id: true, name: true } });
  console.log('Categories used in test:', categories);
  console.log('Product count:', products.length);
  console.log('Product SKUs:', products.map(p => p.sku));

  const totalLinks = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "_CategoryToProduct"`);
  console.log('Total links currently in table:', totalLinks);

  await prisma.$disconnect();
})();
