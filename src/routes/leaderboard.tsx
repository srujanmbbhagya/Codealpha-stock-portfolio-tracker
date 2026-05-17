import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, TrendingDown, Medal, Crown, Star } from "lucide-react";
import { usePortfolio } from "@/lib/portfolio-store";
import { summarize } from "@/lib/calc";
import { useLiveTick } from "@/hooks/useLiveTick";
import { CountUp } from "@/components/CountUp";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — WealthLens.ai" },
      { name: "description", content: "Compare portfolio performance with other investors on WealthLens.ai." },
    ],
  }),
  component: Leaderboard,
});

// Demo leaderboard entries
const DEMO_PORTFOLIOS = [
  {
    id: "1",
    name: "Alex Sharma",
    avatar: "AS",
    portfolioValue: 142850,
    invested: 98000,
    plPct: 45.77,
    pl: 44850,
    riskLevel: "Medium" as const,
    diversification: 78,
    topStock: "NVDA",
    badge: "🏆 Algo King",
  },
  {
    id: "2",
    name: "Priya Mehta",
    avatar: "PM",
    portfolioValue: 87420,
    invested: 72000,
    plPct: 21.42,
    pl: 15420,
    riskLevel: "Low" as const,
    diversification: 91,
    topStock: "MSFT",
    badge: "🌿 Safe Hands",
  },
  {
    id: "3",
    name: "Rohan Gupta",
    avatar: "RG",
    portfolioValue: 65200,
    invested: 55000,
    plPct: 18.55,
    pl: 10200,
    riskLevel: "High" as const,
    diversification: 42,
    topStock: "TSLA",
    badge: "⚡ Risk Taker",
  },
  {
    id: "4",
    name: "Sneha Patil",
    avatar: "SP",
    portfolioValue: 53800,
    invested: 48000,
    plPct: 12.08,
    pl: 5800,
    riskLevel: "Low" as const,
    diversification: 85,
    topStock: "AAPL",
    badge: "🎯 Steady Climber",
  },
  {
    id: "5",
    name: "Vikram Nair",
    avatar: "VN",
    portfolioValue: 39100,
    invested: 38000,
    plPct: 2.89,
    pl: 1100,
    riskLevel: "Medium" as const,
    diversification: 60,
    topStock: "JPM",
    badge: "📈 Newcomer",
  },
  {
    id: "6",
    name: "Kavya Iyer",
    avatar: "KI",
    portfolioValue: 28500,
    invested: 30000,
    plPct: -5.0,
    pl: -1500,
    riskLevel: "High" as const,
    diversification: 35,
    topStock: "COIN",
    badge: "🔄 Comeback Mode",
  },
];

const RANK_COLORS = [
  "from-yellow-500/30 to-yellow-600/10 border-yellow-500/30",
  "from-slate-400/30 to-slate-500/10 border-slate-400/30",
  "from-amber-700/30 to-amber-800/10 border-amber-700/30",
];

const RANK_ICONS = [
  <Crown className="h-5 w-5 text-yellow-400" key="c" />,
  <Medal className="h-5 w-5 text-slate-300" key="m" />,
  <Trophy className="h-5 w-5 text-amber-600" key="t" />,
];

