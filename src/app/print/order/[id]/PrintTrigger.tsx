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
        className="flex items-center gap-2 rounded-xl bg-[#412402] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#5a3003]"
      >
        <Printer className="h-4 w-4" />
        Print / Save PDF
      </button>
    </div>
  );
}
