"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { DailyEarning } from "./types";

export function useDailyEarnings() {
  const router = useRouter();
  const [earnings, setEarnings] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  const load = useCallback(async function load() {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.push("/login");
      return;
    }

    const { data, error: loadError } = await supabase
      .from("daily_earnings")
      .select("*")
      .order("earning_date", { ascending: false });
    if (loadError) setError(loadError.message);
    else setEarnings((data || []) as DailyEarning[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    async function loadInitialEarnings() {
      await load();
    }

    void loadInitialEarnings();
  }, [load]);

  return { earnings, loading, error, reload: load };
}
