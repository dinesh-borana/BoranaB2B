import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { PrintTrigger } from "./PrintTrigger";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order
    .findUnique({ where: { id }, select: { orderNumber: true } })
    .catch(() => null);
  return { title: order ? `Order #${order.orderNumber}` : "Order" };
}

// Indian number to words
function amountInWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const n = Math.round(amount);
  return (convert(n) || "Zero") + " only";
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order
    .findUnique({
      where: { id },
      include: { party: true, items: true },
    })
    .catch(() => null);

  if (!order) notFound();

  // Fetch SKUs and MTO sizes separately
  const productIds = order.items.map((i) => i.productId).filter((p): p is string => !!p);
  const skuMap: Record<string, string> = {};
  const mtoMap: Record<string, Set<string>> = {};
  if (productIds.length > 0) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true },
    });
    for (const p of products) skuMap[p.id] = p.sku;

    const mtoSizes = await prisma.productSize.findMany({
      where: { productId: { in: productIds }, stockStatus: "MADE_TO_ORDER" },
      select: { productId: true, size: true },
    });
    for (const s of mtoSizes) {
      if (!mtoMap[s.productId]) mtoMap[s.productId] = new Set();
      mtoMap[s.productId].add(s.size);
    }
  }

  // Collect all unique sizes ordered across ALL items, sort low→high
  function sortSizes(sizes: string[]): string[] {
    return [...sizes].sort((a, b) => {
      const [am = 0, an = 0] = a.split(".").map(Number);
      const [bm = 0, bn = 0] = b.split(".").map(Number);
      return am !== bm ? am - bm : an - bn;
    });
  }

  const allSizesSet = new Set<string>();
  for (const item of order.items) {
    const sq = item.sizeQuantities as Record<string, number>;
    for (const [size, qty] of Object.entries(sq)) {
      if (qty > 0) allSizesSet.add(size);
    }
  }
  const allSizes = sortSizes(Array.from(allSizesSet));

  // Per-size totals across all items
  const sizeTotals: Record<string, number> = {};
  for (const size of allSizes) sizeTotals[size] = 0;

  const itemRows = order.items.map((item) => {
    const itemName = item.productId ? (skuMap[item.productId] ?? item.productName) : item.productName;
    const sq = item.sizeQuantities as Record<string, number>;
    const mtoSizes = item.productId ? (mtoMap[item.productId] ?? new Set()) : new Set<string>();
    for (const size of allSizes) {
      sizeTotals[size] = (sizeTotals[size] ?? 0) + (sq[size] ?? 0);
    }
    return { item, itemName, sq, mtoSizes, rate: Number(item.unitPrice), lineTotal: Number(item.lineTotal) };
  });

  const total = Number(order.total);
  const subtotal = Number(order.subtotal);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 10mm 12mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        table { border-collapse: collapse; }
      `}</style>
      <PrintTrigger />

      <div className="bg-white p-5 text-[13px] text-stone-900" style={{ fontFamily: "Arial, sans-serif" }}>
        <div className="mx-auto max-w-[700px]">

          {/* ── Company Header ── */}
          <div className="mb-1 flex items-center justify-center gap-4 border-b-2 border-[#412402] pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/borana-logo.png" alt="Borana Creation" className="h-16 w-16 object-contain" />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#412402]">Borana Creation</h1>
              <p className="mt-0.5 text-xs text-stone-500">
                S-6, ADITYA PLAZA, NEAR BOMBAY TALKIES, DADI SHETH MARG, MALAD (WEST) Mumbai
              </p>
              <p className="text-xs text-stone-500">Phone no.: 7506322657</p>
            </div>
          </div>

          {/* ── Invoice label ── */}
          <div className="my-1 text-center text-sm font-bold uppercase tracking-widest text-stone-600">
            Invoice
          </div>

          {/* ── Bill To + Invoice Details ── */}
          <table className="w-full border border-stone-300 text-xs">
            <tbody>
              <tr>
                <td className="w-1/2 border-r border-stone-300 align-top">
                  <div className="bg-[#412402] px-2 py-1 text-[11px] font-bold text-white">Bill To</div>
                  <div className="px-2 py-2">
                    <p className="font-bold text-stone-900">{order.party.shopName}</p>
                    {order.party.ownerName && <p>{order.party.ownerName}</p>}
                    {(order.party.address || order.party.city) && (
                      <p className="text-stone-600">
                        {[order.party.address, order.party.city, order.party.state, order.party.pincode]
                          .filter(Boolean).join(", ")}
                      </p>
                    )}
                    {order.party.mobile && <p>Contact No.: {order.party.mobile}</p>}
                    {order.party.gstin && <p>GSTIN: {order.party.gstin}</p>}
                  </div>
                </td>
                <td className="w-1/2 align-top">
                  <div className="bg-[#412402] px-2 py-1 text-[11px] font-bold text-white">Invoice Details</div>
                  <div className="px-2 py-2">
                    <p>Invoice No.: <span className="font-semibold">{order.orderNumber}</span></p>
                    <p>Date: <span className="font-semibold">{formatDateTime(order.createdAt)}</span></p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Items Table ── */}
          <table className="mt-2 w-full border border-stone-300 text-xs">
            <thead>
              <tr className="bg-[#412402] text-white">
                <th className="border-r border-[#5a3003] px-2 py-1.5 text-center font-bold whitespace-nowrap">#</th>
                <th className="border-r border-[#5a3003] px-2 py-1.5 text-left font-bold">Item</th>
                <th className="border-r border-[#5a3003] px-2 py-1.5 text-right font-bold whitespace-nowrap">Rate</th>
                {allSizes.map((size) => (
                  <th key={size} className="border-r border-[#5a3003] px-2 py-1.5 text-center font-bold whitespace-nowrap">
                    {size}
                  </th>
                ))}
                <th className="border-r border-[#5a3003] px-2 py-1.5 text-center font-bold whitespace-nowrap">Pcs</th>
                <th className="px-2 py-1.5 text-right font-bold whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map(({ item, itemName, sq, mtoSizes, rate, lineTotal }, i) => (
                <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                  <td className="border-r border-t border-stone-200 px-2 py-2 text-center align-middle">{i + 1}</td>
                  <td className="border-r border-t border-stone-200 px-2 py-2 font-semibold align-middle">{itemName}</td>
                  <td className="border-r border-t border-stone-200 px-2 py-2 text-right align-middle whitespace-nowrap">{fmt(rate)}</td>
                  {allSizes.map((size) => {
                    const qty = sq[size] ?? 0;
                    const isMto = mtoSizes.has(size) && qty > 0;
                    return (
                      <td key={size} className="border-r border-t border-stone-200 px-2 py-2 text-center align-middle">
                        {qty > 0 ? (
                          <span className="font-semibold">
                            {qty}
                            {isMto && <span className="ml-0.5 text-[8px] font-bold text-amber-600">*</span>}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-r border-t border-stone-200 px-2 py-2 text-center align-middle font-semibold">{item.pieces}</td>
                  <td className="border-t border-stone-200 px-2 py-2 text-right align-middle font-semibold">{fmt(lineTotal)}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-stone-400 bg-stone-50 font-bold">
                <td className="border-r border-stone-300 px-2 py-1.5" />
                <td className="border-r border-stone-300 px-2 py-1.5">Total</td>
                <td className="border-r border-stone-300 px-2 py-1.5" />
                {allSizes.map((size) => (
                  <td key={size} className="border-r border-stone-300 px-2 py-1.5 text-center">
                    {sizeTotals[size] > 0 ? sizeTotals[size] : <span className="text-stone-300">—</span>}
                  </td>
                ))}
                <td className="border-r border-stone-300 px-2 py-1.5 text-center">{order.totalPieces}</td>
                <td className="px-2 py-1.5 text-right">{fmt(subtotal)}</td>
              </tr>
            </tbody>
          </table>
          {/* MTO footnote */}
          {itemRows.some(({ mtoSizes, sq }) =>
            allSizes.some((s) => mtoSizes.has(s) && (sq[s] ?? 0) > 0)
          ) && (
            <p className="mt-1 text-[10px] text-amber-700">* Made to Order</p>
          )}

          {/* ── Amounts ── */}
          <div className="mt-2 flex justify-end">
            <table className="w-56 border border-stone-300 text-xs">
              <thead>
                <tr>
                  <th colSpan={2} className="bg-[#412402] px-2 py-1 text-left font-bold text-white">
                    Amounts
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-stone-200">
                  <td className="border-r border-stone-200 px-2 py-1">SubTotal</td>
                  <td className="px-2 py-1 text-right">{fmt(subtotal)}</td>
                </tr>
                <tr className="border-t-2 border-stone-400 font-bold">
                  <td className="border-r border-stone-200 px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-right">{fmt(total)}</td>
                </tr>
                <tr className="border-t border-stone-200">
                  <td className="border-r border-stone-200 px-2 py-1">Balance</td>
                  <td className="px-2 py-1 text-right">0.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Amount in Words ── */}
          <table className="mt-2 w-full border border-stone-300 text-xs">
            <tbody>
              <tr>
                <td className="bg-[#412402] px-2 py-1 font-bold text-white">Invoice Amount In Words</td>
              </tr>
              <tr>
                <td className="px-2 py-1.5 italic text-stone-700">{amountInWords(total)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Footer ── */}
          <table className="mt-2 w-full border border-stone-300 text-xs">
            <tbody>
              <tr>
                <td className="w-1/2 border-r border-stone-300 align-top">
                  <div className="bg-[#412402] px-2 py-1 font-bold text-white">Terms and Conditions</div>
                  <div className="px-2 py-2 text-stone-600">Thanks for doing business with us!</div>
                </td>
                <td className="w-1/2 px-2 py-2 text-right align-top">
                  <p>For : Borana Creation</p>
                  <p className="mt-10 border-t border-stone-300 pt-1 text-center text-stone-500">
                    Authorized Signatory
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </>
  );
}
