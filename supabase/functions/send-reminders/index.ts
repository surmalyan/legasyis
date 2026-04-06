import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();

    // Find users inactive for 3+ days
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    // Find users inactive for 7+ days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    // Find users inactive for 30+ days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get inactive users with their email from auth
    const { data: inactiveProfiles, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, last_active_at")
      .lt("last_active_at", threeDaysAgo)
      .order("last_active_at", { ascending: true });

    if (error) {
      console.error("Error fetching inactive profiles:", error);
      throw error;
    }

    const results = {
      total_inactive: inactiveProfiles?.length || 0,
      categories: {
        mild: 0,    // 3-7 days
        moderate: 0, // 7-30 days
        severe: 0,   // 30+ days
      },
      notified: [] as string[],
    };

    for (const profile of inactiveProfiles || []) {
      const lastActive = new Date(profile.last_active_at);
      const daysSince = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSince >= 30) {
        results.categories.severe++;
      } else if (daysSince >= 7) {
        results.categories.moderate++;
      } else {
        results.categories.mild++;
      }

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
      if (!userData?.user?.email) continue;

      const email = userData.user.email;
      const name = profile.full_name || email.split("@")[0];

      // Determine reminder type based on inactivity
      let subject: string;
      let body: string;

      if (daysSince >= 30) {
        subject = `${name}, ваши воспоминания ждут вас 💭`;
        body = `Здравствуйте, ${name}!\n\nВы не заходили в Legacy уже ${daysSince} дней. Каждый день — это часть вашей уникальной истории, которую стоит сохранить.\n\nВернитесь и расскажите о чём-то важном. Всего один ответ — и ваша книга жизни станет богаче.\n\nС теплом,\nКоманда Legacy`;
      } else if (daysSince >= 7) {
        subject = `${name}, расскажите ещё одну историю ✨`;
        body = `Здравствуйте, ${name}!\n\nПрошло ${daysSince} дней с вашего последнего визита. У нас есть новые интересные вопросы, которые помогут вам вспомнить важные моменты жизни.\n\nЗайдите и ответьте хотя бы на один вопрос — это займёт всего пару минут.\n\nС теплом,\nКоманда Legacy`;
      } else {
        subject = `${name}, новый вопрос дня ждёт вас 📖`;
        body = `Здравствуйте, ${name}!\n\nМы подготовили для вас новый вопрос. Ваши ответы — это бесценные сокровища для ваших потомков.\n\nЗайдите и поделитесь своей историей!\n\nС теплом,\nКоманда Legacy`;
      }

      // Log the reminder (actual email sending requires email infra)
      console.log(`Reminder for ${email} (${daysSince} days inactive): ${subject}`);
      results.notified.push(email);
    }

    console.log("Reminder results:", JSON.stringify(results));

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-reminders error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
