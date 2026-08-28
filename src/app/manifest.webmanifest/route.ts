import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "Creator Deal Manager",
    short_name: "Deal Manager",
    description: "轻量记录每一条创作者广告合作",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F7",
    theme_color: "#8B5CF6",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
  });
}

