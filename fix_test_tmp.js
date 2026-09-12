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

  const start = Date.now();
  try {
    const n = await prisma.$executeRaw`
      INSERT INTO "_CategoryToProduct" ("A", "B")
      SELECT c, p
      FROM unnest(${categoryIds}::text[]) AS c
      CROSS JOIN unnest(${productIds}::text[]) AS p
      ON CONFLICT DO NOTHING
    `;
    console.log('SUCCESS rows affected:', n, 'in', Date.now() - start, 'ms');
  } catch (err) {
    console.log('FAILED after', Date.now() - start, 'ms');
    console.error(err);
  }

  // verify
  const check = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, categories: { select: { id: true } } },
  });
  const allLinked = check.every(p => categoryIds.every(cid => p.categories.some(c => c.id === cid)));
  console.log('All 28 products now linked to both categories:', allLinked);

  await prisma.$disconnect();
})();
