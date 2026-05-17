import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="px-6 md:px-12 py-10 max-w-3xl mx-auto">
      <PageHeader eyebrow="Account" title="Settings" />
      <dl className="divide-y divide-border border-y border-border">
        <div className="flex justify-between py-4">
          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Email</dt>
          <dd className="text-sm text-foreground">{user?.email}</dd>
        </div>
        <div className="flex justify-between py-4">
          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">User ID</dt>
          <dd className="text-xs font-mono text-muted-foreground">{user?.id}</dd>
        </div>
      </dl>
    </div>
  );
}
