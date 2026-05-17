import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Upload, FileText, Brain, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border bg-card p-6 rounded-lg">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="font-serif text-4xl mt-3 text-foreground">{value}</p>
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
        <StatCard label="Documents" value="0" hint="No uploads yet" />
        <StatCard label="Flashcards" value="0" hint="Generate from any PDF" />
        <StatCard label="Quizzes taken" value="0" hint="Average score —" />
        <StatCard label="Study minutes" value="0" hint="This week" />
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
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <p className="font-serif text-2xl text-foreground">Nothing here yet</p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Upload your first PDF to get started.</p>
          <Button asChild>
            <Link to="/documents"><Upload className="h-4 w-4 mr-2" strokeWidth={1.5} />Upload PDF</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
