import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { usePortfolio } from "@/lib/portfolio-store";
import { useLiveTick } from "@/hooks/useLiveTick";
import { STOCK_UNIVERSE, findStock, getLivePrice } from "@/lib/stocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Price Alerts — WealthLens.ai" },
      { name: "description", content: "Set price targets and get notified when your stocks hit them." },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  useLiveTick(5000);
  const alerts = usePortfolio((s) => s.alerts);
  const addAlert = usePortfolio((s) => s.addAlert);
  const removeAlert = usePortfolio((s) => s.removeAlert);

  const [symbol, setSymbol] = useState("AAPL");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");

  const submit = () => {
    const t = parseFloat(target);
    if (!findStock(symbol)) return toast.error("Invalid stock");
    if (!t || t <= 0) return toast.error("Invalid target price");
    addAlert({ symbol, direction, targetPrice: t });
    setTarget("");
    toast.success(`Alert set for ${symbol} ${direction} $${t}`);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">Price Alerts</h1>
        <p className="text-muted-foreground text-sm">Get notified when stocks hit your target prices.</p>
      </header>

      <section className="card-grad rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Alert
        </h2>
        <div className="grid md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Stock</Label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STOCK_UNIVERSE.map((s) => (
                  <SelectItem key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">When price goes</Label>
            <Select value={direction} onValueChange={(v) => setDirection(v as "above" | "below")}>
              <SelectTrigger className="bg-input/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Price ($)</Label>
            <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="250.00" className="bg-input/50" />
          </div>
          <div className="flex items-end">
            <Button onClick={submit} className="w-full bg-gradient-to-r from-primary to-info text-primary-foreground">Set Alert</Button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Active Alerts</h2>
        {alerts.length === 0 ? (
          <div className="card-grad rounded-2xl p-10 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No alerts yet. Set one above.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {alerts.map((a) => {
                const price = getLivePrice(a.symbol);
                const triggered = a.direction === "above" ? price >= a.targetPrice : price <= a.targetPrice;
                const distancePct = ((a.targetPrice - price) / price) * 100;
                return (
                  <motion.div
                    key={a.id} layout
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className={`card-grad rounded-2xl p-5 relative overflow-hidden ${triggered ? "ring-2 ring-primary glow" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${triggered ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                          {triggered ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-mono font-bold">{a.symbol}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {a.direction === "above" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            ${a.targetPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeAlert(a.id)} className="h-7 w-7 text-loss">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      <div>
                        <div className="text-xs text-muted-foreground">Current</div>
                        <div className="font-mono font-bold text-lg">${price.toFixed(2)}</div>
                      </div>
                      <div className={`text-xs font-mono px-2 py-1 rounded-full ${triggered ? "bg-primary/20 text-primary" : "bg-secondary"}`}>
                        {triggered ? "Triggered" : `${Math.abs(distancePct).toFixed(2)}% away`}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </main>
  );
}
