import type { Deal } from "./types";
import { productCategoryOptions } from "./types";
import { hasAmount } from "./deal-status";

export type FinanceRange = "currentMonth" | "lastMonth" | "quarter" | "year" | "all" | {
  start?: string;
  end?: string;
};

export type CategoryFinance = {
  category: string;
  deals: number;
  totalCommission: number;
  pendingCommission: number;
  totalPrincipal: number;
  pendingPrincipal: number;
};

export type DateBounds = {
  start: number;
  end: number;
};

export function parseMoneyText(value?: string | null) {
  if (!value || value.includes("%")) return 0;
  const normalized = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : 0;
}

export function commissionAmount(deal: Deal) {
  return hasAmount(deal.base_fee) ? deal.base_fee || 0 : parseMoneyText(deal.commission);
}

function financeDate(deal: Deal) {
  return deal.publish_deadline || "";
}

export function filterDealsByFinanceRange(deals: Deal[], range: FinanceRange) {
  if (range === "all") return deals;
  const { start, end } = getFinanceDateBounds(range);
  return deals.filter((deal) => isDateInBounds(financeDate(deal), start, end));
}

export function getFinanceDateBounds(range: FinanceRange): DateBounds {
  if (range === "all") return { start: Number.NEGATIVE_INFINITY, end: Number.POSITIVE_INFINITY };
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  let start = currentMonthStart.getTime();
  let end = currentMonthEnd.getTime();

  if (range === "lastMonth") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime();
  } else if (range === "quarter") {
    start = new Date(now.getFullYear(), now.getMonth() - 2, 1).getTime();
  } else if (range === "year") {
    start = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();
  } else if (typeof range === "object") {
    start = range.start ? new Date(`${range.start}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    end = range.end ? new Date(`${range.end}T23:59:59`).getTime() : Number.POSITIVE_INFINITY;
  }

  return { start, end };
}

export function isDateInBounds(value: string | null | undefined, start: number, end: number) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`).getTime();
  return !Number.isNaN(date) && date >= start && date <= end;
}

export function getFinanceSummary(deals: Deal[], range: FinanceRange = "currentMonth") {
  const scopedDeals = filterDealsByFinanceRange(deals, range);
  const principalDeals = deals;
  return {
    totalCommission: scopedDeals.reduce((total, deal) => total + commissionAmount(deal), 0),
    pendingCommission: scopedDeals.reduce((total, deal) => total + (!deal.payment_received ? commissionAmount(deal) : 0), 0),
    totalPrincipal: principalDeals.reduce((total, deal) => total + (deal.advance_amount || 0), 0),
    pendingPrincipal: principalDeals.reduce((total, deal) => total + (!deal.refund_received ? deal.advance_amount || 0 : 0), 0),
  };
}

export function getCategoryFinance(deals: Deal[]) {
  const map = new Map<string, CategoryFinance>();
  for (const category of productCategoryOptions) {
    map.set(category, {
      category,
      deals: 0,
      totalCommission: 0,
      pendingCommission: 0,
      totalPrincipal: 0,
      pendingPrincipal: 0,
    });
  }

  for (const deal of deals) {
    const category = deal.product_category || "未分类";
    const current = map.get(category) || {
      category,
      deals: 0,
      totalCommission: 0,
      pendingCommission: 0,
      totalPrincipal: 0,
      pendingPrincipal: 0,
    };

    current.deals += 1;
    current.totalCommission += commissionAmount(deal);
    if (!deal.payment_received) current.pendingCommission += commissionAmount(deal);
    current.totalPrincipal += deal.advance_amount || 0;
    if (!deal.refund_received) current.pendingPrincipal += deal.advance_amount || 0;
    map.set(category, current);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.deals === 0 && b.deals > 0) return 1;
    if (b.deals === 0 && a.deals > 0) return -1;
    const amountA = a.totalCommission + a.totalPrincipal;
    const amountB = b.totalCommission + b.totalPrincipal;
    return amountB - amountA || b.deals - a.deals || a.category.localeCompare(b.category, "zh-CN");
  });
}
