import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/documents/")({
  component: DocumentsPage,
});

const STATUS_LABEL: Record<string, string> = {
  uploading: "Uploading",
  pending: "Queued",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

function DocumentsPage() {
  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, status, page_count, file_size, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-10 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Library"
        title="Your documents"
        description="Upload a PDF to generate summaries, flashcards, quizzes, and chat with it."
      />

      <div className="mb-10">
        <DocumentUploader />
      </div>

      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Recent uploads
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !docs || docs.length === 0 ? (
          <div className="border border-border rounded-lg py-16 text-center">
            <p className="font-serif text-xl text-foreground">No documents yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your uploaded PDFs will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {docs.map((d) => (
              <li key={d.id}>
                <Link
                  to="/documents/$documentId"
                  params={{ documentId: d.id }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-accent/40 transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.page_count ? `${d.page_count} pages · ` : ""}
                      {formatDistanceToNow(new Date(d.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant={d.status === "ready" ? "secondary" : d.status === "failed" ? "destructive" : "outline"}
                  >
                    {STATUS_LABEL[d.status] ?? d.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
