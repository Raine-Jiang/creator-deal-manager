export type Platform = "小红书" | "抖音" | "其他" | "";

export type Deal = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  brand: string | null;
  product_name: string | null;
  product_image_url: string | null;
  platform: Platform | null;
  product_price: number | null;
  base_fee: number | null;
  commission: string | null;
  advance_amount: number | null;
  received_date: string | null;
  shoot_date: string | null;
  publish_deadline: string | null;
  publish_date: string | null;
  expected_payment_date: string | null;
  expected_refund_date: string | null;
  product_url: string | null;
  publish_url: string | null;
  notes: string | null;
};

export type DealFormValues = Omit<
  Deal,
  "id" | "user_id" | "created_at" | "updated_at" | "product_image_url"
> & {
  product_image_url?: string | null;
};

export const emptyDealValues: DealFormValues = {
  brand: "",
  product_name: "",
  platform: "",
  product_price: null,
  base_fee: null,
  commission: "",
  advance_amount: null,
  received_date: "",
  shoot_date: "",
  publish_deadline: "",
  publish_date: "",
  expected_payment_date: "",
  expected_refund_date: "",
  product_url: "",
  publish_url: "",
  notes: "",
  product_image_url: null,
};

