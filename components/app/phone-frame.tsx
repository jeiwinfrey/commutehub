import type { ReactNode } from "react";

/** Mobile-only shell: full screen on phones, a centered phone-sized column elsewhere. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-card">
      <div className="relative mx-auto h-dvh max-w-[430px] overflow-hidden bg-background">{children}</div>
    </div>
  );
}
