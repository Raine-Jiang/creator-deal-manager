"use client";

import type { ChangeEvent } from "react";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { extractExcelImagesByRow } from "@/lib/excel-images";
import { compressImageToWebp } from "@/lib/images";
import { mapExcelRowToDeal, type ImportPreviewRow } from "@/lib/import-deals";
import { isSupabaseConfigured, PRODUCT_IMAGE_BUCKET, supabase, type Database } from "@/lib/supabase";
import { displayTitle, money, shortDate } from "@/lib/format";

type Props = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
};

type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];

export function DealImporter({ open, onClose, onImported }: Props) {
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageFiles, setImageFiles] = useState<Map<number, File>>(new Map());
  const validRows = useMemo(() => rows.filter((row) => row.draft.brand || row.draft.product_name), [rows]);
  const warningCount = useMemo(() => rows.reduce((total, row) => total + row.warnings.length, 0), [rows]);

  if (!open) return null;

  async function parseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    setSuccess(false);
    setRows([]);
    setImageFiles(new Map());
    setFileName(file.name);

    try {
      const { readSheet } = await import("read-excel-file/browser");
      const table = await readSheet(file);
      const headers = table[0]?.map((cell: unknown) => String(cell || "").trim()) || [];
      if (!headers.length) throw new Error("没有识别到表头。");
      const jsonRows = table.slice(1).map((cells: unknown[]) => {
        return headers.reduce((record: Record<string, unknown>, header: string, index: number) => {
          if (header) record[header] = cells[index] ?? "";
          return record;
        }, {});
      });
      const currentYear = new Date().getFullYear();
      const preview = jsonRows
        .map((row: Record<string, unknown>, index: number) => mapExcelRowToDeal(row, index + 2, currentYear))
        .filter((row: ImportPreviewRow) => row.draft.brand || row.draft.product_name || row.warnings.length);
      const images = await extractExcelImagesByRow(file);
      setRows(preview);
      setImageFiles(images);
      setMessage(preview.length ? `已读取 ${preview.length} 行，确认后会导入 ${preview.filter((row) => row.draft.brand || row.draft.product_name).length} 行；识别到 ${images.size} 张嵌入图片。` : "没有识别到可导入的数据。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Excel 解析失败。");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function importRows() {
    if (!supabase) {
      setMessage("当前是演示模式，配置 Supabase 后才能导入。");
      return;
    }

    setBusy(true);
    setMessage("");
    setSuccess(false);
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) {
      setBusy(false);
      setMessage("请先登录后再导入。");
      return;
    }

    const payload: DealInsert[] = [];
    let uploadedImages = 0;

    for (const { draft, rowNumber } of validRows) {
      const dealId = crypto.randomUUID();
      const embeddedImage = imageFiles.get(rowNumber);
      const imageUrl = embeddedImage
        ? await uploadImportedImage(userId, dealId, embeddedImage)
        : draft.product_image_url || null;
      if (embeddedImage && imageUrl) uploadedImages += 1;

      payload.push({
        id: dealId,
        user_id: userId,
        brand: draft.brand || null,
        product_name: draft.product_name || null,
        product_category: draft.product_category || null,
        cooperation_date: draft.cooperation_date || null,
        product_image_url: imageUrl,
        platform: draft.platform || null,
        platforms: draft.platforms?.length ? draft.platforms : null,
        advance_required: draft.advance_required,
        collaboration_type: draft.collaboration_type || null,
        product_price: null,
        base_fee: draft.base_fee,
        commission: draft.commission || null,
        advance_amount: draft.advance_amount,
        received_date: draft.received_date || null,
        shoot_deadline: null,
        shoot_date: null,
        publish_deadline: draft.publish_deadline || null,
        publish_date: draft.publish_date || null,
        expected_payment_date: draft.expected_payment_date || null,
        payment_received: draft.payment_received,
        payment_received_date: draft.payment_received_date || null,
        expected_refund_date: draft.expected_refund_date || null,
        refund_received: draft.refund_received,
        refund_received_date: draft.refund_received_date || null,
        product_url: null,
        publish_url: null,
        notes: draft.notes || null,
        completed: draft.completed,
        archived_at: draft.archived_at,
        deleted_at: null,
      });
    }

    const { error } = await supabase.from("deals").insert(payload);
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRows([]);
    setImageFiles(new Map());
    setSuccess(true);
    setMessage(`导入完成：已新增 ${payload.length} 条合作，上传 ${uploadedImages} 张产品图。可以关闭窗口查看列表。`);
    onImported?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/10 px-3 pb-3" onClick={onClose}>
      <div className="max-h-[88svh] w-full max-w-[430px] overflow-y-auto rounded-[30px] border border-black/[0.06] bg-white p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">导入 Excel</h2>
            <p className="mt-1 text-sm font-bold text-muted">自动识别旧表格，确认后写入系统。</p>
          </div>
          <button type="button" onClick={onClose} className="icon-button !h-10 !w-10 shrink-0" aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-violet-200 bg-violet-50/70 px-4 py-7 text-center">
          <FileSpreadsheet className="h-8 w-8 text-violet-600" />
          <span className="mt-3 text-base font-black">{fileName || "选择 Excel 文件"}</span>
          <span className="mt-1 text-xs font-bold text-muted">支持 .xlsx，旧 .xls 可先另存为 .xlsx</span>
          <input type="file" accept=".xlsx" className="sr-only" onChange={parseFile} />
        </label>

        {message ? (
          <p className={`mt-4 flex items-start gap-2 rounded-[18px] p-3 text-sm font-bold ${success ? "bg-emerald-50 text-emerald-600" : "bg-warm/70 text-muted"}`}>
            {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
            <span>{message}</span>
          </p>
        ) : null}

        {rows.length ? (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <ImportStat label="读取行数" value={rows.length} />
              <ImportStat label="可导入" value={validRows.length} />
              <ImportStat label="提醒" value={warningCount} />
            </div>
            <div className="mt-4 space-y-2.5">
              {rows.slice(0, 8).map((row) => (
                <article key={row.rowNumber} className="rounded-[20px] border border-black/[0.05] bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black">{displayTitle(row.draft.brand || null, row.draft.product_name || null)}</p>
                      <p className="mt-1 text-xs font-bold text-muted">
                        {[row.draft.product_category || "未分类", row.draft.publish_deadline ? `${shortDate(row.draft.publish_deadline)} 前发布` : "", row.draft.collaboration_type, row.draft.advance_amount ? `本金 ${money(row.draft.advance_amount)}` : "", row.draft.commission ? `佣金 ${row.draft.commission}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-warm px-2.5 py-1 text-xs font-black text-muted">第 {row.rowNumber} 行</span>
                  </div>
                  {row.warnings.length ? (
                    <div className="mt-2 flex items-start gap-2 rounded-[14px] bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{row.warnings.join("；")}</span>
                    </div>
                  ) : null}
                </article>
              ))}
              {rows.length > 8 ? <p className="text-center text-xs font-bold text-muted">这里只预览前 8 行，其余会一起导入。</p> : null}
            </div>
          </>
        ) : null}

        <button type="button" disabled={busy || success || !isSupabaseConfigured || !validRows.length} onClick={importRows} className="primary-button mt-5 w-full justify-center py-4 disabled:opacity-50">
          <Upload className="h-5 w-5" />
          {busy ? "处理中..." : success ? "已导入完成" : `确认导入 ${validRows.length || ""}`.trim()}
        </button>
      </div>
    </div>
  );
}

async function uploadImportedImage(userId: string, dealId: string, file: File) {
  if (!supabase) return null;
  const compressed = await compressImageToWebp(file);
  const path = `${userId}/${dealId}/product.webp`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, compressed, { contentType: compressed.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function ImportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[18px] bg-warm/70 p-3">
      <p className="text-xs font-black text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}
