"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CircleDollarSign, RotateCcw, WalletCards } from "lucide-react";
import type { FinanceRange } from "@/lib/finance";
import { filterDealsByFinanceRange, getCategoryFinance, getFinanceSummary } from "@/lib/finance";
import { money } from "@/lib/format";
import { useDeals } from "@/lib/use-deals";
import { AppShell } from "./AppShell";

type FinancePreset = Exclude<FinanceRange, { start?: string; end?: string }>;

const ranges: Array<{ label: string; value: FinancePreset }> = [
  { label: "本月", value: "currentMonth" },
  { label: "上月", value: "lastMonth" },
  { label: "近三个月", value: "quarter" },
  { label: "近一年", value: "year" },
  { label: "累计", value: "all" },
];

export function FinancePage() {
  const [range, setRange] = useState<FinancePreset>("currentMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const { deals, loading, error } = useDeals("all");
  const activeRange: FinanceRange = customStart || customEnd ? { start: customStart, end: customEnd } : range;
  const summary = getFinanceSummary(deals, activeRange);
  const categories = getCategoryFinance(filterDealsByFinanceRange(deals, activeRange));

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="text-[38px] font-black leading-none">财务</h1>
      </header>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <div className="no-scrollbar -mx-3 mt-5 flex gap-2 overflow-x-auto px-3">
        {ranges.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setRange(item.value);
              setCustomStart("");
              setCustomEnd("");
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              !customStart && !customEnd && range === item.value ? "bg-black text-white" : "border border-black/[0.06] bg-white/72 text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="mt-3 rounded-[22px] border border-black/[0.05] bg-white/72 p-3">
        <p className="mb-2 text-sm font-black text-muted">自定义时间</p>
        <div className="grid grid-cols-2 gap-2">
          <DateField label="开始" value={customStart} onChange={setCustomStart} />
          <DateField label="结束" value={customEnd} onChange={setCustomEnd} />
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Metric title="总佣金" value={loading ? "..." : money(summary.totalCommission) || "¥0"} icon={<WalletCards className="h-5 w-5" />} tint="green" />
        <Metric title="待收佣金" value={money(summary.pendingCommission) || "¥0"} icon={<CircleDollarSign className="h-5 w-5" />} tint="violet" />
        <Metric title="总本金" value={money(summary.totalPrincipal) || "¥0"} icon={<WalletCards className="h-5 w-5" />} tint="yellow" />
        <Metric title="待收本金" value={money(summary.pendingPrincipal) || "¥0"} icon={<RotateCcw className="h-5 w-5" />} tint="pink" />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black">品类分析</h2>
        <p className="mb-3 rounded-[18px] bg-white/70 px-4 py-3 text-xs font-bold leading-5 text-muted">
          品类统计来自每条合作的“品类”字段；旧合作未补品类时会暂时计入未分类。
        </p>
        <div className="space-y-2.5">
          {categories.length ? categories.map((item) => (
            <div key={item.category} className="rounded-[22px] border border-black/[0.05] bg-white/76 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{item.category}</h3>
                  <p className="mt-1 text-sm font-bold text-muted">{item.deals} 条合作</p>
                </div>
                <p className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-600">
                  {money(item.totalCommission + item.totalPrincipal) || "¥0"}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <MiniMoney label="总佣金" value={money(item.totalCommission) || "¥0"} />
                <MiniMoney label="待收佣金" value={money(item.pendingCommission) || "¥0"} />
                <MiniMoney label="总本金" value={money(item.totalPrincipal) || "¥0"} />
                <MiniMoney label="待收本金" value={money(item.pendingPrincipal) || "¥0"} />
              </div>
            </div>
          )) : (
            <div className="card p-5 text-center text-sm font-bold text-muted">暂无可分析的品类数据</div>
          )}
        </div>
      </section>

    </AppShell>
  );
}

function MiniMoney({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-warm/70 p-2.5">
      <p className="text-xs font-black text-muted">{label}</p>
      <p className="mt-1 truncate font-black text-ink">{value}</p>
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0 rounded-[16px] bg-warm/70 px-3 py-2">
      <span className="text-xs font-black text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full min-w-0 bg-transparent text-sm font-black outline-none"
      />
    </label>
  );
}

function Metric({ title, value, icon, tint }: { title: string; value: string; icon: ReactNode; tint: "green" | "violet" | "pink" | "yellow" }) {
  const colors = {
    green: "border-lime-200 bg-[linear-gradient(135deg,#f0ffe8,#d8fbc9)] text-emerald-900",
    violet: "border-violet-200 bg-[linear-gradient(135deg,#faf5ff,#ead5ff)] text-violet-950",
    pink: "border-rose-200 bg-[linear-gradient(135deg,#fff1f5,#ffd8e1)] text-rose-950",
    yellow: "border-amber-200 bg-[linear-gradient(135deg,#fff8de,#ffe89a)] text-amber-950",
  };

  return (
    <div className={`relative min-h-[150px] overflow-hidden rounded-[24px] border p-4 ${colors[tint]}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/55">{icon}</div>
      <p className="text-sm font-black text-muted">{title}</p>
      <p className="mt-1 truncate text-[28px] font-black leading-none">{value}</p>
    </div>
  );
}
