"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Upload,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  TriangleAlert,
} from "lucide-react";
import { bulkCreateProducts, type BulkRow, type BulkResult } from "./actions";

// ─── Types ────────────────────────────────────────────────────
type FieldError = { field: string; message: string };
type ParsedRow = BulkRow & { _line: number; _errors: FieldError[] };

const VALID_STOCK = ["IN_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"] as const;
const REQUIRED_COLS = ["name", "sku", "price"];

// ─── CSV parser ───────────────────────────────────────────────
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

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_").trim());

  // Check required columns exist in header
  const missingCols = REQUIRED_COLS.filter((c) => !header.includes(c));
  if (missingCols.length > 0) {
    return {
      ok: false,
      fileError: `Missing required column${missingCols.length > 1 ? "s" : ""} in header: ${missingCols.join(", ")}. Make sure to use the downloaded template.`,
    };
  }

  if (lines.length < 2) return { ok: false, fileError: "No data rows found. Add at least one product row below the header." };

  const get = (vals: string[], key: string) => {
    const idx = header.indexOf(key);
    return idx >= 0 ? (vals[idx] ?? "").trim() : "";
  };

  // First pass: parse each row
  const rows: ParsedRow[] = lines.slice(1).map((line, i) => {
    const vals = parseCSVLine(line);
    const errors: FieldError[] = [];

    // ── Required fields ──
    const name = get(vals, "name");
    if (!name) errors.push({ field: "name", message: "Name is required" });
    else if (name.length > 200) errors.push({ field: "name", message: "Name too long (max 200 chars)" });

    const sku = get(vals, "sku");
    if (!sku) errors.push({ field: "sku", message: "SKU is required" });
    else if (sku.length > 80) errors.push({ field: "sku", message: "SKU too long (max 80 chars)" });

    const priceStr = get(vals, "price");
    const price = parseFloat(priceStr);
    if (!priceStr) errors.push({ field: "price", message: "Price is required" });
    else if (isNaN(price)) errors.push({ field: "price", message: `"${priceStr}" is not a valid number` });
    else if (price <= 0) errors.push({ field: "price", message: "Price must be greater than 0" });

    // ── Optional with validation ──
    const rawStatus = get(vals, "stock_status").toUpperCase();
    let stockStatus: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK" = "IN_STOCK";
    if (rawStatus && !VALID_STOCK.includes(rawStatus as typeof VALID_STOCK[number])) {
      errors.push({
        field: "stock_status",
        message: `"${get(vals, "stock_status")}" is invalid — use IN_STOCK, MADE_TO_ORDER, or OUT_OF_STOCK`,
      });
    } else if (rawStatus) {
      stockStatus = rawStatus as typeof stockStatus;
    }

    const rawSizes = get(vals, "sizes");
    const sizes = rawSizes
      ? rawSizes.split("|").map((s) => s.trim()).filter(Boolean)
      : [];
    if (rawSizes) {
      const emptyParts = rawSizes.split("|").some((s) => s.trim() === "");
      if (emptyParts) errors.push({ field: "sizes", message: `Sizes has an empty entry — check for extra "|" characters` });
    }

    const activeRaw = get(vals, "active").toLowerCase();
    const isActive = activeRaw !== "no" && activeRaw !== "false" && activeRaw !== "0";

    return {
      _line: i + 2,
      _errors: errors,
      name,
      sku,
      price: isNaN(price) ? 0 : price,
      category: get(vals, "category") || undefined,
      description: get(vals, "description") || undefined,
      sizes,
      stockStatus,
      isActive,
    };
  });

  // Second pass: flag duplicate SKUs within the file
  const skuCount = new Map<string, number[]>();
  rows.forEach((r) => {
    if (r.sku) {
      const prev = skuCount.get(r.sku.toLowerCase()) ?? [];
      skuCount.set(r.sku.toLowerCase(), [...prev, r._line]);
    }
  });
  skuCount.forEach((lineNums, _sku) => {
    if (lineNums.length > 1) {
      rows.forEach((r) => {
        if (r.sku && r.sku.toLowerCase() === _sku) {
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
const HEADERS = ["name", "sku", "price", "category", "description", "sizes", "stock_status", "active"];

function downloadTemplate() {
  const example1 = ['"Gold Bangles"', "BNG-001", "450", "Bangles", '"Beautiful gold bangles"', "2.4|2.6|2.8", "IN_STOCK", "yes"].join(",");
  const example2 = ['"Silver Necklace"', "NCK-002", "780", "Necklaces", "", "", "MADE_TO_ORDER", "yes"].join(",");
  const csv = [HEADERS.join(","), example1, example2].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "borana_products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────
export function BulkUploadClient({ categories }: { categories: string[] }) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<BulkResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();
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
      const text = e.target?.result as string;
      setParseResult(parseCSV(text));
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleConfirm() {
    if (validRows.length === 0) return;
    startTransition(async () => {
      const res = await bulkCreateProducts(
        validRows.map(({ _line: _l, _errors: _e, ...row }) => row),
      );
      setResult(res);
      setParseResult(null);
      setFileName("");
    });
  }

  function reset() {
    setResult(null);
    setParseResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Result screen ──────────────────────────────────────────
  if (result) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 shrink-0">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">Upload complete</p>
            <p className="text-sm text-stone-500">
              {result.created} product{result.created !== 1 ? "s" : ""} created successfully
            </p>
          </div>
        </div>

        {result.skipped.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {result.skipped.length} row{result.skipped.length !== 1 ? "s" : ""} were skipped
            </p>
            <ul className="text-xs text-amber-700 space-y-1">
              {result.skipped.map((s, i) => (
                <li key={i}>• <span className="font-medium">{s.sku}</span> — {s.reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/admin/products" className="flex-1 rounded-lg bg-admin-800 py-2 text-center text-sm font-medium text-white hover:bg-admin-700">
            View products
          </Link>
          <button type="button" onClick={reset} className="flex-1 rounded-lg border border-stone-200 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
            Upload more
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Step 1 — Template */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Step 1</p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-stone-900">Download CSV template</p>
            <p className="text-sm text-stone-500 mt-0.5">
              Fill in Excel or Google Sheets. Columns: <span className="font-medium text-stone-700">name</span>, <span className="font-medium text-stone-700">sku</span>, <span className="font-medium text-stone-700">price</span> are required. Sizes use <code className="bg-stone-100 px-1 rounded text-xs">|</code> separator e.g. <code className="bg-stone-100 px-1 rounded text-xs">2.4|2.6|2.8</code>
            </p>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-stone-400">Categories:</span>
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

      {/* Step 2 — Upload */}
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">Step 2</p>
        <p className="font-medium text-stone-900 mb-3">Upload filled CSV</p>

        <div
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors ${
            dragOver ? "border-admin-600 bg-admin-50" : fileName && parseResult ? "border-stone-300 bg-stone-50" : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${fileName && parseResult ? "bg-admin-100" : "bg-stone-100"}`}>
            <Upload className={`h-5 w-5 ${fileName && parseResult ? "text-admin-700" : "text-stone-500"}`} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-stone-700">{fileName || "Click or drag CSV file here"}</p>
            <p className="text-xs text-stone-400 mt-1">Only .csv files</p>
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
            <p className="text-sm font-semibold text-red-700 mb-0.5">Cannot read file</p>
            <p className="text-sm text-red-600">{parseResult.fileError}</p>
          </div>
        </div>
      )}

      {/* Empty file */}
      {parseResult?.ok && rows.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">No data rows found. Add product rows below the header row.</p>
        </div>
      )}

      {/* Step 3 — Preview */}
      {parseResult?.ok && rows.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Step 3 — Preview</p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" /> {validRows.length} ready
              </span>
              {errorRows.length > 0 && (
                <span className="flex items-center gap-1 font-medium text-red-600">
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
                Fix these errors before uploading
              </p>
              <ul className="space-y-2">
                {errorRows.map((r) => (
                  <li key={r._line} className="text-xs">
                    <span className="font-semibold text-red-800">Row {r._line}{r.name ? ` (${r.name})` : ""}:</span>
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

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-stone-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50 text-left text-stone-500">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Sizes</th>
                  <th className="px-3 py-2 font-medium">Stock</th>
                  <th className="px-3 py-2 font-medium w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.slice(0, 50).map((r) => {
                  const hasError = r._errors.length > 0;
                  return (
                    <tr key={r._line} className={hasError ? "bg-red-50" : ""}>
                      <td className="px-3 py-2 text-stone-400">{r._line}</td>
                      <td className="px-3 py-2 font-medium text-stone-800 max-w-[140px] truncate">
                        {r.name || <span className="text-red-400 italic">missing</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-600">
                        {r.sku || <span className="text-red-400 italic">missing</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-600">
                        {r.price > 0 ? `₹${r.price}` : <span className="text-red-400 italic">invalid</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-500">{r.category ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-3 py-2 text-stone-500">
                        {r.sizes.length > 0 ? r.sizes.join(", ") : <span className="text-stone-300">Standard</span>}
                      </td>
                      <td className="px-3 py-2 text-stone-500">{r.stockStatus.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2 text-center">
                        {hasError
                          ? <XCircle className="h-4 w-4 text-red-400 inline" />
                          : <CheckCircle className="h-4 w-4 text-emerald-500 inline" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="px-3 py-2 text-xs text-stone-400 border-t border-stone-100 bg-stone-50">
                Showing 50 of {rows.length} rows
              </p>
            )}
          </div>

          {validRows.length > 0 ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="w-full rounded-lg bg-admin-800 py-2.5 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-60"
            >
              {isPending
                ? "Uploading…"
                : `Create ${validRows.length} product${validRows.length !== 1 ? "s" : ""}${errorRows.length > 0 ? ` (${errorRows.length} error row${errorRows.length !== 1 ? "s" : ""} will be skipped)` : ""}`}
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
              Fix all errors above before uploading.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
