"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoDeals } from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { Deal } from "./types";

export function useDeals(includeArchived = false) {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>(
    isSupabaseConfigured
      ? []
      : demoDeals.filter((deal) => (includeArchived ? deal.archived_at : !deal.archived_at)),
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  async function load() {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.push("/login");
      return;
    }

    let query = supabase.from("deals").select("*").order("created_at", { ascending: false });
    query = includeArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

    const { data, error: loadError } = await query;
    if (loadError) setError(loadError.message);
    else setDeals((data || []) as Deal[]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  return { deals, loading, error, reload: load };
}
