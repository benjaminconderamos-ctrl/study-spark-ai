import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated/documents/")({
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <div className="px-6 md:px-12 py-10 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Library"
        title="Your documents"
        description="PDF upload and processing land here in Phase 2."
      />
      <div className="border border-dashed border-border rounded-lg py-20 text-center">
        <p className="font-serif text-2xl text-foreground">Upload coming next</p>
        <p className="text-sm text-muted-foreground mt-2">Phase 2 builds drag-and-drop, storage, and text extraction.</p>
      </div>
    </div>
  );
}
