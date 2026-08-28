import Image from "next/image";
import { Camera, Shirt, ShoppingBag } from "lucide-react";

type Props = {
  imageUrl?: string | null;
  label?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-14 w-14",
  md: "h-[72px] w-[72px]",
  lg: "h-24 w-24",
};

export function ProductMark({ imageUrl, label, size = "md" }: Props) {
  const Icon = label?.includes("鞋")
    ? ShoppingBag
    : label?.includes("上衣")
      ? Shirt
      : Camera;

  return (
    <div
      className={`${sizeClasses[size]} relative shrink-0 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#ffe1eb,#edf4ff)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72)]`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label || "产品图"}
          fill
          sizes="112px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon strokeWidth={1.9} className="h-8 w-8 text-black" />
        </div>
      )}
    </div>
  );
}
