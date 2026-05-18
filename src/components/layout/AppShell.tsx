import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { LayoutDashboard, FileText, Settings as SettingsIcon, LogOut, LineChart } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const NAV = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/documents", key: "nav.library", icon: FileText },
  { to: "/progress", key: "nav.progress", icon: LineChart },
  { to: "/settings", key: "nav.settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { t } = useT();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PaymentTestModeBanner />
      <div className="flex flex-1 min-h-0">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-sidebar px-5 py-6">
        <div className="mb-10">
          <Logo to="/dashboard" />
        </div>
        <nav className="flex-1 flex flex-col gap-0.5">
          {NAV.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon className="h-4 w-4" strokeWidth={1.5} />
              <span>{t(key)}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 pt-3 border-t border-border">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {t("nav.signOut")}
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 backdrop-blur px-4 py-3">
          <Logo to="/dashboard" />
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("nav.signOut")}>
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
        {children}
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-4">
          {NAV.map(({ to, key, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeProps={{ className: "text-foreground" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.18em]"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span>{t(key)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 sm:gap-6 border-b border-border pb-6 sm:pb-8 mb-8 sm:mb-10">
      <div className="space-y-2 max-w-2xl min-w-0">
        {eyebrow ? (
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.05]">{title}</h1>
        {description ? <p className="text-muted-foreground text-sm sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </header>
  );
}
