import type { CollaborationType, DealFormValues, PlatformOption, ProductCategory } from "./types";

export type ImportedDealDraft = Pick<
  DealFormValues,
  | "brand"
  | "product_name"
  | "product_category"
  | "cooperation_date"
  | "platform"
  | "platforms"
  | "advance_required"
  | "collaboration_type"
  | "base_fee"
  | "commission"
  | "advance_amount"
  | "received_date"
  | "publish_deadline"
  | "publish_date"
  | "expected_payment_date"
  | "payment_received"
  | "payment_received_date"
  | "expected_refund_date"
  | "refund_received"
  | "refund_received_date"
  | "notes"
  | "product_image_url"
  | "completed"
  | "archived_at"
>;

export type ImportPreviewRow = {
  rowNumber: number;
  draft: ImportedDealDraft;
  warnings: string[];
};

type RawRow = Record<string, unknown>;

const fieldAliases = {
  brand: ["品牌", "商家", "合作品牌", "brand"],
  product_name: ["产品", "商品", "产品名称", "商品名称", "品名", "product"],
  product_category: ["品类", "产品类型", "商品类型", "类型", "分类"],
  platform: ["平台", "发布平台", "渠道"],
  cooperation_date: ["接单日期", "合作日期", "建联日期", "创建日期", "录入日期", "日期"],
  publish_deadline: ["最晚发布", "最晚发布日期", "发布时间", "发布日期", "ddl", "deadline"],
  publish_date: ["实际发布", "实际发布日期", "已发布日期", "发布完成日期"],
  base_fee: ["佣金", "合作费", "报价", "费用", "收益", "接单收益"],
  advance_amount: ["本金", "垫付金额", "垫付", "产品价格", "商品金额", "价格"],
  advance_required: ["是否垫付", "垫付情况", "是否需要垫付"],
  collaboration_type: ["合作形式", "合作类型", "寄拍送拍"],
  received_date: ["收货日期", "收货时间", "收到日期"],
  expected_payment_date: ["预计回款", "预计回款日期", "回款日期", "到账日期"],
  payment_received: ["返佣情况", "佣金到账", "合作费到账", "是否到账", "是否收款"],
  expected_refund_date: ["预计返本", "预计返本金", "返本日期"],
  refund_received: ["返本情况", "本金已返", "是否返本"],
  completed: ["完成合作", "是否完成", "状态"],
  notes: ["备注", "说明", "要求", "拍摄要求", "note"],
  product_image_url: ["产品图", "商品图", "图片", "图片链接", "产品图片", "商品图片"],
} satisfies Record<string, string[]>;

export function mapExcelRowToDeal(row: RawRow, rowNumber: number, currentYear = new Date().getFullYear()): ImportPreviewRow {
  const read = (field: keyof typeof fieldAliases) => findValue(row, fieldAliases[field]);
  const warnings: string[] = [];
  const feeText = cleanText(read("base_fee"));
  const feeAmount = parseMoney(feeText);
  const platforms = parsePlatforms(cleanText(read("platform")));
  const completed = parseBoolean(read("completed"));
  const paymentReceived = parseBoolean(read("payment_received"));
  const refundReceived = parseBoolean(read("refund_received"));
  const publishDate = parseDateValue(read("publish_date"), currentYear);
  const paymentDate = parseDateValue(read("expected_payment_date"), currentYear);
  const refundDate = parseDateValue(read("expected_refund_date"), currentYear);
  const fallbackNotes = collectFallbackNotes(row);
  const notes = [cleanText(read("notes")), fallbackNotes].filter(Boolean).join("\n");

  const draft: ImportedDealDraft = {
    brand: cleanText(read("brand")),
    product_name: cleanText(read("product_name")),
    product_category: normalizeCategory(cleanText(read("product_category"))),
    cooperation_date: parseDateValue(read("cooperation_date"), currentYear),
    platform: platforms[0] || "",
    platforms,
    advance_required: parseAdvanceRequired(read("advance_required"), read("advance_amount")),
    collaboration_type: normalizeCollaborationType(cleanText(read("collaboration_type"))),
    base_fee: feeAmount,
    commission: feeText,
    advance_amount: parseMoney(cleanText(read("advance_amount"))),
    received_date: parseDateValue(read("received_date"), currentYear),
    publish_deadline: parseDateValue(read("publish_deadline"), currentYear),
    publish_date: publishDate,
    expected_payment_date: paymentDate,
    payment_received: paymentReceived,
    payment_received_date: paymentReceived ? paymentDate : "",
    expected_refund_date: refundDate,
    refund_received: refundReceived,
    refund_received_date: refundReceived ? refundDate : "",
    notes,
    product_image_url: normalizeImageUrl(cleanText(read("product_image_url"))),
    completed,
    archived_at: completed ? new Date().toISOString() : null,
  };

  if (!draft.brand && !draft.product_name) warnings.push("没有识别到品牌或产品");
  if (!draft.product_category) warnings.push("未识别品类，会导入为未分类");
  if (!draft.publish_deadline) warnings.push("未识别最晚发布，日历和周期财务不会统计这条");

  return { rowNumber, draft, warnings };
}

