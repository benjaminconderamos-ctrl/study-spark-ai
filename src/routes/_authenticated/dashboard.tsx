import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Upload, FileText, Brain, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function StatCard({ label, value, hint, loading }: { label: string; value: string | number; hint?: string; loading?: boolean }) {
  return (
    <div className="border border-border bg-card p-6 rounded-lg">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="h-10 w-16 mt-3" />
      ) : (
        <p className="font-serif text-4xl mt-3 text-foreground">{value}</p>
      )}
      {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }: { to: string; icon: typeof Upload; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group border border-border bg-card hover:bg-accent transition-colors p-6 rounded-lg flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-serif text-xl text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{desc}</p>
      </div>
    </Link>
  );
}

function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [docs, decks, attempts, recent] = await Promise.all([
        supabase.from("documents").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase
          .from("quiz_attempts")
          .select("score, total")
          .order("started_at", { ascending: false })
          .limit(20),
        supabase
          .from("documents")
          .select("id, title, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const attemptList = attempts.data ?? [];
      const avgPct =
        attemptList.length === 0
          ? null
          : Math.round(
              (attemptList.reduce(
                (s, a) => s + (a.total > 0 ? a.score / a.total : 0),
                0,
              ) /
                attemptList.length) *
                100,
            );

      return {
        documentCount: docs.count ?? 0,
        flashcardCount: decks.count ?? 0,
        attemptCount: attemptList.length,
        avgPct,
        recent: recent.data ?? [],
      };
    },
  });

  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title="Good to see you."
        description="Pick up where you left off, or start something new."
        actions={
          <Button asChild>
            <Link to="/documents"><Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />Upload PDF</Link>
          </Button>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard label="Documents" value={stats?.documentCount ?? 0} hint={stats?.documentCount ? "In your library" : "No uploads yet"} loading={isLoading} />
        <StatCard label="Flashcards" value={stats?.flashcardCount ?? 0} hint="Across all decks" loading={isLoading} />
        <StatCard label="Quizzes taken" value={stats?.attemptCount ?? 0} hint={stats?.avgPct != null ? `Average ${stats.avgPct}%` : "No attempts yet"} loading={isLoading} />
        <StatCard label="Avg score" value={stats?.avgPct != null ? `${stats.avgPct}%` : "—"} hint="Last 20 attempts" loading={isLoading} />
      </section>

      <section className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quick actions</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction to="/documents" icon={Upload} title="Upload a PDF" desc="Start a new study workspace" />
          <QuickAction to="/documents" icon={FileText} title="Generate a summary" desc="Distill any document" />
          <QuickAction to="/documents" icon={Brain} title="Make flashcards" desc="Active recall, automatically" />
          <QuickAction to="/documents" icon={MessageSquare} title="Ask the tutor" desc="Chat with your sources" />
        </div>
      </section>

      <section className="mt-16 space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent documents</p>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : stats && stats.recent.length > 0 ? (
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {stats.recent.map((d) => (
              <Link
                key={d.id}
                to="/documents/$documentId"
                params={{ documentId: d.id }}
                className="flex items-center justify-between px-5 py-4 hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-serif text-lg text-foreground truncate">{d.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                    {d.status} · {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border rounded-lg py-16 text-center">
            <p className="font-serif text-2xl text-foreground">Nothing here yet</p>
            <p className="text-sm text-muted-foreground mt-2 mb-6">Upload your first PDF to get started.</p>
            <Button asChild>
              <Link to="/documents"><Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />Upload PDF</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
