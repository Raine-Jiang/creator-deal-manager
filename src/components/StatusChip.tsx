import type { DealStatus } from "@/lib/types";
import { statusMeta } from "@/lib/deal-status";

export function StatusChip({ status }: { status: DealStatus }) {
  const meta = statusMeta[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${meta.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}
