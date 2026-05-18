import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateQuiz, submitQuizAttempt } from "@/lib/quiz.functions";
import { useStudyTimer } from "@/hooks/use-study-timer";

type Question = {
  id: string;
  position: number;
  type: "multiple_choice" | "true_false" | "open";
  prompt: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
};

export function QuizTab({ documentId, ready }: { documentId: string; ready: boolean }) {
  const runGen = useServerFn(generateQuiz);
  const runSubmit = useServerFn(submitQuizAttempt);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  useStudyTimer("quiz", documentId, ready);

  const { data: quiz, isLoading, refetch } = useQuery({
    queryKey: ["quiz", documentId],
    queryFn: async () => {
      const { data: quizzes, error } = await supabase
        .from("quizzes")
        .select("id, title")
        .eq("document_id", documentId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const q = quizzes?.[0];
      if (!q) return null;
      const { data: questions, error: qErr } = await supabase
        .from("quiz_questions")
        .select("id, position, type, prompt, options, correct_answer, explanation")
        .eq("quiz_id", q.id)
        .order("position", { ascending: true });
      if (qErr) throw qErr;
      return { ...q, questions: (questions ?? []) as Question[] };
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["quiz-attempts", quiz?.id],
    enabled: !!quiz?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("id, score, total, completed_at")
        .eq("quiz_id", quiz!.id)
        .order("started_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const generate = async () => {
    setBusy(true);
    setResult(null);
    setAnswers({});
    try {
      await runGen({ data: { documentId, count: 8 } });
      toast.success("Quiz ready.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Answer all ${quiz.questions.length} questions to submit.`);
      return;
    }
    setBusy(true);
    try {
      const res = await runSubmit({
        data: {
          quizId: quiz.id,
          answers: quiz.questions.map((q) => ({ questionId: q.id, answer: answers[q.id] })),
        },
      });
      setResult({ score: res.score, total: res.total });
      toast.success(`Scored ${res.score} / ${res.total}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
  };

  const scorePct = useMemo(() => {
    if (!result || result.total === 0) return 0;
    return Math.round((result.score / result.total) * 100);
  }, [result]);

  if (!ready) {
    return (
      <Empty title="Quiz" msg="Available once the document finishes processing." />
    );
  }
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg py-16 text-center">
        <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
        <p className="font-serif text-2xl text-foreground">No quiz yet</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Generate a mix of multiple-choice and true/false questions from this document.
        </p>
        <Button className="mt-5" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate quiz
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {quiz.questions.length} questions
        </p>
        <Button variant="outline" size="sm" onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Regenerate
        </Button>
      </div>

      {result ? (
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Result</p>
          <p className="font-serif text-4xl mt-2 text-foreground">{result.score} / {result.total}</p>
          <p className="text-sm text-muted-foreground mt-1">{scorePct}% correct</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={reset}>Retake</Button>
        </div>
      ) : null}

      <ol className="space-y-6">
        {quiz.questions.map((q, i) => {
          const userAnswer = answers[q.id];
          const showResult = result !== null;
          const isCorrect =
            showResult && q.type !== "open" && userAnswer?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();
          return (
            <li key={q.id} className="border border-border rounded-lg p-6 bg-card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    Question {i + 1} · {q.type.replace("_", " ")}
                  </p>
                  <p className="font-serif text-xl text-foreground leading-snug">{q.prompt}</p>
                </div>
                {showResult && q.type !== "open" ? (
                  isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-foreground" strokeWidth={1.5} />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                  )
                ) : null}
              </div>

              {q.type === "multiple_choice" && q.options ? (
                <div className="grid gap-2">
                  {q.options.map((opt) => {
                    const checked = userAnswer === opt;
                    return (
                      <label
                        key={opt}
                        className={`flex items-start gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                          checked ? "border-foreground bg-accent" : "border-border hover:bg-accent/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={checked}
                          onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                          disabled={showResult}
                          className="mt-1"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : q.type === "true_false" ? (
                <div className="flex gap-2">
                  {["True", "False"].map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant={userAnswer === opt ? "default" : "outline"}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                      disabled={showResult}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor={q.id}>Your answer</Label>
                  <Input
                    id={q.id}
                    value={userAnswer ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    disabled={showResult}
                  />
                </div>
              )}

              {showResult ? (
                <div className="text-sm text-muted-foreground border-t border-border pt-3 space-y-1">
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] mr-2">Answer</span>
                    {q.correct_answer}
                  </p>
                  {q.explanation ? <p className="italic">{q.explanation}</p> : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!result ? (
        <Button onClick={submit} disabled={busy} className="w-full">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Submit quiz
        </Button>
      ) : null}

      {attempts && attempts.length > 0 ? (
        <div className="border-t border-border pt-6 space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Recent attempts</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {attempts.map((a) => (
              <div key={a.id} className="border border-border rounded-md p-3 text-sm">
                <p className="font-serif text-lg">{a.score} / {a.total}</p>
                <p className="text-xs text-muted-foreground">
                  {a.completed_at ? new Date(a.completed_at).toLocaleString() : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>
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