function findValue(row: RawRow, aliases: string[]) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const match = entries.find(([key]) => normalizeHeader(key) === normalizeHeader(alias));
    if (match) return match[1];
  }
  const fuzzy = entries.find(([key]) => aliases.some((alias) => normalizeHeader(key).includes(normalizeHeader(alias))));
  return fuzzy?.[1];
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[\s_：:（）()【】\[\]-]/g, "");
}

function collectFallbackNotes(row: RawRow) {
  const knownHeaders = new Set(Object.values(fieldAliases).flat().map(normalizeHeader));
  return Object.entries(row)
    .filter(([key, value]) => key && cleanText(value) && !knownHeaders.has(normalizeHeader(key)))
    .map(([key, value]) => `${key}：${cleanText(value)}`)
    .join("\n");
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseMoney(value: string) {
  if (!value || value.includes("%")) return null;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function parseDateValue(value: unknown, currentYear: number) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toDateKey(value);
  if (typeof value === "number" && value > 0) return excelSerialToDate(value);
  const text = cleanText(value);
  if (!text) return "";

  const normalized = text
    .replace(/[年月.]/g, "-")
    .replace(/[日号]/g, "")
    .replace(/\//g, "-")
    .trim();
  const parts = normalized.split("-").filter(Boolean);
  if (parts.length === 3) return validDateKey(Number(parts[0]), Number(parts[1]), Number(parts[2]));
  if (parts.length === 2) return validDateKey(currentYear, Number(parts[0]), Number(parts[1]));
  return "";
}

function excelSerialToDate(serial: number) {
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return toDateKey(date);
}

function validDateKey(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return toDateKey(date);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseBoolean(value: unknown) {
  const text = cleanText(value);
  if (!text) return false;
  return /^(是|已|完成|true|yes|y|1|到账|已收|已返|已发布)$/i.test(text);
}

function parseAdvanceRequired(value: unknown, amount: unknown) {
  const text = cleanText(value);
  if (/不|无|否|no|false/i.test(text)) return false;
  if (/需|是|已|有|垫|yes|true/i.test(text)) return true;
  return Boolean(parseMoney(cleanText(amount)));
}

function normalizeCategory(value: string): ProductCategory {
  if (!value) return "";
  if (/裤/.test(value)) return "裤子";
  if (/套/.test(value)) return "套装";
  if (/裙/.test(value)) return "裙子";
  if (/鞋/.test(value)) return "鞋子";
  if (/配饰|饰品|包|帽|袜|项链|耳环/.test(value)) return "配饰";
  if (/衣|上衣|卫衣|外套|t恤|T恤|衬衫|背心/i.test(value)) return "上衣";
  if (/其他/.test(value)) return "其他";
  return "其他";
}

function normalizeCollaborationType(value: string): CollaborationType {
  if (/寄拍/.test(value)) return "寄拍";
  if (/送拍/.test(value)) return "送拍";
  return "";
}

function parsePlatforms(value: string): PlatformOption[] {
  if (!value) return [];
  const platforms = new Set<PlatformOption>();
  if (/小红书|xhs|red/i.test(value)) platforms.add("小红书");
  if (/抖音|douyin|tiktok/i.test(value)) platforms.add("抖音");
  if (/其他/.test(value)) platforms.add("其他");
  return Array.from(platforms);
}

function normalizeImageUrl(value: string) {
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) return value;
  return "";
}
