import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEntitlements } from "@/lib/entitlements.functions";
import { useAuth } from "@/hooks/use-auth";

export type Entitlements = {
  tier: "free" | "pro" | "max";
  isPro: boolean;
  isMax: boolean;
  docsUsed: number;
  docsLimit: number | null;
  flashcardLimit: number;
  tutorAllowed: boolean;
  mindMapAllowed: boolean;
};

export function useEntitlements() {
  const { user } = useAuth();
  const fetchEntitlements = useServerFn(getEntitlements);
  return useQuery<Entitlements>({
    queryKey: ["entitlements", user?.id],
    queryFn: () => fetchEntitlements() as Promise<Entitlements>,
    enabled: !!user,
    staleTime: 60_000,
  });
}
