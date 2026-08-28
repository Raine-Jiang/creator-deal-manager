"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Edit3, LinkIcon, WalletCards } from "lucide-react";
import type { Deal } from "@/lib/types";
import { demoDeals } from "@/lib/demo-data";
import { displayTitle, fullDate, money } from "@/lib/format";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AppShell } from "./AppShell";
import { ProductMark } from "./ProductMark";
import { SetupNotice } from "./SetupNotice";

export function DealDetail({ id }: { id: string }) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(
    isSupabaseConfigured ? null : demoDeals.find((item) => item.id === id) || demoDeals[0],
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    async function load() {
      const { data: sessionData } = await supabase!.auth.getSession();
      if (!sessionData.session) {
        router.push("/login");
        return;
      }
      const { data, error: loadError } = await supabase!
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();
      if (loadError) setError(loadError.message);
      else setDeal(data);
      setLoading(false);
    }
    load();
  }, [id, router]);

  return (
    <AppShell>
      <div className="flex items-center justify-between pt-2">
        <Link href="/" className="icon-button" aria-label="返回">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-black">合作详情</h1>
        {deal ? (
          <Link href={`/deals/${deal.id}/edit`} className="icon-button" aria-label="编辑">
            <Edit3 className="h-5 w-5" />
          </Link>
        ) : (
          <span className="h-11 w-11" />
        )}
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-6">
          <SetupNotice />
        </div>
      ) : null}

      {loading ? <p className="card mt-6 p-6 text-center font-bold text-muted">正在读取详情...</p> : null}
      {error ? <p className="mt-6 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p> : null}

      {deal ? (
        <div className="mt-6 space-y-4 pb-8">
          <section className="card p-5">
            <div className="flex items-center gap-5">
              <ProductMark imageUrl={deal.product_image_url} label={deal.product_name} size="lg" />
              <div className="min-w-0">
                <h2 className="text-3xl font-black leading-tight">
                  {displayTitle(deal.brand, deal.product_name)}
                </h2>
                {deal.platform ? (
                  <p className="mt-3 inline-flex rounded-full bg-pink-100 px-3 py-1 text-sm font-black text-pink">
                    {deal.platform}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <DetailSection title="基本信息" icon={<ShoppingIcon />}>
            <Info label="品牌" value={deal.brand} />
            <Info label="产品" value={deal.product_name} />
            <Info label="平台" value={deal.platform} />
            <Info label="商品链接" value={deal.product_url} link />
          </DetailSection>

          <DetailSection title="合作金额" icon={<WalletCards className="h-5 w-5" />}>
            <Info label="产品价格" value={money(deal.product_price)} highlight />
            <Info label="合作费" value={money(deal.base_fee)} highlight />
            <Info label="佣金" value={deal.commission} highlight />
            <Info label="垫付金额" value={money(deal.advance_amount)} highlight />
          </DetailSection>

          <DetailSection title="时间" icon={<CalendarDays className="h-5 w-5" />}>
            <Info label="收货日期" value={fullDate(deal.received_date)} />
            <Info label="拍摄日期" value={fullDate(deal.shoot_date)} />
            <Info label="最晚发布" value={fullDate(deal.publish_deadline)} highlight />
            <Info label="实际发布" value={fullDate(deal.publish_date)} />
            <Info label="预计回款" value={fullDate(deal.expected_payment_date)} />
            <Info label="预计返本金" value={fullDate(deal.expected_refund_date)} />
          </DetailSection>

          <DetailSection title="其他" icon={<LinkIcon className="h-5 w-5" />}>
            <Info label="发布链接" value={deal.publish_url} link />
            <Info label="备注" value={deal.notes} />
          </DetailSection>
        </div>
      ) : null}
    </AppShell>
  );
}

function DetailSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const visibleChildren = Array.isArray(children)
    ? children.filter(Boolean)
    : children;

  return (
    <section className="card p-5">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
          {icon}
        </div>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="divide-y divide-stone-100">{visibleChildren}</div>
    </section>
  );
}

function Info({
  label,
  value,
  highlight,
  link,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
  link?: boolean;
}) {
  if (!value) return null;
  const content = link ? (
    <a href={value} target="_blank" rel="noreferrer" className="break-all text-blue">
      {value}
    </a>
  ) : (
    value
  );

  return (
    <div className="flex gap-4 py-3 text-base">
      <span className="w-24 shrink-0 font-bold text-muted">{label}</span>
      <span className={`min-w-0 flex-1 font-black ${highlight ? "text-pink" : "text-ink"}`}>
        {content}
      </span>
    </div>
  );
}

function ShoppingIcon() {
  return <span className="text-base font-black">包</span>;
}
