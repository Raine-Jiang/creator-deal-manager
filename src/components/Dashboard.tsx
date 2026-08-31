"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, Check, ChevronRight, Database, KeyRound, LogOut, Plus, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getTaskGroups } from "@/lib/deal-status";
import { getFinanceSummary } from "@/lib/finance";
import { money } from "@/lib/format";
import { useDeals } from "@/lib/use-deals";
import { AppShell } from "./AppShell";
import { SetupNotice } from "./SetupNotice";
import { TaskCard } from "./TaskCard";

export function Dashboard() {
  const router = useRouter();
  const { deals, loading, error } = useDeals(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const groups = getTaskGroups(deals);
  const finance = getFinanceSummary(deals);
  const todayCount = groups.today.length;

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

  return (
    <AppShell>
      <header className="flex items-start justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="flex min-w-0 items-center gap-3 rounded-2xl text-left"
          aria-label="打开我的"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eadcff,#ffe3ef)] text-lg font-black shadow-soft">
            R
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-muted">Welcome back,</p>
            <h1 className="truncate text-2xl font-black leading-tight">Raine</h1>
          </div>
        </button>
      </header>

      {!isSupabaseConfigured ? <div className="mt-5"><SetupNotice /></div> : null}
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      <section className="mt-6 overflow-hidden rounded-[30px] bg-transparent">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[40px] font-black leading-[0.95] tracking-normal">
              {loading ? "读取中..." : `今天有 ${todayCount} 件事`}
            </h2>
          </div>
          <div className="mb-1 flex h-20 w-20 shrink-0 rotate-6 items-center justify-center rounded-[24px] bg-yellow-300 text-2xl font-black shadow-soft">
            :)
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <MiniStat label="合作中" value={deals.filter((item) => !item.completed).length} />
          <MiniStat label="逾期" value={groups.overdue.length} urgent />
          <MiniStat label="待收" value={money(finance.pendingPayment)} />
        </div>
      </section>

      <TaskSection title="需要注意" tasks={groups.overdue} icon={<TriangleAlert className="h-4 w-4" />} empty="暂时没有逾期事项" tone="attention" />
      <TaskSection title="今天" tasks={groups.today} empty="今天没有必须处理的合作" tone="today" />
      <TaskSection title="未来 7 天" tasks={groups.next7} empty="未来 7 天很清爽" tone="week" />
      <section className="mt-5 flex items-center justify-between rounded-[24px] border border-lime-200 bg-[linear-gradient(135deg,#f1ffe9,#dffbd2)] p-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
            <Sparkles className="h-4 w-4" />
            小提示
          </div>
          <p className="mt-2 text-sm font-bold leading-5 text-ink">重要合作先填最晚发布和预计回款，首页会自动帮你盯住。</p>
        </div>
        <Link href="/deals/new" className="primary-icon-button !h-12 !w-12" aria-label="新建合作">
          <Plus className="h-6 w-6" />
        </Link>
      </section>

      {profileOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 px-3 pb-3"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="max-h-[86svh] w-full max-w-[430px] overflow-y-auto rounded-[30px] border border-black/[0.06] bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#eadcff,#ffe3ef)] text-lg font-black">R</div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black">我的</h2>
                  <p className="truncate text-sm font-bold text-muted">{user?.email || "演示账号"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="icon-button !h-10 !w-10 shrink-0"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <MiniStat label="合作中" value={deals.filter((item) => !item.completed).length} />
              <MiniStat label="已完成" value={deals.filter((item) => item.completed).length} />
              <MiniStat label="待处理" value={groups.overdue.length + groups.today.length} urgent={groups.overdue.length > 0} />
            </div>

            {profileMessage ? (
              <p className={`mt-4 rounded-[18px] p-3 text-sm font-bold ${profileError ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                {profileMessage}
              </p>
            ) : null}

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
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="新密码，至少 6 位"
                    className="w-full rounded-[16px] bg-white px-4 py-3 text-sm font-bold outline-none"
                    minLength={6}
                    required
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="再次输入新密码"
                    className="w-full rounded-[16px] bg-white px-4 py-3 text-sm font-bold outline-none"
                    minLength={6}
                    required
                  />
                  <button className="primary-button w-full justify-center py-3 text-sm" disabled={passwordSaving}>
                    {passwordSaving ? "更新中..." : "保存新密码"}
                  </button>
                </form>
              ) : null}
              <ProfileAction icon={<ShieldCheck className="h-5 w-5" />} title="登录状态" subtitle="登录成功后会自动保持会话。" />
            </ProfileGroup>

            <ProfileGroup title="数据">
              <ProfileAction href="/deals/archived" icon={<Archive className="h-5 w-5" />} title="已归档合作" />
              <ProfileAction icon={<Database className="h-5 w-5" />} title="云端保存" subtitle="合作数据保存在 Supabase，刷新和重新登录后仍会保留。" />
            </ProfileGroup>

            {isSupabaseConfigured ? (
              <button
                onClick={signOut}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-warm/70 px-5 py-3 text-sm font-black text-muted"
              >
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
      <div className="mt-2 overflow-hidden rounded-[22px] border border-black/[0.06] bg-white">
        {children}
      </div>
    </section>
  );
}

function ProfileAction({
  icon,
  title,
  subtitle,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}) {
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
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }
  return content;
}

function TaskSection({
  title,
  tasks,
  empty,
  icon,
  tone,
}: {
  title: string;
  tasks: ReturnType<typeof getTaskGroups>["today"];
  empty: string;
  icon?: ReactNode;
  tone: "attention" | "today" | "week";
}) {
  const panel = {
    attention: "border-orange-200 bg-[linear-gradient(135deg,#fff4e9,#ffe8dc)] text-orange-600",
    today: "border-violet-200 bg-[linear-gradient(135deg,#fbf4ff,#eedcff)] text-violet-600",
    week: "border-blue-200 bg-[linear-gradient(135deg,#f5fbff,#dcebff)] text-blue-600",
  }[tone];

  return (
    <section className={`mt-5 rounded-[24px] border p-3.5 ${panel}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        {icon}
          <h2 className="text-lg font-black">{title}</h2>
        </div>
        <span className="rounded-full bg-white/64 px-2.5 py-1 text-sm font-black">{tasks.length}</span>
      </div>
      <div className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        ) : (
          <div className="flex items-center gap-3 rounded-[18px] bg-white/78 p-4 text-sm font-bold text-muted">
            <Check className="h-5 w-5 text-emerald-500" />
            {empty}
          </div>
        )}
      </div>
    </section>
  );
}
