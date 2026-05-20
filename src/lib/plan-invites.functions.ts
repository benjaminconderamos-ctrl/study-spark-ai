import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MAX_INVITES = 2;

const EmailInput = z.object({
  email: z.string().email().max(255),
});

const IdInput = z.object({ id: z.string().uuid() });

async function ensureOwnerIsMax(userId: string) {
  const { isMaxUser } = await import("./entitlements.server");
  if (!(await isMaxUser(userId))) {
    throw new Error("Solo los usuarios con plan Max pueden invitar.");
  }
}

export const listMyInvites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("plan_invites")
      .select("id, invitee_email, created_at")
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { invites: data ?? [], limit: MAX_INVITES };
  });

export const addInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureOwnerIsMax(userId);

    const email = data.email.trim().toLowerCase();

    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email && user.email.toLowerCase() === email) {
      throw new Error("No puedes invitarte a ti mismo.");
    }

    const { count } = await supabase
      .from("plan_invites")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", userId);
    if ((count ?? 0) >= MAX_INVITES) {
      throw new Error(`Límite alcanzado: máximo ${MAX_INVITES} invitaciones.`);
    }

    const { error } = await supabase
      .from("plan_invites")
      .insert({ owner_user_id: userId, invitee_email: email });
    if (error) {
      if (error.code === "23505") throw new Error("Ese correo ya fue invitado.");
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const removeInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("plan_invites")
      .delete()
      .eq("id", data.id)
      .eq("owner_user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * Server-only helper used by entitlements: checks whether the given email has
 * an active invite from a MAX subscriber. Uses the admin client to bypass RLS.
 */
export async function emailHasActiveMaxInvite(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const { data: invites } = await supabaseAdmin
    .from("plan_invites")
    .select("owner_user_id")
    .ilike("invitee_email", normalized);
  if (!invites || invites.length === 0) return false;

  const { getUserTier } = await import("./entitlements.server");
  for (const inv of invites) {
    const tier = await getUserTier(inv.owner_user_id as string);
    if (tier === "max") return true;
  }
  return false;
}
