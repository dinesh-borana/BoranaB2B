"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartLine = {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  unitPrice: number;
  sizeQuantities: Record<string, number>;
};

type CartState = {
  lines: CartLine[];
};

type CartContextValue = CartState & {
  addLine: (line: CartLine) => void;
  updateQuantity: (lineId: string, size: string, qty: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  totalPieces: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "borana-cart-v1";

function readStorage(): CartState {
  if (typeof window === "undefined") return { lines: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.lines)) return { lines: [] };
    return parsed;
  } catch {
    return { lines: [] };
  }
}

function writeStorage(state: CartState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ lines: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(state);
  }, [state, hydrated]);

  const addLine = useCallback((line: CartLine) => {
    setState((prev) => {
      const existing = prev.lines.find(
        (l) => l.productId === line.productId,
      );
      if (existing) {
        const merged: Record<string, number> = { ...existing.sizeQuantities };
        for (const [size, qty] of Object.entries(line.sizeQuantities)) {
          merged[size] = (merged[size] ?? 0) + qty;
        }
        return {
          lines: prev.lines.map((l) =>
            l.id === existing.id ? { ...l, sizeQuantities: merged } : l,
          ),
        };
      }
      return { lines: [...prev.lines, line] };
    });
  }, []);

  const updateQuantity = useCallback(
    (lineId: string, size: string, qty: number) => {
      setState((prev) => ({
        lines: prev.lines
          .map((l) => {
            if (l.id !== lineId) return l;
            const next = { ...l.sizeQuantities };
            if (qty <= 0) {
              delete next[size];
            } else {
              next[size] = qty;
            }
            return { ...l, sizeQuantities: next };
          })
          .filter((l) => Object.keys(l.sizeQuantities).length > 0),
      }));
    },
    [],
  );

  const removeLine = useCallback((lineId: string) => {
    setState((prev) => ({ lines: prev.lines.filter((l) => l.id !== lineId) }));
  }, []);

  const clear = useCallback(() => setState({ lines: [] }), []);

  const totalPieces = useMemo(
    () =>
      state.lines.reduce(
        (sum, l) =>
          sum +
          Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0),
        0,
      ),
    [state.lines],
  );

  const subtotal = useMemo(
    () =>
      state.lines.reduce((sum, l) => {
        const pieces = Object.values(l.sizeQuantities).reduce(
          (a, b) => a + b,
          0,
        );
        return sum + pieces * l.unitPrice;
      }, 0),
    [state.lines],
  );

  const value: CartContextValue = {
    lines: state.lines,
    addLine,
    updateQuantity,
    removeLine,
    clear,
    totalPieces,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
