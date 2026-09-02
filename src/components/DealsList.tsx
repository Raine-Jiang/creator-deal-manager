"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Check, Plus, Search, Trash2 } from "lucide-react";
import type { DealStatus } from "@/lib/types";
import { getDealStatus } from "@/lib/deal-status";
import { todayKey } from "@/lib/date-utils";
import { useDeals } from "@/lib/use-deals";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { DealCard } from "./DealCard";
import { SetupNotice } from "./SetupNotice";

const filters: Array<"全部" | DealStatus> = ["全部", "待发布", "已发布", "已完成"];
const dateFilters = ["全部日期", "本月发布", "未来30天", "未填日期"] as const;
const sortOptions = ["发布日期近到远", "发布日期远到近"] as const;

export function DealsList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");
  const [dateFilter, setDateFilter] = useState<(typeof dateFilters)[number]>("全部日期");
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]>("发布日期近到远");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { deals, loading, error, reload } = useDeals("all");

  const filteredDeals = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return deals
      .filter((deal) => {
        const matchQuery =
          !trimmed ||
          [deal.brand, deal.product_name, deal.product_category, deal.notes, deal.platform, ...(deal.platforms || [])].some((value) => value?.toLowerCase().includes(trimmed));
        const matchFilter = filter === "全部" || getDealStatus(deal) === filter;
        const matchDate = matchesDateFilter(deal.publish_deadline, dateFilter);
        return matchQuery && matchFilter && matchDate;
      })
      .sort((a, b) => sortPublishDate(a.publish_deadline, b.publish_deadline, sortBy));
  }, [deals, dateFilter, filter, query, sortBy]);

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
            placeholder="搜索品牌 / 产品 / 备注"
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
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="flex min-w-0 items-center gap-2 rounded-[18px] border border-black/[0.06] bg-white/72 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as (typeof dateFilters)[number])}
            className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none"
          >
            {dateFilters.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 items-center gap-2 rounded-[18px] border border-black/[0.06] bg-white/72 px-3 py-2">
          <ArrowDownUp className="h-4 w-4 shrink-0 text-muted" />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as (typeof sortOptions)[number])}
            className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none"
          >
            {sortOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {!isSupabaseConfigured ? <div className="mt-4"><SetupNotice /></div> : null}
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl bg-warm/70 p-3 text-sm font-bold text-muted">{message}</p> : null}

      <div className="mt-4 flex items-center justify-between gap-2">
        <button type="button" onClick={() => toggleSelectMode(setSelectMode, setSelectedIds)} className="rounded-full border border-black/[0.06] bg-white/72 px-4 py-2 text-sm font-black">
          {selectMode ? "取消选择" : "批量管理"}
        </button>
        {selectMode ? (
          <button type="button" disabled={!selectedIds.length || deleting} onClick={batchDelete} className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-sm font-black text-white disabled:opacity-40">
            <Trash2 className="h-4 w-4" />
            {deleting ? "删除中..." : `删除 ${selectedIds.length} 条`}
          </button>
        ) : null}
      </div>

      <section className="mt-5 flex flex-1 flex-col gap-3">
        {loading ? (
          <p className="card p-6 text-center text-sm font-bold text-muted">正在读取合作...</p>
        ) : filteredDeals.length ? (
          filteredDeals.map((deal) => (
            <div key={deal.id} className="relative">
              {selectMode ? (
                <button type="button" onClick={() => toggleSelected(deal.id)} className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white/90">
                  {selectedIds.includes(deal.id) ? <Check className="h-5 w-5 text-emerald-600" /> : null}
                </button>
              ) : null}
              <div className={selectMode ? "pointer-events-none pl-5" : ""}>
                <DealCard deal={deal} />
              </div>
            </div>
          ))
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

  function toggleSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function batchDelete() {
    if (!supabase || !selectedIds.length) return;
    const confirmed = window.confirm(`确定把 ${selectedIds.length} 条合作移入垃圾桶吗？`);
    if (!confirmed) return;

    setDeleting(true);
    setMessage("");
    const { error: deleteError } = await supabase
      .from("deals")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", selectedIds);
    setDeleting(false);

    if (deleteError) {
      setMessage(deleteError.message);
      return;
    }
    setMessage(`已移入垃圾桶 ${selectedIds.length} 条合作。`);
    setSelectedIds([]);
    setSelectMode(false);
    reload();
  }
}

function toggleSelectMode(setSelectMode: (value: (current: boolean) => boolean) => void, setSelectedIds: (value: string[]) => void) {
  setSelectedIds([]);
  setSelectMode((current) => !current);
}

function matchesDateFilter(value: string | null, filter: (typeof dateFilters)[number]) {
  if (filter === "全部日期") return true;
  if (!value) return filter === "未填日期";
  if (filter === "未填日期") return false;

  const today = todayKey();
  const date = new Date(`${value}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  if (filter === "本月发布") {
    return value.slice(0, 7) === today.slice(0, 7);
  }

  const diff = date.getTime() - now.getTime();
  return diff >= 0 && diff <= 30 * 86400000;
}

function sortPublishDate(a: string | null, b: string | null, sortBy: (typeof sortOptions)[number]) {
  const emptyA = a ? 0 : 1;
  const emptyB = b ? 0 : 1;
  if (emptyA !== emptyB) return emptyA - emptyB;
  const timeA = a ? new Date(`${a}T00:00:00`).getTime() : 0;
  const timeB = b ? new Date(`${b}T00:00:00`).getTime() : 0;
  return sortBy === "发布日期近到远" ? timeB - timeA : timeA - timeB;
}
