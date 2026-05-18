import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processDocument } from "@/lib/documents.functions";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function DocumentUploader() {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runProcess = useServerFn(processDocument);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are supported.");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Max file size is 20 MB.");
        return;
      }

      setBusy(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("Not authenticated");

        const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("documents")
          .upload(path, file, { contentType: "application/pdf", upsert: false });
        if (upErr) throw upErr;

        const title = file.name.replace(/\.pdf$/i, "");
        const { data: inserted, error: insErr } = await supabase
          .from("documents")
          .insert({
            user_id: userId,
            title,
            file_path: path,
            file_size: file.size,
            status: "pending",
          })
          .select("id")
          .single();
        if (insErr || !inserted) throw insErr ?? new Error("Insert failed");

        toast.success("Uploaded. Extracting text…");
        queryClient.invalidateQueries({ queryKey: ["documents"] });

        // Fire-and-await processing then navigate.
        try {
          await runProcess({ data: { documentId: inserted.id } });
          toast.success("Document ready.");
        } catch (err) {
          const message = err instanceof Error ? err.message : "Processing failed";
          toast.error(message);
        } finally {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        }

        navigate({
          to: "/documents/$documentId",
          params: { documentId: inserted.id },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
      } finally {
        setBusy(false);
      }
    },
    [navigate, queryClient, runProcess],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`border border-dashed rounded-lg py-14 px-6 text-center transition-colors ${
        drag ? "border-foreground bg-accent/40" : "border-border"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="flex flex-col items-center gap-4">
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
        )}
        <div>
          <p className="font-serif text-2xl text-foreground">
            {busy ? "Working…" : "Drop a PDF to begin"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            PDF, up to 20 MB. We extract the text and prepare AI study tools.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
      </div>
    </div>
  );
}
