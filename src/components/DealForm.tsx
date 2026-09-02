"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ImageUp,
  PackageCheck,
  RotateCcw,
  Save,
  Send,
  ShoppingBag,
  Trash2,
  WalletCards,
} from "lucide-react";
import type { CollaborationType, Deal, DealFormValues, Platform, PlatformOption, ProductCategory } from "@/lib/types";
import { emptyDealValues, productCategoryOptions } from "@/lib/types";
import {
  isSupabaseConfigured,
  PRODUCT_IMAGE_BUCKET,
  supabase,
  type Database,
} from "@/lib/supabase";
import { todayKey } from "@/lib/date-utils";
import { fullDate } from "@/lib/format";
import { compressImageToWebp } from "@/lib/images";
import { AppShell } from "./AppShell";
import { ProductMark } from "./ProductMark";
import { SetupNotice } from "./SetupNotice";

type Props = {
  mode: "create" | "edit";
  deal?: Deal | null;
};

const categoryOptions: ProductCategory[] = ["", ...productCategoryOptions];
const collaborationOptions: CollaborationType[] = ["送拍", "寄拍"];
type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];
type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

function toFormValues(deal?: Deal | null): DealFormValues {
  if (!deal) return { ...emptyDealValues, cooperation_date: todayKey() };
  return {
    brand: deal.brand || "",
    product_name: deal.product_name || "",
    product_category: deal.product_category || "",
    cooperation_date: deal.cooperation_date || deal.created_at?.slice(0, 10) || "",
    platform: deal.platform || "",
    platforms: deal.platforms?.length ? deal.platforms : deal.platform ? [deal.platform as PlatformOption] : [],
    advance_required: deal.advance_required ?? Boolean(deal.advance_amount),
    collaboration_type: deal.collaboration_type || "",
    product_price: deal.product_price,
    base_fee: deal.base_fee,
    commission: deal.commission || "",
    advance_amount: deal.advance_amount,
    received_date: deal.received_date || "",
    shoot_deadline: deal.shoot_deadline || "",
    shoot_date: deal.shoot_date || "",
    publish_deadline: deal.publish_deadline || "",
    publish_date: deal.publish_date || "",
    expected_payment_date: deal.expected_payment_date || "",
    payment_received: deal.payment_received || false,
    payment_received_date: deal.payment_received_date || "",
    expected_refund_date: deal.expected_refund_date || "",
    refund_received: deal.refund_received || false,
    refund_received_date: deal.refund_received_date || "",
    product_url: deal.product_url || "",
    publish_url: deal.publish_url || "",
    notes: deal.notes || "",
    product_image_url: deal.product_image_url,
    completed: deal.completed || false,
    archived_at: deal.archived_at,
    deleted_at: deal.deleted_at,
  };
}

function cleanString(value: string | null | undefined) {
  if (value === "" || value === undefined) return null;
  return value;
}

function cleanNumber(value: number | null) {
  if (value === null || Number.isNaN(value) || Number(value) === 0) return null;
  return Number(value);
}

function missingNewBusinessColumns(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === "PGRST204" || Boolean(maybeError.message?.includes("product_category") || maybeError.message?.includes("cooperation_date") || maybeError.message?.includes("platforms") || maybeError.message?.includes("advance_required") || maybeError.message?.includes("collaboration_type"));
}

function withoutNewBusinessColumns<T extends { product_category?: unknown; cooperation_date?: unknown; platforms?: unknown; advance_required?: unknown; collaboration_type?: unknown }>(payload: T) {
  const next = { ...payload };
  delete next.product_category;
  delete next.cooperation_date;
  delete next.platforms;
  delete next.advance_required;
  delete next.collaboration_type;
  return next;
}

