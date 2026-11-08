"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { IconArrowRightLeft, IconBus, IconClock, IconCloudy, IconRainy, IconSun, IconWarningSign, IconChevronRightSmall } from "central-icons";
import { Squircle } from "./squircle";
import { BottomSheet, SelectField } from "./sheet-picker";
import { cn } from "@/lib/utils";
import { bestService, fmt12, leaveBy, TYPE_LABEL, type Tracker } from "@/lib/use-tracker";
import type { Weather } from "@/lib/use-weather";

const SEAT_LABEL = { open: "Open", few: "Few seats", full: "Full" } as const;
const SEAT_CLASS = { open: "bg-success/15 text-success", few: "bg-primary/15 text-primary", full: "bg-card text-muted-foreground" } as const;

export function SeatBadge({ seat }: { seat: keyof typeof SEAT_LABEL }) {
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px]", SEAT_CLASS[seat])}>{SEAT_LABEL[seat]}</span>;
}

export function FromTo({ t, className }: { t: Tracker; className?: string }) {
  const opts = (t.places ?? []).map((p) => ({ value: p.slug, label: p.name }));
  return (
    <Squircle radius={24} className={cn("flex items-center gap-2 bg-card px-4 py-3", className)}>
      <SelectField label="From" value={t.from} onChange={t.setFrom} options={opts} />
      <button
        aria-label="Swap"
        onClick={() => { const f = t.from; t.setFrom(t.to); t.setTo(f); }}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-primary"
      >
        <IconArrowRightLeft size={18} />
      </button>
      <SelectField label="To" value={t.to} onChange={t.setTo} options={opts} />
    </Squircle>
  );
}

/** Step 2: one row per ride type. Selecting a row shows its vehicles on the map. */
export function RideChooser({ t }: { t: Tracker }) {
  if (t.services.length === 0)
    return (
      <div className="flex flex-col items-center py-2 text-center">
        <Image src="/illustrations/empty-vehicles.svg" alt="An empty bus stop" width={120} height={120} />
        <p className="text-[13px]">No rides between these places yet. Try a different origin or destination.</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      {t.services.map((s) => {
        const on = t.selected === s.route.slug;
        const best = s.vehicles[0]?.v;
        return (
          <button key={s.route._id} onClick={() => t.setSelected(on ? null : s.route.slug)} className="block w-full text-left">
            <Squircle radius={22} className={cn("flex items-center gap-3 px-4 py-3", on ? "bg-primary/12" : "bg-card")}>
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-background text-primary">
                <IconBus size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-foreground">{s.route.name}</span>
                <span className="block text-[12px]">{TYPE_LABEL[s.route.type]} · ₱{s.route.fare}</span>
              </span>
              <span className="flex flex-col items-end gap-1">
                <span className="text-[17px] text-foreground">{s.next === null ? "—" : `${s.next} min`}</span>
                {best ? <SeatBadge seat={best.seat} /> : <span className="text-[11px]">No vehicles</span>}
              </span>
            </Squircle>
          </button>
        );
      })}
    </div>
  );
}

/** Step 3: vehicles for the chosen ride with ETA and seat status. Tap one to pick it. */
export function VehicleList({ t, selectedId, onSelect }: { t: Tracker; selectedId: string | null; onSelect: (id: string) => void }) {
  if (!t.active) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-[13px]">{t.active.route.name} · {TYPE_LABEL[t.active.route.type]}</p>
      {t.active.vehicles.map(({ v, eta }) => (
        <button key={v._id} onClick={() => onSelect(v._id)} className="block w-full text-left">
          <Squircle radius={20} className={cn("flex items-center justify-between px-4 py-3.5", selectedId === v._id ? "bg-primary/12" : "bg-card")}>
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-background text-primary"><IconBus size={22} /></span>
              <span>
                <span className="block text-[15px] text-foreground">{v.label}</span>
                <span className="block text-[12px]">{eta} min away</span>
              </span>
            </span>
            <SeatBadge seat={v.seat} />
          </Squircle>
        </button>
      ))}
    </div>
  );
}

export const fmtRadius = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 1)} km` : `${m} m`);

const R_MIN = 100, R_MAX = 3000, R_STEP = 50;

/** Custom radius slider (no native range input) with quick presets. */
export function RadiusSlider({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const set = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (x - r.left) / r.width));
    onChange(Math.round((R_MIN + p * (R_MAX - R_MIN)) / R_STEP) * R_STEP);
  };
  const pct = ((value - R_MIN) / (R_MAX - R_MIN)) * 100;
  return (
    <div>
      <div
        ref={ref}
        className="relative h-10 touch-none"
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e.clientX); }}
        onPointerMove={(e) => { if (e.buttons) set(e.clientX); }}
        role="slider" aria-valuemin={R_MIN} aria-valuemax={R_MAX} aria-valuenow={value} aria-label="Alert radius"
      >
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-card" />
        <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary/40" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${pct}%` }} />
      </div>
      <div className="mt-1 flex gap-2">
        {[300, 500, 1000, 2000].map((m) => (
          <button key={m} onClick={() => onChange(m)} className={cn("flex-1 rounded-full py-2 text-[13px]", value === m ? "bg-primary/12 text-primary" : "bg-card text-foreground")}>{fmtRadius(m)}</button>
        ))}
      </div>
    </div>
  );
}

