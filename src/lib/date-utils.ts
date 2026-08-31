export function todayKey() {
  return toDateKey(new Date());
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, amount: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function daysBetween(from: string, to: string) {
  const start = parseDateKey(from).getTime();
  const end = parseDateKey(to).getTime();
  return Math.round((end - start) / 86400000);
}

export function isPast(value: string, today = todayKey()) {
  return daysBetween(value, today) > 0;
}

export function isSameDay(value: string, today = todayKey()) {
  return value === today;
}

export function isWithinNextDays(value: string, days: number, today = todayKey()) {
  const diff = daysBetween(today, value);
  return diff > 0 && diff <= days;
}

export function monthTitle(year: number, monthIndex: number) {
  return `${year}年${monthIndex + 1}月`;
}

export function monthMatrix(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: toDateKey(date),
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
    };
  });
}
