import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useT } from "@/i18n/I18nProvider";
import { LANGUAGES, type Lang } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradeProDialog } from "@/components/UpgradeProDialog";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { t, lang, setLang } = useT();
  const { subscription, isActive, loading } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const openPortal = useServerFn(createPortalSession);

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const url = await openPortal({
        data: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.href,
        },
      });
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const planLabel = !subscription
    ? "Free"
    : subscription.status === "trialing"
    ? "Pro · Trial"
    : subscription.cancel_at_period_end
    ? "Pro · Canceling"
    : subscription.status === "past_due"
    ? "Pro · Past due"
    : isActive
    ? "Pro"
    : "Free";

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="px-4 sm:px-6 md:px-12 py-6 sm:py-10 max-w-3xl mx-auto">
      <PageHeader eyebrow={t("settings.eyebrow")} title={t("settings.title")} />

      {/* Plan section */}
      <section className="border border-border rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Plan
            </p>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-foreground">{planLabel}</h2>
              {isActive && <Badge variant="secondary">Active</Badge>}
            </div>
            {periodEnd && (
              <p className="text-sm text-muted-foreground mt-2">
                {subscription?.cancel_at_period_end
                  ? `Access ends on ${periodEnd}`
                  : subscription?.status === "trialing"
                  ? `Trial ends on ${periodEnd}`
                  : `Renews on ${periodEnd}`}
              </p>
            )}
            {!isActive && !loading && (
              <p className="text-sm text-muted-foreground mt-2">
                3 documents/month · Up to 10 flashcards per doc · No AI tutor
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isActive ? (
              <Button variant="outline" onClick={handleManage} disabled={portalLoading}>
                {portalLoading ? "Opening…" : "Manage / Cancel"}
              </Button>
            ) : (
              <Button onClick={() => setUpgradeOpen(true)}>Upgrade to Pro</Button>
            )}
          </div>
        </div>
      </section>

      <dl className="divide-y divide-border border-y border-border">
        <div className="flex justify-between py-4">
          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("settings.email")}</dt>
          <dd className="text-sm text-foreground">{user?.email}</dd>
        </div>
        <div className="flex justify-between py-4">
          <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("settings.userId")}</dt>
          <dd className="text-xs font-mono text-muted-foreground">{user?.id}</dd>
        </div>
        <div className="flex items-center justify-between py-4 gap-4">
          <div>
            <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{t("settings.language")}</dt>
            <p className="text-xs text-muted-foreground mt-1">{t("settings.languageHint")}</p>
          </div>
          <dd>
            <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </dd>
        </div>
      </dl>

      <UpgradeProDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
