import React from "react";
import { Link, useLocation } from "wouter";
import { ShieldAlert, LayoutDashboard, AlertTriangle, Terminal, Shield, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/threats", label: "Threats & Alerts", icon: AlertTriangle },
  { href: "/incidents", label: "Incidents", icon: ShieldAlert },
  { href: "/logs", label: "Security Logs", icon: Terminal },
  { href: "/response", label: "SOAR Response", icon: Activity },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-xl flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Nexus SOC
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden",
                    isActive
                      ? "text-primary bg-primary/10 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                  )}
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 border border-border">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-xs font-mono text-muted-foreground">System Online</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center text-sm font-mono text-muted-foreground">
            <span className="text-primary mr-2">root@nexus-soc:~$</span>
            <span className="opacity-70">tail -f /var/log/syslog</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono bg-secondary/50 px-3 py-1 rounded-md border border-border">
              {new Date().toISOString().split('T')[0]} <span className="text-primary">{new Date().toISOString().split('T')[1].slice(0,8)}</span> UTC
            </div>
            <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
