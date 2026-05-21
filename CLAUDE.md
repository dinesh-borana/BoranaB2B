# Borana Jewels — B2B Ordering Portal (borana-b2b)

## What this project is
A B2B ordering web app (installable PWA) for Borana Jewels, an imitation jewellery
wholesaler. Two kinds of users:

- **Customers (parties / dealers):** browse catalog, pick products, choose variant +
  size + quantity, place orders. No online payment — payment is handled manually by
  the team after the order.
- **Admins (Borana team):** manage orders, products (with variants & sizes), parties,
  categories; view reports.

The whole app is ONE Next.js codebase (frontend + API routes + DB).

## Tech stack (do not change without asking)
- Next.js 14+ (App Router, TypeScript, src/ directory)
- Tailwind CSS for styling
- Prisma ORM
- PostgreSQL database
- next-auth (Auth.js, next-auth@beta) for authentication, credentials provider
  (mobile/email + password)
- next-pwa for installable PWA
- Deployed to Vercel; DB on Neon / Vercel Postgres / Supabase
- React Hook Form + Zod for forms & validation
- lucide-react for icons

## Design system (match the approved mockups)
- Customer side primary color: `#854F0B` (rich gold-brown)
- Admin side primary color: `#412402` (deep brown) — so the two are distinguishable
- Success / orders accent: teal `#0F6E56`
- Info / parties accent: blue `#185FA5`
- Highlight accents: pink `#993556`, purple `#534AB7`
- Light warm surface: `#FAEEDA`
- Currency is INR, format like `₹91,670` (Indian comma grouping)
- Clean, flat, professional. Rounded cards (rounded-lg / rounded-xl). No heavy shadows.
- Mobile-first — most customers will use phones. Bottom tab nav on mobile.
- Sentence case for all labels. No ALL CAPS except small section eyebrows.

## Roles & routing
- `/login` — shared login, redirect by role after auth
- `/(customer)/...` — customer pages, layout has bottom tab nav (Home, Catalog, Orders, Profile)
- `/(admin)/...` — admin pages, layout has bottom tab nav (Dashboard, Orders, Products, Parties, Settings)
- Protect routes with middleware: customers cannot reach `/admin/*`, and vice versa.
- Roles: `ADMIN`, `CUSTOMER`.

## Key business rules
- Price is the SAME for all customers (no per-party pricing for now).
- Do NOT show real stock numbers to customers. Show "In stock" / "Made to order"
  status only. Keep a stock field in DB but hidden from customer UI for now.
- A product has many variants (e.g. Gold plated, Rose gold). Each variant has its own
  price and a set of sizes (e.g. 2.4, 2.6, 2.8, 2.10).
- An order line captures: product, variant, and a quantity PER SIZE.
- GST is 3% on jewellery — show as a line item, make the rate a setting.
- Order statuses: PENDING → CONFIRMED → PACKING → SHIPPED → DELIVERED (plus REJECTED/CANCELLED).
- When admin adds a party, optionally auto-create their app login and send credentials
  (stub the SMS/WhatsApp send for now — just log it).

## Screens (all approved as mockups)
Customer: Login, Dashboard, Catalog (search+category filter), Product detail
(variant/size/qty picker), Cart, Checkout, Order success, My orders, Order detail, Profile.
Admin: Dashboard (stats), Orders list, Order detail (status update), Products list,
Add/Edit product (with variants+sizes), Parties list, Add/Edit party, Categories, Reports, Settings.

## Conventions
- TypeScript everywhere, strict mode.
- Server Components by default; mark client components with "use client" only when needed.
- Server Actions or Route Handlers for mutations — keep DB logic out of client.
- Money stored in DB as Prisma `Decimal`. Be consistent everywhere.
- Validate every form with Zod on both client and server.
- Reusable UI in `src/components/ui/`. Feature components in `src/components/`.
- Keep a `src/lib/` folder for prisma client, auth config, formatters (e.g. formatINR).
- Seed script must create: 1 admin, 2-3 sample parties, a few categories, and several
  products with variants & sizes so the app is demoable immediately.

## Working style for Claude Code
- Build incrementally. After each milestone, make sure `npm run dev` works and the
  page renders before moving on.
- When unsure about a product/business decision, ASK rather than assume.
- Write the Prisma schema first, run the migration, then build pages on top.
- Don't install extra libraries beyond the stack above without explaining why.
- Commit to git after each working phase.