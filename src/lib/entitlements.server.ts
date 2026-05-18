import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const FREE_MONTHLY_DOCS = 3;
export const FREE_MAX_FLASHCARDS = 10;

/**
 * Returns true if the user has an active paid subscription (incl. trial,
 * past_due, and canceled-but-still-in-period) in either environment.
 * Server-side only — never trust a client claim.
 */
export async function isProUser(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("status,current_period_end")
    .eq("user_id", userId);
  if (!data) return false;
  const now = Date.now();
  return data.some((row: any) => {
    const end = row.current_period_end ? new Date(row.current_period_end).getTime() : null;
    if (["active", "trialing", "past_due"].includes(row.status)) {
      return end === null || end > now;
    }
    if (row.status === "canceled" && end !== null) return end > now;
    return false;
  });
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
