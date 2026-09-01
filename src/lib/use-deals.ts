"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoDeals } from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { Deal } from "./types";

type DealScope = boolean | "active" | "completed" | "all" | "trash";

function filterByScope(deals: Deal[], scope: DealScope) {
  if (scope === "trash") return deals.filter((deal) => Boolean(deal.deleted_at));
  const visibleDeals = deals.filter((deal) => !deal.deleted_at);
  if (scope === "all") return visibleDeals;
  if (scope === true || scope === "completed") {
    return visibleDeals.filter((deal) => Boolean(deal.completed || deal.archived_at));
  }
  return visibleDeals.filter((deal) => !deal.completed && !deal.archived_at);
}

export function useDeals(scope: DealScope = "active") {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>(
    isSupabaseConfigured ? [] : filterByScope(demoDeals, scope),
  );
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
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setDeals(filterByScope((data || []) as Deal[], scope));
    setLoading(false);
  }, [router, scope]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { deals, loading, error, reload: load };
}
