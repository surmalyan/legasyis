import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface PreservedStatus {
  loading: boolean;
  isPreserved: boolean;
  reason: "milestone" | "legacy_tier" | null;
  preservedAt: string | null;
  legacyTier: boolean;
  digitalHeirEmail: string | null;
  entryCount: number;
  refresh: () => Promise<void>;
}

export const PRESERVED_THRESHOLD = 50;

export function usePreservedStatus(): PreservedStatus {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPreserved, setIsPreserved] = useState(false);
  const [reason, setReason] = useState<"milestone" | "legacy_tier" | null>(null);
  const [preservedAt, setPreservedAt] = useState<string | null>(null);
  const [legacyTier, setLegacyTier] = useState(false);
  const [heir, setHeir] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const [profileRes, countRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("is_preserved, preserved_reason, preserved_at, legacy_tier, digital_heir_email")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    const p = profileRes.data as any;
    setIsPreserved(!!p?.is_preserved);
    setReason((p?.preserved_reason as any) || null);
    setPreservedAt(p?.preserved_at || null);
    setLegacyTier(!!p?.legacy_tier);
    setHeir(p?.digital_heir_email || null);
    setEntryCount(countRes.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return {
    loading,
    isPreserved,
    reason,
    preservedAt,
    legacyTier,
    digitalHeirEmail: heir,
    entryCount,
    refresh: load,
  };
}