"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden">
      <button
        onClick={() => window.print()}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg, #8b1a2e, #6d1424)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: "11px 20px", fontSize: 14, fontWeight: 600,
          cursor: "pointer", boxShadow: "0 4px 16px rgba(139,26,46,0.35)",
          fontFamily: "inherit", letterSpacing: 0.3,
        }}
      >
        <Printer size={16} />
        Print / Save PDF
      </button>
    </div>
  );
}
