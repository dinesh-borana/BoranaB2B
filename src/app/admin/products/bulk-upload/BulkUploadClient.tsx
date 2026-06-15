"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Upload,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  TriangleAlert,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  bulkCreateProducts,
  deleteBulkBatch,
  type BulkRow,
  type BulkResult,
} from "./actions";

// ─── Types ───────────────────────────────────────────────────
type FieldError = { field: string; message: string };
type ParsedRow = BulkRow & { _line: number; _errors: FieldError[] };

const VALID_STOCK = ["IN_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"] as const;
const REQUIRED_COLS = ["sku", "price"];

// ─── CSV parser ──────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

type ParseResult =
  | { ok: true; rows: ParsedRow[] }
  | { ok: false; fileError: string };

function parseCSV(text: string): ParseResult {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 1) return { ok: false, fileError: "File is empty." };

  const header = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_").trim()
  );

  const missingCols = REQUIRED_COLS.filter((c) => !header.includes(c));
  if (missingCols.length > 0) {
    return {
      ok: false,
      fileError: `Missing required column${missingCols.length > 1 ? "s" : ""}: ${missingCols.join(", ")}. Use the downloaded template.`,
    };
  }
  if (lines.length < 2) {
    return { ok: false, fileError: "No data rows found. Add at least one product row below the header." };
  }

  const get = (vals: string[], key: string) => {
    const idx = header.indexOf(key);
    return idx >= 0 ? (vals[idx] ?? "").trim() : "";
  };

  const rows: ParsedRow[] = lines.slice(1).map((line, i) => {
    const vals = parseCSVLine(line);
    const errors: FieldError[] = [];

    const sku = get(vals, "sku");
    if (!sku) errors.push({ field: "sku", message: "SKU is required" });
    else if (sku.length > 80) errors.push({ field: "sku", message: "SKU too long (max 80 chars)" });

    const priceStr = get(vals, "price");
    const price = parseFloat(priceStr);
    if (!priceStr) errors.push({ field: "price", message: "Price is required" });
    else if (isNaN(price)) errors.push({ field: "price", message: `"${priceStr}" is not a valid number` });
    else if (price <= 0) errors.push({ field: "price", message: "Price must be > 0" });

    const rawStatus = get(vals, "stock_status").toUpperCase();
    let stockStatus: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" = "IN_STOCK";
    if (rawStatus && !VALID_STOCK.includes(rawStatus as typeof VALID_STOCK[number])) {
      errors.push({ field: "stock_status", message: `Invalid — use IN_STOCK, MADE_TO_ORDER, or OUT_OF_STOCK` });
    } else if (rawStatus) {
      stockStatus = rawStatus as typeof stockStatus;
    }

    const rawSizes = get(vals, "sizes");
    const sizes = rawSizes ? rawSizes.split("|").map((s) => s.trim()).filter(Boolean) : [];
    if (rawSizes && rawSizes.split("|").some((s) => s.trim() === "")) {
      errors.push({ field: "sizes", message: `Empty size entry — check for extra "|"` });
    }

    const rawCategories = get(vals, "categories") || get(vals, "category");
    const categories = rawCategories
      ? rawCategories.split("|").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const activeRaw = get(vals, "active").toLowerCase();
    const isActive = activeRaw !== "no" && activeRaw !== "false" && activeRaw !== "0";

    const imageUrls = [get(vals, "img1"), get(vals, "img2"), get(vals, "img3")].filter(Boolean);

    return {
      _line: i + 2,
      _errors: errors,
      sku,
      price: isNaN(price) ? 0 : price,
      categories,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      sizes,
      stockStatus,
      isActive,
    };
  });

  // Flag duplicate SKUs within the file
  const skuCount = new Map<string, number[]>();
  rows.forEach((r) => {
    if (r.sku) {
      const prev = skuCount.get(r.sku.toLowerCase()) ?? [];
      skuCount.set(r.sku.toLowerCase(), [...prev, r._line]);
    }
  });
  skuCount.forEach((lineNums, sku) => {
    if (lineNums.length > 1) {
      rows.forEach((r) => {
        if (r.sku && r.sku.toLowerCase() === sku) {
          const others = lineNums.filter((l) => l !== r._line);
          r._errors.push({
            field: "sku",
            message: `Duplicate SKU in this file (also on row ${others.join(", ")})`,
          });
        }
      });
    }
  });

  return { ok: true, rows };
}

// ─── Template download ────────────────────────────────────────
const TEMPLATE_HEADERS = ["sku", "price", "categories", "sizes", "stock_status", "active", "img1", "img2", "img3"];