export function DealForm({ mode, deal }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<DealFormValues>(() => toFormValues(deal));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const imagePreview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return values.product_image_url || null;
  }, [imageFile, values.product_image_url]);

  function setField<K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setNumberField(key: "product_price" | "base_fee" | "advance_amount", value: string) {
    const normalized = value.replace(/[^\d.]/g, "").replace(/^(\d{9})\d+/, "$1");
    setField(key, normalized ? Number(normalized) : null);
  }

  function setToggleDate(key: "payment_received" | "refund_received", dateKey: "payment_received_date" | "refund_received_date", checked: boolean) {
    setValues((current) => ({
      ...current,
      [key]: checked,
      [dateKey]: checked && !current[dateKey] ? new Date().toISOString().slice(0, 10) : current[dateKey],
    }));
  }

  function toggleDateValue(dateKey: "received_date" | "publish_date", checked: boolean) {
    setValues((current) => ({
      ...current,
      [dateKey]: checked ? current[dateKey] || todayKey() : "",
    }));
  }

  function toggleCompleted(checked: boolean) {
    setValues((current) => ({
      ...current,
      completed: checked,
      archived_at: checked ? current.archived_at || new Date().toISOString() : null,
    }));
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] || null);
  }

  async function uploadImage(userId: string, dealId: string) {
    if (!supabase || !imageFile) return values.product_image_url || null;
    const compressed = await compressImageToWebp(imageFile);
    const path = `${userId}/${dealId}/product.webp`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, compressed, { contentType: compressed.type, upsert: true });

    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("当前是演示模式。请先配置 Supabase 环境变量，再保存真实合作。");
      return;
    }

    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        router.push("/login");
        return;
      }

      const dealId = mode === "edit" && deal ? deal.id : crypto.randomUUID();
      const imageUrl = await uploadImage(userId, dealId);
      const selectedPlatforms = values.platforms?.length ? values.platforms : values.platform ? [values.platform as PlatformOption] : [];
      const dealFields = {
        brand: cleanString(values.brand),
        product_name: cleanString(values.product_name),
        product_category: cleanString(values.product_category) as ProductCategory | null,
        cooperation_date: cleanString(values.cooperation_date),
        product_image_url: cleanString(imageUrl),
        platform: cleanString(selectedPlatforms[0]) as Platform | null,
        platforms: selectedPlatforms.length ? selectedPlatforms : null,
        advance_required: values.advance_required,
        collaboration_type: cleanString(values.collaboration_type) as CollaborationType | null,
        product_price: cleanNumber(values.product_price),
        base_fee: cleanNumber(values.base_fee),
        commission: cleanString(values.commission),
        advance_amount: cleanNumber(values.advance_amount),
        received_date: cleanString(values.received_date),
        shoot_deadline: null,
        shoot_date: cleanString(values.shoot_date),
        publish_deadline: cleanString(values.publish_deadline),
        publish_date: cleanString(values.publish_date),
        expected_payment_date: cleanString(values.expected_payment_date),
        payment_received: values.payment_received,
        payment_received_date: cleanString(values.payment_received_date),
        expected_refund_date: cleanString(values.expected_refund_date),
        refund_received: values.refund_received,
        refund_received_date: cleanString(values.refund_received_date),
        product_url: cleanString(values.product_url),
        publish_url: cleanString(values.publish_url),
        notes: cleanString(values.notes),
        completed: values.completed,
        archived_at: values.completed ? values.archived_at || new Date().toISOString() : null,
        deleted_at: null,
      };

      if (mode === "edit") {
        let updatePayload: DealUpdate = { ...dealFields, updated_at: new Date().toISOString() };
        let { error: updateError } = await supabase
          .from("deals")
          .update(updatePayload)
          .eq("id", dealId);
        if (updateError && missingNewBusinessColumns(updateError)) {
          updatePayload = withoutNewBusinessColumns(updatePayload);
          const fallback = await supabase.from("deals").update(updatePayload).eq("id", dealId);
          updateError = fallback.error;
        }
        if (updateError) throw updateError;
        router.push(`/deals/${dealId}`);
      } else {
        let payload: DealInsert = { id: dealId, user_id: userId, ...dealFields };
        let { error: insertError } = await supabase.from("deals").insert(payload);
        if (insertError && missingNewBusinessColumns(insertError)) {
          payload = withoutNewBusinessColumns(payload) as DealInsert;
          const fallback = await supabase.from("deals").insert(payload);
          insertError = fallback.error;
        }
        if (insertError) throw insertError;
        router.push("/deals");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDeal() {
    if (!supabase || !deal) return;
    const confirmed = window.confirm("确定把这条合作移入垃圾桶吗？30 天后会彻底删除。");
    if (!confirmed) return;

    setSaving(true);
    const { error: deleteError } = await supabase
      .from("deals")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", deal.id);
    setSaving(false);
    if (deleteError) setError(deleteError.message);
    else router.push("/deals");
  }

  return (
    <AppShell showNav={false}>
      <div className="flex items-center justify-between pt-2">
        <Link href={mode === "edit" && deal ? `/deals/${deal.id}` : "/deals"} className="icon-button" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="h-11 w-11" />
      </div>

      <section className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[38px] font-black leading-none">{mode === "edit" ? "编辑合作" : "新建合作"}</h1>
          <p className="mt-2 text-base font-bold text-muted">先填确定的信息，后面随时补。</p>
        </div>
      </section>

      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5 pb-8">
        <FormSection title="基本" icon={<ShoppingBag className="h-5 w-5" />} tint="pink">
          <TextInput label="品牌" value={values.brand || ""} onChange={(value) => setField("brand", value)} placeholder="请输入品牌名称" />
          <TextInput label="产品" value={values.product_name || ""} onChange={(value) => setField("product_name", value)} placeholder="请输入产品名称" />
          <label className="form-row">
            <span>品类</span>
            <select value={values.product_category || ""} onChange={(event) => setField("product_category", event.target.value as ProductCategory)} className="form-control">
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option || "请选择品类"}</option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 cursor-pointer items-center gap-3 py-3">
            <span className="w-[86px] shrink-0 text-base font-black max-[390px]:w-[76px]">产品图</span>
            <div className="min-w-0 flex-1 text-right text-sm font-bold text-muted">
              {imagePreview ? "点击更换图片" : "上传一张主图"}
            </div>
            <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[22px] border border-dashed border-stone-200 bg-warm/80">
              {imagePreview ? (
                <ProductMark imageUrl={imagePreview} label={values.product_name} size="lg" />
              ) : (
                <ImageUp className="h-7 w-7 text-muted" />
              )}
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={onImageChange} />
          </label>
        </FormSection>

        <FormSection title="快捷状态" icon={<CheckCircle2 className="h-5 w-5" />} tint="green">
          <div className="grid grid-cols-2 gap-2 py-3">
            <QuickToggle label="收货情况" active={Boolean(values.received_date)} onClick={() => toggleDateValue("received_date", !values.received_date)} icon={<PackageCheck className="h-4 w-4" />} />
            <QuickToggle label="发布情况" active={Boolean(values.publish_date)} onClick={() => toggleDateValue("publish_date", !values.publish_date)} icon={<Send className="h-4 w-4" />} />
            <QuickToggle label="返本情况" active={values.refund_received} onClick={() => setToggleDate("refund_received", "refund_received_date", !values.refund_received)} icon={<RotateCcw className="h-4 w-4" />} />
            <QuickToggle label="返佣情况" active={values.payment_received} onClick={() => setToggleDate("payment_received", "payment_received_date", !values.payment_received)} icon={<CircleDollarSign className="h-4 w-4" />} />
            <QuickToggle label="完成合作" active={values.completed} onClick={() => toggleCompleted(!values.completed)} icon={<CheckCircle2 className="h-4 w-4" />} wide />
          </div>
          <label className="block py-3">
            <span className="text-base font-black">备注</span>
            <textarea
              value={values.notes || ""}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="拍摄要求、穿搭重点、商家备注..."
              className="mt-3 min-h-24 w-full resize-none rounded-[20px] bg-white/72 px-4 py-3 text-base font-semibold outline-none placeholder:text-muted focus:ring-4 focus:ring-violet-100"
            />
          </label>
        </FormSection>

        <FormSection title="时间" icon={<CalendarDays className="h-5 w-5" />} tint="blue">
          <DateInput label="接单日期" value={values.cooperation_date || todayKey()} onChange={(value) => setField("cooperation_date", value)} />
          <DateInput label="最晚发布" value={values.publish_deadline || ""} onChange={(value) => setField("publish_deadline", value)} />
        </FormSection>

        <FormSection title="金额" icon={<WalletCards className="h-5 w-5" />} tint="yellow">
          <ChoiceRow label="是否垫付" options={["需要垫付", "不垫付"]} value={values.advance_required ? "需要垫付" : "不垫付"} onChange={(value) => setField("advance_required", value === "需要垫付")} />
          <ChoiceRow label="合作形式" options={collaborationOptions} value={values.collaboration_type || ""} onChange={(value) => setField("collaboration_type", value as CollaborationType)} />
          <NumberInput label="本金" value={values.advance_amount} onChange={(value) => setNumberField("advance_amount", value)} />
          <TextInput label="佣金" value={values.commission || ""} onChange={(value) => setField("commission", value)} placeholder="10% 或 ¥200" />
        </FormSection>

        {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

        <button type="submit" disabled={saving} className="primary-button w-full justify-center py-4 text-lg">
          <Save className="h-5 w-5" />
          {saving ? "保存中..." : "保存"}
        </button>

        {mode === "edit" ? (
          <button
            type="button"
            disabled={saving || !isSupabaseConfigured}
            onClick={deleteDeal}
            className="flex w-full items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-4 text-base font-black text-red-500 shadow-soft disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
            移入垃圾桶
          </button>
        ) : null}
      </form>
    </AppShell>
  );
}

