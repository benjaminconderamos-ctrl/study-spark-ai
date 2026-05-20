import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/confirm")({
  component: AuthConfirmPage,
});

type ConfirmState = "loading" | "success" | "error";

function AuthConfirmPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<ConfirmState>("loading");
  const [message, setMessage] = useState("Confirmando tu correo...");

  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        tokenHash: null,
        type: null,
        code: null,
      };
    }

    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);

    return {
      tokenHash: url.searchParams.get("token_hash") ?? hashParams.get("token_hash"),
      type: url.searchParams.get("type") ?? hashParams.get("type"),
      code: url.searchParams.get("code") ?? hashParams.get("code"),
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const confirmEmail = async () => {
      try {
        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;

          if (!cancelled) {
            setState("success");
            setMessage("Tu correo fue confirmado. Redirigiendo...");
            window.history.replaceState({}, document.title, "/auth/confirm");
            window.setTimeout(() => navigate({ to: "/dashboard" }), 800);
          }
          return;
        }

        if (params.tokenHash && params.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: params.type as "signup" | "email" | "recovery" | "invite" | "email_change" | "magiclink",
          });
          if (error) throw error;

          if (!cancelled) {
            setState("success");
            setMessage("Tu correo fue confirmado. Ya puedes entrar.");
            window.history.replaceState({}, document.title, "/auth/confirm");
            window.setTimeout(() => navigate({ to: "/dashboard" }), 800);
          }
          return;
        }

        throw new Error("No encontramos un enlace válido de confirmación.");
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "No pudimos confirmar tu correo.");
      }
    };

    void confirmEmail();

    return () => {
      cancelled = true;
    };
  }, [navigate, params.code, params.tokenHash, params.type]);

  return (
    <div className="min-h-screen bg-background px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md border border-border bg-card rounded-lg p-8 text-center space-y-6">
        <div className="flex justify-center">
          <Logo to="/" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Verificación de correo
          </p>
          <h1 className="font-serif text-3xl text-foreground">
            {state === "success" ? "Correo confirmado" : state === "error" ? "No se pudo confirmar" : "Confirmando..."}
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-center gap-3">
          {state === "error" ? (
            <>
              <Button variant="outline" asChild>
                <a href="/signup">Crear cuenta otra vez</a>
              </Button>
              <Button asChild>
                <a href="/login">Ir a iniciar sesión</a>
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}