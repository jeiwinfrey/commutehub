"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { IconCheckmark1 } from "central-icons";
import { Squircle } from "./squircle";
import { cn } from "@/lib/utils";

const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

/** Flat bottom sheet, portaled so it always sits over the whole phone column. */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const controls = useDragControls();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-[430px]">
            <motion.div
              className="pointer-events-auto"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}
              drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, i) => i.offset.y > 80 && onClose()}
            >
              <Squircle radius={32} className="bg-background px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+20px)]">
                {/* only the header drags the sheet, so lists and wheels inside can scroll freely */}
                <div style={{ touchAction: "none" }} onPointerDown={(e) => controls.start(e)}>
                  <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-card" />
                  {title && <h3 className="mb-3 text-[18px]">{title}</h3>}
                </div>
                {children}
              </Squircle>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export type Option = { value: string; label: string };

type Variant = "stack" | "pill" | "field";

function Trigger({ variant, label, value, onClick }: { variant: Variant; label: string; value: string; onClick: () => void }) {
  if (variant === "pill")
    return <button onClick={onClick} className="rounded-full bg-background px-3.5 py-1.5 text-[14px] text-foreground">{value}</button>;
  if (variant === "field")
    return (
      <button onClick={onClick} className="block w-full rounded-2xl bg-card px-4 py-3 text-left">
        <span className="block text-[12px] text-muted-foreground">{label}</span>
        <span className="block text-[16px] text-foreground">{value}</span>
      </button>
    );
  return (
    <button onClick={onClick} className="block min-w-0 flex-1 text-left">
      <span className="block text-[11px]">{label}</span>
      <span className="block truncate text-[15px] text-foreground">{value}</span>
    </button>
  );
}

export function SelectField({ label, value, options, onChange, variant = "stack", placeholder = "Choose" }: {
  label: string; value: string; options: Option[]; onChange: (v: string) => void; variant?: Variant; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value)?.label ?? placeholder;
  return (
    <>
      <Trigger variant={variant} label={label} value={cur} onClick={() => setOpen(true)} />
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="flex max-h-[55dvh] flex-col gap-1 overflow-y-auto">
          {options.map((o) => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={cn("flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[16px]", o.value === value ? "bg-primary/12 text-primary" : "bg-card text-foreground")}>
              {o.label}
              {o.value === value && <IconCheckmark1 size={20} />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

const fmt = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const ITEM = 44; // row height
const ROWS = 5; // visible rows; the middle one is selected

/** One vertical scroll wheel that snaps rows to the center band. */
function Wheel({ items, index, onChange, className }: { items: string[]; index: number; onChange: (i: number) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(index);
  useEffect(() => { if (ref.current) ref.current.scrollTop = index * ITEM; }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={cn("relative", className)} style={{ height: ITEM * ROWS }}>
      <div className="pointer-events-none absolute inset-x-0 rounded-2xl bg-card" style={{ top: ITEM * 2, height: ITEM }} />
      <div
        ref={ref}
        className="relative h-full snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ paddingBlock: ITEM * 2 }}
        onScroll={(e) => {
          const i = Math.min(items.length - 1, Math.max(0, Math.round(e.currentTarget.scrollTop / ITEM)));
          if (i !== live) { setLive(i); onChange(i); }
        }}
      >
        {items.map((label, i) => (
          <button
            key={label}
            onClick={() => ref.current?.scrollTo({ top: i * ITEM, behavior: "smooth" })}
            className={cn("flex w-full snap-center items-center justify-center text-[22px] [scroll-snap-stop:always]", i === live ? "text-foreground" : "text-muted-foreground/60")}
            style={{ height: ITEM }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIOD = ["AM", "PM"];

/** Custom time picker: vertical scroll wheels for hour, minute and AM/PM. Value is "HH:MM" (24h). */
export function TimeField({ label, value, onChange, variant = "pill" }: { label: string; value: string; onChange: (v: string) => void; variant?: Variant }) {
  const [open, setOpen] = useState(false);
  const [h24, m] = value.split(":").map(Number);
  const pm = h24 >= 12;
  const h12 = h24 % 12 || 12;
  const set = (h: number, min: number, isPm: boolean) => onChange(`${String((h % 12) + (isPm ? 12 : 0)).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  return (
    <>
      <Trigger variant={variant} label={label} value={fmt(value)} onClick={() => setOpen(true)} />
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        <div className="mb-4 flex gap-2">
          <Wheel className="flex-1" items={HOURS} index={h12 - 1} onChange={(i) => set(i + 1, m, pm)} />
          <Wheel className="flex-1" items={MINUTES} index={m} onChange={(i) => set(h12, i, pm)} />
          <Wheel className="w-24" items={PERIOD} index={pm ? 1 : 0} onChange={(i) => set(h12, m, i === 1)} />
        </div>
        <button onClick={() => setOpen(false)} className="w-full rounded-full bg-foreground py-4 text-[16px] text-background">Done</button>
      </BottomSheet>
    </>
  );
}