function FormSection({
  title,
  icon,
  tint,
  children,
}: {
  title: string;
  icon: ReactNode;
  tint: "pink" | "yellow" | "blue" | "violet" | "green";
  children: ReactNode;
}) {
  const tintClass = {
    pink: "bg-pink-100 text-pink-600",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-600",
    violet: "bg-violet-100 text-violet-600",
    green: "bg-emerald-100 text-emerald-700",
  }[tint];
  const panelClass = {
    pink: "border-pink-100 bg-[linear-gradient(135deg,#fffafd,#fff1f6)]",
    yellow: "border-amber-100 bg-[linear-gradient(135deg,#fffdf4,#fff5df)]",
    blue: "border-blue-100 bg-[linear-gradient(135deg,#f8fcff,#edf6ff)]",
    violet: "border-violet-100 bg-[linear-gradient(135deg,#fdfaff,#f5edff)]",
    green: "border-emerald-100 bg-[linear-gradient(135deg,#f8fff8,#ecffe7)]",
  }[tint];

  return (
    <section className={`rounded-[24px] border p-3.5 shadow-soft ${panelClass}`}>
      <div className="mb-1.5 flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-[14px] ${tintClass}`}>
          {icon}
        </div>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="form-row">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="form-control"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-row">
      <span>{label}</span>
      <span className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="请输入金额"
          inputMode="decimal"
          className="form-control min-w-0"
        />
        <span className="shrink-0 font-bold text-ink">元</span>
      </span>
    </label>
  );
}

