import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeProDialog({ open, onOpenChange }: Props) {
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`
      : "/checkout/return?session_id={CHECKOUT_SESSION_ID}";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade to StudyFlow Pro</DialogTitle>
          <DialogDescription>
            7-day free trial · $12.99/month after · Cancel anytime from Settings
          </DialogDescription>
        </DialogHeader>
        {open && <StripeEmbeddedCheckout priceId="pro_monthly" returnUrl={returnUrl} />}
      </DialogContent>
    </Dialog>
  );
}