function downloadTemplate() {
  const ex1 = ["BNG-001", "450", "Bangles|New Arrival", "2.4|2.6|2.8", "IN_STOCK", "yes", "", "", ""].join(",");
  const ex2 = ["NCK-002", "780", "Necklaces", "", "MADE_TO_ORDER", "yes", "", "", ""].join(",");
  const csv = [TEMPLATE_HEADERS.join(","), ex1, ex2].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "borana_products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ───────────────────────────────────────────────
export function BulkUploadClient({ categories }: { categories: string[] }) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<BulkResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "deleting" | "done">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = parseResult?.ok ? parseResult.rows : [];
  const validRows = rows.filter((r) => r._errors.length === 0);
  const errorRows = rows.filter((r) => r._errors.length > 0);

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setParseResult({ ok: false, fileError: "Only .csv files are supported." });
      setFileName(file.name);
      return;
    }
    setFileName(file.name);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setParseResult(parseCSV(e.target?.result as string));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleUpload() {
    if (validRows.length === 0 || isUploading) return;
    setIsUploading(true);
    const cleanRows = validRows.map(({ _line: _l, _errors: _e, ...row }) => row);
    const res = await bulkCreateProducts(cleanRows);
    setResult(res);
    setParseResult(null);
    setFileName("");
    setIsUploading(false);
  }

  function reset() {
    setResult(null);
    setParseResult(null);
    setFileName("");
    setDeleteConfirm(false);
    setDeleteState("idle");
    setIsUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDeleteBatch() {
    if (!result?.createdIds.length) return;
    setDeleteState("deleting");
    await deleteBulkBatch(result.createdIds);
    setDeleteState("done");
    setDeleteConfirm(false);
  }

  // ── Uploading screen ──────────────────────────────────────
  if (isUploading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-admin-100">
          <Loader2 className="h-7 w-7 text-admin-700 animate-spin" />
        </div>
        <div>
          <p className="font-semibold text-stone-900">
            Uploading {validRows.length} products…
          </p>
          <p className="mt-1 text-sm text-stone-500">
            Yeh typically 1–3 seconds lagta hai. Tab band mat karo.
          </p>
        </div>
        <div className="w-full rounded-full bg-stone-100 h-1.5 overflow-hidden">
          <div className="h-full bg-admin-700 rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  // ── Result screen ─────────────────────────────────────────
  if (result) {
    const isError = Boolean(result.error);
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isError ? "bg-red-100" : "bg-emerald-100"}`}>
            {isError
              ? <XCircle className="h-5 w-5 text-red-600" />
              : <CheckCircle className="h-5 w-5 text-emerald-600" />}
          </div>
          <div>
            <p className="font-semibold text-stone-900">
              {deleteState === "done"
                ? "Products deleted"
                : isError
                ? "Upload failed"
                : "Upload complete"}
            </p>
            <p className="text-sm text-stone-500">
              {deleteState === "done"
                ? `${result.createdIds.length} product${result.createdIds.length !== 1 ? "s" : ""} deleted`
                : isError
                ? result.error
                : `${result.created} product${result.created !== 1 ? "s" : ""} created successfully`}
            </p>
          </div>
        </div>

        {result.skipped.length > 0 && deleteState === "idle" && !isError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {result.skipped.length} row{result.skipped.length !== 1 ? "s" : ""} skipped
            </p>
            <ul className="text-xs text-amber-700 space-y-1 max-h-40 overflow-y-auto">
              {result.skipped.map((s, i) => (
                <li key={i}>• <span className="font-medium">{s.sku}</span> — {s.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          {!isError && (
            <Link
              href="/admin/products"
              className="flex-1 rounded-lg bg-admin-800 py-2 text-center text-sm font-medium text-white hover:bg-admin-700"
            >
              View products
            </Link>
          )}
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg border border-stone-200 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            {isError ? "Try again" : "Upload more"}
          </button>
        </div>

        {/* Undo / delete batch */}
        {result.createdIds.length > 0 && deleteState !== "done" && !isError && (
          <div className="border-t border-stone-100 pt-4">
            {!deleteConfirm ? (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete all {result.createdIds.length} uploaded products
              </button>
            ) : (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-rose-800">
                  Permanently delete all {result.createdIds.length} products from this upload?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteBatch}
                    disabled={deleteState === "deleting"}
                    className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {deleteState === "deleting" ? "Deleting…" : "Yes, delete all"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-stone-200 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Main upload flow ──────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Step 1 — Template */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Step 1</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-stone-900">Download CSV template</p>
            <p className="text-sm text-stone-500 mt-0.5">
              <span className="font-medium text-stone-700">sku</span> aur{" "}
              <span className="font-medium text-stone-700">price</span> required hain.
              Sizes aur categories mein{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">|</code> separator use karo.
              Images <code className="bg-stone-100 px-1 rounded text-xs">img1</code>,{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">img2</code>,{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">img3</code> columns mein (optional).
            </p>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-stone-400">Available categories:</span>
                {categories.map((c) => (
                  <span key={c} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{c}</span>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="shrink-0 flex items-center gap-2 rounded-lg border border-admin-800 px-4 py-2 text-sm font-medium text-admin-800 hover:bg-admin-50"
          >
            <Download className="h-4 w-4" /> Template
          </button>
        </div>
      </div>

      {/* Step 2 — Upload CSV */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Step 2</p>
        <p className="font-medium text-stone-900 mb-3">Upload filled CSV</p>

        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
            dragOver
              ? "border-admin-600 bg-admin-50"
              : fileName && parseResult
              ? "border-stone-300 bg-stone-50"
              : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${fileName && parseResult ? "bg-admin-100" : "bg-stone-100"}`}>
            <Upload className={`h-5 w-5 ${fileName && parseResult ? "text-admin-700" : "text-stone-500"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-stone-700">
              {fileName || "Click karo ya CSV file drag karo"}
            </p>
            <p className="text-xs text-stone-400 mt-1">Sirf .csv files • Koi bhi size</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* File-level error */}
      {parseResult && !parseResult.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <TriangleAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 mb-0.5">File read nahi ho sakhi</p>
            <p className="text-sm text-red-600">{parseResult.fileError}</p>
          </div>
        </div>
      )}

      {/* Empty file */}
      {parseResult?.ok && rows.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Koi data row nahi mili. Header ke neeche product rows add karo.</p>
        </div>
      )}

      {/* Step 3 — Preview + errors + upload button */}
      {parseResult?.ok && rows.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Step 3 — Preview
              </p>
              <p className="mt-1 text-sm text-stone-500">
                <span className="font-semibold text-stone-800">{rows.length}</span> rows detected
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" /> {validRows.length} ready
              </span>
              {errorRows.length > 0 && (
                <span className="flex items-center gap-1 font-semibold text-red-600">
                  <XCircle className="h-3.5 w-3.5" /> {errorRows.length} error{errorRows.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Error summary */}
          {errorRows.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" />
                Ye rows skip ho jayengi — fix karo ya ignore karo
              </p>
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {errorRows.map((r) => (
                  <li key={r._line} className="text-xs">
                    <span className="font-semibold text-red-800">
                      Row {r._line}{r.sku ? ` (${r.sku})` : ""}:
                    </span>
                    <ul className="mt-0.5 ml-3 space-y-0.5">
                      {r._errors.map((e, i) => (
                        <li key={i} className="text-red-600">
                          • <span className="font-medium">{e.field}</span> — {e.message}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table — show first 100 rows */}
          <div className="overflow-x-auto rounded-lg border border-stone-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50 text-left text-stone-500">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Categories</th>
                  <th className="px-3 py-2 font-medium">Sizes</th>
                  <th className="px-3 py-2 font-medium">Images</th>
                  <th className="px-3 py-2 font-medium w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.slice(0, 100).map((r) => {
                  const hasError = r._errors.length > 0;
                  return (
                    <tr key={r._line} className={hasError ? "bg-red-50" : ""}>
                      <td className="px-3 py-2 text-stone-400">{r._line}</td>
                      <td className="px-3 py-2 font-medium text-stone-800">
                        {r.sku || <span className="italic text-red-400">missing</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-600">
                        {r.price > 0
                          ? `₹${r.price}`
                          : <span className="italic text-red-400">invalid</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-500">
                        {r.categories?.length ? r.categories.join(", ") : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-500">
                        {r.sizes.length > 0 ? r.sizes.join(", ") : <span className="text-stone-300">Standard</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-500">
                        {r.imageUrls?.length
                          ? <span className="text-emerald-600">{r.imageUrls.length} img</span>
                          : <span className="text-stone-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {hasError
                          ? <XCircle className="inline h-4 w-4 text-red-400" />
                          : <CheckCircle className="inline h-4 w-4 text-emerald-500" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 100 && (
              <p className="border-t border-stone-100 bg-stone-50 px-3 py-2 text-xs text-stone-400">
                Preview mein 100 of {rows.length} rows dikh rahi hain — sab upload hongi
              </p>
            )}
          </div>

          {/* Upload button */}
          {validRows.length > 0 ? (
            <button
              type="button"
              onClick={handleUpload}
              className="w-full rounded-lg bg-admin-800 py-3 text-sm font-semibold text-white hover:bg-admin-700 transition-colors"
            >
              {errorRows.length > 0
                ? `Create ${validRows.length} products (${errorRows.length} error rows skip hongi)`
                : `Create ${validRows.length} product${validRows.length !== 1 ? "s" : ""}`}
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              Sab errors fix karo pehle upload karne se.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
