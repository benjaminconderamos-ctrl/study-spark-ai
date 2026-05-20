import { useCallback, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud, Loader2, Link2, Youtube, FileText, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { processDocument } from "@/lib/documents.functions";
import { ensureCanUpload } from "@/lib/entitlements.functions";
import { importFromUrl } from "@/lib/import-url.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEntitlements } from "@/hooks/use-entitlements";
import { UpgradeProDialog } from "@/components/UpgradeProDialog";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function DocumentUploader() {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const runProcess = useServerFn(processDocument);
  const checkUpload = useServerFn(ensureCanUpload);
  const runImport = useServerFn(importFromUrl);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: ent } = useEntitlements();
  const isMax = ent?.isMax ?? false;

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

        try {
          await checkUpload();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload not allowed");
          setBusy(false);
          return;
        }

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
            source_type: "pdf",
          })
          .select("id")
          .single();
        if (insErr || !inserted) throw insErr ?? new Error("Insert failed");

        toast.success("Uploaded. Extracting text…");
        queryClient.invalidateQueries({ queryKey: ["documents"] });

        try {
          await runProcess({ data: { documentId: inserted.id } });
          toast.success("Document ready.");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Processing failed");
        } finally {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
        }

        navigate({ to: "/documents/$documentId", params: { documentId: inserted.id } });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [navigate, queryClient, runProcess, checkUpload],
  );

  const handleImport = useCallback(
    async (rawUrl: string, kind: "url" | "youtube") => {
      const value = rawUrl.trim();
      if (!value) {
        toast.error(kind === "youtube" ? "Pega un enlace de YouTube" : "Pega una URL");
        return;
      }
      if (!isMax) {
        setUpgradeOpen(true);
        return;
      }
      try {
        new URL(value);
      } catch {
        toast.error("URL inválida");
        return;
      }
      setBusy(true);
      try {
        try {
          await checkUpload();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "No permitido");
          setBusy(false);
          return;
        }
        toast.success(kind === "youtube" ? "Obteniendo transcripción…" : "Extrayendo contenido…");
        const res = await runImport({ data: { url: value } });
        toast.success("Documento listo.");
        queryClient.invalidateQueries({ queryKey: ["documents"] });
        navigate({ to: "/documents/$documentId", params: { documentId: res.documentId } });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        setBusy(false);
      }
    },
    [isMax, checkUpload, runImport, queryClient, navigate],
  );

  return (
    <>
      <Tabs defaultValue="pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pdf">
            <FileText className="h-4 w-4 mr-2" /> PDF
          </TabsTrigger>
          <TabsTrigger value="url">
            <Link2 className="h-4 w-4 mr-2" /> URL
            {!isMax && <Lock className="h-3 w-3 ml-1.5 text-muted-foreground" />}
          </TabsTrigger>
          <TabsTrigger value="youtube">
            <Youtube className="h-4 w-4 mr-2" /> YouTube
            {!isMax && <Lock className="h-3 w-3 ml-1.5 text-muted-foreground" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="mt-4">
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
              <Button variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
                Choose file
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <div className="border border-dashed rounded-lg py-10 px-6">
            <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
              <Link2 className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
              <div className="text-center">
                <p className="font-serif text-2xl text-foreground">Importar desde una URL</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pega el enlace de un artículo, blog o página web. Extraeremos el texto
                  automáticamente.
                </p>
              </div>
              <div className="flex w-full gap-2">
                <Input
                  type="url"
                  placeholder="https://es.wikipedia.org/wiki/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={busy}
                  onKeyDown={(e) => e.key === "Enter" && handleImport(url, "url")}
                />
                <Button onClick={() => handleImport(url, "url")} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                </Button>
              </div>
              {!isMax && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Función del plan Max
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="youtube" className="mt-4">
          <div className="border border-dashed rounded-lg py-10 px-6">
            <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
              <Youtube className="h-8 w-8 text-muted-foreground" strokeWidth={1.25} />
              <div className="text-center">
                <p className="font-serif text-2xl text-foreground">Importar desde YouTube</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pega el enlace de un video. Obtendremos la transcripción y la procesaremos
                  como un documento.
                </p>
              </div>
              <div className="flex w-full gap-2">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  disabled={busy}
                  onKeyDown={(e) => e.key === "Enter" && handleImport(ytUrl, "youtube")}
                />
                <Button onClick={() => handleImport(ytUrl, "youtube")} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Importar"}
                </Button>
              </div>
              {!isMax && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Función del plan Max
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Solo funciona en videos con subtítulos disponibles.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <UpgradeProDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        priceId="max_monthly"
      />
    </>
  );
}
