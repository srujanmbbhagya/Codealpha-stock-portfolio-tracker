import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "USD" | "INR";

interface CurrencyState {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
}

// Fixed demo rate — in production fetch from exchangerate-api
export const USD_TO_INR = 83.42;

export function convertAmount(amount: number, to: Currency): number {
  if (to === "INR") return amount * USD_TO_INR;
  return amount;
}

export function formatCurrency(amount: number, currency: Currency, decimals = 2): string {
  if (currency === "INR") {
    const inr = amount * USD_TO_INR;
    if (Math.abs(inr) >= 1_00_00_000) {
      return `₹${(inr / 1_00_00_000).toFixed(2)} Cr`;
    }
    if (Math.abs(inr) >= 1_00_000) {
      return `₹${(inr / 1_00_000).toFixed(2)} L`;
    }
    return `₹${inr.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`;
  }
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: decimals })}`;
}

export const useCurrency = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      setCurrency: (c) => set({ currency: c }),
      toggle: () => set({ currency: get().currency === "USD" ? "INR" : "USD" }),
    }),
    { name: "wealthlens-currency" },
  ),
);
