import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const FREE_MONTHLY_DOCS = 3;
export const FREE_MAX_FLASHCARDS = 10;

export type Tier = "free" | "pro" | "max";

const MAX_PRICE_IDS = new Set(["max_monthly", "max_annual"]);
const PRO_PRICE_IDS = new Set(["pro_monthly", "pro_annual"]);

function isRowActive(row: { status: string; current_period_end: string | null }): boolean {
  const now = Date.now();
  const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
  if (["active", "trialing", "past_due"].includes(row.status)) {
    return end === null || end > now;
  }
  if (row.status === "canceled" && end !== null) return end > now;
  return false;
}

/**
 * Returns the user's effective tier based on their latest active subscription row.
 * Max outranks Pro outranks Free. Server-side only — never trust a client claim.
 *
 * Also grants MAX to users who were invited by an active MAX subscriber
 * (see `plan_invites`). The `inviteeEmail` is optional — when provided we
 * use it; otherwise we look it up from auth.users.
 */
export async function getUserTier(userId: string, inviteeEmail?: string): Promise<Tier> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status,current_period_end,price_id")
    .eq("user_id", userId);

  let tier: Tier = "free";
  if (data && data.length > 0) {
    for (const row of data as Array<{ status: string; current_period_end: string | null; price_id: string }>) {
      if (!isRowActive(row)) continue;
      if (MAX_PRICE_IDS.has(row.price_id)) return "max";
      if (PRO_PRICE_IDS.has(row.price_id)) tier = "pro";
    }
  }

  // If not already MAX via own subscription, check guest invites.
  let email = inviteeEmail;
  if (!email) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(userId);
    email = u?.user?.email ?? undefined;
  }
  if (email) {
    const normalized = email.trim().toLowerCase();
    const { data: invites } = await supabaseAdmin
      .from("plan_invites")
      .select("owner_user_id")
      .ilike("invitee_email", normalized);
    if (invites && invites.length > 0) {
      for (const inv of invites as Array<{ owner_user_id: string }>) {
        const ownerTier = await getOwnTier(inv.owner_user_id);
        if (ownerTier === "max") return "max";
      }
    }
  }

  return tier;
}

// Internal: tier from the user's own subscriptions only (no invite lookup).
async function getOwnTier(userId: string): Promise<Tier> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status,current_period_end,price_id")
    .eq("user_id", userId);
  if (!data || data.length === 0) return "free";
  let tier: Tier = "free";
  for (const row of data as Array<{ status: string; current_period_end: string | null; price_id: string }>) {
    if (!isRowActive(row)) continue;
    if (MAX_PRICE_IDS.has(row.price_id)) return "max";
    if (PRO_PRICE_IDS.has(row.price_id)) tier = "pro";
  }
  return tier;
}

export async function isProUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "pro" || tier === "max";
}

export async function isMaxUser(userId: string): Promise<boolean> {
  return (await getUserTier(userId)) === "max";
}

export async function monthlyDocCount(userId: string): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", start.toISOString());
  return count ?? 0;
}
