import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  addedAt: number;
}

export interface Alert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: "above" | "below";
}

export interface PortfolioSnapshot {
  date: string; // ISO date string YYYY-MM-DD
  totalValue: number;
  invested: number;
  pl: number;
}

interface PortfolioState {
  holdings: Holding[];
  watchlist: string[];
  alerts: Alert[];
  snapshots: PortfolioSnapshot[];
  addHolding: (h: Omit<Holding, "id" | "addedAt">) => void;
  updateHolding: (id: string, patch: Partial<Omit<Holding, "id">>) => void;
  removeHolding: (id: string) => void;
  toggleWatch: (symbol: string) => void;
  addAlert: (a: Omit<Alert, "id">) => void;
  removeAlert: (id: string) => void;
  saveSnapshot: (s: Omit<PortfolioSnapshot, "date">) => void;
  seedDemo: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const todayStr = () => new Date().toISOString().split("T")[0];

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set, get) => ({
      holdings: [],
      watchlist: [],
      alerts: [],
      snapshots: [],

      addHolding: (h) =>
        set((s) => ({
          holdings: [
            ...s.holdings,
            { ...h, symbol: h.symbol.toUpperCase(), id: uid(), addedAt: Date.now() },
          ],
        })),

      updateHolding: (id, patch) =>
        set((s) => ({
          holdings: s.holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),

      removeHolding: (id) =>
        set((s) => ({ holdings: s.holdings.filter((h) => h.id !== id) })),

      toggleWatch: (symbol) =>
        set((s) => ({
          watchlist: s.watchlist.includes(symbol)
            ? s.watchlist.filter((x) => x !== symbol)
            : [...s.watchlist, symbol.toUpperCase()],
        })),

      addAlert: (a) =>
        set((s) => ({ alerts: [...s.alerts, { ...a, id: uid() }] })),

      removeAlert: (id) =>
        set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),

      saveSnapshot: ({ totalValue, invested, pl }) => {
        const today = todayStr();
        set((s) => {
          const filtered = s.snapshots.filter((snap) => snap.date !== today);
          const sorted = [...filtered, { date: today, totalValue, invested, pl }]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-90); // keep last 90 days
          return { snapshots: sorted };
        });
      },

      seedDemo: () => {
        if (get().holdings.length > 0) return;

        // Generate 30 days of fake history
        const snapshots: PortfolioSnapshot[] = [];
        let val = 68000;
        for (let i = 29; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          const date = d.toISOString().split("T")[0];
          const change = (Math.random() - 0.46) * 0.03;
          val = val * (1 + change);
          snapshots.push({ date, totalValue: +val.toFixed(2), invested: 65000, pl: +(val - 65000).toFixed(2) });
        }

        set({
          holdings: [
            { id: uid(), symbol: "AAPL", quantity: 12, buyPrice: 195.4, addedAt: Date.now() },
            { id: uid(), symbol: "NVDA", quantity: 25, buyPrice: 118.2, addedAt: Date.now() },
            { id: uid(), symbol: "TSLA", quantity: 8, buyPrice: 282.1, addedAt: Date.now() },
            { id: uid(), symbol: "MSFT", quantity: 5, buyPrice: 410.0, addedAt: Date.now() },
            { id: uid(), symbol: "GOOGL", quantity: 15, buyPrice: 165.3, addedAt: Date.now() },
          ],
          watchlist: ["AMD", "META", "COIN"],
          snapshots,
        });
      },
    }),
    { name: "wealthlens-portfolio" },
  ),
);
