import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("→ Seeding Panini Jewels B2B…");

  const adminPassword = await bcrypt.hash("admin@123", 10);
  const customerPassword = await bcrypt.hash("party@123", 10);

  const admin = await prisma.user.upsert({
    where: { mobile: "9000000001" },
    update: {},
    create: {
      name: "Panini Admin",
      mobile: "9000000001",
      email: "admin@paninijewels.in",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`   admin: ${admin.mobile} / admin@123`);

  const partySeeds = [
    {
      shopName: "Shree Krishna Jewellers",
      ownerName: "Mahesh Patel",
      mobile: "9000000010",
      city: "Surat",
      state: "Gujarat",
      pincode: "395003",
    },
    {
      shopName: "Lalit Bangles",
      ownerName: "Lalit Sharma",
      mobile: "9000000011",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302002",
    },
    {
      shopName: "Mumbai Imitation House",
      ownerName: "Rakesh Mehta",
      mobile: "9000000012",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400002",
    },
  ];

  for (const p of partySeeds) {
    const party = await prisma.party.upsert({
      where: { mobile: p.mobile },
      update: {},
      create: { ...p, isActive: true },
    });
    await prisma.user.upsert({
      where: { mobile: p.mobile },
      update: { partyId: party.id },
      create: {
        name: p.ownerName,
        mobile: p.mobile,
        passwordHash: customerPassword,
        role: "CUSTOMER",
        partyId: party.id,
      },
    });
    console.log(`   party: ${p.shopName} (${p.mobile} / party@123)`);
  }

  const categories = [
    { name: "Bangles", slug: "bangles", sortOrder: 1 },
    { name: "Earrings", slug: "earrings", sortOrder: 2 },
    { name: "Necklace sets", slug: "necklace-sets", sortOrder: 3 },
    { name: "Rings", slug: "rings", sortOrder: 4 },
    { name: "Mangalsutra", slug: "mangalsutra", sortOrder: 5 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }
  console.log(`   ${categories.length} categories upserted`);

  const settings = [
    { key: "shop.name", value: "Panini Jewels" },
    { key: "shop.tagline", value: "Imitation jewellery — wholesale orders" },
    { key: "gst.rate", value: "3" },
    { key: "order.prefix", value: "PJ" },
    { key: "support.phone", value: "+91 88604 98653" },
    { key: "support.email", value: "orders@paninijewels.in" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
