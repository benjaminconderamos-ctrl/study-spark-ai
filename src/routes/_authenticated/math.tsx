import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calculator, Sparkles, Lock, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { solveMath, type MathSolution } from "@/lib/math.functions";
import { useEntitlements } from "@/hooks/use-entitlements";
import { UpgradeProDialog } from "@/components/UpgradeProDialog";
import { useT } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/_authenticated/math")({
  component: MathPage,
});

const EXAMPLES = [
  "Find the local extrema of f(x) = x^3 − 3x^2 + 2",
  "Solve the integral of sin(x)*cos(x) dx",
  "Mean and standard deviation of: 4, 8, 15, 16, 23, 42",
  "Solve the system: 2x + y = 7, x − y = 2",
];

function MathPage() {
  const { t } = useT();
  const { data: ent, isLoading: entLoading } = useEntitlements();
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState<MathSolution | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const solveFn = useServerFn(solveMath);
  const mutation = useMutation({
    mutationFn: (p: string) => solveFn({ data: { problem: p } }) as Promise<MathSolution>,
    onSuccess: (res) => setSolution(res),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed to solve"),
  });

  const isMax = !!ent?.isMax;

  function handleSubmit() {
    if (!problem.trim()) return;
    if (!isMax) {
      setUpgradeOpen(true);
      return;
    }
    setSolution(null);
    mutation.mutate(problem.trim());
  }

  return (
    <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-10 max-w-5xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        {t("math.back")}
      </Link>

      <PageHeader
        eyebrow={t("math.eyebrow")}
        title={t("math.title")}
        description={t("math.desc")}
      />

      {!entLoading && !isMax ? (
        <div className="border border-border bg-card rounded-lg p-6 mb-8 flex items-start gap-4">
          <Lock className="h-5 w-5 text-muted-foreground mt-1 shrink-0" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="font-serif text-xl text-foreground">{t("math.locked.title")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("math.locked.desc")}</p>
          </div>
          <Button onClick={() => setUpgradeOpen(true)}>{t("math.locked.cta")}</Button>
        </div>
      ) : null}

      <section className="border border-border bg-card rounded-lg p-6">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("math.input.label")}
        </label>
        <Textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder={t("math.input.placeholder")}
          className="mt-3 min-h-[120px] font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setProblem(ex)}
              className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-accent transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSubmit} disabled={mutation.isPending || !problem.trim()}>
            <Sparkles className="h-4 w-4 mr-2" strokeWidth={1.5} />
            {mutation.isPending ? t("math.solving") : t("math.solve")}
          </Button>
        </div>
      </section>

      {mutation.isPending ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-64 w-full mt-6" />
        </div>
      ) : solution ? (
        <SolutionView solution={solution} />
      ) : null}

      <UpgradeProDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} priceId="max_monthly" />
    </div>
  );
}

function SolutionView({ solution }: { solution: MathSolution }) {
  const { t } = useT();
  return (
    <div className="mt-8 grid lg:grid-cols-2 gap-6">
      <div className="border border-border bg-card rounded-lg p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("math.solution")}
        </p>
        <p className="font-serif text-lg text-foreground mt-3">{solution.restated}</p>
        <ol className="mt-5 space-y-3">
          {solution.steps.map((s, i) => (
            <li
              key={i}
              className="text-sm text-foreground bg-muted/50 rounded-md px-4 py-3 font-mono"
            >
              {s}
            </li>
          ))}
        </ol>
        <div className="mt-6 border-t border-border pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {t("math.answer")}
          </p>
          <p className="font-serif text-2xl text-foreground mt-2">{solution.answer}</p>
        </div>
      </div>
      <div className="border border-border bg-card rounded-lg p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("math.graph")}
        </p>
        {solution.plot ? (
          <PlotSvg plot={solution.plot} />
        ) : (
          <div className="mt-6 border border-dashed border-border rounded-md py-16 text-center text-sm text-muted-foreground">
            {t("math.noGraph")}
          </div>
        )}
      </div>
    </div>
  );
}

