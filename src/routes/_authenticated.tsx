import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated")({
  // Gate ONLY on the client. SSR has no session — let it render the shell;
  // the client effect below will redirect if unauthenticated.
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.navigate({ to: "/login" });
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Loading</p>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
