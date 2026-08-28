import Link from "next/link";
import { CalendarDays, WalletCards } from "lucide-react";
import type { Deal } from "@/lib/types";
import { displayTitle, money, shortDate } from "@/lib/format";
import { ProductMark } from "./ProductMark";

export function DealCard({ deal }: { deal: Deal }) {
  const fee = money(deal.base_fee);
  const advance = money(deal.advance_amount);
  const deadline = shortDate(deal.publish_deadline);

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block rounded-[28px] focus:outline-none focus:ring-4 focus:ring-violet-200"
    >
      <article className="card flex gap-3.5 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
        <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} />
        <div className="min-w-0 flex-1 py-1">
          <div className="min-w-0">
              <h2 className="truncate text-lg font-black leading-tight">
              {displayTitle(deal.brand, deal.product_name)}
            </h2>
            {deal.platform ? (
              <p className="mt-1 text-sm font-semibold text-pink">{deal.platform}</p>
            ) : null}
          </div>
          <div className="mt-2.5 space-y-1.5 text-sm text-muted">
            {deadline ? (
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>最晚发布 {deadline}</span>
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
      </article>
    </Link>
  );
}
