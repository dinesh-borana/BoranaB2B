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
  console.log('products:', productIds.length, 'categories:', categoryIds.length);

  const start = Date.now();
  try {
    await prisma.$transaction(async (tx) => {
      for (const id of productIds) {
        await tx.product.update({
          where: { id },
          data: { categories: { connect: categoryIds.map((catId) => ({ id: catId })) } },
        });
      }
    });
    console.log('SUCCESS in', Date.now() - start, 'ms');
  } catch (err) {
    console.log('FAILED after', Date.now() - start, 'ms');
    console.error(err);
  }
  await prisma.$disconnect();
})();
