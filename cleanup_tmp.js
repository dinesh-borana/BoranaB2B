const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config({ quiet: true });

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

(async () => {
  const products = await prisma.product.findMany({ take: 28, select: { id: true } });
  const categories = await prisma.category.findMany({ take: 2, select: { id: true } });
  const productIds = products.map(p => p.id);
  const categoryIds = categories.map(c => c.id);

  const del = await prisma.$executeRaw`
    DELETE FROM "_CategoryToProduct"
    WHERE "A" = ANY(${categoryIds}::text[]) AND "B" = ANY(${productIds}::text[])
  `;
  console.log('Deleted test rows:', del);

  await prisma.$disconnect();
})();
