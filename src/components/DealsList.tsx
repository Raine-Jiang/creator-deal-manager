"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Search } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Deal } from "@/lib/types";
import { demoDeals } from "@/lib/demo-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { DealCard } from "./DealCard";
import { SetupNotice } from "./SetupNotice";

export function DealsList() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deals, setDeals] = useState<Deal[]>(isSupabaseConfigured ? [] : demoDeals);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;

    async function load() {
      const { data: sessionData } = await supabase!.auth.getSession();
      if (!sessionData.session) {
        router.push("/login");
        return;
      }

      setUser(sessionData.session.user);
      const { data, error: loadError } = await supabase!
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (loadError) setError(loadError.message);
      else setDeals(data || []);
      setLoading(false);
    }

    load();
  }, [router]);

  const filteredDeals = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return deals;
    return deals.filter((deal) =>
      [deal.brand, deal.product_name].some((value) =>
        value?.toLowerCase().includes(trimmed),
      ),
    );
  }, [deals, query]);

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/login");
  }

  return (
    <AppShell>
      <header className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="text-sm font-bold text-violet-500">Creator Deal Manager</p>
          <h1 className="mt-1 text-[38px] font-black leading-none tracking-normal">
            合作
          </h1>
        </div>
        {isSupabaseConfigured ? (
          <button
            onClick={signOut}
            className="logout-button mt-1"
            aria-label="退出登录"
            title={user?.email || "退出登录"}
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : null}
      </header>

      <div className="mt-5 flex gap-3">
        <label className="search-box flex flex-1 items-center gap-3">
          <Search className="h-5 w-5 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索品牌 / 产品"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted"
          />
        </label>
        <Link href="/deals/new" className="primary-icon-button" aria-label="新建合作">
          <Plus className="h-6 w-6" />
        </Link>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-4">
          <SetupNotice />
        </div>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      <section className="mt-5 flex flex-1 flex-col gap-3 pb-8">
        {loading ? (
          <p className="card p-6 text-center text-sm font-bold text-muted">
            正在读取合作...
          </p>
        ) : filteredDeals.length ? (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <div className="card flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#eadcff,#ffe1eb)] text-3xl">
              :)
            </div>
            <h2 className="text-2xl font-black">还没有合作记录</h2>
            <p className="mt-2 text-sm font-semibold text-muted">
              把第一条合作记下来吧
            </p>
            <Link href="/deals/new" className="primary-button mt-6">
              <Plus className="h-5 w-5" />
              新建合作
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
