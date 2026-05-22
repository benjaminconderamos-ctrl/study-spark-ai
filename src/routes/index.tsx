import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/brand/Logo";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UpgradeProDialog } from "@/components/UpgradeProDialog";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/i18n/I18nProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyFlow AI — A quieter way to study" },
      { name: "description", content: "Upload PDFs. Get AI summaries, flashcards, quizzes, and a tutor that knows your sources." },
      { property: "og:title", content: "StudyFlow AI" },
      { property: "og:description", content: "Upload PDFs. Get AI summaries, flashcards, quizzes, and a tutor that knows your sources." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useT();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePriceId, setUpgradePriceId] = useState<string>("pro_monthly");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const openUpgrade = (plan: "pro" | "max") => {
    const priceId =
      plan === "pro"
        ? billing === "monthly" ? "pro_monthly" : "pro_annual"
        : billing === "monthly" ? "max_monthly" : "max_annual";
    if (user) {
      setUpgradePriceId(priceId);
      setUpgradeOpen(true);
    } else {
      navigate({ to: "/signup" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PaymentTestModeBanner />
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              {t("landing.nav.price")}
            </Button>
            <LanguageToggle />
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">{t("landing.nav.signin")}</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">{t("landing.nav.getStarted")}</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7 space-y-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("landing.hero.kicker")}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl text-foreground leading-[0.95]">
              {t("landing.hero.title1")} <br />{t("landing.hero.title2")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              {t("landing.hero.desc")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link to="/signup">
                  {t("landing.hero.start")} <ArrowUpRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">{t("landing.hero.haveAccount")}</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              { kpi: "01", label: t("landing.tile.01") },
              { kpi: "02", label: t("landing.tile.02") },
              { kpi: "03", label: t("landing.tile.03") },
              { kpi: "04", label: t("landing.tile.04") },
            ].map((tile) => (
              <div key={tile.kpi} className="border border-border bg-card rounded-lg p-6 aspect-square flex flex-col justify-between">
                <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">{tile.kpi}</p>
                <p className="font-serif text-2xl text-foreground">{tile.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {t("landing.pricing.kicker")}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              {t("landing.pricing.title")}
            </h2>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="inline-flex items-center border border-border rounded-full p-1 bg-card">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  billing === "monthly"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("landing.pricing.monthly")}
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  billing === "annual"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("landing.pricing.annual")}
              </button>
            </div>
            {billing === "annual" && (
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {t("landing.pricing.save")}
              </span>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col">
              <div className="mb-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  {t("landing.pricing.free")}
                </p>
                <p className="font-serif text-5xl text-foreground">$0</p>
                <p className="text-sm text-muted-foreground mt-1">{t("landing.pricing.free.sub")}</p>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  t("landing.pricing.free.f1"),
                  t("landing.pricing.free.f2"),
                  t("landing.pricing.free.f3"),
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-ink shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="mt-8 w-full" asChild>
                <Link to="/signup">{t("landing.pricing.free.cta")}</Link>
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                  {t("landing.pricing.pro.popular")}
                </span>
              </div>

              <div className="mb-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  {t("landing.pricing.pro")}
                </p>
                <div className="flex flex-col">
                  <p className="font-serif text-5xl text-foreground">
                    {billing === "monthly" ? "$12.99" : "$99.99"}
                  </p>
                  <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">
                    {billing === "monthly" ? t("landing.pricing.perMonth") : t("landing.pricing.perYear")}
                  </p>
                  {billing === "annual" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("landing.pricing.monthlyEquiv").replace("{amount}", "8.33")}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t("landing.pricing.pro.sub")}</p>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  t("landing.pricing.pro.f1"),
                  t("landing.pricing.pro.f2"),
                  t("landing.pricing.pro.f3"),
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-ink shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="mt-8 w-full" onClick={() => openUpgrade("pro")}>
                {t("landing.pricing.pro.cta")}
              </Button>
            </div>

            {/* Max Plan */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                  {t("landing.pricing.max.badge")}
                </span>
              </div>

              <div className="mb-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  {t("landing.pricing.max")}
                </p>
                <div className="flex flex-col">
                  <p className="font-serif text-5xl text-foreground">
                    {billing === "monthly" ? "$29.99" : "$191.99"}
                  </p>
                  <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">
                    {billing === "monthly" ? t("landing.pricing.perMonth") : t("landing.pricing.perYear")}
                  </p>
                  {billing === "annual" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("landing.pricing.monthlyEquiv").replace("{amount}", "16.00")}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{t("landing.pricing.max.sub")}</p>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  t("landing.pricing.max.f1"),
                  t("landing.pricing.max.f2"),
                  t("landing.pricing.max.f3"),
                  t("landing.pricing.max.f4"),
                  t("landing.pricing.max.f5"),
                  t("landing.pricing.max.f6"),
                  t("landing.pricing.max.f7"),
                  t("landing.pricing.max.f8"),
                  t("landing.pricing.max.f9"),
                  t("landing.pricing.max.f10"),
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-ink shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="mt-8 w-full" onClick={() => openUpgrade("max")}>
                {t("landing.pricing.max.cta")}
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* Math Made Visual */}
      <section id="math" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center mb-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              {t("landing.math.kicker")}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              {t("landing.math.title")}
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-muted-foreground">
              {t("landing.math.desc")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Problem + solution */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                {t("landing.math.problemLabel")}
              </p>
              <p className="font-serif text-2xl text-foreground mb-8">
                {t("landing.math.problem")}
              </p>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                {t("landing.math.solutionLabel")}
              </p>
              <ol className="space-y-3 text-sm text-foreground">
                {[
                  t("landing.math.step1"),
                  t("landing.math.step2"),
                  t("landing.math.step3"),
                  t("landing.math.step4"),
                ].map((s) => (
                  <li key={s} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent-ink shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Graph */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                {t("landing.math.graphLabel")}
              </p>
              <div className="flex-1 min-h-[280px] rounded-md bg-background border border-border p-4 flex items-center justify-center">
                <svg viewBox="0 0 320 240" className="w-full h-full" aria-label="Graph of f(x) = x^3 - 3x^2 + 2">
                  {/* grid */}
                  <g stroke="hsl(var(--border))" strokeWidth="0.5">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="240" />
                    ))}
                    {Array.from({ length: 7 }).map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 40} x2="320" y2={i * 40} />
                    ))}
                  </g>
                  {/* axes */}
                  <line x1="0" y1="120" x2="320" y2="120" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  <line x1="160" y1="0" x2="160" y2="240" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  {/* curve: f(x) = x^3 - 3x^2 + 2, mapped x in [-1.5, 3.5] -> [0, 320], y in [-4, 4] -> [240, 0] */}
                  <path
                    d={(() => {
                      const pts: string[] = [];
                      for (let i = 0; i <= 100; i++) {
                        const x = -1.5 + (i / 100) * 5;
                        const y = x * x * x - 3 * x * x + 2;
                        const sx = ((x + 1.5) / 5) * 320;
                        const sy = 120 - (y / 4) * 120;
                        if (sy < -20 || sy > 260) continue;
                        pts.push(`${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`);
                      }
                      return pts.join(" ");
                    })()}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                  />
                  {/* extrema points */}
                  <circle cx={((0 + 1.5) / 5) * 320} cy={120 - (2 / 4) * 120} r="4" fill="hsl(var(--primary))" />
                  <circle cx={((2 + 1.5) / 5) * 320} cy={120 - (-2 / 4) * 120} r="4" fill="hsl(var(--primary))" />
                </svg>
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground text-center">
                {t("landing.math.graphCaption")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-24 lg:py-32">
          <h3 className="font-serif text-3xl text-foreground text-center mb-8">
            {t("landing.faq.title")}
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: t("landing.faq.q1"), a: t("landing.faq.a1") },
              { q: t("landing.faq.q2"), a: t("landing.faq.a2") },
              { q: t("landing.faq.q3"), a: t("landing.faq.a3") },
              { q: t("landing.faq.q4"), a: t("landing.faq.a4") },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>


      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>© StudyFlow AI</span>
          <span>{t("landing.footer.built")}</span>
        </div>
      </footer>
      <UpgradeProDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} priceId={upgradePriceId} />
    </div>
  );
}
