"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendarEvents } from "@/lib/deal-status";
import { monthMatrix, monthTitle, todayKey } from "@/lib/date-utils";
import { fullDate, money } from "@/lib/format";
import { useDeals } from "@/lib/use-deals";
import { useDailyEarnings } from "@/lib/use-daily-earnings";
import { AppShell } from "./AppShell";

const week = ["日", "一", "二", "三", "四", "五", "六"];
const labelOrder = ["待发布", "已发布", "已完成"];

export function CalendarPage() {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(todayKey());
  const { deals, error } = useDeals(false);
  const { earnings, error: earningsError } = useDailyEarnings();
  const events = getCalendarEvents(deals);

  const days = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, typeof events>>((map, event) => {
      map[event.date] = [...(map[event.date] || []), event];
      return map;
    }, {});
  }, [events]);
  const selectedGroups = useMemo(() => groupCalendarEvents(eventsByDate[selected] || []), [eventsByDate, selected]);
  const earningsByDate = useMemo(() => {
    return earnings.reduce<Record<string, number>>((map, item) => {
      map[item.earning_date] = (map[item.earning_date] || 0) + Number(item.amount || 0);
      return map;
    }, {});
  }, [earnings]);
  const monthStats = useMemo(() => {
    const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    const monthDeals = events.filter((event) => event.date.startsWith(monthKey));
    const dealIds = new Set(monthDeals.map((event) => event.dealId));
    const creatorRevenue = earnings
      .filter((item) => item.earning_date.startsWith(monthKey))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { dealCount: dealIds.size, creatorRevenue };
  }, [cursor.month, cursor.year, earnings, events]);
  const selectedEarning = useMemo(() => earnings.find((item) => item.earning_date === selected), [earnings, selected]);

  function moveMonth(amount: number) {
    const date = new Date(cursor.year, cursor.month + amount, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  }

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="text-[38px] font-black leading-none">日历</h1>
      </header>
      {error || earningsError ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error || earningsError}</p> : null}

      <section className="mt-5 grid grid-cols-2 gap-3">
        <CalendarStat label={`${cursor.month + 1}月合作`} value={`${monthStats.dealCount}`} />
        <CalendarStat label="创作者收益" value={money(monthStats.creatorRevenue) || "¥0"} />
      </section>

      <section className="mt-5 rounded-[26px] bg-transparent p-1">
        <div className="mb-4 flex items-center justify-between">
          <button className="icon-button !h-10 !w-10" onClick={() => moveMonth(-1)} aria-label="上个月">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-black">{monthTitle(cursor.year, cursor.month)}</h2>
          <button className="icon-button !h-10 !w-10" onClick={() => moveMonth(1)} aria-label="下个月">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {week.map((item) => <div key={item} className="text-sm font-black text-muted">{item}</div>)}
          {days.map((day) => {
            const dayEvents = eventsByDate[day.key] || [];
            const dailyEarning = earningsByDate[day.key] || 0;
            const active = day.key === selected;
            return (
              <button
                key={day.key}
                onClick={() => setSelected(day.key)}
                className={`mx-auto flex h-[62px] w-full flex-col items-center justify-center rounded-[14px] border text-base font-black ${
                  active ? "border-black bg-black text-white" : day.inMonth ? "border-stone-200 bg-white/74 text-ink" : "border-stone-100 bg-white/45 text-stone-300"
                }`}
              >
                <span>{day.day}</span>
                {dailyEarning ? <span className={`mt-0.5 max-w-full truncate px-1 text-[10px] font-black leading-none ${active ? "text-emerald-200" : "text-emerald-600"}`}>{compactMoney(dailyEarning)}</span> : null}
                <span className="mt-0.5 flex h-1.5 max-w-10 gap-0.5 overflow-hidden">
                  {uniqueLabelEvents(dayEvents).slice(0, 4).map((event) => (
                    <span key={`${event.label}-${event.type}`} className={`h-1.5 w-3 shrink-0 rounded-full ${calendarTone(event).dot}`} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-black">{selected.slice(5).replace("-", "月")}日安排</h2>
        <div className="space-y-3">
          {selectedEarning ? (
            <article className="rounded-[22px] border border-emerald-200 bg-[linear-gradient(135deg,#f6fff9,#e3f8ec)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-emerald-700">每日收益</p>
                  <p className="mt-1 text-sm font-bold text-muted">{fullDate(selectedEarning.earning_date)}</p>
                  {selectedEarning.notes ? <p className="mt-2 text-sm font-bold leading-5 text-muted">{selectedEarning.notes}</p> : null}
                </div>
                <p className="shrink-0 text-xl font-black text-emerald-900">{money(selectedEarning.amount) || "¥0"}</p>
              </div>
            </article>
          ) : null}
          {selectedGroups.length ? selectedGroups.map((group) => {
            const tone = calendarTone(group.items[0]);
            return (
              <details key={group.label} open className={`rounded-[22px] border ${tone.panel}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-3 w-3 shrink-0 rounded-full ${tone.dot}`} />
                    <div className="min-w-0">
                      <p className="text-lg font-black">{group.label}</p>
                      <p className="text-sm font-bold text-muted">{group.items.length} 条合作</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${tone.badge}`}>{group.items.length}</span>
                </summary>
                <div className="space-y-2 px-3 pb-3">
                  {group.items.map((event) => (
                    <Link key={event.id} href={`/deals/${event.dealId}`} className="block rounded-[18px] focus:outline-none focus:ring-4 focus:ring-violet-200">
                      <article className="flex min-w-0 items-center justify-between gap-3 rounded-[18px] bg-white/78 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-black">{event.title}</p>
                          <p className={`mt-1 text-sm font-bold ${event.overdue ? "text-red-500" : "text-muted"}`}>最晚发布日</p>
                        </div>
                        {event.amount ? <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black">{money(event.amount)}</span> : null}
                      </article>
                    </Link>
                  ))}
                </div>
              </details>
            );
          }) : !selectedEarning ? (
            <div className="card p-5 text-center text-sm font-bold text-muted">这天没有安排</div>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}

function uniqueLabelEvents(events: ReturnType<typeof getCalendarEvents>) {
  return events.filter((event, index, source) => source.findIndex((item) => item.label === event.label) === index);
}

function groupCalendarEvents(events: ReturnType<typeof getCalendarEvents>) {
  const groups = events.reduce<Record<string, typeof events>>((map, event) => {
    map[event.label] = [...(map[event.label] || []), event];
    return map;
  }, {});

  return Object.entries(groups)
    .map(([label, items]) => ({ label, items }))
    .sort((a, b) => labelOrder.indexOf(a.label) - labelOrder.indexOf(b.label));
}

function calendarTone(event: ReturnType<typeof getCalendarEvents>[number]) {
  if (event.overdue) {
    return {
      dot: "bg-rose-500",
      panel: "border-rose-200 bg-[linear-gradient(135deg,#fff6f8,#ffe4ea)]",
      badge: "bg-rose-100 text-rose-600",
    };
  }

  const byLabel: Record<string, { dot: string; panel: string; badge: string }> = {
    待发布: {
      dot: "bg-rose-500",
      panel: "border-rose-200 bg-[linear-gradient(135deg,#fff7f8,#ffe8ee)]",
      badge: "bg-rose-100 text-rose-700",
    },
    已发布: {
      dot: "bg-emerald-500",
      panel: "border-emerald-200 bg-[linear-gradient(135deg,#f4fff8,#dff8eb)]",
      badge: "bg-emerald-100 text-emerald-700",
    },
    已完成: {
      dot: "bg-stone-400",
      panel: "border-stone-200 bg-[linear-gradient(135deg,#ffffff,#f2f2f4)]",
      badge: "bg-stone-100 text-stone-600",
    },
  };

  return byLabel[event.label] || {
    dot: "bg-stone-400",
    panel: "border-stone-200 bg-white/78",
    badge: "bg-stone-100 text-stone-600",
  };
}

function compactMoney(value: number) {
  if (value >= 10000) return `¥${Math.round(value / 10000)}w`;
  return `¥${Math.round(value)}`;
}

function CalendarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-black/[0.05] bg-white/76 p-4">
      <p className="text-sm font-black text-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-black text-ink">{value}</p>
    </div>
  );
}
