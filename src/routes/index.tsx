import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useMemo } from "react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, BarChart, Bar,
} from "recharts";
import {
  TrendingUp, Wallet, DollarSign, Activity, Sparkles,
  ArrowUpRight, ArrowDownRight, Shield, IndianRupee,
} from "lucide-react";

import { usePortfolio } from "@/lib/portfolio-store";
import { useLiveTick } from "@/hooks/useLiveTick";
import { summarize } from "@/lib/calc";
import { getHistory, SECTOR_COLORS } from "@/lib/stocks";
import { StatCard } from "@/components/StatCard";
import { AddStockDialog } from "@/components/AddStockDialog";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import { useCurrency, formatCurrency, USD_TO_INR } from "@/lib/currency-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WealthLens.ai" },
      { name: "description", content: "Your live portfolio dashboard with allocation, performance and AI-powered insights." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useLiveTick(5000);
  const holdings = usePortfolio((s) => s.holdings);
  const snapshots = usePortfolio((s) => s.snapshots);
  const seedDemo = usePortfolio((s) => s.seedDemo);
  const { currency } = useCurrency();

  useEffect(() => {
    if (holdings.length === 0) seedDemo();
  }, [holdings.length, seedDemo]);

  const summary = useMemo(() => summarize(holdings), [holdings]);
  const isProfit = summary.pl >= 0;

  // Allocation by sector
  const sectorMap = new Map<string, number>();
  summary.metrics.forEach((m) => {
    sectorMap.set(m.sector, (sectorMap.get(m.sector) ?? 0) + m.currentValue);
  });
  const allocation = Array.from(sectorMap, ([name, value]) => ({ name, value }));

  // Use real snapshots if available, else fall back to simulated 30d history
  const trend = useMemo(() => {
    if (snapshots.length >= 5) {
      return snapshots.slice(-30).map((s) => ({
        date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: currency === "INR" ? +(s.totalValue * USD_TO_INR).toFixed(0) : s.totalValue,
      }));
    }
    // Simulated
    const days = 30;
    const histories = summary.metrics.map((m) => ({
      qty: m.holding.quantity,
      series: getHistory(m.holding.symbol, days),
    }));
    return Array.from({ length: days }, (_, i) => {
      const total = histories.reduce((a, h) => a + h.qty * (h.series[i]?.price ?? 0), 0);
      const val = currency === "INR" ? +(total * USD_TO_INR).toFixed(0) : +total.toFixed(2);
      return { date: histories[0]?.series[i]?.date ?? "", value: val };
    });
  }, [snapshots, summary.metrics, currency]);

  const plPerStock = summary.metrics.map((m) => ({
    symbol: m.holding.symbol,
    pl: +(currency === "INR" ? m.pl * USD_TO_INR : m.pl).toFixed(2),
  }));

  const currencyPrefix = currency === "INR" ? "₹" : "$";
  const displayValue = currency === "INR" ? summary.currentValue * USD_TO_INR : summary.currentValue;
  const displayPl = currency === "INR" ? summary.pl * USD_TO_INR : summary.pl;
  const displayInvested = currency === "INR" ? summary.invested * USD_TO_INR : summary.invested;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl card-grad p-8 sm:p-10 grid-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/10 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs glass px-3 py-1 rounded-full mb-4">
              <Sparkles className="h-3 w-3 text-primary" /> AI-powered portfolio intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
              Your wealth, <span className="text-gradient">in focus.</span>
            </h1>
            <p className="mt-2 text-muted-foreground max-w-lg">
              Real-time portfolio value, smart insights, and clarity on every move you make in the market.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <AddStockDialog />
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/insights">View AI Insights</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/leaderboard">🏆 Leaderboard</Link>
              </Button>
            </div>
          </div>
          <div className="lg:text-right">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Portfolio Value</div>
            <div className="font-display text-5xl font-bold mt-1 flex items-center lg:justify-end gap-2">
              {currency === "INR" && <IndianRupee className="h-8 w-8 text-primary" />}
              <CountUp value={displayValue} prefix={currency === "INR" ? "" : "$"} decimals={currency === "INR" ? 0 : 2} />
            </div>
            <div className={`mt-1 inline-flex items-center gap-1 font-mono ${isProfit ? "text-profit" : "text-loss"}`}>
              {isProfit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <CountUp value={Math.abs(displayPl)} prefix={isProfit ? `+${currencyPrefix}` : `-${currencyPrefix}`} decimals={currency === "INR" ? 0 : 2} />
              <span className="opacity-70">(<CountUp value={Math.abs(summary.plPct)} suffix="%" decimals={2} />)</span>
            </div>
            {currency === "INR" && (
              <div className="mt-1 text-xs text-muted-foreground">
                Rate: 1 USD = ₹{USD_TO_INR.toFixed(2)}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Stat row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Invested" value={displayInvested} prefix={currencyPrefix} icon={Wallet} accent="info" decimals={currency === "INR" ? 0 : 2} />
        <StatCard label="Current Value" value={displayValue} prefix={currencyPrefix} icon={DollarSign} accent="primary" decimals={currency === "INR" ? 0 : 2} />
        <StatCard
          label="Profit / Loss"
          value={Math.abs(displayPl)}
          prefix={isProfit ? `+${currencyPrefix}` : `-${currencyPrefix}`}
          icon={summary.pl >= 0 ? TrendingUp : Activity}
          accent={summary.pl >= 0 ? "profit" : "loss"}
          decimals={currency === "INR" ? 0 : 2}
          subtext={
            <span className={summary.pl >= 0 ? "text-profit" : "text-loss"}>
              {summary.plPct >= 0 ? "+" : ""}
              {summary.plPct.toFixed(2)}% all-time
            </span>
          }
        />
        <StatCard
          label="Risk Level"
          value={summary.riskScore}
          suffix="/100"
          decimals={0}
          icon={Shield}
          accent={summary.riskLevel === "Low" ? "profit" : summary.riskLevel === "High" ? "loss" : "info"}
          subtext={<span className="text-muted-foreground">{summary.riskLevel} risk · {summary.diversification}% diversified</span>}
        />
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Portfolio Growth</h2>
              <p className="text-xs text-muted-foreground">
                {snapshots.length >= 5 ? `${snapshots.slice(-30).length}-day real history` : "30 days · simulated history"}
                {currency === "INR" ? " · ₹ INR" : " · $ USD"}
              </p>
            </div>
            <span className="text-xs glass px-2 py-1 rounded-full">30D</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 152)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 152)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="oklch(0.7 0.02 255)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.02 255)" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => currency === "INR" ? `₹${(v / 100000).toFixed(1)}L` : `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={{ background: "oklch(0.21 0.035 262)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                  formatter={(v: number) => [formatCurrency(currency === "INR" ? v / USD_TO_INR : v, currency), "Value"]} />
                <Area type="monotone" dataKey="value" stroke="oklch(0.78 0.18 152)" strokeWidth={2.5} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold mb-1">Asset Allocation</h2>
          <p className="text-xs text-muted-foreground mb-4">By sector</p>
          {allocation.length === 0 ? (
            <Empty />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {allocation.map((a, i) => (
                        <Cell key={i} fill={SECTOR_COLORS[a.name] ?? "oklch(0.6 0.1 260)"} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "oklch(0.21 0.035 262)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }}
                      formatter={(v: number) => [formatCurrency(v, currency), "Value"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {allocation.map((a) => (
                  <div key={a.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: SECTOR_COLORS[a.name] ?? "#888" }} />
                      <span>{a.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {((a.value / summary.currentValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold mb-1">Profit / Loss per Stock</h2>
          <p className="text-xs text-muted-foreground mb-4">Realised against your buy price · {currency}</p>
          {plPerStock.length === 0 ? <Empty /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plPerStock}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="symbol" stroke="oklch(0.7 0.02 255)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="oklch(0.7 0.02 255)" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => currency === "INR" ? `₹${v}` : `$${v}`} />
                  <Tooltip contentStyle={{ background: "oklch(0.21 0.035 262)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
                  <Bar dataKey="pl" radius={[8, 8, 0, 0]}>
                    {plPerStock.map((d, i) => (
                      <Cell key={i} fill={d.pl >= 0 ? "oklch(0.78 0.18 152)" : "oklch(0.68 0.24 22)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold">Highlights</h2>
          {summary.best && (
            <Highlight label="Top performer" symbol={summary.best.holding.symbol} pct={summary.best.plPct} kind="profit" />
          )}
          {summary.worst && summary.worst !== summary.best && (
            <Highlight label="Worst performer" symbol={summary.worst.holding.symbol} pct={summary.worst.plPct} kind="loss" />
          )}
          <div className="rounded-xl bg-secondary/50 p-4">
            <div className="text-xs text-muted-foreground">Diversification</div>
            <div className="font-display text-2xl font-bold">{summary.diversification}%</div>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${summary.diversification}%` }} className="h-full bg-gradient-to-r from-primary to-info" />
            </div>
          </div>
          {snapshots.length > 0 && (
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="text-xs text-muted-foreground">Days Tracked</div>
              <div className="font-display text-2xl font-bold">{snapshots.length}</div>
              <div className="text-xs text-muted-foreground mt-1">history snapshots saved</div>
            </div>
          )}
        </motion.div>
      </section>
    </main>
  );
}

function Highlight({ label, symbol, pct, kind }: { label: string; symbol: string; pct: number; kind: "profit" | "loss" }) {
  return (
    <Link to="/stock/$symbol" params={{ symbol }} className="block rounded-xl bg-secondary/50 p-4 hover:bg-secondary transition">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center justify-between mt-1">
        <div className="font-mono font-bold">{symbol}</div>
        <div className={`font-mono font-semibold ${kind === "profit" ? "text-profit" : "text-loss"}`}>
          {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
        </div>
      </div>
    </Link>
  );
}

function Empty() {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-center text-muted-foreground text-sm">
      <p>No holdings yet.</p>
      <AddStockDialog />
    </div>
  );
}
