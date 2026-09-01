"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Database,
  Download,
  KeyRound,
  LogOut,
  PackageCheck,
  Plus,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { daysBetween, isWithinNextDays, todayKey } from "@/lib/date-utils";
import { getDealStatus, hasAmount } from "@/lib/deal-status";
import { commissionAmount, getFinanceSummary } from "@/lib/finance";
import { fullDate, money, shortDate } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Deal } from "@/lib/types";
import { useDeals } from "@/lib/use-deals";
import { AppShell } from "./AppShell";
import { ProductMark } from "./ProductMark";
import { SetupNotice } from "./SetupNotice";
import { StatusChip } from "./StatusChip";

export function Dashboard() {
  const router = useRouter();
  const { deals, loading, error } = useDeals("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const activeDeals = deals.filter((item) => !item.completed && !item.archived_at);
  const completedDeals = deals.filter((item) => item.completed || item.archived_at);
  const focusItems = useMemo(() => getFocusItems(activeDeals), [activeDeals]);
  const recentDeals = useMemo(() => [...deals].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5), [deals]);
  const finance = getFinanceSummary(deals, "all");
  const pendingCommissionDeals = deals.filter((deal) => !deal.payment_received && commissionAmount(deal) > 0).length;
  const pendingPrincipalDeals = deals.filter((deal) => !deal.refund_received && hasAmount(deal.advance_amount)).length;

  useEffect(() => {
    if (!supabase) return;
    async function loadUser() {
      const { data } = await supabase!.auth.getSession();
      setUser(data.session?.user || null);
    }
    loadUser();
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
    router.push("/login");
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError(false);

    if (!supabase) {
      setProfileError(true);
      setProfileMessage("当前是演示模式，配置 Supabase 后才能修改密码。");
      return;
    }

    if (newPassword.length < 6) {
      setProfileError(true);
      setProfileMessage("新密码至少需要 6 位。");
      return;
    }

    if (newPassword !== confirmPassword) {
      setProfileError(true);
      setProfileMessage("两次输入的新密码不一致。");
      return;
    }

    setPasswordSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);

    if (updateError) {
      setProfileError(true);
      setProfileMessage(updateError.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordOpen(false);
    setProfileMessage("密码已更新，下次登录请使用新密码。");
  }

  function exportDeals() {
    const columns = ["状态", "品牌", "产品", "品类", "合作形式", "是否垫付", "本金", "佣金", "接单日期", "最晚拍摄", "最晚发布", "已收货", "已发布", "返本情况", "返佣情况", "完成时间", "备注"];
    const rows = deals.map((deal) => [
      getDealStatus(deal),
      deal.brand || "",
      deal.product_name || "",
      deal.product_category || "",
      deal.collaboration_type || "",
      deal.advance_required ? "需要垫付" : "不垫付",
      deal.advance_amount || "",
      deal.base_fee || deal.commission || "",
      deal.cooperation_date || "",
      deal.shoot_deadline || "",
      deal.publish_deadline || "",
      deal.received_date ? "已收货" : "",
      deal.publish_date ? "已发布" : "",
      deal.refund_received ? "已返本" : "",
      deal.payment_received ? "已返佣" : "",
      deal.archived_at || "",
      deal.notes || "",
    ]);
    const table = [columns, ...rows]
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeCell(String(cell))}</td>`).join("")}</tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${table}</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `creator-deals-${new Date().toISOString().slice(0, 10)}.xls`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <header className="flex items-start justify-between gap-4 pt-2">
        <button type="button" onClick={() => setProfileOpen(true)} className="flex min-w-0 items-center gap-3 rounded-2xl text-left" aria-label="打开我的">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eadcff,#ffe3ef)] text-lg font-black">R</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-muted">Welcome back,</p>
            <h1 className="truncate text-2xl font-black leading-tight">Raine</h1>
          </div>
        </button>
        <Link href="/deals/new" className="primary-icon-button !h-11 !w-11" aria-label="新建合作">
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      {!isSupabaseConfigured ? <div className="mt-5"><SetupNotice /></div> : null}
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <section className="mt-7">
        <h2 className="text-[36px] font-black leading-none">{loading ? "读取中..." : "首页"}</h2>
      </section>

      <HomeSection title="需要关注" count={focusItems.length}>
        {focusItems.length ? (
          <div className="space-y-2.5">{focusItems.map((item) => <FocusCard key={item.id} item={item} />)}</div>
        ) : (
          <EmptyLine icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} text="暂时没有需要特别关注的合作" />
        )}
      </HomeSection>

      <HomeSection title="财务提醒">
        <div className="grid gap-2.5">
          <FinanceReminder icon={<CircleDollarSign className="h-5 w-5" />} title="待收佣金" value={money(finance.pendingCommission) || "¥0"} subtitle={`来自 ${pendingCommissionDeals} 个合作`} tone="violet" />
          {finance.pendingPrincipal > 0 ? <FinanceReminder icon={<WalletCards className="h-5 w-5" />} title="待返本金" value={money(finance.pendingPrincipal) || "¥0"} subtitle={`来自 ${pendingPrincipalDeals} 个合作`} tone="yellow" /> : null}
        </div>
      </HomeSection>

      <HomeSection title="合作统计">
        <div className="grid grid-cols-3 gap-2.5">
          <MiniStat label="合作总数" value={deals.length} />
          <MiniStat label="进行中" value={activeDeals.length} />
          <MiniStat label="已完成" value={completedDeals.length} />
        </div>
      </HomeSection>

      <HomeSection title="最近合作">
        {recentDeals.length ? (
          <div className="space-y-2.5">{recentDeals.map((deal) => <RecentDeal key={deal.id} deal={deal} />)}</div>
        ) : (
          <EmptyLine icon={<Plus className="h-5 w-5 text-violet-500" />} text="还没有合作记录" />
        )}
      </HomeSection>

      {profileOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 px-3 pb-3" onClick={() => setProfileOpen(false)}>
          <div className="max-h-[86svh] w-full max-w-[430px] overflow-y-auto rounded-[30px] border border-black/[0.06] bg-white p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eadcff,#ffe3ef)] text-lg font-black">R</div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black">我的</h2>
                  <p className="truncate text-sm font-bold text-muted">{user?.email || "演示账号"}</p>
                </div>
              </div>
              <button type="button" onClick={() => setProfileOpen(false)} className="icon-button !h-10 !w-10 shrink-0" aria-label="关闭">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <MiniStat label="合作中" value={activeDeals.length} />
              <MiniStat label="已完成" value={completedDeals.length} />
              <MiniStat label="待关注" value={focusItems.length} urgent={focusItems.some((item) => item.risk === "high")} />
            </div>

            {profileMessage ? <p className={`mt-4 rounded-[18px] p-3 text-sm font-bold ${profileError ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>{profileMessage}</p> : null}

            <ProfileGroup title="账号安全">
              <ProfileAction
                icon={<KeyRound className="h-5 w-5" />}
                title="修改密码"
                subtitle="已登录时可直接更新当前账号密码。"
                onClick={() => {
                  setPasswordOpen((value) => !value);
                  setProfileMessage("");
                  setProfileError(false);
                }}
              />
              {passwordOpen ? (
                <form onSubmit={updatePassword} className="mt-3 space-y-3 rounded-[20px] bg-warm/65 p-3">
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="新密码，至少 6 位" className="w-full rounded-[16px] bg-white px-4 py-3 text-sm font-bold outline-none" minLength={6} required />
                  <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="再次输入新密码" className="w-full rounded-[16px] bg-white px-4 py-3 text-sm font-bold outline-none" minLength={6} required />
                  <button className="primary-button w-full justify-center py-3 text-sm" disabled={passwordSaving}>{passwordSaving ? "更新中..." : "保存新密码"}</button>
                </form>
              ) : null}
              <ProfileAction icon={<ShieldCheck className="h-5 w-5" />} title="登录状态" subtitle="登录成功后会自动保持会话。" />
            </ProfileGroup>

            <ProfileGroup title="数据">
              <ProfileAction href="/deals/archived" icon={<Archive className="h-5 w-5" />} title="已完成合作" />
              <ProfileAction href="/deals/trash" icon={<Trash2 className="h-5 w-5" />} title="垃圾桶" subtitle="删除后的合作会保留 30 天。" />
              <ProfileAction icon={<Download className="h-5 w-5" />} title="导出数据" subtitle="导出为 Excel 可打开的表格文件。" onClick={exportDeals} />
              <ProfileAction icon={<Database className="h-5 w-5" />} title="云端保存" subtitle="合作数据保存在 Supabase，刷新和重新登录后仍会保留。" />
            </ProfileGroup>

            {isSupabaseConfigured ? (
              <button onClick={signOut} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-warm/70 px-5 py-3 text-sm font-black text-muted">
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

type FocusItem = {
  id: string;
  dealId: string;
  type: "shoot" | "publish" | "payment";
  title: string;
  product: string;
  label: string;
  dateLabel: string;
  footnote: string;
  risk: "high" | "normal";
};

function getFocusItems(deals: Deal[]): FocusItem[] {
  const today = todayKey();
  const items: FocusItem[] = [];

  for (const deal of deals) {
    const status = getDealStatus(deal);
    if (status === "待发布" && deal.shoot_deadline && isWithinNextDays(deal.shoot_deadline, 7, today)) {
      const left = daysBetween(today, deal.shoot_deadline);
      items.push({
        id: `${deal.id}-shoot`,
        dealId: deal.id,
        type: "shoot",
        title: deal.brand || "未命名品牌",
        product: deal.product_name || "合作",
        label: "即将到期拍摄",
        dateLabel: `最晚拍摄：${fullDate(deal.shoot_deadline)}`,
        footnote: left <= 0 ? "今天到期" : `剩余 ${left} 天`,
        risk: left <= 2 ? "high" : "normal",
      });
    }

    if (deal.shoot_date && !deal.publish_date && deal.publish_deadline) {
      const left = daysBetween(today, deal.publish_deadline);
      items.push({
        id: `${deal.id}-publish`,
        dealId: deal.id,
        type: "publish",
        title: deal.brand || "未命名品牌",
        product: deal.product_name || "合作",
        label: "未完成发布",
        dateLabel: `最晚发布时间：${fullDate(deal.publish_deadline)}`,
        footnote: left < 0 ? `已超过 ${Math.abs(left)} 天` : left === 0 ? "今天到期" : `剩余 ${left} 天`,
        risk: left <= 2 ? "high" : "normal",
      });
    }

    const commission = commissionAmount(deal);
    if (commission > 0 && !deal.payment_received) {
      items.push({
        id: `${deal.id}-payment`,
        dealId: deal.id,
        type: "payment",
        title: deal.brand || "未命名品牌",
        product: deal.product_name || "合作",
        label: "待收合作佣金",
        dateLabel: deal.expected_payment_date ? `预计回款：${fullDate(deal.expected_payment_date)}` : "待确认收款",
        footnote: money(commission) || "",
        risk: "normal",
      });
    }
  }

  const order = { shoot: 0, publish: 1, payment: 2 };
  return items.sort((a, b) => order[a.type] - order[b.type]).slice(0, 8);
}

function HomeSection({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        {typeof count === "number" ? <span className="rounded-full bg-white/72 px-3 py-1 text-sm font-black text-muted">{count}</span> : null}
      </div>
      {children}
    </section>
  );
}

function FocusCard({ item }: { item: FocusItem }) {
  const tone = item.risk === "high"
    ? "border-rose-200 bg-[linear-gradient(135deg,#fff7f8,#ffe7ed)]"
    : item.type === "payment"
      ? "border-violet-200 bg-[linear-gradient(135deg,#fbf7ff,#f0e6ff)]"
      : "border-blue-200 bg-[linear-gradient(135deg,#f7fbff,#e9f3ff)]";
  const Icon = item.type === "shoot" ? PackageCheck : item.type === "publish" ? Clock : CircleDollarSign;

  return (
    <Link href={`/deals/${item.dealId}`} className="block rounded-[24px] focus:outline-none focus:ring-4 focus:ring-violet-200">
      <article className={`flex min-w-0 gap-3 rounded-[22px] border p-3.5 ${tone}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-white/70">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-black">{item.title}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-muted">{item.product}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${item.risk === "high" ? "bg-rose-100 text-rose-600" : "bg-white/72 text-muted"}`}>{item.label}</span>
          </div>
          <p className="mt-3 text-sm font-bold text-muted">{item.dateLabel}</p>
          <p className={`mt-1 text-sm font-black ${item.risk === "high" ? "text-rose-600" : "text-ink"}`}>{item.footnote}</p>
        </div>
      </article>
    </Link>
  );
}

function RecentDeal({ deal }: { deal: Deal }) {
  const commission = commissionAmount(deal);
  return (
    <Link href={`/deals/${deal.id}`} className="block rounded-[22px] focus:outline-none focus:ring-4 focus:ring-violet-200">
      <article className="flex min-w-0 items-center gap-3 rounded-[22px] border border-black/[0.05] bg-white/78 p-3">
        <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-black">{deal.brand || "未命名品牌"}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-muted">{deal.product_name || "合作"}</p>
            </div>
            <StatusChip status={getDealStatus(deal)} />
          </div>
          <p className="mt-2 truncate text-sm font-bold text-muted">
            {[commission ? money(commission) : "", deal.publish_deadline ? `${shortDate(deal.publish_deadline)}前发布` : ""].filter(Boolean).join(" · ")}
          </p>
        </div>
      </article>
    </Link>
  );
}

function FinanceReminder({ icon, title, value, subtitle, tone }: { icon: ReactNode; title: string; value: string; subtitle: string; tone: "violet" | "yellow" }) {
  const colors = {
    violet: "border-violet-200 bg-[linear-gradient(135deg,#fbf7ff,#f0e6ff)] text-violet-900",
    yellow: "border-amber-200 bg-[linear-gradient(135deg,#fffaf0,#fff0c7)] text-amber-950",
  }[tone];

  return (
    <div className={`flex items-center gap-3 rounded-[22px] border p-4 ${colors}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/65">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-muted">{title}</p>
        <p className="mt-1 truncate text-2xl font-black">{value}</p>
      </div>
      <p className="shrink-0 text-right text-xs font-black text-muted">{subtitle}</p>
    </div>
  );
}

function EmptyLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-black/[0.05] bg-white/78 p-4 text-sm font-bold text-muted">
      {icon}
      {text}
    </div>
  );
}

function escapeCell(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function MiniStat({ label, value, urgent }: { label: string; value: string | number; urgent?: boolean }) {
  return (
    <div className="rounded-[18px] border border-black/[0.04] bg-white/80 p-3">
      <p className="text-xs font-black text-muted">{label}</p>
      <p className={`mt-1 truncate text-lg font-black ${urgent ? "text-red-500" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function ProfileGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="px-1 text-xs font-black uppercase text-muted">{title}</h3>
      <div className="mt-2 overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">{children}</div>
    </section>
  );
}

function ProfileAction({ icon, title, subtitle, href, onClick }: { icon: ReactNode; title: string; subtitle?: string; href?: string; onClick?: () => void }) {
  const content = (
    <div className="flex min-h-[64px] items-center gap-3 border-b border-black/[0.05] px-3 py-3 last:border-b-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-warm text-ink">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-black">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs font-bold leading-5 text-muted">{subtitle}</p> : null}
      </div>
      {href || onClick ? <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted" /> : null}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="w-full text-left">{content}</button>;
  return content;
}
