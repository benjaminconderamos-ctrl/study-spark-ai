import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { generateFlashcards, recordFlashcardReview } from "@/lib/flashcards.functions";
import { useStudyTimer } from "@/hooks/use-study-timer";

type Card = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  difficulty: "easy" | "medium" | "hard";
  position: number;
};

const RATINGS = [
  { value: "again", label: "Again", hint: "I didn't know it" },
  { value: "hard", label: "Hard", hint: "Got it with effort" },
  { value: "good", label: "Good", hint: "Solid recall" },
  { value: "easy", label: "Easy", hint: "Effortless" },
] as const;

export function FlashcardsTab({ documentId, ready }: { documentId: string; ready: boolean }) {
  const runGen = useServerFn(generateFlashcards);
  const runReview = useServerFn(recordFlashcardReview);
  const [busy, setBusy] = useState(false);
  useStudyTimer("flashcards", documentId, ready);

  const { data: deck, isLoading, refetch } = useQuery({
    queryKey: ["deck", documentId],
    queryFn: async () => {
      const { data: decks, error } = await supabase
        .from("flashcard_decks")
        .select("id, title, updated_at")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const d = decks?.[0];
      if (!d) return null;
      const { data: cards, error: cErr } = await supabase
        .from("flashcards")
        .select("id, question, answer, category, difficulty, position")
        .eq("deck_id", d.id)
        .order("position", { ascending: true });
      if (cErr) throw cErr;
      return { ...d, cards: (cards ?? []) as Card[] };
    },
  });

  const generate = async () => {
    setBusy(true);
    try {
      await runGen({ data: { documentId, count: 12 } });
      toast.success("Deck ready.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <Empty title="Flashcards" msg="Available once the document finishes processing." />;
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!deck || deck.cards.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg py-16 text-center">
        <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
        <p className="font-serif text-2xl text-foreground">No flashcards yet</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Generate a deck of study cards covering the key ideas of this document.
        </p>
        <Button className="mt-5" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate flashcards
        </Button>
      </div>
    );
  }

  return (
    <DeckStudy
      cards={deck.cards}
      onReview={async (cardId, rating) => {
        try {
          await runReview({ data: { flashcardId: cardId, rating } });
        } catch (err) {
          console.error(err);
        }
      }}
      onRegenerate={generate}
      busy={busy}
    />
  );
}

function DeckStudy({
  cards,
  onReview,
  onRegenerate,
  busy,
}: {
  cards: Card[];
  onReview: (cardId: string, rating: "again" | "hard" | "good" | "easy") => Promise<void>;
  onRegenerate: () => void;
  busy: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [index]);

  const card = cards[index];
  const progress = useMemo(() => `${index + 1} / ${cards.length}`, [index, cards.length]);

  const rate = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!card) return;
    await onReview(card.id, rating);
    if (index + 1 < cards.length) setIndex(index + 1);
    else toast.success("Deck complete.");
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {progress}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={restart}>
            <RotateCcw className="h-4 w-4 mr-1" /> Restart
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Regenerate
          </Button>
        </div>
      </div>

      {card ? (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="w-full min-h-[280px] rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors text-left p-8 md:p-12 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.15em]">
              {card.category ?? "general"}
            </Badge>
            <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-[0.15em]">
              {card.difficulty}
            </Badge>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="font-serif text-2xl md:text-3xl text-foreground leading-snug">
            {flipped ? card.answer : card.question}
          </p>
          <p className="mt-auto pt-8 text-xs text-muted-foreground">
            Tap card to {flipped ? "see question" : "reveal answer"}
          </p>
        </button>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {RATINGS.map((r) => (
          <Button
            key={r.value}
            variant="outline"
            onClick={() => rate(r.value)}
            disabled={!flipped}
            className="flex-col h-auto py-3"
          >
            <span className="font-medium">{r.label}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{r.hint}</span>
          </Button>
        ))}
      </div>
      {!flipped ? (
        <p className="text-xs text-muted-foreground text-center">Reveal the answer to rate your recall.</p>
      ) : null}
    </div>
  );
}

function Empty({ title, msg }: { title: string; msg: string }) {
  return (
    <div className="border border-dashed border-border rounded-lg py-16 text-center">
      <p className="font-serif text-2xl text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-2">{msg}</p>
    </div>
  );
}
