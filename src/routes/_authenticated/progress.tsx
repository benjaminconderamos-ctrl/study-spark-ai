import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Flame, Clock, Activity as ActivityIcon, ArrowUpRight, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import { resetStudyProgress } from "@/lib/study.functions";

export const Route = createFileRoute("/_authenticated/progress")({
  component: ProgressPage,
});

type Activity = "summary" | "flashcards" | "quiz" | "chat" | "upload";

type SessionRow = {
  id: string;
  activity: Activity;
  duration_seconds: number;
  created_at: string;
  document_id: string | null;
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map(dayKey));
  let streak = 0;
  const cursor = new Date();
  // If user hasn't studied today, streak can still continue from yesterday.
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function StatCard({ icon: Icon, label, value, hint, loading }: {
  icon: typeof Clock;
  label: string;
  value: string | number;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <div className="border border-border bg-card p-6 rounded-lg">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      {loading ? (
        <Skeleton className="h-10 w-16 mt-3" />
      ) : (
        <p className="font-serif text-4xl mt-3 text-foreground">{value}</p>
      )}
      {hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

function ProgressPage() {
  const { t } = useT();

  const { data, isLoading } = useQuery({
    queryKey: ["study-progress"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data: sessions, error } = await supabase
        .from("study_sessions")
        .select("id, activity, duration_seconds, created_at, document_id")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;

      const docIds = Array.from(
        new Set((sessions ?? []).map((s) => s.document_id).filter((x): x is string => !!x)),
      );
      const docs = docIds.length
        ? await supabase.from("documents").select("id, title").in("id", docIds)
        : { data: [] as { id: string; title: string }[] };
      const titleById = new Map((docs.data ?? []).map((d) => [d.id, d.title]));

      return { sessions: (sessions ?? []) as SessionRow[], titleById };
    },
  });

  const sessions = data?.sessions ?? [];
  const titleById = data?.titleById ?? new Map<string, string>();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const sevenAgo = new Date(now);
  sevenAgo.setDate(sevenAgo.getDate() - 7);

  const totalSec = sessions.reduce((s, x) => s + x.duration_seconds, 0);
  const todaySec = sessions
    .filter((x) => new Date(x.created_at) >= startOfDay)
    .reduce((s, x) => s + x.duration_seconds, 0);
  const weekSec = sessions
    .filter((x) => new Date(x.created_at) >= sevenAgo)
    .reduce((s, x) => s + x.duration_seconds, 0);

  const streak = computeStreak(sessions.map((s) => new Date(s.created_at)));

  const byActivity = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.activity] = (acc[s.activity] ?? 0) + s.duration_seconds;
    return acc;
  }, {});
  const maxAct = Math.max(1, ...Object.values(byActivity));

  const minutes = (sec: number) => Math.max(0, Math.round(sec / 60));

  const qc = useQueryClient();
  const runReset = useServerFn(resetStudyProgress);
  const [resetting, setResetting] = useState(false);
  const handleReset = async () => {
    if (!confirm(t("progress.resetConfirm"))) return;
    setResetting(true);
    try {
      await runReset({});
      toast.success(t("progress.resetDone"));
      qc.invalidateQueries({ queryKey: ["study-progress"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-10 max-w-6xl mx-auto">
      <PageHeader
        eyebrow={t("progress.eyebrow")}
        title={t("progress.title")}
        description={t("progress.desc")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={resetting || sessions.length === 0}
          >
            {resetting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" strokeWidth={1.5} />
            )}
            {t("progress.reset")}
          </Button>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard
          icon={Clock}
          label={t("progress.totalMinutes")}
          value={minutes(totalSec)}
          hint={t("progress.minutesShort")}
          loading={isLoading}
        />
        <StatCard
          icon={Clock}
          label={t("progress.todayMinutes")}
          value={minutes(todaySec)}
          hint={t("progress.minutesShort")}
          loading={isLoading}
        />
        <StatCard
          icon={Clock}
          label={t("progress.weekMinutes")}
          value={minutes(weekSec)}
          hint={t("progress.minutesShort")}
          loading={isLoading}
        />
        <StatCard
          icon={Flame}
          label={t("progress.streak")}
          value={streak}
          hint={t("progress.streakHint")}
          loading={isLoading}
        />
      </section>

      {!isLoading && sessions.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg py-16 text-center">
          <ActivityIcon className="h-6 w-6 mx-auto text-muted-foreground mb-3" strokeWidth={1.25} />
          <p className="font-serif text-2xl text-foreground">{t("progress.empty.title")}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{t("progress.empty.desc")}</p>
        </div>
      ) : (
        <>
          <section className="space-y-4 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("progress.byActivity")}
            </p>
            <div className="border border-border rounded-lg divide-y divide-border">
              {(["summary", "flashcards", "quiz", "chat", "upload"] as Activity[]).map((a) => {
                const sec = byActivity[a] ?? 0;
                const pct = Math.round((sec / maxAct) * 100);
                return (
                  <div key={a} className="px-5 py-4 flex items-center gap-4">
                    <div className="w-32 shrink-0 text-sm text-foreground">{t(`activity.${a}`)}</div>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-right font-mono text-xs text-muted-foreground">
                      {minutes(sec)} {t("progress.minutesShort")}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("progress.recent")}
            </p>
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
              {sessions.slice(0, 12).map((s) => {
                const title = s.document_id ? titleById.get(s.document_id) : null;
                const inner = (
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-serif text-base text-foreground truncate">
                        {t(`activity.${s.activity}`)}
                        {title ? <span className="text-muted-foreground"> · {title}</span> : null}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                        {new Date(s.created_at).toLocaleString()} · {Math.max(1, Math.round(s.duration_seconds / 60))} {t("progress.minutesShort")}
                      </p>
                    </div>
                    {s.document_id ? (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                    ) : null}
                  </div>
                );
                return s.document_id ? (
                  <Link
                    key={s.id}
                    to="/documents/$documentId"
                    params={{ documentId: s.document_id }}
                    className="block hover:bg-accent transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={s.id}>{inner}</div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