function QuickToggle({
  label,
  active,
  icon,
  onClick,
  wide,
}: {
  label: string;
  active: boolean;
  icon: ReactNode;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-[16px] border px-3 text-sm font-black transition ${
        wide ? "col-span-2" : ""
      } ${
        active
          ? "border-emerald-200 bg-emerald-100 text-emerald-700"
          : "border-black/[0.04] bg-white/70 text-muted"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <div className="form-row">
      <span className="self-start pt-2">{label}</span>
      <div className="ml-auto flex min-w-0 flex-1 flex-wrap justify-end gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full border px-3 py-2 text-sm font-black transition ${
              value === option
                ? "border-black bg-black text-white"
                : "border-black/[0.06] bg-white/72 text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-row">
      <span>{label}</span>
      <span className="relative ml-auto flex min-w-0 flex-1 justify-end">
        <span className={`pointer-events-none flex h-10 min-w-[148px] items-center justify-center rounded-[14px] border px-3 pr-9 text-sm font-black max-[390px]:min-w-[138px] max-[390px]:text-xs ${
          value ? "border-black/[0.05] bg-white/78 text-ink" : "border-black/[0.04] bg-white/55 text-muted"
        }`}>
          {value ? fullDate(value) : "选择日期"}
        </span>
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-y-0 right-0 h-10 w-[150px] cursor-pointer opacity-0"
        />
      </span>
    </label>
  );
}
