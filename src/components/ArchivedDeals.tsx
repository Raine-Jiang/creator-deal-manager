"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import type { Deal } from "@/lib/types";
import { useDeals } from "@/lib/use-deals";
import { fullDate } from "@/lib/format";
import { AppShell } from "./AppShell";
import { DealCard } from "./DealCard";

export function ArchivedDeals() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const { deals, loading, error } = useDeals(true);
  const categories = useMemo(() => {
    const names = new Set(deals.map((deal) => deal.product_category || "未分类"));
    return ["全部", ...Array.from(names).sort((a, b) => a.localeCompare(b, "zh-CN"))];
  }, [deals]);

  const filteredDeals = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return deals
      .filter((deal) => {
        const matchCategory = category === "全部" || (deal.product_category || "未分类") === category;
        const values = [
          deal.brand,
          deal.product_name,
          deal.product_category,
          deal.platform,
          ...(deal.platforms || []),
          deal.cooperation_date,
          deal.notes,
          deal.product_url,
          deal.publish_url,
        ];
        const matchQuery = !keyword || values.some((value) => value?.toLowerCase().includes(keyword));
        return matchCategory && matchQuery;
      })
      .sort((a, b) => timelineValue(b) - timelineValue(a));
  }, [category, deals, query]);

  const groups = useMemo(() => groupByMonth(filteredDeals), [filteredDeals]);

  return (
    <AppShell>
      <div className="flex items-center justify-between pt-2">
        <Link href="/deals" className="icon-button" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black">已归档合作</h1>
        <span className="h-11 w-11" />
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <label className="search-box mt-5 flex min-w-0 items-center gap-3">
        <Search className="h-5 w-5 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="全局搜索品牌、产品、品类、备注"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted"
        />
      </label>

      <div className="no-scrollbar -mx-3 mt-4 flex gap-2 overflow-x-auto px-3">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              category === item ? "bg-black text-white" : "border border-stone-200 bg-white/72 text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="mt-5 space-y-5">
        {loading ? (
          <p className="card p-6 text-center text-sm font-bold text-muted">正在读取归档...</p>
        ) : groups.length ? (
          groups.map((group) => (
            <div key={group.month}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-xl font-black">{group.month}</h2>
                <span className="text-sm font-black text-muted">{group.deals.length} 条</span>
              </div>
              <div className="space-y-3">
                {group.deals.map((deal) => (
                  <div key={deal.id}>
                    <p className="mb-1.5 px-1 text-xs font-black text-muted">{timelineLabel(deal)}</p>
                    <DealCard deal={deal} />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <h2 className="text-xl font-black">{deals.length ? "没有匹配结果" : "暂无归档"}</h2>
            <p className="mt-2 text-sm font-bold text-muted">{deals.length ? "换个关键词或品类试试。" : "完成后的合作可以在详情页归档。"}</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function timelineDate(deal: Deal) {
  return deal.publish_date || deal.archived_at || deal.cooperation_date || deal.created_at;
}

function timelineValue(deal: Deal) {
  return new Date(timelineDate(deal)).getTime();
}

function timelineLabel(deal: Deal) {
  const label = deal.publish_date ? "发布时间" : deal.archived_at ? "归档时间" : "创建时间";
  return `${label} ${fullDate(timelineDate(deal))}`;
}

function groupByMonth(deals: Deal[]) {
  const map = new Map<string, Deal[]>();
  for (const deal of deals) {
    const date = new Date(timelineDate(deal));
    const month = Number.isNaN(date.getTime())
      ? "时间未记录"
      : `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月`;
    const current = map.get(month) || [];
    current.push(deal);
    map.set(month, current);
  }

  return Array.from(map.entries()).map(([month, monthDeals]) => ({ month, deals: monthDeals }));
}
