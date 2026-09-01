import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Deal } from "@/lib/types";
import { getDealStatus } from "@/lib/deal-status";
import { displayTitle, money, shortDate } from "@/lib/format";
import { ProductMark } from "./ProductMark";
import { StatusChip } from "./StatusChip";

export function DealCard({ deal }: { deal: Deal }) {
  const advance = money(deal.advance_amount);
  const status = getDealStatus(deal);
  const visual = cardVisual(status);
  const detailParts = [
    shortDate(deal.publish_deadline) || "未定",
    deal.collaboration_type,
    advance,
    deal.advance_required ? "需垫付" : "未垫付",
  ].filter(Boolean);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block rounded-[28px] focus:outline-none focus:ring-4 focus:ring-violet-200"
    >
      <article className={`relative flex gap-3.5 overflow-hidden rounded-[24px] border p-3.5 transition duration-200 hover:-translate-y-0.5 ${visual.card}`}>
        <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} />
        <div className="min-w-0 flex-1 py-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-black leading-tight">
                {displayTitle(deal.brand, deal.product_name)}
              </h2>
              {deal.product_category ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white/72 px-2.5 py-0.5 text-xs font-black text-violet-600">{deal.product_category}</span>
                </div>
              ) : null}
            </div>
            <StatusChip status={status} />
          </div>
          <div className="mt-2.5 space-y-1.5 text-sm font-bold text-muted">
            <p className="flex min-w-0 items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className="truncate">{detailParts.join(" ")}</span>
            </p>
            {deal.notes ? <p className="line-clamp-1">备注：{deal.notes}</p> : null}
          </div>
        </div>
      </article>
    </Link>
  );
}

function cardVisual(status: ReturnType<typeof getDealStatus>) {
  const map = {
    待发布: {
      card: "border-amber-200 bg-[linear-gradient(135deg,#fffaf2,#fff2dd)]",
    },
    已发布: {
      card: "border-blue-200 bg-[linear-gradient(135deg,#f5fbff,#e2f0ff)]",
    },
    已完成: {
      card: "border-emerald-200 bg-[linear-gradient(135deg,#f6fff4,#e5fbdc)]",
    },
  };
  return map[status];
}
