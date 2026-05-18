import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { processDocument, deleteDocument } from "@/lib/documents.functions";
import { SummaryTab } from "@/components/documents/SummaryTab";
import { FlashcardsTab } from "@/components/documents/FlashcardsTab";

export const Route = createFileRoute("/_authenticated/documents/$documentId")({
  component: DocumentDetailPage,
});

function DocumentDetailPage() {
  const { documentId } = Route.useParams();
  const navigate = useNavigate();
  const runProcess = useServerFn(processDocument);
  const runDelete = useServerFn(deleteDocument);
  const [busy, setBusy] = useState(false);

  const { data: doc, isLoading, refetch } = useQuery({
    queryKey: ["document", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, status, page_count, file_size, created_at, error_message")
        .eq("id", documentId)
        .single();
      if (error) throw error;
      return data;
    },
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "pending" || s === "processing" ? 2000 : false;
    },
  });

  const reprocess = async () => {
    setBusy(true);
    try {
      await runProcess({ data: { documentId } });
      toast.success("Reprocessed.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this document and all related study materials?")) return;
    setBusy(true);
    try {
      await runDelete({ data: { documentId } });
      toast.success("Deleted.");
      navigate({ to: "/documents" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
        <p className="text-muted-foreground">Document not found.</p>
      </div>
    );
  }

  const isReady = doc.status === "ready";
  const isWorking = doc.status === "pending" || doc.status === "processing";

  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
      <Link
        to="/documents"
        className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-3 w-3" /> Library
      </Link>

      <PageHeader
        eyebrow="Document"
        title={doc.title}
        description={
          doc.page_count
            ? `${doc.page_count} pages`
            : isWorking
            ? "Extracting text…"
            : undefined
        }
        actions={
          <>
            <Badge
              variant={
                isReady ? "secondary" : doc.status === "failed" ? "destructive" : "outline"
              }
            >
              {doc.status}
            </Badge>
            <Button variant="outline" size="sm" disabled={busy || isWorking} onClick={reprocess}>
              <RefreshCw className="h-4 w-4 mr-1" /> Reprocess
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={remove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
      />

      {doc.status === "failed" && doc.error_message ? (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {doc.error_message}
        </div>
      ) : null}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
          <TabsTrigger value="chat">Tutor</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-8">
          <SummaryTab documentId={documentId} ready={isReady} />
        </TabsContent>
        <TabsContent value="flashcards" className="pt-8">
          <FlashcardsTab documentId={documentId} ready={isReady} />
        </TabsContent>
        <TabsContent value="quiz" className="pt-8">
          <ComingSoon ready={isReady} feature="Quizzes" phase="Phase 6" />
        </TabsContent>
        <TabsContent value="chat" className="pt-8">
          <ComingSoon ready={isReady} feature="Tutor chat" phase="Phase 7" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComingSoon({ ready, feature, phase }: { ready: boolean; feature: string; phase: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-16 text-center">
      <p className="font-serif text-2xl text-foreground">{feature}</p>
      <p className="text-sm text-muted-foreground mt-2">
        {ready ? `${phase} wires this up next.` : "Available once the document finishes processing."}
      </p>
    </div>
  );
}
