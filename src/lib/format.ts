export function money(value?: number | null) {
  if (value === null || value === undefined || Number(value) === 0) return "";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function shortDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function fullDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function displayTitle(brand?: string | null, product?: string | null) {
  const joined = [brand, product].filter(Boolean).join(" ");
  return joined || "未命名合作";
}

