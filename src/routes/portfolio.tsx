import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowUpRight, ArrowDownRight, Download, Pencil, Check, X, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { usePortfolio } from "@/lib/portfolio-store";
import { useLiveTick } from "@/hooks/useLiveTick";
import { metricsFor, summarize } from "@/lib/calc";
import { AddStockDialog } from "@/components/AddStockDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrency, formatCurrency } from "@/lib/currency-store";
import { generatePdfReport } from "@/lib/pdf-report";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — WealthLens.ai" },
      { name: "description", content: "Manage your stock holdings: add, edit, remove and export." },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  useLiveTick(5000);
  const holdings = usePortfolio((s) => s.holdings);
  const remove = usePortfolio((s) => s.removeHolding);
  const update = usePortfolio((s) => s.updateHolding);
  const saveSnapshot = usePortfolio((s) => s.saveSnapshot);
  const { currency } = useCurrency();
  const user = useAuth((s) => s.currentUser());
  const [editing, setEditing] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Save a portfolio snapshot once per page visit
  useEffect(() => {
    if (holdings.length === 0) return;
    const summary = summarize(holdings);
    saveSnapshot({
      totalValue: summary.currentValue,
      invested: summary.invested,
      pl: summary.pl,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    if (holdings.length === 0) return toast.error("No holdings to export");
    const rows = [["Symbol", "Quantity", "Buy Price", "Current Price", "Invested", "Current Value", "P/L", "P/L %"]];
    holdings.forEach((h) => {
      const m = metricsFor(h);
      rows.push([
        h.symbol, String(h.quantity), h.buyPrice.toFixed(2),
        m.currentPrice.toFixed(2), m.invested.toFixed(2), m.currentValue.toFixed(2),
        m.pl.toFixed(2), m.plPct.toFixed(2),
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "wealthlens-portfolio.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Portfolio exported as CSV");
  };

  const exportPdf = () => {
    if (holdings.length === 0) return toast.error("No holdings to export");
    const summary = summarize(holdings);
    generatePdfReport(holdings, summary, user?.name ?? "Investor");
    toast.success("Opening PDF report...");
  };

  const startEdit = (id: string, qty: number, price: number) => {
    setEditing(id); setEditQty(String(qty)); setEditPrice(String(price));
  };
  const saveEdit = (id: string) => {
    const q = parseFloat(editQty), p = parseFloat(editPrice);
    if (!q || !p || q <= 0 || p <= 0) return toast.error("Invalid values");
    update(id, { quantity: q, buyPrice: p });
    setEditing(null);
    toast.success("Holding updated");
  };

  const summary = summarize(holdings);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">My Portfolio</h1>
          <p className="text-muted-foreground text-sm">
            {holdings.length} holding{holdings.length === 1 ? "" : "s"} · live prices · showing in {currency}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2 rounded-full">
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPdf} className="gap-2 rounded-full">
            <FileText className="h-4 w-4" /> PDF Report
          </Button>
          <AddStockDialog />
        </div>
      </div>

      {/* Summary strip */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Invested", value: formatCurrency(summary.invested, currency), accent: "text-info" },
            { label: "Current Value", value: formatCurrency(summary.currentValue, currency), accent: "text-primary" },
            { label: "Total P/L", value: `${summary.pl >= 0 ? "+" : ""}${formatCurrency(summary.pl, currency)}`, accent: summary.pl >= 0 ? "text-profit" : "text-loss" },
            { label: "Return", value: `${summary.plPct >= 0 ? "+" : ""}${summary.plPct.toFixed(2)}%`, accent: summary.plPct >= 0 ? "text-profit" : "text-loss" },
          ].map((s) => (
            <div key={s.label} className="card-grad rounded-xl p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className={`mt-1 font-display font-bold text-xl ${s.accent}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {holdings.length === 0 ? (
        <div className="card-grad rounded-2xl p-16 text-center">
          <p className="text-muted-foreground mb-4">Your portfolio is empty.</p>
          <AddStockDialog />
        </div>
      ) : (
        <div className="card-grad rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <div className="col-span-3">Stock</div>
            <div className="col-span-1 text-right">Qty</div>
            <div className="col-span-2 text-right">Buy</div>
            <div className="col-span-2 text-right">Current</div>
            <div className="col-span-2 text-right">Value ({currency})</div>
            <div className="col-span-2 text-right">P/L</div>
          </div>
          <AnimatePresence>
            {holdings.map((h) => {
              const m = metricsFor(h);
              const isProfit = m.pl >= 0;
              const isEdit = editing === h.id;
              return (
                <motion.div
                  key={h.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 md:grid-cols-12 gap-3 px-6 py-4 items-center border-b border-border last:border-0 hover:bg-secondary/30 transition"
                >
                  <Link to="/stock/$symbol" params={{ symbol: h.symbol }} className="col-span-2 md:col-span-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-info/20 flex items-center justify-center font-mono font-bold text-sm">
                      {h.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-mono font-semibold">{h.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">{m.name}</div>
                    </div>
                  </Link>

                  {isEdit ? (
                    <>
                      <div className="col-span-1 md:col-span-1">
                        <Input value={editQty} onChange={(e) => setEditQty(e.target.value)} className="h-8 text-right text-xs" type="number" />
                      </div>
                      <div className="col-span-2 md:col-span-2">
                        <Input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-8 text-right text-xs" type="number" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-1 md:col-span-1 text-right font-mono">{h.quantity}</div>
                      <div className="col-span-2 md:col-span-2 text-right font-mono text-muted-foreground">
                        {formatCurrency(h.buyPrice, currency)}
                      </div>
                    </>
                  )}

                  <div className="col-span-2 md:col-span-2 text-right font-mono">
                    {formatCurrency(m.currentPrice, currency)}
                  </div>
                  <div className="col-span-2 md:col-span-2 text-right font-mono font-semibold">
                    {formatCurrency(m.currentValue, currency)}
                  </div>
                  <div className={`col-span-2 md:col-span-2 text-right font-mono font-semibold ${isProfit ? "text-profit" : "text-loss"}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isProfit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatCurrency(Math.abs(m.pl), currency)}
                    </div>
                    <div className="text-xs opacity-80">{m.plPct >= 0 ? "+" : ""}{m.plPct.toFixed(2)}%</div>
                  </div>

                  <div className="col-span-2 md:col-span-12 flex md:justify-end gap-1 md:-mt-3">
                    {isEdit ? (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(h.id)} className="h-8 w-8 text-profit"><Check className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditing(null)} className="h-8 w-8"><X className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => startEdit(h.id, h.quantity, h.buyPrice)} className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => { remove(h.id); toast.success("Removed"); }} className="h-8 w-8 text-loss hover:text-loss"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </main>
  );
}
