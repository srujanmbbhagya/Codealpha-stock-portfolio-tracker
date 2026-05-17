import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";

import { usePortfolio } from "@/lib/portfolio-store";
import { useLiveTick } from "@/hooks/useLiveTick";
import { STOCK_UNIVERSE, findStock, getLivePrice, getDayChange } from "@/lib/stocks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — WealthLens.ai" },
      { name: "description", content: "Track stocks you're interested in without buying." },
    ],
  }),
  component: Watchlist,
});

function Watchlist() {
  useLiveTick(5000);
  const watchlist = usePortfolio((s) => s.watchlist);
  const toggle = usePortfolio((s) => s.toggleWatch);

  const watched = watchlist.map((s) => findStock(s)).filter(Boolean);
  const suggestions = STOCK_UNIVERSE.filter((s) => !watchlist.includes(s.symbol)).slice(0, 8);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground text-sm">Stocks on your radar — live prices, no commitment.</p>
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Watching ({watched.length})</h2>
        {watched.length === 0 ? (
          <div className="card-grad rounded-2xl p-10 text-center text-muted-foreground">
            Your watchlist is empty. Add some from the suggestions below.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {watched.map((s, i) => s && (
              <StockTile key={s.symbol} symbol={s.symbol} name={s.name} sector={s.sector} watching onToggle={() => toggle(s.symbol)} delay={i * 0.04} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Discover</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestions.map((s, i) => (
            <StockTile key={s.symbol} symbol={s.symbol} name={s.name} sector={s.sector} onToggle={() => toggle(s.symbol)} delay={i * 0.03} />
          ))}
        </div>
      </section>
    </main>
  );
}

function StockTile({ symbol, name, sector, watching, onToggle, delay = 0 }: {
  symbol: string; name: string; sector: string; watching?: boolean; onToggle: () => void; delay?: number;
}) {
  const price = getLivePrice(symbol);
  const change = getDayChange(symbol);
  const up = change >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="card-grad rounded-2xl p-5 group"
    >
      <div className="flex items-start justify-between">
        <Link to="/stock/$symbol" params={{ symbol }} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-info/20 flex items-center justify-center font-mono font-bold text-sm">
            {symbol.slice(0, 2)}
          </div>
          <div>
            <div className="font-mono font-bold">{symbol}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[140px]">{name}</div>
          </div>
        </Link>
        <Button size="icon" variant="ghost" onClick={onToggle} className="h-8 w-8">
          {watching ? <EyeOff className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="font-display text-2xl font-bold font-mono">${price.toFixed(2)}</div>
        <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${up ? "text-profit" : "text-loss"}`}>
          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          {(change * 100).toFixed(2)}%
        </div>
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">{sector}</div>
    </motion.div>
  );
}
