import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) {
  return (
    <main className="h-[100svh] overflow-hidden bg-page px-3 py-4 text-ink sm:px-4">
      <div className="relative mx-auto flex h-full w-full max-w-[430px] min-w-0 overflow-hidden">
        <div
          className={`no-scrollbar min-w-0 flex-1 overflow-y-auto overflow-x-hidden ${
            showNav ? "pb-[calc(112px+env(safe-area-inset-bottom))]" : ""
          }`}
        >
          {children}
        </div>
        {showNav ? <BottomNav /> : null}
      </div>
    </main>
  );
}
