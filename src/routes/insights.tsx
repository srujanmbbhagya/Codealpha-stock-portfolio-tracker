import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Shield, Zap, AlertTriangle, CheckCircle2, MessageSquare, Send,
  TrendingUp, TrendingDown, BarChart2, RefreshCw,
} from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

import { usePortfolio } from "@/lib/portfolio-store";
import { useLiveTick } from "@/hooks/useLiveTick";
import { summarize } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights — WealthLens.ai" },
      { name: "description", content: "AI-powered insights, risk analysis and a chatbot to discuss your portfolio." },
    ],
  }),
  component: Insights,
});

const QUICK_PROMPTS = [
  "How's my risk?",
  "Am I diversified?",
  "Who's my best stock?",
  "Should I rebalance?",
  "What's my total value?",
];

function Insights() {
  useLiveTick(5000);
  const holdings = usePortfolio((s) => s.holdings);
  const summary = useMemo(() => summarize(holdings), [holdings]);
  const insights = useMemo(() => generateInsights(summary), [summary]);

  // Radar chart data for portfolio analysis
  const radarData = [
    { metric: "Diversif.", value: summary.diversification },
    { metric: "Safety", value: Math.max(0, 100 - summary.riskScore) },
    { metric: "Holdings", value: Math.min(100, (holdings.length / 15) * 100) },
    { metric: "Gainers", value: summary.metrics.length > 0 ? (summary.metrics.filter((m) => m.pl > 0).length / summary.metrics.length) * 100 : 0 },
    { metric: "Return", value: Math.max(0, Math.min(100, 50 + summary.plPct * 2)) },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 text-xs glass px-3 py-1 rounded-full mb-3">
          <Sparkles className="h-3 w-3 text-primary" /> Powered by WealthLens AI
        </div>
        <h1 className="font-display text-3xl font-bold">AI Investment Insights</h1>
        <p className="text-muted-foreground text-sm">Smart analysis of your portfolio: risk, diversification, and recommendations.</p>
      </header>

      {/* Top metrics row */}
      <section className="grid lg:grid-cols-4 gap-4">
        <RiskCard summary={summary} />
        <InsightCard
          icon={Shield}
          title="Diversification"
          value={`${summary.diversification}%`}
          subtitle={summary.diversification > 60 ? "Well diversified portfolio" : "Consider adding more sectors"}
          accent={summary.diversification > 60 ? "profit" : "info"}
        />
        <InsightCard
          icon={Zap}
          title="Active Holdings"
          value={String(holdings.length)}
          subtitle={holdings.length < 5 ? "A larger portfolio reduces single-stock risk" : "Healthy position count"}
          accent="info"
        />
        <InsightCard
          icon={summary.pl >= 0 ? TrendingUp : TrendingDown}
          title="Portfolio Return"
          value={`${summary.plPct >= 0 ? "+" : ""}${summary.plPct.toFixed(2)}%`}
          subtitle={summary.best ? `Best: ${summary.best.holding.symbol} +${summary.best.plPct.toFixed(1)}%` : "Add holdings to track"}
          accent={summary.pl >= 0 ? "profit" : "loss"}
        />
      </section>

      <section className="grid lg:grid-cols-5 gap-4">
        {/* Radar + Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Portfolio Health Radar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" /> Portfolio Health
            </h2>
            <p className="text-xs text-muted-foreground mb-4">Multi-dimensional analysis</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(1 0 0 / 0.08)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "oklch(0.7 0.02 255)", fontSize: 11 }} />
                  <Radar dataKey="value" stroke="oklch(0.78 0.18 152)" fill="oklch(0.78 0.18 152)" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            {/* Metric breakdown */}
            <div className="space-y-2 mt-2">
              {radarData.map((d) => (
                <div key={d.metric} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">{d.metric}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${d.value}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-primary to-info"
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-8 text-right">{Math.round(d.value)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recommendations */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card-grad rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Smart Recommendations</h2>
            <div className="space-y-3">
              {insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex gap-3 p-4 rounded-xl bg-secondary/40 border border-border"
                >
                  <div className={`h-9 w-9 shrink-0 rounded-lg flex items-center justify-center ${
                    ins.kind === "good" ? "bg-profit/20 text-profit" :
                    ins.kind === "warn" ? "bg-loss/20 text-loss" : "bg-info/20 text-info"
                  }`}>
                    {ins.kind === "good" ? <CheckCircle2 className="h-4 w-4" /> :
                     ins.kind === "warn" ? <AlertTriangle className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{ins.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{ins.message}</div>
                  </div>
                </motion.div>
              ))}
              {insights.length === 0 && (
                <p className="text-sm text-muted-foreground">Add some holdings to get personalised insights.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chatbot — full width */}
      <Chatbot summary={summary} />
    </main>
  );
}

function RiskCard({ summary }: { summary: ReturnType<typeof summarize> }) {
  const color = summary.riskLevel === "Low" ? "profit" : summary.riskLevel === "High" ? "loss" : "info";
  const ringColor =
    color === "profit" ? "oklch(0.78 0.18 152)" :
    color === "loss" ? "oklch(0.68 0.24 22)" : "oklch(0.7 0.18 255)";
  const pct = summary.riskScore;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold">Portfolio Risk</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          color === "profit" ? "bg-profit/15 text-profit" :
          color === "loss" ? "bg-loss/15 text-loss" : "bg-info/15 text-info"
        }`}>{summary.riskLevel}</span>
      </div>
      <div className="relative h-36 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-36 w-36 -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="oklch(1 0 0 / 0.08)" strokeWidth="8" fill="none" />
          <motion.circle
            cx="50" cy="50" r="42" stroke={ringColor} strokeWidth="8" fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 264} 264`}
            initial={{ strokeDasharray: "0 264" }}
            animate={{ strokeDasharray: `${(pct / 100) * 264} 264` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-display text-3xl font-bold">{pct}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Based on concentration, sector spread and volatility.
      </p>
    </motion.div>
  );
}

function InsightCard({ icon: Icon, title, value, subtitle, accent }: {
  icon: typeof Shield; title: string; value: string; subtitle: string; accent: "profit" | "loss" | "info";
}) {
  const accentClass = {
    profit: "from-profit/20 to-profit/5 text-profit",
    loss: "from-loss/20 to-loss/5 text-loss",
    info: "from-info/20 to-info/5 text-info",
  }[accent];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accentClass} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="font-display text-3xl font-bold mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
    </motion.div>
  );
}

interface Insight { title: string; message: string; kind: "good" | "warn" | "tip"; }

function generateInsights(s: ReturnType<typeof summarize>): Insight[] {
  const out: Insight[] = [];
  if (s.metrics.length === 0) return out;

  if (s.diversification < 40) {
    out.push({ kind: "warn", title: "Low diversification", message: "Your portfolio is concentrated. Consider adding stocks from different sectors to reduce risk." });
  } else if (s.diversification > 70) {
    out.push({ kind: "good", title: "Excellent diversification", message: "Your holdings are spread across multiple sectors — solid risk management." });
  }

  const total = s.currentValue || 1;
  const heavy = s.metrics.filter((m) => m.currentValue / total > 0.4);
  heavy.forEach((m) => {
    out.push({ kind: "warn", title: `${m.holding.symbol} is over 40% of your portfolio`, message: `Heavy concentration in ${m.name}. A single bad quarter could significantly impact your wealth.` });
  });

  if (s.best && s.best.plPct > 15) {
    out.push({ kind: "tip", title: `${s.best.holding.symbol} is up ${s.best.plPct.toFixed(1)}%`, message: `Consider taking partial profits to lock in gains and rebalance your allocation.` });
  }
  if (s.worst && s.worst.plPct < -15) {
    out.push({ kind: "warn", title: `${s.worst.holding.symbol} is down ${Math.abs(s.worst.plPct).toFixed(1)}%`, message: `Review the thesis — is this a temporary dip or a structural change?` });
  }
  if (s.riskLevel === "Low") {
    out.push({ kind: "good", title: "Low risk profile", message: "Your portfolio is balanced and resilient — great for steady long-term growth." });
  }
  if (s.metrics.length < 5) {
    out.push({ kind: "tip", title: "Build out your portfolio", message: "5–15 holdings is generally a sweet spot for individual investors." });
  }

  const sectors = new Set(s.metrics.map((m) => m.sector)).size;
  if (sectors < 3 && s.metrics.length >= 3) {
    out.push({ kind: "warn", title: "Limited sector exposure", message: "Spreading across 4+ sectors (e.g. Tech, Finance, Healthcare, Energy) significantly reduces portfolio volatility." });
  }

  const winners = s.metrics.filter((m) => m.pl > 0).length;
  const winRate = s.metrics.length > 0 ? (winners / s.metrics.length) * 100 : 0;
  if (winRate === 100) {
    out.push({ kind: "good", title: "All positions in profit", message: "Every holding is currently profitable. Keep monitoring and consider trailing stop-losses." });
  }

  return out.slice(0, 6);
}

interface Msg { role: "user" | "ai"; text: string; }

function Chatbot({ summary }: { summary: ReturnType<typeof summarize> }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "👋 Hi! I'm your WealthLens AI. I can analyse your portfolio, explain risks, and give tailored advice. Try asking me anything!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setTyping(true);
    // Simulate AI thinking time (300–800ms)
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { role: "ai", text: answer(q, summary) }]);
    }, 300 + Math.random() * 500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-grad rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/40 to-info/30 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Ask anything about your portfolio</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-profit glass px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-profit animate-pulse" />
          Online
        </div>
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="text-xs px-3 py-1.5 rounded-full glass hover:bg-primary/20 hover:text-primary transition text-muted-foreground"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="space-y-3 overflow-y-auto max-h-72 mb-4 pr-1">
        {msgs.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/40 to-info/30 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-secondary border border-border rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/40 to-info/30 flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-secondary border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about your portfolio..."
          className="bg-input/50"
        />
        <Button onClick={() => send()} size="icon" className="bg-primary text-primary-foreground shrink-0">
          <Send className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost" size="icon"
          onClick={() => setMsgs([{ role: "ai", text: "Chat cleared! Ask me anything about your portfolio." }])}
          title="Clear chat"
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function answer(q: string, s: ReturnType<typeof summarize>): string {
  const lc = q.toLowerCase();
  if (s.metrics.length === 0) return "Add some holdings first and I'll have plenty to say! Try clicking 'Add Stock' on the dashboard.";

  if (/risk|safe|danger/.test(lc)) {
    return `Your portfolio risk score is ${s.riskScore}/100 (${s.riskLevel} risk). Diversification sits at ${s.diversification}%. ${
      s.riskLevel === "High" ? "⚠️ Consider rebalancing — high concentration in fewer stocks amplifies losses." :
      s.riskLevel === "Low" ? "✅ You're in good shape! Your portfolio is well balanced and resilient." :
      "📊 Moderate risk is manageable. Keep diversifying across sectors."
    }`;
  }
  if (/diversif/.test(lc)) {
    const sectors = new Set(s.metrics.map((m) => m.sector)).size;
    return `You hold stocks across ${sectors} sector${sectors !== 1 ? "s" : ""} with a diversification score of ${s.diversification}%. ${
      sectors < 3 ? "💡 Adding sectors like Healthcare, Energy, or Consumer could significantly improve stability." :
      sectors < 5 ? "📈 Decent spread. Consider adding 1-2 more sectors for robustness." :
      "✅ Excellent sector coverage — your portfolio is well diversified."
    }`;
  }
  if (/rebalanc/.test(lc)) {
    const heavy = s.metrics.filter((m) => (m.currentValue / (s.currentValue || 1)) > 0.35);
    if (heavy.length > 0) {
      return `⚖️ Rebalancing looks advisable. ${heavy.map((m) => m.holding.symbol).join(", ")} ${heavy.length === 1 ? "makes" : "make"} up over 35% of your portfolio. Consider trimming and redistributing to underweighted positions.`;
    }
    return "✅ Your portfolio looks fairly balanced. No immediate rebalancing needed, but review quarterly.";
  }
  if (/best|top|winner|performing well/.test(lc) && s.best) {
    return `🏆 Your top performer is ${s.best.holding.symbol} (${s.best.name}), up ${s.best.plPct.toFixed(2)}% from your buy price. ${
      s.best.plPct > 25 ? "A big gain — consider locking in partial profits." : "Keep holding if the fundamentals remain strong."
    }`;
  }
  if (/worst|loser|down|losing/.test(lc) && s.worst) {
    return `📉 Your weakest position is ${s.worst.holding.symbol} at ${s.worst.plPct.toFixed(2)}%. ${
      s.worst.plPct < -20 ? "A significant loss. Review the fundamentals — is this a business problem or market noise?" :
      "Small dip, could be temporary. Monitor closely before making any decisions."
    }`;
  }
  if (/total|value|worth|portfolio/.test(lc)) {
    return `💼 Your portfolio is currently worth $${s.currentValue.toFixed(2)} with a total P/L of ${s.pl >= 0 ? "+" : ""}$${s.pl.toFixed(2)} (${s.plPct.toFixed(2)}% all-time return).`;
  }
  if (/invest|add|buy|new/.test(lc)) {
    const sectors = [...new Set(s.metrics.map((m) => m.sector))];
    const missing = ["Finance", "Healthcare", "Energy", "Consumer"].filter((sec) => !sectors.includes(sec));
    if (missing.length > 0) {
      return `💡 To improve diversification, consider adding stocks from: ${missing.slice(0, 2).join(", ")}. Your current sectors are: ${sectors.join(", ")}.`;
    }
    return "✅ You have good sector coverage! Consider adding more positions within existing sectors or exploring international stocks.";
  }

  // Stock-specific analysis
  const symMatch = q.toUpperCase().match(/\b([A-Z]{2,10})\b/);
  if (symMatch) {
    const m = s.metrics.find((x) => x.holding.symbol === symMatch[1]);
    if (m) {
      if (/sell|hold|buy/.test(lc)) {
        if (m.plPct > 20) return `${m.holding.symbol} is up ${m.plPct.toFixed(2)}%. 💰 Consider trimming 20-30% to lock in profits while keeping exposure. Don't exit a winner without solid reason.`;
        if (m.plPct < -20) return `${m.holding.symbol} is down ${m.plPct.toFixed(2)}%. 🔍 Re-evaluate the fundamentals. Average down only if your conviction is high and the business outlook is unchanged.`;
        return `${m.holding.symbol} is roughly flat at ${m.plPct.toFixed(2)}%. ⏳ Hold and monitor — consider your original investment thesis.`;
      }
      return `📊 ${m.holding.symbol} (${m.name}): ${m.holding.quantity} shares @ avg $${m.holding.buyPrice.toFixed(2)}, now $${m.currentPrice.toFixed(2)}. P/L: ${m.plPct >= 0 ? "+" : ""}${m.plPct.toFixed(2)}% ($${m.pl.toFixed(2)}).`;
    }
  }

  return "I can analyse 📊 risk, 🌍 diversification, 🏆 top performers, ⚖️ rebalancing needs, or specific stocks. Try 'How's my AAPL doing?' or 'Should I rebalance?'";
}
