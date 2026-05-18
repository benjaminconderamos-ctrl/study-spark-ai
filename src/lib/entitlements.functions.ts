import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  FREE_MONTHLY_DOCS,
  isProUser,
  monthlyDocCount,
} from "./entitlements.server";

export const getEntitlements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [isPro, docsUsed] = await Promise.all([isProUser(userId), monthlyDocCount(userId)]);
    return {
      isPro,
      docsUsed,
      docsLimit: isPro ? null : FREE_MONTHLY_DOCS,
      flashcardLimit: isPro ? 30 : 10,
      tutorAllowed: isPro,
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
