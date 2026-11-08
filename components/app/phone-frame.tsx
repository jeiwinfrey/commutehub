import type { ReactNode } from "react";

/** Mobile-only shell: full screen on phones, a centered phone-sized column elsewhere. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh bg-card">
      {/* edge to edge: screens add the status-bar spacing themselves, so the map can run under it */}
      <div className="relative mx-auto h-full max-w-[430px] overflow-hidden bg-background">{children}</div>
    </div>
  );
}
