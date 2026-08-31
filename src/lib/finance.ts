import type { Deal } from "./types";
import { isPast, todayKey } from "./date-utils";
import { hasAmount } from "./deal-status";

export type CategoryFinance = {
  category: string;
  deals: number;
  received: number;
  pendingPayment: number;
  pendingRefund: number;
};

export function getFinanceSummary(deals: Deal[]) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const today = todayKey();

  return deals.reduce(
    (summary, deal) => {
      if (hasAmount(deal.base_fee) && deal.payment_received) {
        const receivedMonth = (deal.payment_received_date || deal.publish_date || "").slice(0, 7);
        if (receivedMonth === currentMonth) summary.monthReceived += deal.base_fee || 0;
      }

      if (hasAmount(deal.base_fee) && !deal.payment_received) {
        summary.pendingPayment += deal.base_fee || 0;
        if (deal.expected_payment_date && isPast(deal.expected_payment_date, today)) {
          summary.overdueAmount += deal.base_fee || 0;
        }
      }

      if (hasAmount(deal.advance_amount) && !deal.refund_received) {
        summary.pendingRefund += deal.advance_amount || 0;
        if (deal.expected_refund_date && isPast(deal.expected_refund_date, today)) {
          summary.overdueAmount += deal.advance_amount || 0;
        }
      }

      return summary;
    },
    {
      monthReceived: 0,
      pendingPayment: 0,
      pendingRefund: 0,
      overdueAmount: 0,
    },
  );
}

export function getCategoryFinance(deals: Deal[]) {
  const map = new Map<string, CategoryFinance>();

  for (const deal of deals) {
    const category = deal.product_category || "未分类";
    const current = map.get(category) || {
      category,
      deals: 0,
      received: 0,
      pendingPayment: 0,
      pendingRefund: 0,
    };

    current.deals += 1;
    if (hasAmount(deal.base_fee) && deal.payment_received) current.received += deal.base_fee || 0;
    if (hasAmount(deal.base_fee) && !deal.payment_received) current.pendingPayment += deal.base_fee || 0;
    if (hasAmount(deal.advance_amount) && !deal.refund_received) current.pendingRefund += deal.advance_amount || 0;
    map.set(category, current);
  }

  return Array.from(map.values()).sort((a, b) => {
    const amountA = a.received + a.pendingPayment + a.pendingRefund;
    const amountB = b.received + b.pendingPayment + b.pendingRefund;
    return amountB - amountA || b.deals - a.deals;
  });
}
