"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconBus, IconClockAlert, IconRainy, IconWarningSign } from "central-icons";
import { BottomSheet } from "./sheet-picker";
import { ensurePermission } from "@/lib/notify";

const ITEMS = [
  { kind: "weather", label: "Weather", sub: "70% chance of rain", Icon: IconRainy },
  { kind: "rush", label: "Rush hour", sub: "Starts in 20 minutes", Icon: IconClockAlert },
  { kind: "delay", label: "Delay", sub: "Roadworks, +30 min", Icon: IconWarningSign },
  { kind: "arrival", label: "Arrival", sub: "Your vehicle is near", Icon: IconBus },
] as const;

/** Row for Me: send yourself a sample of each alert to see how it looks and sounds. */
export function PreviewAlerts({ row }: { row: (label: string, right: React.ReactNode) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const preview = useMutation(api.alerts.preview);
  return (
    <>
      {row("Preview alerts", <button onClick={() => setOpen(true)} className="rounded-full bg-background px-3.5 py-1.5 text-[14px] text-foreground">Try</button>)}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Preview alerts">
        <p className="mb-3 text-[14px]">Send yourself a sample. You'll see the toast, get a notification if you allowed them, and find it in Alerts.</p>
        <div className="grid grid-cols-2 gap-2">
          {ITEMS.map(({ kind, label, sub, Icon }) => (
            <button
              key={kind}
              onClick={() => { ensurePermission(); preview({ kind }); setOpen(false); }}
              className="flex flex-col items-start gap-2 rounded-3xl bg-card p-4 text-left"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-background text-primary"><Icon size={24} /></span>
              <span>
                <span className="block text-[16px] text-foreground">{label}</span>
                <span className="block text-[12px]">{sub}</span>
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
