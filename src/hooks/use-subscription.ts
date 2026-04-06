import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const FREE_ENTRY_LIMIT = 7;
const TRIAL_DAYS = 7;

interface SubscriptionState {
  loading: boolean;
  isSubscribed: boolean;
  entryCount: number;
  canCreate: boolean;
  remaining: number;
  trialDaysLeft: number;
  isTrial: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [subRes, countRes, roleRes] = await Promise.all([
        supabase
          .from("user_subscriptions")
          .select("active")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle(),
      ]);

      const admin = !!roleRes.data;
      setIsAdmin(admin);
      setIsSubscribed(subRes.data?.active === true || admin);
      setEntryCount(countRes.count ?? 0);

      // Calculate trial days from account creation
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = Math.max(0, TRIAL_DAYS - daysSinceCreation);
      setTrialDaysLeft(daysLeft);

      setLoading(false);
    };

    load();
  }, [user]);

  const isTrial = !isSubscribed && !isAdmin && trialDaysLeft > 0;
  const withinEntryLimit = entryCount < FREE_ENTRY_LIMIT;
  const canCreate = isSubscribed || isAdmin || (isTrial && withinEntryLimit) || (!isTrial && withinEntryLimit);
  const remaining = isAdmin ? Infinity : Math.max(0, FREE_ENTRY_LIMIT - entryCount);

  return { loading, isSubscribed, entryCount, canCreate, remaining, trialDaysLeft, isTrial };
}

export async function activateStubSubscription(): Promise<void> {
  // Subscription records are now managed server-side only.
  // This stub is kept for UI flow compatibility until payment integration is added.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
}
