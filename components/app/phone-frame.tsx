import type { ReactNode } from "react";

/** Mobile-only shell: full screen on phones, a centered phone-sized column elsewhere. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh bg-card">
      {/* the notch / status bar area is reserved as a solid band, so nothing sits under it */}
      <div className="relative mx-auto h-full max-w-[430px] overflow-hidden bg-background pt-[env(safe-area-inset-top)]">{children}</div>
    </div>
  );
}
