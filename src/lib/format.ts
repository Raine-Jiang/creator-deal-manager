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
  const date = parseDisplayDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function fullDate(value?: string | null) {
  if (!value) return "";
  const date = parseDisplayDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日`;
}

export function fullDateTime(value?: string | null) {
  if (!value) return "";
  const date = parseDisplayDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, "0")}月${String(date.getDate()).padStart(2, "0")}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
}

export function displayTitle(brand?: string | null, product?: string | null) {
  const joined = [brand, product].filter(Boolean).join(" ");
  return joined || "未命名合作";
}

function parseDisplayDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }
  return new Date(value);
}
