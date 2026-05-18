import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generateSummary } from "@/lib/summary.functions";
import { useStudyTimer } from "@/hooks/use-study-timer";
import type { Summary } from "@/lib/ai/services/summary.service";

export function SummaryTab({ documentId, ready }: { documentId: string; ready: boolean }) {
  const run = useServerFn(generateSummary);
  const [busy, setBusy] = useState(false);
  useStudyTimer("summary", documentId, ready);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["summary", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("summaries")
        .select("content, updated_at")
        .eq("document_id", documentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const generate = async () => {
    setBusy(true);
    try {
      await run({ data: { documentId } });
      toast.success("Summary ready.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return (
      <EmptyState title="Summary" message="Available once the document finishes processing." />
    );
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (!data) {
    return (
      <div className="border border-dashed border-border rounded-lg py-16 text-center">
        <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
        <p className="font-serif text-2xl text-foreground">No summary yet</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Generate a concise study summary with key concepts, bullet takeaways, and a plain-language explanation.
        </p>
        <Button className="mt-5" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate summary
        </Button>
      </div>
    );
  }

  const summary = data.content as Summary;
  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Updated {new Date(data.updated_at).toLocaleString()}
        </p>
        <Button variant="outline" size="sm" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Regenerate
        </Button>
      </div>

      <Section title="Overview">
        <p className="text-foreground leading-relaxed">{summary.overview}</p>
      </Section>

      <Section title="Key concepts">
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {summary.key_concepts.map((c) => (
            <div key={c.term}>
              <dt className="font-serif text-lg text-foreground">{c.term}</dt>
              <dd className="text-sm text-muted-foreground mt-1">{c.definition}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Takeaways">
        <ul className="space-y-2 list-disc pl-5 marker:text-muted-foreground">
          {summary.bullets.map((b, i) => (
            <li key={i} className="text-foreground leading-relaxed">{b}</li>
          ))}
        </ul>
      </Section>

      <Section title="In plain language">
        <p className="text-foreground leading-relaxed">{summary.simplified}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</h3>
      {children}
    </section>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-16 text-center">
      <p className="font-serif text-2xl text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
    </div>
  );
}
