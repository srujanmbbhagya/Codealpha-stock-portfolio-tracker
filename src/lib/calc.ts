import type { Holding } from "./portfolio-store";
import { findStock, getLivePrice } from "./stocks";

export interface HoldingMetrics {
  holding: Holding;
  name: string;
  sector: string;
  currentPrice: number;
  invested: number;
  currentValue: number;
  pl: number;
  plPct: number;
}

export function metricsFor(h: Holding): HoldingMetrics {
  const meta = findStock(h.symbol);
  const currentPrice = getLivePrice(h.symbol);
  const invested = h.quantity * h.buyPrice;
  const currentValue = h.quantity * currentPrice;
  const pl = currentValue - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;
  return {
    holding: h,
    name: meta?.name ?? h.symbol,
    sector: meta?.sector ?? "Other",
    currentPrice,
    invested,
    currentValue,
    pl,
    plPct,
  };
}

export interface PortfolioSummary {
  invested: number;
  currentValue: number;
  pl: number;
  plPct: number;
  best: HoldingMetrics | null;
  worst: HoldingMetrics | null;
  metrics: HoldingMetrics[];
  diversification: number; // 0-100
  riskLevel: "Low" | "Medium" | "High";
  riskScore: number;
}

export function summarize(holdings: Holding[]): PortfolioSummary {
  const metrics = holdings.map(metricsFor);
  const invested = metrics.reduce((a, m) => a + m.invested, 0);
  const currentValue = metrics.reduce((a, m) => a + m.currentValue, 0);
  const pl = currentValue - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

  const sectors = new Set(metrics.map((m) => m.sector));
  // Herfindahl-style concentration → diversification score
  const totalVal = currentValue || 1;
  const weights = metrics.map((m) => m.currentValue / totalVal);
  const hhi = weights.reduce((a, w) => a + w * w, 0);
  const diversification = Math.round((1 - hhi) * 100);

  let riskScore = 50;
  if (metrics.length === 0) riskScore = 0;
  else {
    const concentrationRisk = hhi * 100;
    const sectorBonus = Math.min(30, sectors.size * 6);
    riskScore = Math.round(Math.max(0, Math.min(100, concentrationRisk - sectorBonus + 40)));
  }
  const riskLevel: PortfolioSummary["riskLevel"] =
    riskScore < 35 ? "Low" : riskScore < 65 ? "Medium" : "High";

  const best = metrics.length
    ? metrics.reduce((a, b) => (b.plPct > a.plPct ? b : a))
    : null;
  const worst = metrics.length
    ? metrics.reduce((a, b) => (b.plPct < a.plPct ? b : a))
    : null;

  return { invested, currentValue, pl, plPct, best, worst, metrics, diversification, riskLevel, riskScore };
}
