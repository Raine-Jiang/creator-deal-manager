import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-page px-3 py-4 text-ink sm:px-4">
      <div className="mx-auto flex min-h-[calc(100dvh-32px)] w-full max-w-[430px] flex-col">
        {children}
      </div>
    </main>
  );
}
