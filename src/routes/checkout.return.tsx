import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 mx-auto text-primary" strokeWidth={1.5} />
        <h1 className="font-serif text-3xl text-foreground">You're in.</h1>
        <p className="text-muted-foreground">
          {session_id
            ? "Your StudyFlow Pro trial is active. You won't be charged for 7 days."
            : "Subscription confirmed."}
        </p>
        <Button asChild size="lg">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
