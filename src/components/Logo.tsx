import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center glow group-hover:scale-105 transition">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="font-display font-bold text-lg tracking-tight">
          WealthLens<span className="text-primary">.ai</span>
        </div>
        <div className="text-[10px] text-muted-foreground tracking-widest uppercase">Track · Grow · Master</div>
      </div>
    </Link>
  );
}
