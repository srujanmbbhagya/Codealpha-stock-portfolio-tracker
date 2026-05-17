import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Briefcase, Eye, Sparkles, Bell, LogOut, Trophy, DollarSign } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth-store";
import { useCurrency } from "@/lib/currency-store";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/watchlist", label: "Watchlist", icon: Eye },
  { to: "/insights", label: "AI Insights", icon: Sparkles },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function Nav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuth((s) => s.currentUser());
  const logout = useAuth((s) => s.logout);
  const { currency, toggle } = useCurrency();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Hide nav on auth screen
  if (pathname === "/auth") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 backdrop-blur-xl bg-background/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        {user && (
          <nav className="hidden md:flex items-center gap-1 glass rounded-full p-1">
            {links.map((l) => {
              const active = pathname === l.to;
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    active
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-profit animate-pulse" />
            Live market
          </div>

          {/* Currency toggle */}
          {user && (
            <button
              onClick={toggle}
              title="Toggle currency"
              className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full hover:bg-accent/40 transition font-mono font-semibold"
            >
              <DollarSign className="h-3.5 w-3.5" />
              {currency === "USD" ? "$ USD" : "₹ INR"}
            </button>
          )}

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 glass rounded-full pl-1 pr-3 py-1 hover:bg-accent/40 transition"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-medium max-w-[80px] truncate">{user.name}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/60 bg-popover shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/60">
                    <div className="text-sm font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{user.phone || (user.username ? `@${user.username}` : "")}</div>
                  </div>
                  <button
                    onClick={() => { logout(); setOpen(false); navigate({ to: "/auth" }); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent/40 text-loss"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold shadow-lg hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      {user && (
        <nav className="md:hidden flex items-center gap-1 px-3 pb-3 overflow-x-auto">
          {links.map((l) => {
            const active = pathname === l.to;
            const Icon = l.icon;
            return (
              <Link key={l.to} to={l.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  active ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"
                }`}>
                <Icon className="h-3 w-3" />{l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
