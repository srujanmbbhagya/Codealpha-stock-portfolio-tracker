import { motion } from "framer-motion";
import { CountUp } from "./CountUp";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, icon: Icon, prefix = "", suffix = "", decimals = 2, accent = "primary", subtext,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent?: "primary" | "profit" | "loss" | "info";
  subtext?: React.ReactNode;
}) {
  const accentMap = {
    primary: "from-primary/20 to-primary/5 text-primary",
    profit: "from-profit/20 to-profit/5 text-profit",
    loss: "from-loss/20 to-loss/5 text-loss",
    info: "from-info/20 to-info/5 text-info",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4 }}
      className="card-grad rounded-2xl p-5 relative overflow-hidden group"
    >
      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-2xl opacity-60 group-hover:opacity-100 transition`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-display font-bold tracking-tight">
            <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          </div>
          {subtext && <div className="mt-1 text-xs">{subtext}</div>}
        </div>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${accentMap[accent]} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
