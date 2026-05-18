import { Link, useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { LayoutDashboard, FileText, Settings as SettingsIcon, LogOut, LineChart } from "lucide-react";

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
    <div className="min-h-screen flex bg-background text-foreground">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" strokeWidth={1.5} />
          {t("nav.signOut")}
        </Button>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="md:hidden flex items-center justify-between border-b border-border px-5 py-4">
          <Logo to="/dashboard" />
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
        {children}
      </main>
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
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8 mb-10">
      <div className="space-y-2 max-w-2xl">
        {eyebrow ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="font-serif text-4xl md:text-5xl text-foreground">{title}</h1>
        {description ? <p className="text-muted-foreground text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