export function LeaveByCard({ t, classTime = "08:00", compact = false }: { t: Tracker; classTime?: string; compact?: boolean }) {
  const best = bestService(t);
  return (
    <Squircle radius={24} className={cn("bg-primary text-primary-foreground", compact ? "px-4 py-3" : "px-5 py-4")}>
      <div className="flex items-center gap-1.5 text-[12px] text-white/80"><IconClock size={16} /> {fmt12(Number(classTime.slice(0, 2)) * 60 + Number(classTime.slice(3, 5)))} class</div>
      <div className={cn("text-white", compact ? "text-[24px]" : "text-[34px]")}>Leave by {leaveBy(classTime, best, t.delayMin)}</div>
      {t.delayMin > 0 && <div className="mt-0.5 flex items-center gap-1 text-[12px] text-white/90"><IconWarningSign size={14} /> +{t.delayMin} min delay on the road</div>}
    </Squircle>
  );
}

export function WeatherChip({ w, className, onClick }: { w: Weather | null; className?: string; onClick?: () => void }) {
  if (!w) return null;
  const Icon = w.rainy ? IconRainy : w.hot ? IconSun : IconCloudy;
  return (
    <button onClick={onClick} aria-label="Open weather" className={cn("flex h-12 items-center gap-2 rounded-full bg-card px-4 text-left text-[13px]", className)}>
      <Icon size={20} className="text-primary" />
      <span className="text-foreground">{w.temp}°</span>
      <span>{w.rainy ? "Bring an umbrella" : w.hot ? "Hot, bring water" : w.label}</span>
      <IconChevronRightSmall size={18} className="text-muted-foreground" />
    </button>
  );
}

type ReportKind = "roadworks" | "accident" | "traffic" | "flood";
const REPORT_KINDS: { kind: ReportKind; label: string }[] = [
  { kind: "roadworks", label: "Roadworks" },
  { kind: "accident", label: "Accident" },
  { kind: "traffic", label: "Heavy traffic" },
  { kind: "flood", label: "Flooding" },
];
const REPORT_DELAYS = [10, 20, 30, 45] as const;

/** Report illustration from public/illustrations/report-<name>.svg; shows an icon until the file exists. */
function ReportArt({ name, size }: { name: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className="grid place-items-center rounded-3xl bg-background text-primary" style={{ width: size, height: size }}>
        <IconWarningSign size={size / 2} />
      </span>
    );
  return <Image src={`/illustrations/report-${name}.svg`} alt="" width={size} height={size} onError={() => setFailed(true)} />;
}

/** Two taps: what happened, then how long the delay is. */
export function ReportButton({ t }: { t: Tracker }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [sent, setSent] = useState(false);

  const close = () => {
    setOpen(false);
    setTimeout(() => { setKind(null); setSent(false); }, 300); // reset after the sheet has slid away
  };
  const submit = (delay: number) => {
    if (!kind) return;
    t.report(kind, delay).then(() => { setSent(true); setTimeout(close, 2000); });
  };
  const label = REPORT_KINDS.find((k) => k.kind === kind)?.label;

  return (
    <>
      <button onClick={() => setOpen(true)} className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Report delay">
        <IconWarningSign size={22} />
      </button>
      <BottomSheet open={open} onClose={close} title={sent ? undefined : kind ? "How long is the delay?" : "Report a delay"}>
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <ReportArt name="sent" size={200} />
            <div className="text-[18px] text-foreground">Thanks, it's reported</div>
            <p className="text-[14px]">Other commuters can see it now. It clears on its own after 45 minutes.</p>
          </div>
        ) : !kind ? (
          <div className="grid grid-cols-2 gap-2">
            {REPORT_KINDS.map((k) => (
              <button key={k.kind} onClick={() => setKind(k.kind)} className="flex flex-col items-center gap-1 rounded-3xl bg-card px-2 pb-3 pt-2">
                <ReportArt name={k.kind} size={150} />
                <span className="text-[15px] text-foreground">{k.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <ReportArt name={kind} size={80} />
                <span className="text-[16px] text-foreground">{label}</span>
              </span>
              <button onClick={() => setKind(null)} className="rounded-full bg-card px-3 py-1.5 text-[13px] text-foreground">Back</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_DELAYS.map((m) => (
                <button key={m} onClick={() => submit(m)} className="rounded-2xl bg-card py-5 text-[18px] text-foreground">
                  {m === 45 ? "45+ min" : `${m} min`}
                </button>
              ))}
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
}
