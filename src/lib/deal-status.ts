import type { CalendarEvent, Deal, DealStatus, TaskItem, TaskType } from "./types";
import { daysBetween, isPast, isSameDay, isWithinNextDays, todayKey } from "./date-utils";

export const statusMeta: Record<DealStatus, { tone: string; dot: string }> = {
  待处理: { tone: "bg-stone-100 text-stone-600", dot: "bg-stone-400" },
  待拍摄: { tone: "bg-pink-100 text-pink-600", dot: "bg-pink-500" },
  待发布: { tone: "bg-blue-100 text-blue-600", dot: "bg-blue-500" },
  待收款: { tone: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  已完成: { tone: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

export const taskMeta: Record<TaskType, { label: string; tone: string; dot: string }> = {
  cooperation: { label: "合作", tone: "bg-stone-100 text-stone-600", dot: "bg-stone-500" },
  shoot: { label: "拍摄", tone: "bg-pink-100 text-pink-600", dot: "bg-pink-500" },
  publish: { label: "发布", tone: "bg-blue-100 text-blue-600", dot: "bg-blue-500" },
  payment: { label: "回款", tone: "bg-violet-100 text-violet-600", dot: "bg-violet-500" },
  refund: { label: "返本", tone: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

export function hasAmount(value: number | null | undefined) {
  return typeof value === "number" && value > 0;
}

export function getDealStatus(deal: Deal): DealStatus {
  if (deal.completed) return "已完成";
  if (
    deal.publish_date &&
    ((hasAmount(deal.base_fee) && !deal.payment_received) ||
      (hasAmount(deal.advance_amount) && !deal.refund_received))
  ) {
    return "待收款";
  }
  if (deal.shoot_date && !deal.publish_date) return "待发布";
  if (!deal.shoot_date && !deal.completed) return "待拍摄";
  return "待处理";
}

export function canCompleteDeal(deal: Deal) {
  const feeDone = !hasAmount(deal.base_fee) || deal.payment_received;
  const refundDone = !hasAmount(deal.advance_amount) || deal.refund_received;
  return Boolean(deal.publish_date && feeDone && refundDone);
}

function task(
  deal: Deal,
  type: TaskType,
  date: string | null,
  done: boolean,
  amount?: number | null,
): TaskItem | null {
  if (!date || done) return null;
  const today = todayKey();
  const overdue = isPast(date, today);
  return {
    id: `${deal.id}-${type}-${date}`,
    dealId: deal.id,
    type,
    title: `${deal.brand || "未命名品牌"} ${deal.product_name || ""}`.trim(),
    subtitle: taskMeta[type].label,
    date,
    overdue,
    daysOverdue: overdue ? daysBetween(date, today) : undefined,
    amount,
  };
}

export function getDealTasks(deal: Deal) {
  return [
    task(deal, "shoot", deal.shoot_deadline, Boolean(deal.shoot_date)),
    task(deal, "publish", deal.publish_deadline, Boolean(deal.publish_date)),
    task(deal, "payment", hasAmount(deal.base_fee) ? deal.expected_payment_date : null, deal.payment_received, deal.base_fee),
    task(deal, "refund", hasAmount(deal.advance_amount) ? deal.expected_refund_date : null, deal.refund_received, deal.advance_amount),
  ].filter(Boolean) as TaskItem[];
}

export function getAllTasks(deals: Deal[]) {
  return deals.flatMap(getDealTasks).sort((a, b) => a.date.localeCompare(b.date));
}

export function getTaskGroups(deals: Deal[]) {
  const today = todayKey();
  const tasks = getAllTasks(deals);
  return {
    overdue: tasks.filter((item) => item.overdue),
    today: tasks.filter((item) => isSameDay(item.date, today)),
    next7: tasks.filter((item) => isWithinNextDays(item.date, 7, today)),
  };
}

export function getCalendarEvents(deals: Deal[]): CalendarEvent[] {
  return deals
    .flatMap((deal) => {
      const title = `${deal.brand || "未命名品牌"} ${deal.product_name || ""}`.trim();
      return [
        calendarEvent(deal, "cooperation", "合作建联", deal.cooperation_date || deal.created_at?.slice(0, 10) || null, true, title),
        calendarEvent(deal, "shoot", "收货", deal.received_date, true, title),
        calendarEvent(deal, "shoot", "最晚拍摄", deal.shoot_deadline, Boolean(deal.shoot_date), title),
        calendarEvent(deal, "shoot", "已拍摄", deal.shoot_date, true, title),
        calendarEvent(deal, "publish", "最晚发布", deal.publish_deadline, Boolean(deal.publish_date), title),
        calendarEvent(deal, "publish", "已发布", deal.publish_date, true, title),
        calendarEvent(
          deal,
          "payment",
          "预计回款",
          hasAmount(deal.base_fee) ? deal.expected_payment_date : null,
          deal.payment_received,
          title,
          deal.base_fee,
        ),
        calendarEvent(deal, "payment", "合作费到账", deal.payment_received_date, true, title, deal.base_fee),
        calendarEvent(
          deal,
          "refund",
          "预计返本",
          hasAmount(deal.advance_amount) ? deal.expected_refund_date : null,
          deal.refund_received,
          title,
          deal.advance_amount,
        ),
        calendarEvent(deal, "refund", "本金已返", deal.refund_received_date, true, title, deal.advance_amount),
      ];
    })
    .filter((event): event is CalendarEvent => Boolean(event))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calendarEvent(
  deal: Deal,
  type: TaskType,
  label: string,
  date: string | null,
  completed: boolean,
  title: string,
  amount?: number | null,
): CalendarEvent | null {
  if (!date) return null;
  return {
    id: `${deal.id}-${type}-${label}-${date}`,
    dealId: deal.id,
    date,
    type,
    label,
    title,
    amount: amount || undefined,
    completed,
    overdue: !completed && isPast(date),
  };
}
