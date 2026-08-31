import Link from "next/link";
import { Camera, CircleDollarSign, Handshake, RotateCcw, Send } from "lucide-react";
import { money, shortDate } from "@/lib/format";
import { taskMeta } from "@/lib/deal-status";
import type { TaskItem, TaskType } from "@/lib/types";

const icons: Record<TaskType, typeof Camera> = {
  cooperation: Handshake,
  shoot: Camera,
  publish: Send,
  payment: CircleDollarSign,
  refund: RotateCcw,
};

export function TaskCard({ task }: { task: TaskItem }) {
  const Icon = icons[task.type];
  const meta = taskMeta[task.type];

  return (
    <Link href={`/deals/${task.dealId}`} className="block rounded-[22px] focus:outline-none focus:ring-4 focus:ring-violet-200">
      <article className="flex min-w-0 items-center gap-3 rounded-[18px] border border-black/[0.04] bg-white/82 p-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${task.overdue ? "bg-orange-500 text-white" : meta.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-black">{task.title}</p>
          <p className={`mt-1 text-sm font-bold ${task.overdue ? "text-red-500" : "text-muted"}`}>
            {task.overdue ? `逾期 ${task.daysOverdue} 天` : shortDate(task.date)} · {meta.label}
          </p>
        </div>
        {task.amount ? (
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${task.overdue ? "bg-red-50 text-red-500" : meta.tone}`}>
            {money(task.amount)}
          </span>
        ) : (
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-black ${meta.tone}`}>{meta.label}</span>
        )}
      </article>
    </Link>
  );
}
