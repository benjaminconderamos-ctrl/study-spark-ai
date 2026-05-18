import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { ArrowUpRight } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7 space-y-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              AI-powered study workspace
            </p>
            <h1 className="font-serif text-5xl md:text-7xl text-foreground leading-[0.95]">
              Read less. <br />Understand more.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Drop in a PDF. StudyFlow gives you a clean summary, a deck of flashcards,
              a quiz to test yourself, and a tutor that answers from your own sources.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link to="/signup">
                  Start studying <ArrowUpRight className="h-4 w-4 ml-1" strokeWidth={1.5} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I have an account</Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {[
              { kpi: "01", label: "Upload PDF" },
              { kpi: "02", label: "Auto-summarize" },
              { kpi: "03", label: "Flashcards" },
              { kpi: "04", label: "Tutor chat" },
            ].map((t) => (
              <div key={t.kpi} className="border border-border bg-card rounded-lg p-6 aspect-square flex flex-col justify-between">
                <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">{t.kpi}</p>
                <p className="font-serif text-2xl text-foreground">{t.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Pricing Section */}
      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center mb-16">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Pricing
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground">
              Start free. Upgrade when you need more.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col">
              <div className="mb-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Free
                </p>
                <p className="font-serif text-5xl text-foreground">$0</p>
                <p className="text-sm text-muted-foreground mt-1">Forever free</p>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  "3 documents / month",
                  "Up to 10 flashcards per doc",
                  "Basic summary",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-ink shrink-0" />
                    {feature}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  No AI tutor
                </li>
              </ul>

              <Button variant="outline" className="mt-8 w-full" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="border border-border bg-card rounded-lg p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  Most popular
                </span>
              </div>

              <div className="mb-8">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  Pro
                </p>
                <div className="flex flex-col">
                  <p className="font-serif text-5xl text-foreground">$12.99</p>
                  <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">USD / month</p>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
              </div>

              <ul className="space-y-4 flex-1">
                {[
                  "Unlimited documents",
                  "Unlimited flashcards & quizzes",
                  "AI tutor included",
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-ink shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button className="mt-8 w-full" asChild>
                <Link to="/signup">Start Pro trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>© StudyFlow AI</span>
          <span>Built by Benjamin CR</span>
        </div>
      </footer>
    </div>
  );
}
