import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

const FREE_LIMIT = 3;

interface SubscriptionState {
  loading: boolean;
  isSubscribed: boolean;
  entryCount: number;
  canCreate: boolean;
  remaining: number;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [entryCount, setEntryCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [subRes, countRes] = await Promise.all([
        supabase
          .from("user_subscriptions")
          .select("active")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ]);

      setIsSubscribed(subRes.data?.active === true);
      setEntryCount(countRes.count ?? 0);
      setLoading(false);
    };

    load();
  }, [user]);

  const canCreate = isSubscribed || entryCount < FREE_LIMIT;
  const remaining = Math.max(0, FREE_LIMIT - entryCount);

  return { loading, isSubscribed, entryCount, canCreate, remaining };
}

export async function activateStubSubscription(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");

  const { error } = await supabase
    .from("user_subscriptions")
    .insert({ user_id: user.id, active: true });

  if (error && error.code !== "23505") throw error; // ignore duplicate
}
