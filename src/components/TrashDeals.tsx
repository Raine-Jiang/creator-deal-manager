"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { daysBetween, todayKey } from "@/lib/date-utils";
import { displayTitle, fullDate } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Deal } from "@/lib/types";
import { useDeals } from "@/lib/use-deals";
import { AppShell } from "./AppShell";
import { ProductMark } from "./ProductMark";

export function TrashDeals() {
  const { deals, loading, error, reload } = useDeals("trash");
  const [message, setMessage] = useState("");
  const visibleDeals = useMemo(() => deals.filter((deal) => daysLeft(deal) > 0), [deals]);

  useEffect(() => {
    async function purgeExpired() {
      if (!supabase) return;
      const expired = deals.filter((deal) => daysLeft(deal) <= 0);
      if (!expired.length) return;
      const { error: deleteError } = await supabase
        .from("deals")
        .delete()
        .in("id", expired.map((deal) => deal.id));
      if (!deleteError) reload();
    }
    purgeExpired();
  }, [deals, reload]);

  async function restoreDeal(deal: Deal) {
    if (!supabase) return;
    const { error: restoreError } = await supabase
      .from("deals")
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq("id", deal.id);
    if (restoreError) setMessage(restoreError.message);
    else {
      setMessage("已恢复合作。");
      reload();
    }
  }

  return (
    <AppShell showNav={false}>
      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="icon-button" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black">垃圾桶</h1>
        <span className="h-11 w-11" />
      </div>

      <p className="mt-5 rounded-[22px] border border-black/[0.05] bg-white/78 p-4 text-sm font-bold leading-6 text-muted">
        删除后的合作会先保留 30 天，超过后进入垃圾桶时会自动彻底删除。
      </p>

      {!isSupabaseConfigured ? <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">当前是演示模式，垃圾桶恢复需要 Supabase。</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-600">{message}</p> : null}

      <section className="mt-5 space-y-3">
        {loading ? (
          <p className="card p-6 text-center text-sm font-bold text-muted">正在读取垃圾桶...</p>
        ) : visibleDeals.length ? (
          visibleDeals.map((deal) => (
            <article key={deal.id} className="rounded-[22px] border border-black/[0.05] bg-white/78 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-black">{displayTitle(deal.brand, deal.product_name)}</h2>
                  <p className="mt-1 text-sm font-bold text-muted">
                    删除时间：{fullDate(deal.deleted_at?.slice(0, 10))} · 还剩 {daysLeft(deal)} 天
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => restoreDeal(deal)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] bg-warm/80 px-4 py-3 text-sm font-black text-ink"
              >
                <RotateCcw className="h-4 w-4" />
                恢复合作
              </button>
            </article>
          ))
        ) : (
          <div className="card flex flex-col items-center justify-center p-8 text-center">
            <Trash2 className="h-8 w-8 text-muted" />
            <h2 className="mt-3 text-xl font-black">垃圾桶是空的</h2>
            <p className="mt-2 text-sm font-bold text-muted">误删的合作会先出现在这里。</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function daysLeft(deal: Deal) {
  if (!deal.deleted_at) return 0;
  const deletedDate = deal.deleted_at.slice(0, 10);
  return Math.max(0, 30 - daysBetween(deletedDate, todayKey()));
}
