"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCalendarEvents, taskMeta } from "@/lib/deal-status";
import { monthMatrix, monthTitle, todayKey } from "@/lib/date-utils";
import { money } from "@/lib/format";
import { useDeals } from "@/lib/use-deals";
import { AppShell } from "./AppShell";

const week = ["日", "一", "二", "三", "四", "五", "六"];
const labelOrder = ["合作建联", "收货", "最晚拍摄", "已拍摄", "最晚发布", "已发布", "预计回款", "合作费到账", "预计返本", "本金已返"];

export function CalendarPage() {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(todayKey());
  const { deals, error } = useDeals(false);
  const events = getCalendarEvents(deals);

  const days = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, typeof events>>((map, event) => {
      map[event.date] = [...(map[event.date] || []), event];
      return map;
    }, {});
  }, [events]);
  const selectedGroups = useMemo(() => groupCalendarEvents(eventsByDate[selected] || []), [eventsByDate, selected]);

  function moveMonth(amount: number) {
    const date = new Date(cursor.year, cursor.month + amount, 1);
    setCursor({ year: date.getFullYear(), month: date.getMonth() });
  }

  return (
    <AppShell>
      <header className="pt-2">
        <h1 className="text-[38px] font-black leading-none">日历</h1>
      </header>
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

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
            const active = day.key === selected;
            return (
              <button
                key={day.key}
                onClick={() => setSelected(day.key)}
                className={`mx-auto flex h-[54px] w-full flex-col items-center justify-center rounded-[14px] border text-base font-black ${
                  active ? "border-black bg-black text-white" : day.inMonth ? "border-stone-200 bg-white/74 text-ink" : "border-stone-100 bg-white/45 text-stone-300"
                }`}
              >
                <span>{day.day}</span>
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
                          <p className={`mt-1 text-sm font-bold ${event.overdue ? "text-red-500" : "text-muted"}`}>{event.overdue ? "已逾期" : event.completed ? "已记录" : "待处理"}</p>
                        </div>
                        {event.amount ? <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-black">{money(event.amount)}</span> : null}
                      </article>
                    </Link>
                  ))}
                </div>
              </details>
            );
          }) : (
            <div className="card p-5 text-center text-sm font-bold text-muted">这天没有安排</div>
          )}
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
    合作建联: {
      dot: "bg-stone-600",
      panel: "border-stone-200 bg-[linear-gradient(135deg,#ffffff,#f3f1f8)]",
      badge: "bg-stone-100 text-stone-700",
    },
    收货: {
      dot: "bg-sky-400",
      panel: "border-sky-200 bg-[linear-gradient(135deg,#f4fbff,#e2f3ff)]",
      badge: "bg-sky-100 text-sky-700",
    },
    最晚拍摄: {
      dot: "bg-orange-400",
      panel: "border-orange-200 bg-[linear-gradient(135deg,#fff9ef,#ffecd5)]",
      badge: "bg-orange-100 text-orange-700",
    },
    已拍摄: {
      dot: "bg-lime-500",
      panel: "border-lime-200 bg-[linear-gradient(135deg,#f7ffef,#e7fbd4)]",
      badge: "bg-lime-100 text-lime-700",
    },
    最晚发布: {
      dot: "bg-violet-500",
      panel: "border-violet-200 bg-[linear-gradient(135deg,#fbf7ff,#efddff)]",
      badge: "bg-violet-100 text-violet-700",
    },
    已发布: {
      dot: "bg-blue-500",
      panel: "border-blue-200 bg-[linear-gradient(135deg,#f5fbff,#ddecff)]",
      badge: "bg-blue-100 text-blue-700",
    },
    预计回款: {
      dot: "bg-fuchsia-500",
      panel: "border-fuchsia-200 bg-[linear-gradient(135deg,#fff7fd,#f7ddff)]",
      badge: "bg-fuchsia-100 text-fuchsia-700",
    },
    合作费到账: {
      dot: "bg-emerald-500",
      panel: "border-emerald-200 bg-[linear-gradient(135deg,#f4fff8,#dff8eb)]",
      badge: "bg-emerald-100 text-emerald-700",
    },
    预计返本: {
      dot: "bg-amber-500",
      panel: "border-amber-200 bg-[linear-gradient(135deg,#fffdf0,#fff0bd)]",
      badge: "bg-amber-100 text-amber-700",
    },
    本金已返: {
      dot: "bg-teal-500",
      panel: "border-teal-200 bg-[linear-gradient(135deg,#f3fffd,#d8f8ef)]",
      badge: "bg-teal-100 text-teal-700",
    },
  };

  return byLabel[event.label] || {
    dot: taskMeta[event.type].dot,
    panel: "border-stone-200 bg-white/78",
    badge: taskMeta[event.type].tone,
  };
}
