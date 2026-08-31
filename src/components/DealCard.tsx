import Link from "next/link";
import { CalendarDays, WalletCards } from "lucide-react";
import type { Deal } from "@/lib/types";
import { getDealStatus, getDealTasks } from "@/lib/deal-status";
import { displayTitle, money, shortDate } from "@/lib/format";
import { ProductMark } from "./ProductMark";
import { StatusChip } from "./StatusChip";

export function DealCard({ deal }: { deal: Deal }) {
  const fee = money(deal.base_fee);
  const advance = money(deal.advance_amount);
  const status = getDealStatus(deal);
  const nextTask = getDealTasks(deal)[0];
  const visual = cardVisual(status, Boolean(nextTask?.overdue));

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block rounded-[28px] focus:outline-none focus:ring-4 focus:ring-violet-200"
    >
      <article className={`relative flex gap-3.5 overflow-hidden rounded-[24px] border p-3.5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-lift ${visual.card}`}>
        <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} />
        <div className="min-w-0 flex-1 py-1 pr-8">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black leading-tight">
                {displayTitle(deal.brand, deal.product_name)}
              </h2>
              {deal.platform || deal.product_category ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {deal.product_category ? <span className="rounded-full bg-white/72 px-2.5 py-0.5 text-xs font-black text-violet-600">{deal.product_category}</span> : null}
                  {deal.platform ? <span className="rounded-full bg-white/72 px-2.5 py-0.5 text-xs font-black text-muted">{deal.platform}</span> : null}
                </div>
              ) : null}
            </div>
            <StatusChip status={status} />
          </div>
          <div className="mt-2.5 space-y-1.5 text-sm text-muted">
            {nextTask ? (
              <p className={`flex min-w-0 items-center gap-2 ${nextTask.overdue ? "text-red-500" : ""}`}>
                <CalendarDays className="h-4 w-4" />
                <span className="truncate">
                  {nextTask.overdue ? `逾期 ${nextTask.daysOverdue} 天` : shortDate(nextTask.date)} · {nextTask.subtitle}
                </span>
              </p>
            ) : null}
            {fee || advance ? (
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <WalletCards className="h-4 w-4" />
                {fee ? <span>合作费 <b className="text-pink">{fee}</b></span> : null}
                {advance ? <span>垫付 <b className="text-blue">{advance}</b></span> : null}
              </p>
            ) : null}
            {deal.notes ? <p className="line-clamp-1">{deal.notes}</p> : null}
          </div>
        </div>
        <span className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full text-lg font-black ${visual.face}`}>
          :)
        </span>
      </article>
    </Link>
  );
}

function cardVisual(status: ReturnType<typeof getDealStatus>, overdue: boolean) {
  if (overdue) {
    return {
      card: "border-rose-200 bg-[linear-gradient(135deg,#fff7f8,#ffe5eb)]",
      face: "bg-rose-300/70 text-rose-900",
    };
  }

  const map = {
    待拍摄: {
      card: "border-orange-200 bg-[linear-gradient(135deg,#fffaf3,#fff0dc)]",
      face: "bg-amber-300/80 text-amber-950",
    },
    待发布: {
      card: "border-violet-200 bg-[linear-gradient(135deg,#fcf8ff,#efe3ff)]",
      face: "bg-violet-300/70 text-violet-950",
    },
    待收款: {
      card: "border-blue-200 bg-[linear-gradient(135deg,#f5fbff,#e2f0ff)]",
      face: "bg-blue-300/70 text-blue-950",
    },
    已完成: {
      card: "border-emerald-200 bg-[linear-gradient(135deg,#f6fff4,#e5fbdc)]",
      face: "bg-lime-300/80 text-lime-950",
    },
    待处理: {
      card: "border-stone-200 bg-white/82",
      face: "bg-stone-200 text-stone-700",
    },
  };
  return map[status];
}
