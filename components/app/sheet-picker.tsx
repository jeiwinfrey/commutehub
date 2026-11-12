"use client";

import { useEffect, useState, type ReactNode } from "react";
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
