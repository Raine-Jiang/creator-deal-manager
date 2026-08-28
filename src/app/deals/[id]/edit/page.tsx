"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Deal } from "@/lib/types";
import { demoDeals } from "@/lib/demo-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { DealForm } from "@/components/DealForm";
import { AppShell } from "@/components/AppShell";

export default function EditDealPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(
    isSupabaseConfigured ? null : demoDeals.find((item) => item.id === params.id) || demoDeals[0],
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    async function load() {
      const { data: sessionData } = await supabase!.auth.getSession();
      if (!sessionData.session) {
        router.push("/login");
        return;
      }
      const { data } = await supabase!
        .from("deals")
        .select("*")
        .eq("id", params.id)
        .single();
      setDeal(data);
      setLoading(false);
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <AppShell>
        <p className="card mt-8 p-6 text-center font-bold text-muted">正在读取合作...</p>
      </AppShell>
    );
  }

  return <DealForm mode="edit" deal={deal} />;
}
