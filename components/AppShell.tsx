"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Target, GitBranch, ListOrdered, Share2, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV_ITEMS = [
  { href: "/", label: "Board", icon: Trophy },
  { href: "/predict", label: "Predict", icon: Target },
  { href: "/matches", label: "Results", icon: ListOrdered },
  { href: "/standings", label: "Groups", icon: Table2 },
  { href: "/bracket", label: "Bracket", icon: GitBranch },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs transition-colors",
                active
                  ? "text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  function shareLeague() {
    const text = `Join our FIFA World Cup 2026 predictions!\n${window.location.origin}\nAsk the group for the PIN.`;
    navigator.clipboard.writeText(text);
    toast.success("Invite link copied!");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">
            WC 2026
          </p>
          <h1 className="text-xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <Button variant="outline" size="icon" onClick={shareLeague}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/30 via-background to-background pb-24">
      {children}
      <BottomNav />
    </div>
  );
}
