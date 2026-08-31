"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Plus, Search } from "lucide-react";
import type { DealStatus } from "@/lib/types";
import { getDealStatus } from "@/lib/deal-status";
import { useDeals } from "@/lib/use-deals";
import { isSupabaseConfigured } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { DealCard } from "./DealCard";
import { SetupNotice } from "./SetupNotice";

const filters: Array<"全部" | DealStatus> = ["全部", "待拍摄", "待发布", "待收款", "已完成"];

export function DealsList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");
  const { deals, loading, error } = useDeals(false);

  const filteredDeals = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return deals.filter((deal) => {
      const matchQuery =
        !trimmed ||
        [deal.brand, deal.product_name, deal.product_category].some((value) => value?.toLowerCase().includes(trimmed));
      const matchFilter = filter === "全部" || getDealStatus(deal) === filter;
      return matchQuery && matchFilter;
    });
  }, [deals, filter, query]);

  return (
    <AppShell>
      <header className="flex items-start justify-between gap-4 pt-2">
        <div>
          <p className="text-sm font-bold text-violet-500">Creator Deal Manager</p>
          <h1 className="mt-1 text-[38px] font-black leading-none">合作</h1>
        </div>
        <Link href="/deals/new" className="icon-button mt-1" aria-label="新建合作">
          <Plus className="h-6 w-6" />
        </Link>
      </header>

      <div className="mt-5 flex gap-3">
        <label className="search-box flex min-w-0 flex-1 items-center gap-3">
          <Search className="h-5 w-5 shrink-0 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索品牌 / 产品"
            className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <div className="no-scrollbar -mx-3 mt-4 flex gap-2 overflow-x-auto px-3">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              filter === item ? "bg-black text-white shadow-soft" : "border border-stone-200 bg-white/72 text-ink"
            }`}
          >
            {item}
          </button>
        ))}
        <Link href="/deals/archived" className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-black text-muted">
          <Archive className="h-4 w-4" />
          归档
        </Link>
      </div>

      {!isSupabaseConfigured ? <div className="mt-4"><SetupNotice /></div> : null}
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <section className="mt-5 flex flex-1 flex-col gap-3">
        {loading ? (
          <p className="card p-6 text-center text-sm font-bold text-muted">正在读取合作...</p>
        ) : filteredDeals.length ? (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        ) : (
          <div className="card flex flex-1 flex-col items-center justify-center p-8 text-center">
            <h2 className="text-2xl font-black">还没有合作记录</h2>
            <p className="mt-2 text-sm font-semibold text-muted">把第一条合作记下来吧</p>
            <Link href="/deals/new" className="primary-button mt-6 px-5 py-3">
              <Plus className="h-5 w-5" />
              新建合作
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