const SERIES_COLORS = ["#ec4899", "#3b82f6", "#10b981"];

function PlotSvg({ plot }: { plot: NonNullable<MathSolution["plot"]> }) {
  const { xs, ys, xMin, xMax, yMin, yMax } = useMemo(() => {
    const xsAll = plot.series.flatMap((s) => s.points.map((p) => p.x));
    const ysAll = plot.series.flatMap((s) => s.points.map((p) => p.y));
    const xMin = Math.min(...xsAll);
    const xMax = Math.max(...xsAll);
    let yMin = Math.min(...ysAll);
    let yMax = Math.max(...ysAll);
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    // 5% padding
    const pad = (yMax - yMin) * 0.08;
    return { xs: xsAll, ys: ysAll, xMin, xMax, yMin: yMin - pad, yMax: yMax + pad };
  }, [plot]);

  const W = 520;
  const H = 320;
  const PAD = 36;
  const sx = (x: number) =>
    PAD + ((x - xMin) / Math.max(xMax - xMin, 1e-9)) * (W - PAD * 2);
  const sy = (y: number) =>
    H - PAD - ((y - yMin) / Math.max(yMax - yMin, 1e-9)) * (H - PAD * 2);

  const zeroX = xMin <= 0 && xMax >= 0 ? sx(0) : null;
  const zeroY = yMin <= 0 && yMax >= 0 ? sy(0) : null;

  return (
    <div className="mt-4">
      <p className="text-sm text-foreground font-serif">{plot.title}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mt-3">
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {/* grid */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = PAD + (i * (H - PAD * 2)) / 4;
          return (
            <line
              key={`gy-${i}`}
              x1={PAD}
              x2={W - PAD}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
          );
        })}
        {Array.from({ length: 5 }).map((_, i) => {
          const x = PAD + (i * (W - PAD * 2)) / 4;
          return (
            <line
              key={`gx-${i}`}
              x1={x}
              x2={x}
              y1={PAD}
              y2={H - PAD}
              stroke="currentColor"
              strokeOpacity={0.08}
            />
          );
        })}
        {/* axes */}
        {zeroY != null && (
          <line x1={PAD} x2={W - PAD} y1={zeroY} y2={zeroY} stroke="currentColor" strokeOpacity={0.5} />
        )}
        {zeroX != null && (
          <line x1={zeroX} x2={zeroX} y1={PAD} y2={H - PAD} stroke="currentColor" strokeOpacity={0.5} />
        )}
        {/* series */}
        {plot.series.map((s, i) => {
          const color = SERIES_COLORS[i % SERIES_COLORS.length];
          const isScatter = s.points.length < 25;
          const d = s.points
            .map((p, idx) => `${idx === 0 ? "M" : "L"} ${sx(p.x)} ${sy(p.y)}`)
            .join(" ");
          return (
            <g key={i}>
              {!isScatter && <path d={d} fill="none" stroke={color} strokeWidth={2} />}
              {isScatter &&
                s.points.map((p, idx) => (
                  <circle key={idx} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={color} />
                ))}
            </g>
          );
        })}
        {/* labels */}
        <text x={W - PAD} y={H - 10} textAnchor="end" fontSize="10" fill="currentColor" opacity={0.6}>
          {plot.xLabel}
        </text>
        <text x={10} y={PAD} fontSize="10" fill="currentColor" opacity={0.6}>
          {plot.yLabel}
        </text>
      </svg>
      <div className="flex flex-wrap gap-3 mt-3">
        {plot.series.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {s.label}
          </div>
        ))}
      </div>
      <p className="sr-only">
        {xs.length} x-values, range {xMin.toFixed(2)} to {xMax.toFixed(2)}, y range {yMin.toFixed(2)} to {yMax.toFixed(2)}, {ys.length} y-values.
      </p>
    </div>
  );
}

// Calculator icon kept to silence unused warning in case of future header use
void Calculator;
