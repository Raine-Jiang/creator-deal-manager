"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoDeals } from "./demo-data";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { Deal } from "./types";

type DealScope = boolean | "active" | "completed" | "all" | "trash";

function filterByScope(deals: Deal[], scope: DealScope) {
  if (scope === "trash") return deals;
  if (scope === "all") return deals;
  if (scope === true || scope === "completed") {
    return deals.filter((deal) => Boolean(deal.completed || deal.archived_at));
  }
  return deals.filter((deal) => !deal.completed && !deal.archived_at);
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

    let query = supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });

    if (scope === "trash") {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null);
    }

    const { data, error: loadError } = await query;
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
