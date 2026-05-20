import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — StudyFlow AI" },
      { name: "description", content: "Sign in to your StudyFlow AI study workspace." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setNeedsConfirmation(false);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        setNeedsConfirmation(true);
        toast.error("Tu correo aún no está confirmado. Reenvía el enlace y vuelve a intentarlo.");
        return;
      }
      toast.error(error.message);
      return;
    }
    router.navigate({ to: "/dashboard" });
  };

  const onResendConfirmation = async () => {
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Escribe un correo válido para reenviar la confirmación.");
      return;
    }

    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: {
        emailRedirectTo: window.location.origin + "/auth/confirm",
      },
    });
    setResending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Te reenviamos el correo de confirmación.");
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between border-r border-border p-12 bg-sidebar">
        <Logo to="/" />
        <div className="space-y-6 max-w-md">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            A quieter way to study
          </p>
          <p className="font-serif text-4xl text-foreground leading-tight">
            Upload your reading. Get summaries, flashcards, and a tutor that knows your sources.
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">© StudyFlow AI</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="lg:hidden mb-10">
          <Logo to="/" />
        </div>
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Sign in</p>
            <h1 className="font-serif text-4xl text-foreground">Welcome back</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
            {needsConfirmation ? (
              <Button type="button" variant="outline" className="w-full" onClick={onResendConfirmation} disabled={resending}>
                {resending ? "Reenviando confirmación..." : "Reenviar correo de confirmación"}
              </Button>
            ) : null}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.2em]">
              <span className="bg-background px-3 font-mono text-muted-foreground">or</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
            Continue with Google
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            No account?{" "}
            <Link to="/signup" className="text-foreground underline underline-offset-4">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
