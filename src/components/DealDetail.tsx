"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Edit3,
  LinkIcon,
  PackageCheck,
  RotateCcw,
  Send,
  Trash2,
  WalletCards,
} from "lucide-react";
import type { Deal } from "@/lib/types";
import { demoDeals } from "@/lib/demo-data";
import { getDealStatus } from "@/lib/deal-status";
import { todayKey } from "@/lib/date-utils";
import { displayTitle, fullDate, fullDateTime, money } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { ProductMark } from "./ProductMark";
import { SetupNotice } from "./SetupNotice";
import { StatusChip } from "./StatusChip";

type ActionType = "received" | "publish" | "payment" | "refund";
type DealUpdate = Partial<Omit<Deal, "id" | "user_id" | "created_at">>;

export function DealDetail({ id }: { id: string }) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(
    isSupabaseConfigured ? null : demoDeals.find((item) => item.id === id) || demoDeals[0],
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState<ActionType | null>(null);
  const [actionDate, setActionDate] = useState(todayKey());
  const [publishUrl, setPublishUrl] = useState("");

  useEffect(() => {
    if (!supabase) return;
    async function load() {
      const { data: sessionData } = await supabase!.auth.getSession();
      if (!sessionData.session) {
        router.push("/login");
        return;
      }
      const { data, error: loadError } = await supabase!
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();
      if (loadError) setError(loadError.message);
      else setDeal(data as Deal);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function updateDeal(fields: DealUpdate) {
    if (!deal) return false;
    const next = { ...deal, ...fields, updated_at: new Date().toISOString() };
    if (!supabase) {
      setDeal(next);
      return true;
    }
    const { error: updateError } = await supabase
      .from("deals")
      .update({ ...fields, updated_at: next.updated_at } as DealUpdate)
      .eq("id", deal.id);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setDeal(next);
    return true;
  }

  async function moveToTrash() {
    if (!deal) return;
    const confirmed = window.confirm("确定把这条合作移入垃圾桶吗？30 天后会彻底删除。");
    if (!confirmed) return;
    const ok = await updateDeal({ deleted_at: new Date().toISOString() });
    if (ok) router.push("/deals");
  }

  async function submitQuickAction() {
    if (!sheet) return;
    const fields: DealUpdate =
      sheet === "received"
        ? { received_date: actionDate }
        : sheet === "publish"
          ? { publish_date: actionDate, publish_url: publishUrl || deal?.publish_url || null }
          : sheet === "payment"
            ? { payment_received: true, payment_received_date: actionDate }
            : { refund_received: true, refund_received_date: actionDate };
    await updateDeal(fields);
    setSheet(null);
  }

  async function cancelQuickAction() {
    if (!sheet) return;
    const fields: DealUpdate =
      sheet === "received"
        ? { received_date: null }
        : sheet === "publish"
        ? { publish_date: null, publish_url: null }
        : sheet === "payment"
          ? { payment_received: false, payment_received_date: null }
          : { refund_received: false, refund_received_date: null };
    await updateDeal(fields);
    setSheet(null);
  }

  function openSheet(type: ActionType) {
    const savedDate =
      type === "received" ? deal?.received_date
        : type === "publish" ? deal?.publish_date
          : type === "payment" ? deal?.payment_received_date
            : deal?.refund_received_date;
    setActionDate(savedDate || todayKey());
    setPublishUrl(deal?.publish_url || "");
    setSheet(type);
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between pt-2">
        <Link href="/deals" className="icon-button" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black">合作详情</h1>
        {deal ? (
          <Link href={`/deals/${deal.id}/edit`} className="icon-button" aria-label="编辑">
            <Edit3 className="h-5 w-5" />
          </Link>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      {!isSupabaseConfigured ? <div className="mt-6"><SetupNotice /></div> : null}
      {loading ? <p className="card mt-6 p-6 text-center font-bold text-muted">正在读取详情...</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      {deal ? (
        <div className="mt-6 space-y-4">
          <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,#f8fcff,#f0e7ff)] p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <h2 className="line-clamp-2 min-w-0 flex-1 break-words text-[22px] font-black leading-tight">{displayTitle(deal.brand, deal.product_name)}</h2>
                  <StatusChip status={getDealStatus(deal)} />
                </div>
                {(deal.platforms?.length || deal.platform || deal.product_category) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {deal.product_category ? <p className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-black text-violet-600">{deal.product_category}</p> : null}
                    {(deal.platforms?.length ? deal.platforms : deal.platform ? [deal.platform] : []).map((platform) => (
                      <p key={platform} className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink">{platform}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-blue-200 bg-[linear-gradient(135deg,#f5fbff,#e7f2ff)] p-4 shadow-soft">
            <h3 className="mb-3 text-lg font-black">快捷记录</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <QuickButton label="收货情况" active={Boolean(deal.received_date)} icon={<PackageCheck className="h-4 w-4" />} onClick={() => openSheet("received")} />
              <QuickButton label="已发布" active={Boolean(deal.publish_date)} icon={<Send className="h-4 w-4" />} onClick={() => openSheet("publish")} />
              <QuickButton label="合作费已收" active={deal.payment_received} icon={<WalletCards className="h-4 w-4" />} onClick={() => openSheet("payment")} />
              <QuickButton label="本金已返" active={deal.refund_received} icon={<RotateCcw className="h-4 w-4" />} onClick={() => openSheet("refund")} />
              <QuickButton
                label="完成合作"
                active={Boolean(deal.completed || deal.archived_at)}
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => updateDeal(deal.completed || deal.archived_at ? { completed: false, archived_at: null } : { completed: true, archived_at: new Date().toISOString() })}
              />
            </div>
          </section>

          <DetailSection title="基本信息" icon={<ShoppingIcon />}>
            <Info label="品牌" value={deal.brand} />
            <Info label="产品" value={deal.product_name} />
            <Info label="品类" value={deal.product_category} />
            <Info label="平台" value={(deal.platforms?.length ? deal.platforms : deal.platform ? [deal.platform] : []).join("、")} />
            <Info label="合作形式" value={deal.collaboration_type} />
            <Info label="合作日期" value={fullDate(deal.cooperation_date || deal.created_at)} />
            <Info label="商品链接" value={deal.product_url} link />
          </DetailSection>

          <DetailSection title="合作金额" icon={<WalletCards className="h-5 w-5" />}>
            <Info label="产品价格" value={money(deal.product_price)} highlight />
            <Info label="合作费" value={money(deal.base_fee)} highlight />
            <Info label="佣金" value={deal.commission} highlight />
            <Info label="垫付金额" value={money(deal.advance_amount)} highlight />
            <Info label="是否垫付" value={deal.advance_required ? "需要垫付" : "不垫付"} />
            <Info label="合作费到账" value={deal.payment_received ? fullDate(deal.payment_received_date) || "已到账" : null} />
            <Info label="本金返还" value={deal.refund_received ? fullDate(deal.refund_received_date) || "已返还" : null} />
          </DetailSection>

          <DetailSection title="时间" icon={<CalendarDays className="h-5 w-5" />}>
            <Info label="创建合作" value={fullDateTime(deal.created_at)} />
            <Info label="收货日期" value={fullDate(deal.received_date)} />
            <Info label="最晚发布" value={fullDate(deal.publish_deadline)} highlight />
            <Info label="实际发布" value={fullDate(deal.publish_date)} />
            <Info label="预计回款" value={fullDate(deal.expected_payment_date)} />
            <Info label="预计返本金" value={fullDate(deal.expected_refund_date)} />
          </DetailSection>

          <DetailSection title="其他" icon={<LinkIcon className="h-5 w-5" />}>
            <Info label="发布链接" value={deal.publish_url} link />
            <Info label="备注" value={deal.notes} />
          </DetailSection>

          <button
            type="button"
            onClick={moveToTrash}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] border border-red-100 bg-white/78 px-5 py-4 text-base font-black text-red-500"
          >
            <Trash2 className="h-5 w-5" />
            移入垃圾桶
          </button>
        </div>
      ) : null}

      {sheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-3 pb-3" onClick={() => setSheet(null)}>
          <div className="w-full max-w-[430px] rounded-[28px] bg-white p-5 shadow-lift" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-xl font-black">{sheetTitle(sheet)}</h3>
            <label className="form-row mt-3">
              <span>日期</span>
              <input type="date" value={actionDate} onChange={(event) => setActionDate(event.target.value)} className="form-control" />
            </label>
            {sheet === "publish" ? (
              <label className="form-row">
                <span>链接</span>
                <input value={publishUrl} onChange={(event) => setPublishUrl(event.target.value)} placeholder="发布链接（选填）" className="form-control" />
              </label>
            ) : null}
            <button onClick={submitQuickAction} className="primary-button mt-4 w-full justify-center py-4">确认</button>
            {deal && isQuickActionActive(deal, sheet) ? (
              <button type="button" onClick={cancelQuickAction} className="mt-2 flex w-full items-center justify-center rounded-[18px] bg-rose-50 px-5 py-3 text-sm font-black text-rose-500">
                取消此记录
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function sheetTitle(type: ActionType) {
  return { received: "标记已收货", publish: "标记已发布", payment: "合作费已收", refund: "本金已返" }[type];
}

function isQuickActionActive(deal: Deal, type: ActionType) {
  return type === "received"
    ? Boolean(deal.received_date)
    : type === "publish"
      ? Boolean(deal.publish_date)
      : type === "payment"
        ? deal.payment_received
        : deal.refund_received;
}

function QuickButton({ label, active, icon, onClick }: { label: string; active: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-[18px] border px-3 text-sm font-black ${
        active ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-black/[0.04] bg-warm text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DetailSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">{icon}</div>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}

function Info({ label, value, highlight, link }: { label: string; value?: string | null; highlight?: boolean; link?: boolean }) {
  if (!value) return null;
  const content = link ? (
    <a href={value} target="_blank" rel="noreferrer" className="break-all text-blue">{value}</a>
  ) : value;

  return (
    <div className="flex gap-4 py-3 text-base">
      <span className="w-24 shrink-0 font-bold text-muted">{label}</span>
      <span className={`min-w-0 flex-1 break-words font-black ${highlight ? "text-pink" : "text-ink"}`}>{content}</span>
    </div>
  );
}

function ShoppingIcon() {
  return <span className="text-base font-black">包</span>;
}
