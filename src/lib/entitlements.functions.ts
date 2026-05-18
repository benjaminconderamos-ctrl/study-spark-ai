import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  FREE_MONTHLY_DOCS,
  getUserTier,
  isProUser,
  monthlyDocCount,
} from "./entitlements.server";

export const getEntitlements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [tier, docsUsed] = await Promise.all([getUserTier(userId), monthlyDocCount(userId)]);
    const isPro = tier === "pro" || tier === "max";
    const isMax = tier === "max";
    return {
      tier,
      isPro,
      isMax,
      docsUsed,
      docsLimit: isPro ? null : FREE_MONTHLY_DOCS,
      flashcardLimit: isPro ? 30 : 10,
      tutorAllowed: isPro,
      mindMapAllowed: isMax,
    };
  });

export const ensureCanUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    if (await isProUser(userId)) return { ok: true as const };
    const used = await monthlyDocCount(userId);
    if (used >= FREE_MONTHLY_DOCS) {
      throw new Error(
        `Free plan limit reached: ${FREE_MONTHLY_DOCS} documents per month. Upgrade to Pro for unlimited uploads.`,
      );
    }
    return { ok: true as const };
  });
