import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { startChatSession, sendTutorMessage } from "@/lib/tutor.functions";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export function ChatTab({ documentId, ready }: { documentId: string; ready: boolean }) {
  const runStart = useServerFn(startChatSession);
  const runSend = useServerFn(sendTutorMessage);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const { sessionId } = await runStart({ data: { documentId } });
        if (!cancelled) setSessionId(sessionId);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to start chat");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, documentId, runStart]);

  const { data: history } = useQuery({
    queryKey: ["chat-history", sessionId],
    enabled: !!sessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    if (history) setLocalMessages(history);
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [localMessages, sending]);

  const send = async () => {
    if (!sessionId || !draft.trim() || sending) return;
    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: draft.trim(),
      created_at: new Date().toISOString(),
    };
    setLocalMessages((m) => [...m, userMsg]);
    const messageText = draft.trim();
    setDraft("");
    setSending(true);
    try {
      const { message } = await runSend({ data: { sessionId, message: messageText } });
      setLocalMessages((m) => [...m, message as Message]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
      setLocalMessages((m) => m.filter((x) => x.id !== userMsg.id));
      setDraft(messageText);
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <div className="border border-dashed border-border rounded-lg py-16 text-center">
        <p className="font-serif text-2xl text-foreground">Tutor chat</p>
        <p className="text-sm text-muted-foreground mt-2">Available once the document finishes processing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[70vh] border border-border rounded-lg bg-card overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {localMessages.length === 0 && !sending ? (
          <div className="text-center py-16">
            <MessageSquare className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
            <p className="font-serif text-2xl text-foreground">Ask anything about this document</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              The tutor answers using only the source text. Try "What are the main ideas?"
            </p>
          </div>
        ) : null}

        {localMessages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-accent text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending ? (
          <div className="flex justify-start">
            <div className="bg-accent rounded-2xl px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-border p-4 flex gap-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask a question about the document…"
          disabled={!sessionId || sending}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        <Button onClick={send} disabled={!sessionId || sending || !draft.trim()} size="icon">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
