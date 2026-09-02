"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { CircleDollarSign, PencilLine, RotateCcw, WalletCards } from "lucide-react";
import type { FinanceRange } from "@/lib/finance";
import { filterDealsByFinanceRange, getCategoryFinance, getFinanceDateBounds, getFinanceSummary, isDateInBounds } from "@/lib/finance";
import { fullDate, money } from "@/lib/format";
import { todayKey } from "@/lib/date-utils";
import { useDeals } from "@/lib/use-deals";
import { useDailyEarnings } from "@/lib/use-daily-earnings";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
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
  const [earningDate, setEarningDate] = useState(todayKey());
  const [earningAmount, setEarningAmount] = useState("");
  const [earningNotes, setEarningNotes] = useState("");
  const [earningMessage, setEarningMessage] = useState("");
  const [earningSaving, setEarningSaving] = useState(false);
  const { deals, loading, error } = useDeals("all");
  const { earnings, loading: earningsLoading, error: earningsError, reload: reloadEarnings } = useDailyEarnings();
  const activeRange: FinanceRange = useMemo(
    () => (customStart || customEnd ? { start: customStart, end: customEnd } : range),
    [customEnd, customStart, range],
  );
  const summary = getFinanceSummary(deals, activeRange);
  const categories = getCategoryFinance(filterDealsByFinanceRange(deals, activeRange));
  const dailyEarningStats = useMemo(() => {
    const { start, end } = getFinanceDateBounds(activeRange);
    const scoped = earnings.filter((item) => isDateInBounds(item.earning_date, start, end));
    return {
      total: scoped.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      count: scoped.length,
      recent: scoped.slice(0, 5),
    };
  }, [activeRange, earnings]);

  async function saveDailyEarning(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEarningMessage("");
    if (!supabase) {
      setEarningMessage("当前是演示模式，登录 Supabase 后才能保存。");
      return;
    }

    const amount = Number(earningAmount.replace(/[^\d.]/g, ""));
    if (!earningDate || !amount) {
      setEarningMessage("请选择日期并填写收益金额。");
      return;
    }

    setEarningSaving(true);
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      setEarningSaving(false);
      setEarningMessage("请先登录后再记录收益。");
      return;
    }

    const { error: saveError } = await supabase
      .from("daily_earnings")
      .upsert({
        user_id: userId,
        earning_date: earningDate,
        amount,
        notes: earningNotes.trim() || null,
      }, { onConflict: "user_id,earning_date" });

    setEarningSaving(false);
    if (saveError) {
      setEarningMessage(saveError.message);
      return;
    }
    setEarningAmount("");
    setEarningNotes("");
    setEarningMessage("已保存当天收益。");
    reloadEarnings();
  }

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="text-[38px] font-black leading-none">财务</h1>
      </header>

      {error || earningsError ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error || earningsError}</p> : null}

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

      <section className="mt-5 rounded-[24px] border border-black/[0.05] bg-white/76 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">每日收益</h2>
            <p className="mt-1 text-xs font-bold text-muted">抖音等平台的创作者收益，按日期手动记录。</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-black text-muted">{dailyEarningStats.count} 天</p>
            <p className="mt-1 text-xl font-black">{earningsLoading ? "..." : money(dailyEarningStats.total) || "¥0"}</p>
          </div>
        </div>

        <form onSubmit={saveDailyEarning} className="mt-4 grid gap-2">
          <div className="grid grid-cols-[1fr_1.1fr] gap-2">
            <DateField label="日期" value={earningDate} onChange={setEarningDate} />
            <label className="min-w-0 rounded-[16px] bg-warm/70 px-3 py-2">
              <span className="text-xs font-black text-muted">收益金额</span>
              <input
                value={earningAmount}
                onChange={(event) => setEarningAmount(event.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0"
                inputMode="decimal"
                className="mt-1 w-full min-w-0 bg-transparent text-sm font-black outline-none"
              />
            </label>
          </div>
          <input
            value={earningNotes}
            onChange={(event) => setEarningNotes(event.target.value)}
            placeholder="备注，比如抖音、视频收益、直播收益"
            className="rounded-[16px] bg-warm/70 px-3 py-3 text-sm font-bold outline-none placeholder:text-muted"
          />
          <button type="submit" disabled={earningSaving || !isSupabaseConfigured} className="flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-black px-4 text-sm font-black text-white disabled:opacity-50">
            <PencilLine className="h-4 w-4" />
            {earningSaving ? "保存中..." : "记录当天收益"}
          </button>
        </form>

        {earningMessage ? <p className="mt-3 rounded-[16px] bg-warm/70 px-3 py-2 text-xs font-bold text-muted">{earningMessage}</p> : null}
        {dailyEarningStats.recent.length ? (
          <div className="mt-4 divide-y divide-black/[0.05]">
            {dailyEarningStats.recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-black">{fullDate(item.earning_date)}</p>
                  {item.notes ? <p className="mt-0.5 truncate text-xs font-bold text-muted">{item.notes}</p> : null}
                </div>
                <p className="shrink-0 font-black">{money(item.amount) || "¥0"}</p>
              </div>
            ))}
          </div>
        ) : null}
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
