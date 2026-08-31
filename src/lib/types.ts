export type Platform = "小红书" | "抖音" | "其他" | "";
export type ProductCategory =
  | "上衣"
  | "裤子"
  | "鞋子"
  | "卫衣"
  | "裙子"
  | "包包"
  | "帽子"
  | "配饰"
  | "运动套装"
  | "美妆个护"
  | "食品饮品"
  | "其他"
  | "";

export type Deal = {
  id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  brand: string | null;
  product_name: string | null;
  product_category: ProductCategory | null;
  cooperation_date: string | null;
  product_image_url: string | null;
  platform: Platform | null;
  product_price: number | null;
  base_fee: number | null;
  commission: string | null;
  advance_amount: number | null;
  received_date: string | null;
  shoot_deadline: string | null;
  shoot_date: string | null;
  publish_deadline: string | null;
  publish_date: string | null;
  expected_payment_date: string | null;
  payment_received: boolean;
  payment_received_date: string | null;
  expected_refund_date: string | null;
  refund_received: boolean;
  refund_received_date: string | null;
  product_url: string | null;
  publish_url: string | null;
  notes: string | null;
  completed: boolean;
  archived_at: string | null;
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
  product_category: "",
  cooperation_date: "",
  platform: "",
  product_price: null,
  base_fee: null,
  commission: "",
  advance_amount: null,
  received_date: "",
  shoot_deadline: "",
  shoot_date: "",
  publish_deadline: "",
  publish_date: "",
  expected_payment_date: "",
  payment_received: false,
  payment_received_date: "",
  expected_refund_date: "",
  refund_received: false,
  refund_received_date: "",
  product_url: "",
  publish_url: "",
  notes: "",
  product_image_url: null,
  completed: false,
  archived_at: null,
};

export type DealStatus = "待处理" | "待拍摄" | "待发布" | "待收款" | "已完成";

export type TaskType = "cooperation" | "shoot" | "publish" | "payment" | "refund";

export type TaskItem = {
  id: string;
  dealId: string;
  type: TaskType;
  title: string;
  subtitle?: string;
  date: string;
  overdue: boolean;
  daysOverdue?: number;
  amount?: number | null;
};

export type CalendarEvent = {
  id: string;
  dealId: string;
  date: string;
  type: TaskType;
  label: string;
  title: string;
  amount?: number;
  completed: boolean;
  overdue: boolean;
};
