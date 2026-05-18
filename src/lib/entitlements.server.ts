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
 */
export async function getUserTier(userId: string): Promise<Tier> {
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
