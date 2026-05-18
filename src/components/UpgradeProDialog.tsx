import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceId?: string;
}

const PLAN_COPY: Record<string, { title: string; description: string }> = {
  pro_monthly: {
    title: "Upgrade to StudyFlow Pro",
    description: "7-day free trial · $12.99/month after · Cancel anytime",
  },
  pro_annual: {
    title: "Upgrade to StudyFlow Pro (Annual)",
    description: "7-day free trial · $99.99/year after · Cancel anytime",
  },
  max_monthly: {
    title: "Upgrade to StudyFlow Max",
    description: "7-day free trial · $29.99/month after · Cancel anytime",
  },
  max_annual: {
    title: "Upgrade to StudyFlow Max (Annual)",
    description: "7-day free trial · $191.99/year after · Cancel anytime",
  },
};

export function UpgradeProDialog({ open, onOpenChange, priceId = "pro_monthly" }: Props) {
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
      : "/checkout/return?session_id={CHECKOUT_SESSION_ID}";

  const copy = PLAN_COPY[priceId] ?? PLAN_COPY.pro_monthly;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {open && <StripeEmbeddedCheckout priceId={priceId} returnUrl={returnUrl} />}
      </DialogContent>
    </Dialog>
  );
}
