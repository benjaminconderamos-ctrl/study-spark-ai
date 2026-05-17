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

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — StudyFlow AI" },
      { name: "description", content: "Create your StudyFlow AI account and start studying smarter." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  displayName: z.string().trim().min(1, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { display_name: parsed.data.displayName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your inbox to verify your email.");
    router.navigate({ to: "/login" });
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
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Start free</p>
          <p className="font-serif text-4xl text-foreground leading-tight">
            Turn any PDF into a study session in under a minute.
          </p>
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">© StudyFlow AI</p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="lg:hidden mb-10"><Logo to="/" /></div>
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Create account</p>
            <h1 className="font-serif text-4xl text-foreground">Get started</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" type="text" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
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
            Already have an account?{" "}
            <Link to="/login" className="text-foreground underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
