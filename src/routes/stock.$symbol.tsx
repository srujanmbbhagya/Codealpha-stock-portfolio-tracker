import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Eye, EyeOff, TrendingUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

import { findStock, getLivePrice, getDayChange, getHistory } from "@/lib/stocks";
import { useLiveTick } from "@/hooks/useLiveTick";
import { usePortfolio } from "@/lib/portfolio-store";
import { metricsFor } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { AddStockDialog } from "@/components/AddStockDialog";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/stock/$symbol")({
  beforeLoad: ({ params }) => {
    if (!findStock(params.symbol)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol.toUpperCase()} — WealthLens.ai` },
      { name: "description", content: `Live price, history and your position in ${params.symbol.toUpperCase()}.` },
    ],
  }),
  component: StockDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Stock not found</h1>
      <Link to="/" className="text-primary text-sm mt-2 inline-block">← Back home</Link>
    </div>
  ),
});

function StockDetail() {
  useLiveTick(5000);
  const { symbol } = Route.useParams();
  const upper = symbol.toUpperCase();
  const meta = findStock(upper)!;
  const price = getLivePrice(upper);
  const change = getDayChange(upper);
  const history = getHistory(upper, 60);
  const watchlist = usePortfolio((s) => s.watchlist);
  const toggleWatch = usePortfolio((s) => s.toggleWatch);
  const isWatching = watchlist.includes(upper);
  const myHoldings = usePortfolio((s) => s.holdings).filter((h) => h.symbol === upper);
  const totalQty = myHoldings.reduce((a, h) => a + h.quantity, 0);
  const totalInvested = myHoldings.reduce((a, h) => a + h.quantity * h.buyPrice, 0);
  const avgBuy = totalQty ? totalInvested / totalQty : 0;
  const myValue = totalQty * price;
  const myPL = myValue - totalInvested;
  const myPlPct = totalInvested ? (myPL / totalInvested) * 100 : 0;

  const up = change >= 0;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <Link to="/portfolio" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to portfolio
      </Link>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card-grad rounded-3xl p-8 grid-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-info/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/40 to-info/30 flex items-center justify-center font-mono font-bold text-xl">
              {upper.slice(0, 2)}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{meta.sector}</div>
              <h1 className="font-display text-3xl font-bold">{meta.name}</h1>
              <div className="font-mono text-muted-foreground">{upper}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-5xl font-bold font-mono">
              <CountUp value={price} prefix="$" />
            </div>
            <div className={`flex items-center justify-end gap-1 mt-1 font-mono ${up ? "text-profit" : "text-loss"}`}>
              {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {(change * 100).toFixed(2)}% today
            </div>
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="outline" onClick={() => toggleWatch(upper)} className="rounded-full gap-2">
                {isWatching ? <><EyeOff className="h-4 w-4" /> Unwatch</> : <><Eye className="h-4 w-4" /> Watch</>}
              </Button>
              <AddStockDialog />
            </div>
          </div>
        </div>
      </motion.section>

      <section className="card-grad rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Price History
          </h2>
          <span className="text-xs glass px-2 py-1 rounded-full">60D</span>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={up ? "oklch(0.78 0.18 152)" : "oklch(0.68 0.24 22)"} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={up ? "oklch(0.78 0.18 152)" : "oklch(0.68 0.24 22)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="oklch(0.7 0.02 255)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.7 0.02 255)" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 5", "dataMax + 5"]} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.035 262)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="price" stroke={up ? "oklch(0.78 0.18 152)" : "oklch(0.68 0.24 22)"} strokeWidth={2.5} fill="url(#sg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {totalQty > 0 && (
        <section className="grid sm:grid-cols-4 gap-4">
          <Stat label="Your Position" value={`${totalQty} sh`} mono />
          <Stat label="Avg Buy Price" value={`$${avgBuy.toFixed(2)}`} mono />
          <Stat label="Current Value" value={`$${myValue.toFixed(2)}`} mono accent="info" />
          <Stat label="P / L" value={`${myPL >= 0 ? "+" : ""}$${myPL.toFixed(2)} (${myPlPct.toFixed(2)}%)`} mono accent={myPL >= 0 ? "profit" : "loss"} />
        </section>
      )}

      {myHoldings.length > 0 && (
        <section className="card-grad rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold mb-4">Your Lots</h2>
          <div className="space-y-2">
            {myHoldings.map((h) => {
              const m = metricsFor(h);
              return (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                  <div className="text-sm">
                    <span className="font-mono">{h.quantity} shares</span> @ <span className="font-mono text-muted-foreground">${h.buyPrice.toFixed(2)}</span>
                  </div>
                  <div className={`font-mono font-semibold ${m.pl >= 0 ? "text-profit" : "text-loss"}`}>
                    {m.pl >= 0 ? "+" : ""}${m.pl.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: "info" | "profit" | "loss" }) {
  const cls = accent === "profit" ? "text-profit" : accent === "loss" ? "text-loss" : accent === "info" ? "text-info" : "";
  return (
    <div className="card-grad rounded-2xl p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${mono ? "font-mono" : ""} ${cls}`}>{value}</div>
    </div>
  );
}
