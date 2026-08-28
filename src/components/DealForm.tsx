"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ImageUp,
  LinkIcon,
  Save,
  ShoppingBag,
  Trash2,
  WalletCards,
} from "lucide-react";
import type { Deal, DealFormValues, Platform } from "@/lib/types";
import { emptyDealValues } from "@/lib/types";
import {
  isSupabaseConfigured,
  PRODUCT_IMAGE_BUCKET,
  supabase,
} from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { ProductMark } from "./ProductMark";
import { SetupNotice } from "./SetupNotice";

type Props = {
  mode: "create" | "edit";
  deal?: Deal | null;
};

const platformOptions = ["", "小红书", "抖音", "其他"];

function toFormValues(deal?: Deal | null): DealFormValues {
  if (!deal) return emptyDealValues;
  return {
    brand: deal.brand || "",
    product_name: deal.product_name || "",
    platform: deal.platform || "",
    product_price: deal.product_price,
    base_fee: deal.base_fee,
    commission: deal.commission || "",
    advance_amount: deal.advance_amount,
    received_date: deal.received_date || "",
    shoot_date: deal.shoot_date || "",
    publish_deadline: deal.publish_deadline || "",
    publish_date: deal.publish_date || "",
    expected_payment_date: deal.expected_payment_date || "",
    expected_refund_date: deal.expected_refund_date || "",
    product_url: deal.product_url || "",
    publish_url: deal.publish_url || "",
    notes: deal.notes || "",
    product_image_url: deal.product_image_url,
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
    setField(key, value ? Number(value) : null);
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    setImageFile(event.target.files?.[0] || null);
  }

  async function uploadImage(userId: string, dealId: string) {
    if (!supabase || !imageFile) return values.product_image_url || null;
    const extension = imageFile.name.split(".").pop() || "jpg";
    const path = `${userId}/${dealId}/product.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_IMAGE_BUCKET)
      .upload(path, imageFile, { upsert: true });

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
      const dealFields = {
        brand: cleanString(values.brand),
        product_name: cleanString(values.product_name),
        product_image_url: cleanString(imageUrl),
        platform: cleanString(values.platform) as Platform | null,
        product_price: cleanNumber(values.product_price),
        base_fee: cleanNumber(values.base_fee),
        commission: cleanString(values.commission),
        advance_amount: cleanNumber(values.advance_amount),
        received_date: cleanString(values.received_date),
        shoot_date: cleanString(values.shoot_date),
        publish_deadline: cleanString(values.publish_deadline),
        publish_date: cleanString(values.publish_date),
        expected_payment_date: cleanString(values.expected_payment_date),
        expected_refund_date: cleanString(values.expected_refund_date),
        product_url: cleanString(values.product_url),
        publish_url: cleanString(values.publish_url),
        notes: cleanString(values.notes),
      };

      if (mode === "edit") {
        const { error: updateError } = await supabase
          .from("deals")
          .update({ ...dealFields, updated_at: new Date().toISOString() })
          .eq("id", dealId);
        if (updateError) throw updateError;
        router.push(`/deals/${dealId}`);
      } else {
        const payload = { id: dealId, user_id: userId, ...dealFields };
        const { error: insertError } = await supabase.from("deals").insert(payload);
        if (insertError) throw insertError;
        router.push("/");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败，请稍后重试。");
    } finally {
      setSaving(false);
    }
  }

  async function deleteDeal() {
    if (!supabase || !deal) return;
    const confirmed = window.confirm("确定删除这条合作吗？删除后不可恢复。");
    if (!confirmed) return;

    setSaving(true);
    const { error: deleteError } = await supabase.from("deals").delete().eq("id", deal.id);
    setSaving(false);
    if (deleteError) setError(deleteError.message);
    else router.push("/");
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between pt-2">
        <Link href={mode === "edit" && deal ? `/deals/${deal.id}` : "/"} className="icon-button" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black">{mode === "edit" ? "编辑合作" : "新建合作"}</h1>
        <span className="h-11 w-11" />
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5 pb-8">
        <section className="grid grid-cols-[1fr_118px] gap-3.5 max-[390px]:grid-cols-1">
          <FormSection title="基本" icon={<ShoppingBag className="h-5 w-5" />} tint="pink">
            <TextInput label="品牌" value={values.brand || ""} onChange={(value) => setField("brand", value)} placeholder="请输入品牌名称" />
            <TextInput label="产品" value={values.product_name || ""} onChange={(value) => setField("product_name", value)} placeholder="请输入产品名称" />
            <label className="form-row">
              <span>平台</span>
              <select value={values.platform || ""} onChange={(event) => setField("platform", event.target.value as DealFormValues["platform"])} className="form-control">
                {platformOptions.map((option) => (
                  <option key={option} value={option}>{option || "请选择平台"}</option>
                ))}
              </select>
            </label>
          </FormSection>

          <div className="card p-3.5">
            <p className="text-sm font-black">产品图</p>
            <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-stone-200 bg-warm/70 p-3 text-center text-sm font-bold text-muted">
              {imagePreview ? (
                <ProductMark imageUrl={imagePreview} label={values.product_name} size="lg" />
              ) : (
                <>
                  <ImageUp className="mb-2 h-7 w-7" />
                  上传图片
                </>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={onImageChange} />
            </label>
          </div>
        </section>

        <FormSection title="金额" icon={<WalletCards className="h-5 w-5" />} tint="yellow">
          <NumberInput label="产品价格" value={values.product_price} onChange={(value) => setNumberField("product_price", value)} />
          <NumberInput label="合作费" value={values.base_fee} onChange={(value) => setNumberField("base_fee", value)} />
          <TextInput label="佣金" value={values.commission || ""} onChange={(value) => setField("commission", value)} placeholder="10% 或 ¥200" />
          <NumberInput label="垫付金额" value={values.advance_amount} onChange={(value) => setNumberField("advance_amount", value)} />
        </FormSection>

        <FormSection title="时间" icon={<CalendarDays className="h-5 w-5" />} tint="blue">
          <DateInput label="收货日期" value={values.received_date || ""} onChange={(value) => setField("received_date", value)} />
          <DateInput label="拍摄日期" value={values.shoot_date || ""} onChange={(value) => setField("shoot_date", value)} />
          <DateInput label="最晚发布" value={values.publish_deadline || ""} onChange={(value) => setField("publish_deadline", value)} />
          <DateInput label="实际发布" value={values.publish_date || ""} onChange={(value) => setField("publish_date", value)} />
          <DateInput label="预计回款" value={values.expected_payment_date || ""} onChange={(value) => setField("expected_payment_date", value)} />
          <DateInput label="预计返本金" value={values.expected_refund_date || ""} onChange={(value) => setField("expected_refund_date", value)} />
        </FormSection>

        <FormSection title="其他" icon={<LinkIcon className="h-5 w-5" />} tint="violet">
          <TextInput label="商品链接" value={values.product_url || ""} onChange={(value) => setField("product_url", value)} placeholder="请输入链接（选填）" />
          <TextInput label="发布链接" value={values.publish_url || ""} onChange={(value) => setField("publish_url", value)} placeholder="请输入链接（选填）" />
          <label className="block pt-3">
            <span className="text-base font-black">备注</span>
            <textarea
              value={values.notes || ""}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder="品牌要求、联系人、发布后返款说明..."
              className="mt-3 min-h-28 w-full resize-none rounded-[20px] bg-warm px-4 py-3 text-base font-semibold outline-none placeholder:text-muted focus:ring-4 focus:ring-violet-100"
            />
          </label>
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
            删除这条合作
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
  tint: "pink" | "yellow" | "blue" | "violet";
  children: ReactNode;
}) {
  const tintClass = {
    pink: "bg-pink-100 text-pink-600",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-600",
    violet: "bg-violet-100 text-violet-600",
  }[tint];

  return (
    <section className="card p-3.5">
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
          type="number"
          min="0"
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
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-control"
      />
    </label>
  );
}
