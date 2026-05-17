import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/lib/portfolio-store";
import { STOCK_UNIVERSE, findStock, getLivePrice } from "@/lib/stocks";
import { Plus, Search, Mic, MicOff, Sparkles, Globe } from "lucide-react";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { motion, AnimatePresence } from "framer-motion";

export function AddStockDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [filter, setFilter] = useState<"all" | "US" | "IN">("all");
  const add = usePortfolio((s) => s.addHolding);
  const voice = useVoiceInput();

  // Auto-fill from voice command
  useEffect(() => {
    if (!voice.parsed) return;
    if (voice.parsed.symbol) {
      setSymbol(voice.parsed.symbol);
      setQuery("");
      if (!voice.parsed.price) {
        setPrice(getLivePrice(voice.parsed.symbol).toString());
      }
    }
    if (voice.parsed.quantity) setQty(String(voice.parsed.quantity));
    if (voice.parsed.price) setPrice(String(voice.parsed.price));
  }, [voice.parsed]);

  const filtered = STOCK_UNIVERSE.filter(
    (s) =>
      (filter === "all" || s.country === filter) &&
      (s.symbol.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())),
  ).slice(0, 8);

  const submit = () => {
    if (!symbol || !findStock(symbol)) return toast.error("Pick a valid stock");
    const q = parseFloat(qty), p = parseFloat(price);
    if (!q || q <= 0) return toast.error("Quantity must be > 0");
    if (!p || p <= 0) return toast.error("Buy price must be > 0");
    add({ symbol, quantity: q, buyPrice: p });
    toast.success(`Added ${q} × ${symbol.toUpperCase()}`, {
      description: `Invested $${(q * p).toFixed(2)}`,
    });
    setOpen(false); setSymbol(""); setQty(""); setPrice(""); setQuery("");
    voice.reset();
  };

  const selectedMeta = findStock(symbol);

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) voice.reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 bg-gradient-to-r from-primary to-info text-primary-foreground glow rounded-full">
            <Plus className="h-4 w-4" />Add Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="card-grad border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Add to Portfolio
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Voice Input Banner */}
          {voice.supported && (
            <div className="rounded-xl bg-secondary/40 border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">🎤 Voice Input</span>
                <Button
                  size="sm"
                  variant={voice.listening ? "destructive" : "outline"}
                  onClick={voice.listening ? voice.stop : voice.start}
                  className="h-7 px-3 text-xs gap-1.5 rounded-full"
                >
                  {voice.listening ? (
                    <><MicOff className="h-3 w-3" /> Stop</>
                  ) : (
                    <><Mic className="h-3 w-3" /> Speak</>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Try: <em>"Add 10 shares of Apple"</em> or <em>"Buy 5 NVDA at 450"</em>
              </p>
              <AnimatePresence>
                {voice.listening && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-loss animate-pulse" />
                    <span className="text-xs text-loss">Listening...</span>
                  </motion.div>
                )}
                {voice.transcript && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground italic">
                    "{voice.transcript}"
                  </motion.div>
                )}
                {voice.parsed?.confidence === "high" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-profit flex items-center gap-1">
                    ✓ Detected: {voice.parsed.quantity}× {voice.parsed.symbol}
                    {voice.parsed.price ? ` @ $${voice.parsed.price}` : ""}
                  </motion.div>
                )}
                {voice.error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-loss">
                    {voice.error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Country filter */}
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "US", "IN"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : f === "US" ? "🇺🇸 US" : "🇮🇳 India"}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>Search stock</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Apple, TCS, NVDA, Infosys..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-input/50"
              />
            </div>
            {query && (
              <div className="rounded-lg border border-border overflow-hidden max-h-48 overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground">No matches</div>
                )}
                {filtered.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      setSymbol(s.symbol);
                      setPrice(getLivePrice(s.symbol).toString());
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-secondary flex items-center justify-between"
                  >
                    <div>
                      <div className="font-mono font-semibold flex items-center gap-1.5">
                        {s.symbol}
                        <span className="text-[10px] text-muted-foreground">{s.country === "IN" ? "🇮🇳" : "🇺🇸"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{s.name} · {s.sector}</div>
                    </div>
                    <div className="text-sm font-mono">${getLivePrice(s.symbol).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedMeta && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {selectedMeta.name} ({symbol}) — {selectedMeta.sector}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="0" step="any" placeholder="10" value={qty} onChange={(e) => setQty(e.target.value)} className="bg-input/50" />
            </div>
            <div className="space-y-2">
              <Label>Buy Price ($)</Label>
              <Input type="number" min="0" step="any" placeholder="195.40" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-input/50" />
            </div>
          </div>

          {qty && price && parseFloat(qty) > 0 && parseFloat(price) > 0 && (
            <div className="text-xs text-muted-foreground text-right">
              Total invested: <span className="text-foreground font-semibold">${(parseFloat(qty) * parseFloat(price)).toFixed(2)}</span>
            </div>
          )}

          <Button
            onClick={submit}
            disabled={!symbol || !qty || !price}
            className="w-full bg-gradient-to-r from-primary to-info text-primary-foreground rounded-xl h-11 font-semibold text-base"
          >
            Add to Portfolio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
