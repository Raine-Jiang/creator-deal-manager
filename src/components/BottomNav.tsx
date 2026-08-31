"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, Handshake, Home, Plus } from "lucide-react";

const items = [
  { href: "/", label: "首页", icon: Home, match: (path: string) => path === "/" },
  { href: "/deals", label: "合作", icon: Handshake, match: (path: string) => path.startsWith("/deals") },
  { href: "/deals/new", label: "新增", icon: Plus, match: (path: string) => path === "/deals/new", center: true },
  { href: "/calendar", label: "日历", icon: CalendarDays, match: (path: string) => path.startsWith("/calendar") },
  { href: "/finance", label: "财务", icon: BarChart3, match: (path: string) => path.startsWith("/finance") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] px-4 pb-[calc(10px+env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5 items-center gap-1 rounded-[28px] border border-black/[0.06] bg-white/90 px-3 py-2 backdrop-blur-2xl">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black text-white"
                aria-label="新增合作"
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-xs font-black transition ${
                active ? "text-black" : "text-muted"
              }`}
            >
              <Icon className={`h-6 w-6 ${active ? "stroke-[2.8]" : ""}`} />
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
