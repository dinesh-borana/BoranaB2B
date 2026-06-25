//Dinesh Borana
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
  const shipping = Number(order.shippingCharges ?? 0);

  const hasMto = itemRows.some(({ mtoSizes, sq }) =>
    allSizes.some((s) => mtoSizes.has(s) && (sq[s] ?? 0) > 0)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        @page { size: A4; margin: 8mm 10mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        body { margin: 0; background: #fff; }
      `}</style>
      <PrintTrigger />

      <div style={{ fontFamily: "'EB Garamond', Georgia, serif", background: "#fff", minHeight: "100vh", padding: "0" }}>
        <div style={{ maxWidth: 740, margin: "0 auto", padding: "20px 24px 28px" }}>

          {/* ══ HEADER ══ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, borderBottom: "2px solid #8b1a2e", marginBottom: 16 }}>
            {/* Logo + Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/borana-logo.png"
                alt="Borana Creation"
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flexShrink: 0, border: "1px solid #f0e6e8" }}
              />
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#8b1a2e", letterSpacing: 0.5, lineHeight: 1.1 }}>
                  Borana Creation
                </div>
                <div style={{ fontSize: 10.5, color: "#6b5a5d", marginTop: 4, lineHeight: 1.6, fontStyle: "italic" }}>
                  S-6, Aditya Plaza, Near Bombay Talkies,<br />
                  Dadi Sheth Marg, Malad (West), Mumbai
                </div>
                <div style={{ fontSize: 10.5, color: "#6b5a5d", marginTop: 1, fontStyle: "italic" }}>
                  Phone: 7506322657
                </div>
              </div>
            </div>

            {/* Invoice badge */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#8b1a2e", letterSpacing: 3, textTransform: "uppercase" }}>
                Invoice
              </div>
              <div style={{ marginTop: 8, background: "#fdf2f4", border: "1px solid #f4c5cf", borderRadius: 8, padding: "8px 14px", textAlign: "right" }}>
                <div style={{ fontSize: 10, color: "#7a5a5e", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Invoice No.</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a0d10" }}>{order.orderNumber}</div>
                <div style={{ fontSize: 10, color: "#7a5a5e", textTransform: "uppercase", letterSpacing: 1, marginTop: 6, marginBottom: 2 }}>Date</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a0d10" }}>{formatDateTime(order.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* ══ BILL TO ══ */}
          <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
            <div style={{ flex: 1, background: "#fdf2f4", border: "1px solid #f4c5cf", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#8b1a2e", marginBottom: 8 }}>
                Bill To
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1a0d10", marginBottom: 3 }}>
                {order.party?.shopName ?? order.guestName ?? "Guest"}
              </div>
              {order.party?.ownerName && (
                <div style={{ fontSize: 12, color: "#4a3035", marginBottom: 2 }}>{order.party.ownerName}</div>
              )}
              {(order.party?.address || order.party?.city || order.guestAddress) && (
                <div style={{ fontSize: 11, color: "#6b5a5d", marginBottom: 2, lineHeight: 1.5 }}>
                  {order.party
                    ? [order.party.address, order.party.city, order.party.state, order.party.pincode].filter(Boolean).join(", ")
                    : [order.guestAddress, order.guestPincode].filter(Boolean).join(", ")}
                </div>
              )}
              {(order.party?.mobile ?? order.guestMobile) && (
                <div style={{ fontSize: 11, color: "#4a3035", marginBottom: 2 }}>Contact: {order.party?.mobile ?? order.guestMobile}</div>
              )}
              {order.party?.gstin && (
                <div style={{ fontSize: 11, color: "#4a3035" }}>GSTIN: <span style={{ fontWeight: 600 }}>{order.party.gstin}</span></div>
              )}
            </div>

            {/* Summary box */}
            <div style={{ width: 200, background: "#fff9f0", border: "1px solid #e8d4b0", borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#8b1a2e", marginBottom: 8 }}>
                Summary
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b5a5d", marginBottom: 5 }}>
                <span>Total Items</span>
                <span style={{ fontWeight: 600, color: "#1a0d10" }}>{order.items.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b5a5d", marginBottom: 5 }}>
                <span>Total Pieces</span>
                <span style={{ fontWeight: 600, color: "#1a0d10" }}>{order.totalPieces}</span>
              </div>
              <div style={{ borderTop: "1px solid #e8d4b0", paddingTop: 7, marginTop: 7, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#8b1a2e" }}>
                <span>Grand Total</span>
                <span>₹{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ ITEMS TABLE ══ */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, marginBottom: 4 }}>
            <thead>
              <tr style={{ background: "#8b1a2e", color: "#fff" }}>
                <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, borderRight: "1px solid rgba(255,255,255,0.15)", width: 28 }}>#</th>
                <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, borderRight: "1px solid rgba(255,255,255,0.15)" }}>Item / SKU</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, borderRight: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap" }}>Rate (₹)</th>
                {allSizes.map((size) => (
                  <th key={size} style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, borderRight: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap" }}>
                    {size}
                  </th>
                ))}
                <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, borderRight: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap" }}>Pcs</th>
                <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 10.5, letterSpacing: 0.5, whiteSpace: "nowrap" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map(({ item, itemName, sq, mtoSizes, rate, lineTotal }, i) => (
                <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fdf8f8", borderBottom: "1px solid #f0e6e8" }}>
                  <td style={{ padding: "7px 10px", textAlign: "center", color: "#7a5a5e", borderRight: "1px solid #f0e6e8", verticalAlign: "middle" }}>{i + 1}</td>
                  <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1a0d10", borderRight: "1px solid #f0e6e8", verticalAlign: "middle" }}>{itemName}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: "#4a3035", borderRight: "1px solid #f0e6e8", verticalAlign: "middle", whiteSpace: "nowrap" }}>{fmt(rate)}</td>
                  {allSizes.map((size) => {
                    const qty = sq[size] ?? 0;
                    const isMto = mtoSizes.has(size) && qty > 0;
                    return (
                      <td key={size} style={{ padding: "7px 8px", textAlign: "center", borderRight: "1px solid #f0e6e8", verticalAlign: "middle" }}>
                        {qty > 0 ? (
                          <span style={{ fontWeight: 700, color: "#1a0d10" }}>
                            {qty}
                            {isMto && <sup style={{ fontSize: 7, color: "#c49a3c", fontWeight: 700 }}>*</sup>}
                          </span>
                        ) : (
                          <span style={{ color: "#d8c8ca" }}>—</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: "7px 10px", textAlign: "center", fontWeight: 600, color: "#1a0d10", borderRight: "1px solid #f0e6e8", verticalAlign: "middle" }}>{item.pieces}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: "#8b1a2e", verticalAlign: "middle" }}>{fmt(lineTotal)}</td>
                </tr>
              ))}
            </tbody>
            {/* Totals footer row */}
            <tfoot>
              <tr style={{ background: "#fdf2f4", borderTop: "2px solid #8b1a2e" }}>
                <td style={{ padding: "8px 10px", borderRight: "1px solid #f0e6e8" }} />
                <td style={{ padding: "8px 10px", fontWeight: 700, color: "#8b1a2e", fontSize: 12, borderRight: "1px solid #f0e6e8" }}>Grand Total</td>
                <td style={{ padding: "8px 10px", borderRight: "1px solid #f0e6e8" }} />
                {allSizes.map((size) => (
                  <td key={size} style={{ padding: "8px 8px", textAlign: "center", fontWeight: 700, color: "#1a0d10", borderRight: "1px solid #f0e6e8" }}>
                    {sizeTotals[size] > 0 ? sizeTotals[size] : <span style={{ color: "#d8c8ca" }}>—</span>}
                  </td>
                ))}
                <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700, color: "#1a0d10", borderRight: "1px solid #f0e6e8" }}>{order.totalPieces}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, color: "#8b1a2e", fontSize: 13 }}>₹{fmt(subtotal)}</td>
              </tr>
            </tfoot>
          </table>
          {hasMto && (
            <div style={{ fontSize: 10, color: "#c49a3c", marginBottom: 12, fontStyle: "italic" }}>
              <sup>*</sup> Made to Order item
            </div>
          )}

          {/* ══ AMOUNT SUMMARY + WORDS ══ */}
          <div style={{ display: "flex", gap: 16, marginTop: hasMto ? 0 : 16, marginBottom: 20 }}>
            {/* Amount in words */}
            <div style={{ flex: 1, background: "#fdf9f0", border: "1px solid #e8d4b0", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#8b1a2e", marginBottom: 6 }}>
                Invoice Amount In Words
              </div>
              <div style={{ fontSize: 12.5, fontStyle: "italic", color: "#4a3035", lineHeight: 1.5 }}>
                Rupees {amountInWords(total)}
              </div>
            </div>

            {/* Amount box */}
            <div style={{ width: 220 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #f4c5cf", borderRadius: 10, overflow: "hidden", fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: "#8b1a2e" }}>
                    <th colSpan={2} style={{ padding: "7px 14px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 10.5, letterSpacing: 1, textTransform: "uppercase" }}>
                      Payment Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #f4c5cf" }}>
                    <td style={{ padding: "7px 14px", color: "#6b5a5d" }}>Sub Total</td>
                    <td style={{ padding: "7px 14px", textAlign: "right", color: "#1a0d10", fontWeight: 500 }}>₹{fmt(subtotal)}</td>
                  </tr>
                  {shipping > 0 && (
                    <tr style={{ borderBottom: "1px solid #f4c5cf" }}>
                      <td style={{ padding: "7px 14px", color: "#6b5a5d" }}>Shipping</td>
                      <td style={{ padding: "7px 14px", textAlign: "right", color: "#1a0d10", fontWeight: 500 }}>₹{fmt(shipping)}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1px solid #f4c5cf", background: "#fdf2f4" }}>
                    <td style={{ padding: "9px 14px", color: "#8b1a2e", fontWeight: 700, fontSize: 13 }}>Grand Total</td>
                    <td style={{ padding: "9px 14px", textAlign: "right", color: "#8b1a2e", fontWeight: 700, fontSize: 14 }}>₹{fmt(total)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "7px 14px", color: "#6b5a5d" }}>Balance Due</td>
                    <td style={{ padding: "7px 14px", textAlign: "right", color: "#0f6e56", fontWeight: 700 }}>₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ══ FOOTER ══ */}
          <div style={{ borderTop: "1.5px solid #f4c5cf", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {/* Terms */}
            <div style={{ flex: 1, paddingRight: 40 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#8b1a2e", marginBottom: 6 }}>
                Terms &amp; Conditions
              </div>
              <div style={{ fontSize: 11, color: "#6b5a5d", lineHeight: 1.6 }}>
                Thank you for your business with us. All disputes subject to Mumbai jurisdiction.
              </div>
            </div>

            {/* Signatory */}
            <div style={{ textAlign: "center", minWidth: 160 }}>
              <div style={{ fontSize: 11, color: "#4a3035", marginBottom: 40 }}>
                For: <strong>Borana Creation</strong>
              </div>
              <div style={{ borderTop: "1px solid #c4a0a8", paddingTop: 6 }}>
                <div style={{ fontSize: 10, color: "#7a5a5e", letterSpacing: 0.5 }}>Authorized Signatory</div>
              </div>
            </div>
          </div>

          {/* Powered by */}
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 9.5, color: "#b8a0a5", letterSpacing: 0.5, fontStyle: "italic" }}>
            Generated by Borana B2B Portal
          </div>

        </div>
      </div>
    </>
  );
}