function Leaderboard() {
  useLiveTick(5000);
  const holdings = usePortfolio((s) => s.holdings);
  const user = { name: "You", avatar: "YO" };
  const mySummary = summarize(holdings);
  const myPLPct = mySummary.plPct;

  // Insert user into leaderboard at correct rank
  const myEntry = {
    id: "me",
    name: user.name,
    avatar: user.avatar,
    portfolioValue: mySummary.currentValue,
    invested: mySummary.invested,
    plPct: myPLPct,
    pl: mySummary.pl,
    riskLevel: mySummary.riskLevel,
    diversification: mySummary.diversification,
    topStock: mySummary.best?.holding.symbol ?? "—",
    badge: "🌟 You",
    isMe: true,
  };

  const all = [...DEMO_PORTFOLIOS.map((p) => ({ ...p, isMe: false })), myEntry]
    .sort((a, b) => b.plPct - a.plPct);

  const myRank = all.findIndex((e) => e.id === "me") + 1;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl card-grad p-8 grid-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-primary/10 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs glass px-3 py-1 rounded-full mb-4">
              <Trophy className="h-3 w-3 text-yellow-400" /> Hackathon Portfolio Challenge
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
              Investor <span className="text-gradient">Leaderboard</span>
            </h1>
            <p className="mt-2 text-muted-foreground max-w-lg">
              Real-time portfolio performance rankings. Rise through the ranks by growing your wealth.
            </p>
          </div>
          <div className="glass rounded-2xl px-6 py-4 text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Your Rank</div>
            <div className="font-display text-5xl font-bold text-gradient mt-1">#{myRank}</div>
            <div className="text-xs text-muted-foreground mt-1">of {all.length} investors</div>
          </div>
        </motion.div>
      </section>

      {/* Top 3 podium */}
      <section className="grid grid-cols-3 gap-4 items-end">
        {[all[1], all[0], all[2]].map((entry, idx) => {
          const actualRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
          const heights = ["h-32", "h-44", "h-28"];
          const height = heights[idx];
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex flex-col items-center gap-3`}
            >
              {/* Avatar */}
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-lg ${
                entry.id === "me" ? "bg-gradient-to-br from-primary to-info" :
                actualRank === 1 ? "bg-gradient-to-br from-yellow-500/60 to-yellow-600/40" :
                actualRank === 2 ? "bg-gradient-to-br from-slate-400/50 to-slate-500/30" :
                "bg-gradient-to-br from-amber-700/50 to-amber-800/30"
              }`}>
                {entry.avatar}
              </div>
              <div className="text-center">
                <div className="font-semibold text-sm truncate max-w-[100px]">{entry.name}</div>
                <div className={`text-xs font-mono font-bold mt-0.5 ${entry.plPct >= 0 ? "text-profit" : "text-loss"}`}>
                  {entry.plPct >= 0 ? "+" : ""}{entry.plPct.toFixed(2)}%
                </div>
              </div>
              {/* Podium block */}
              <div className={`w-full ${height} rounded-t-2xl bg-gradient-to-t ${
                actualRank === 1 ? RANK_COLORS[0] :
                actualRank === 2 ? RANK_COLORS[1] : RANK_COLORS[2]
              } border flex flex-col items-center justify-start pt-3 gap-1`}>
                {RANK_ICONS[actualRank - 1]}
                <span className="text-2xl font-display font-bold">#{actualRank}</span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Full Ranking Table */}
      <section className="card-grad rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" /> Full Rankings
          </h2>
          <span className="text-xs text-muted-foreground">Sorted by % return</span>
        </div>
        <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-1">Rank</div>
          <div className="col-span-3">Investor</div>
          <div className="col-span-2 text-right">Portfolio</div>
          <div className="col-span-2 text-right">P/L</div>
          <div className="col-span-2 text-right">Return</div>
          <div className="col-span-2 text-right">Risk</div>
        </div>
        {all.map((entry, i) => {
          const rank = i + 1;
          const isProfit = entry.plPct >= 0;
          const isMe = entry.id === "me";
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`grid grid-cols-2 md:grid-cols-12 gap-3 px-6 py-4 items-center border-b border-border last:border-0 transition ${
                isMe
                  ? "bg-primary/10 hover:bg-primary/15"
                  : "hover:bg-secondary/30"
              }`}
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center gap-2">
                {rank <= 3 ? RANK_ICONS[rank - 1] : (
                  <span className="font-display font-bold text-muted-foreground w-5 text-center">{rank}</span>
                )}
              </div>

              {/* Investor */}
              <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isMe ? "bg-gradient-to-br from-primary to-info text-primary-foreground" :
                  "bg-gradient-to-br from-primary/30 to-info/20"
                }`}>
                  {entry.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    {entry.name}
                    {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{entry.badge}</div>
                </div>
              </div>

              {/* Portfolio value */}
              <div className="col-span-1 md:col-span-2 text-right font-mono">
                {isMe ? (
                  <CountUp value={entry.portfolioValue} prefix="$" />
                ) : (
                  <span>${entry.portfolioValue.toLocaleString()}</span>
                )}
              </div>

              {/* P/L */}
              <div className={`col-span-1 md:col-span-2 text-right font-mono font-semibold ${isProfit ? "text-profit" : "text-loss"}`}>
                {isProfit ? "+" : ""}${Math.abs(entry.pl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>

              {/* Return % */}
              <div className={`col-span-1 md:col-span-2 text-right font-mono font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
                <div className="flex items-center justify-end gap-1">
                  {isProfit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isProfit ? "+" : ""}{entry.plPct.toFixed(2)}%
                </div>
              </div>

              {/* Risk */}
              <div className="col-span-1 md:col-span-2 text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  entry.riskLevel === "Low" ? "bg-profit/15 text-profit" :
                  entry.riskLevel === "High" ? "bg-loss/15 text-loss" :
                  "bg-info/15 text-info"
                }`}>
                  {entry.riskLevel}
                </span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Stats */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Participants", value: `${all.length}`, icon: "👥" },
          { label: "Avg. Return", value: `+${(all.filter(e => e.plPct > 0).reduce((a, e) => a + e.plPct, 0) / all.length).toFixed(1)}%`, icon: "📊" },
          { label: "Best Single Return", value: `+${all[0].plPct.toFixed(2)}%`, icon: "🏆" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="card-grad rounded-2xl p-5 text-center"
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="font-display text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
