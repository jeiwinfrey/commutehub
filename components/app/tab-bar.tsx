"use client";

import { IconHome, IconCompassRound, IconBell, IconPersona } from "central-icons";
import { motion } from "motion/react";
import { Squircle } from "./squircle";
import { cn } from "@/lib/utils";

export const TABS = [
  { id: "home", label: "Home", Icon: IconHome },
  { id: "plan", label: "Plan", Icon: IconCompassRound },
  { id: "alerts", label: "Alerts", Icon: IconBell },
  { id: "me", label: "Me", Icon: IconPersona },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function TabBar({
  active,
  onChange,
  floating = false,
  onMap = false,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  floating?: boolean;
  /** white fill when floating over the map so it stands out from the gray basemap */
  onMap?: boolean;
}) {
  return (
    <nav
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4",
        floating ? "pb-[var(--tab-b)]" : "bg-background px-0 pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <Squircle radius={floating ? 28 : 0} className={cn("pointer-events-auto flex p-1.5", onMap || !floating ? "bg-background" : "bg-card")}>
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]"
            >
              {on && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-[20px] bg-primary/12"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <Icon size={24} className={cn("relative", on ? "text-primary" : "text-muted-foreground")} />
              <span className={cn("relative", on ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </button>
          );
        })}
      </Squircle>
    </nav>
  );
}
