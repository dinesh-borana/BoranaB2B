import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("→ Seeding Borana B2B…");

  const adminPassword = await bcrypt.hash("admin@123", 10);
  const customerPassword = await bcrypt.hash("party@123", 10);

  const admin = await prisma.user.upsert({
    where: { mobile: "9000000001" },
    update: {},
    create: {
      name: "Borana Admin",
      mobile: "9000000001",
      email: "admin@boranajewels.in",
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
      gstin: "24ABCDE1234F1Z5",
    },
    {
      shopName: "Lalit Bangles",
      ownerName: "Lalit Sharma",
      mobile: "9000000011",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302002",
      gstin: "08ABCDE1234F1Z5",
    },
    {
      shopName: "Mumbai Imitation House",
      ownerName: "Rakesh Mehta",
      mobile: "9000000012",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400002",
      gstin: "27ABCDE1234F1Z5",
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

  const cats = await prisma.category.findMany();
  const byName = (n: string) => cats.find((c) => c.name === n)!;

  type V = { name: string; color?: string; price: number; sizes: string[] };
  type P = {
    sku: string;
    name: string;
    description: string;
    category: string;
    image: string;
    variants: V[];
  };

  const products: P[] = [
    {
      sku: "BJ-BNG-001",
      name: "Antique kada — peacock",
      description:
        "Hand-finished antique peacock kada with cz stones. Comes in matched pairs.",
      category: "Bangles",
      image:
        "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900",
      variants: [
        {
          name: "Gold plated",
          color: "Antique gold",
          price: 320,
          sizes: ["2.4", "2.6", "2.8", "2.10"],
        },
        {
          name: "Rose gold",
          color: "Rose gold",
          price: 360,
          sizes: ["2.4", "2.6", "2.8"],
        },
      ],
    },
    {
      sku: "BJ-BNG-002",
      name: "Daily-wear thin bangles set",
      description: "Set of 4 thin bangles. Lightweight, daily-wear finish.",
      category: "Bangles",
      image:
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900",
      variants: [
        {
          name: "Gold plated",
          price: 180,
          sizes: ["2.4", "2.6", "2.8", "2.10"],
        },
      ],
    },
    {
      sku: "BJ-EAR-001",
      name: "Jhumka — temple work",
      description:
        "South-style temple jhumka with goddess motif and pearl drops.",
      category: "Earrings",
      image:
        "https://images.unsplash.com/photo-1635767582909-345b22a3e51d?w=900",
      variants: [
        { name: "Antique gold", price: 220, sizes: ["Standard"] },
        { name: "Silver oxidised", price: 200, sizes: ["Standard"] },
      ],
    },
    {
      sku: "BJ-EAR-002",
      name: "Chandbali — kundan",
      description: "Lightweight kundan chandbali with meena work.",
      category: "Earrings",
      image:
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900",
      variants: [
        { name: "Gold plated", price: 260, sizes: ["Standard"] },
        { name: "Rose gold", price: 290, sizes: ["Standard"] },
      ],
    },
    {
      sku: "BJ-NCK-001",
      name: "Bridal choker set",
      description:
        "Heavy bridal choker with matched earrings and maang tikka.",
      category: "Necklace sets",
      image:
        "https://images.unsplash.com/photo-1631982690223-8aa2c8bea9e6?w=900",
      variants: [
        { name: "Gold plated", price: 1450, sizes: ["Standard"] },
        { name: "Antique finish", price: 1380, sizes: ["Standard"] },
      ],
    },
    {
      sku: "BJ-NCK-002",
      name: "Pearl haar — 3 layer",
      description: "Three-layer pearl haar with cz pendant.",
      category: "Necklace sets",
      image:
        "https://images.unsplash.com/photo-1611591437281-460914d56cd9?w=900",
      variants: [{ name: "White pearl", price: 780, sizes: ["Standard"] }],
    },
    {
      sku: "BJ-RNG-001",
      name: "Cocktail ring — emerald",
      description: "Statement cocktail ring with emerald-colour cz stone.",
      category: "Rings",
      image:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=900",
      variants: [
        {
          name: "Gold plated",
          price: 140,
          sizes: ["12", "14", "16", "18"],
        },
      ],
    },
    {
      sku: "BJ-MNG-001",
      name: "Daily mangalsutra",
      description: "Slim, daily-wear mangalsutra with vati pendant.",
      category: "Mangalsutra",
      image:
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=900",
      variants: [
        { name: "Gold plated — 24 inch", price: 380, sizes: ["24 inch"] },
        { name: "Gold plated — 28 inch", price: 420, sizes: ["28 inch"] },
      ],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findUnique({
      where: { sku: p.sku },
    });
    if (existing) {
      await prisma.productVariant.deleteMany({
        where: { productId: existing.id },
      });
      await prisma.productImage.deleteMany({
        where: { productId: existing.id },
      });
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: p.name,
          description: p.description,
          categoryId: byName(p.category).id,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          description: p.description,
          categoryId: byName(p.category).id,
        },
      });
    }

    const product = await prisma.product.findUnique({
      where: { sku: p.sku },
    });
    if (!product) continue;

    await prisma.productImage.create({
      data: { url: p.image, isMain: true, productId: product.id },
    });

    for (const v of p.variants) {
      const variant = await prisma.productVariant.create({
        data: {
          name: v.name,
          color: v.color,
          price: v.price,
          productId: product.id,
        },
      });
      for (const size of v.sizes) {
        await prisma.productVariantSize.create({
          data: {
            size,
            stock: 50,
            stockStatus: "IN_STOCK",
            variantId: variant.id,
          },
        });
      }
    }
    console.log(`   product: ${p.sku} — ${p.name}`);
  }

  const settings = [
    { key: "shop.name", value: "Borana Jewels" },
    { key: "shop.tagline", value: "Imitation jewellery — wholesale orders" },
    { key: "gst.rate", value: "3" },
    { key: "order.prefix", value: "BJ" },
    { key: "support.phone", value: "+91 98765 43210" },
    { key: "support.email", value: "orders@boranajewels.in" },
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
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
