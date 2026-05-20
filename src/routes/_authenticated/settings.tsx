import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useT } from "@/i18n/I18nProvider";
import { LANGUAGES, type Lang } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UpgradeProDialog } from "@/components/UpgradeProDialog";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { listMyInvites, addInvite, removeInvite } from "@/lib/plan-invites.functions";
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
  const { data: entitlements } = useEntitlements();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePriceId, setUpgradePriceId] = useState<string>("pro_monthly");
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

  const openUpgrade = (priceId: string) => {
    setUpgradePriceId(priceId);
    setUpgradeOpen(true);
  };

  const isMax = entitlements?.isMax === true;
  const tier = entitlements?.tier ?? "free";

  const planLabel = isMax
    ? "Max"
    : !subscription
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
              {(isActive || isMax) && <Badge variant="secondary">Active</Badge>}
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
            {!isActive && !isMax && !loading && (
              <p className="text-sm text-muted-foreground mt-2">
                3 documents/month · Up to 10 flashcards per doc · No AI tutor
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {isActive && (
              <Button variant="outline" onClick={handleManage} disabled={portalLoading}>
                {portalLoading ? "Opening…" : "Manage / Cancel"}
              </Button>
            )}
            {tier === "free" && (
              <>
                <Button variant="outline" onClick={() => openUpgrade("pro_monthly")}>
                  Upgrade to Pro · $12.99/mo
                </Button>
                <Button onClick={() => openUpgrade("max_monthly")}>
                  Upgrade to Max · $29.99/mo
                </Button>
              </>
            )}
            {tier === "pro" && (
              <Button onClick={() => openUpgrade("max_monthly")}>
                Upgrade to Max · $29.99/mo
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* MAX-only: invite up to 2 people */}
      {isMax && <MaxInvitesSection />}

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

      <UpgradeProDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} priceId={upgradePriceId} />
    </div>
  );
}

type Invite = { id: string; invitee_email: string; created_at: string };

function MaxInvitesSection() {
  const qc = useQueryClient();
  const fetchInvites = useServerFn(listMyInvites);
  const addFn = useServerFn(addInvite);
  const removeFn = useServerFn(removeInvite);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["plan-invites"],
    queryFn: () => fetchInvites() as Promise<{ invites: Invite[]; limit: number }>,
  });

  const invites = data?.invites ?? [];
  const limit = data?.limit ?? 2;
  const remaining = Math.max(0, limit - invites.length);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await addFn({ data: { email: email.trim() } });
      setEmail("");
      toast.success("Invitación añadida");
      qc.invalidateQueries({ queryKey: ["plan-invites"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al invitar");
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (id: string) => {
    try {
      await removeFn({ data: { id } });
      toast.success("Invitación eliminada");
      qc.invalidateQueries({ queryKey: ["plan-invites"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  return (
    <section className="border border-border rounded-lg p-6 mb-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Plan Max · Invitaciones
      </p>
      <h2 className="font-serif text-xl text-foreground mb-1">Comparte tu plan Max</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Invita hasta {limit} personas para que disfruten todas las funciones de Max usando sus
        propias cuentas. Quedan {remaining} {remaining === 1 ? "invitación" : "invitaciones"}.
      </p>

      <form onSubmit={onAdd} className="flex gap-2 mb-4">
        <Input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={remaining === 0 || submitting}
          required
        />
        <Button type="submit" disabled={remaining === 0 || submitting}>
          {submitting ? "Enviando…" : "Invitar"}
        </Button>
      </form>

      {invites.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no has invitado a nadie.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {invites.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-foreground">{inv.invitee_email}</p>
                <p className="text-xs text-muted-foreground">
                  Agregado el {new Date(inv.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(inv.id)}
                aria-label="Eliminar invitación"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        La persona invitada debe registrarse con el correo invitado. Acceso Max activo mientras tu
        suscripción esté activa.
      </p>
    </section>
  );
}
