"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CircleDollarSign, RotateCcw, TriangleAlert, WalletCards } from "lucide-react";
import { getCategoryFinance, getFinanceSummary } from "@/lib/finance";
import { hasAmount } from "@/lib/deal-status";
import { fullDate, money } from "@/lib/format";
import { useDeals } from "@/lib/use-deals";
import { AppShell } from "./AppShell";

export function FinancePage() {
  const { deals, loading, error } = useDeals(false);
  const summary = getFinanceSummary(deals);
  const categories = getCategoryFinance(deals);
  const pending = deals.filter(
    (deal) =>
      (hasAmount(deal.base_fee) && !deal.payment_received) ||
      (hasAmount(deal.advance_amount) && !deal.refund_received),
  );

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="text-[38px] font-black leading-none">财务</h1>
      </header>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Metric title="本月已收" value={loading ? "..." : money(summary.monthReceived)} icon={<WalletCards className="h-5 w-5" />} tint="green" face=":)" />
        <Metric title="待收合作费" value={money(summary.pendingPayment)} icon={<CircleDollarSign className="h-5 w-5" />} tint="violet" face=":(" />
        <Metric title="待返本金" value={money(summary.pendingRefund)} icon={<RotateCcw className="h-5 w-5" />} tint="yellow" face=":D" />
        <Metric title="逾期金额" value={money(summary.overdueAmount)} icon={<TriangleAlert className="h-5 w-5" />} tint="pink" face=":|" />
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black">品类分析</h2>
        <div className="space-y-2.5">
          {categories.length ? categories.map((item) => (
            <div key={item.category} className="rounded-[22px] border border-black/[0.05] bg-white/76 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">{item.category}</h3>
                  <p className="mt-1 text-sm font-bold text-muted">{item.deals} 条合作</p>
                </div>
                <p className="shrink-0 rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-600">
                  {money(item.received + item.pendingPayment + item.pendingRefund)}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <MiniMoney label="已收" value={money(item.received)} />
                <MiniMoney label="待收" value={money(item.pendingPayment)} />
                <MiniMoney label="待返" value={money(item.pendingRefund)} />
              </div>
            </div>
          )) : (
            <div className="card p-5 text-center text-sm font-bold text-muted">暂无可分析的品类数据</div>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black">待处理款项</h2>
        <div className="space-y-3">
          {pending.length ? pending.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`} className="block rounded-[22px] focus:outline-none focus:ring-4 focus:ring-violet-200">
              <article className="card flex min-w-0 items-center justify-between gap-3 p-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-warm">
                  <span className="text-sm font-black">{(deal.brand || "?").slice(0, 2)}</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{deal.brand || "未命名品牌"}</p>
                  <p className="mt-1 text-sm font-bold text-muted">
                    {!deal.payment_received && hasAmount(deal.base_fee) ? `合作费 ${fullDate(deal.expected_payment_date) || ""}` : ""}
                    {!deal.refund_received && hasAmount(deal.advance_amount) ? ` 本金 ${fullDate(deal.expected_refund_date) || ""}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {!deal.payment_received && hasAmount(deal.base_fee) ? <p className="font-black text-pink">{money(deal.base_fee)}</p> : null}
                  {!deal.refund_received && hasAmount(deal.advance_amount) ? <p className="font-black text-blue">{money(deal.advance_amount)}</p> : null}
                </div>
              </article>
            </Link>
          )) : (
            <div className="card p-5 text-center text-sm font-bold text-muted">暂时没有待收或待返本金</div>
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

function Metric({ title, value, icon, tint, face }: { title: string; value: string; icon: ReactNode; tint: "green" | "violet" | "pink" | "yellow"; face: string }) {
  const colors = {
    green: "border-lime-200 bg-[linear-gradient(135deg,#f0ffe8,#d8fbc9)] text-emerald-900",
    violet: "border-violet-200 bg-[linear-gradient(135deg,#faf5ff,#ead5ff)] text-violet-950",
    pink: "border-rose-200 bg-[linear-gradient(135deg,#fff1f5,#ffd8e1)] text-rose-950",
    yellow: "border-amber-200 bg-[linear-gradient(135deg,#fff8de,#ffe89a)] text-amber-950",
  };

  return (
    <div className={`relative min-h-[150px] overflow-hidden rounded-[24px] border p-4 shadow-soft ${colors[tint]}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[15px] bg-white/55">{icon}</div>
      <p className="text-sm font-black text-muted">{title}</p>
      <p className="mt-1 truncate text-[28px] font-black leading-none">{value}</p>
      <span className="absolute -bottom-2 right-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/35 text-xl font-black">
        {face}
      </span>
    </div>
  );
}
