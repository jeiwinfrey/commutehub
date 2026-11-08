"use client";

import { IconCloudy, IconRainy, IconSun } from "central-icons";
import { BottomSheet } from "./sheet-picker";
import { Squircle } from "./squircle";
import { bestService, fmt12, leaveByMinutes, type Tracker } from "@/lib/use-tracker";
import { isWet, type Hour, type Weather } from "@/lib/use-weather";
import { cn } from "@/lib/utils";

const iconFor = (code: number) => (isWet(code) ? IconRainy : code <= 1 ? IconSun : IconCloudy);
const hourLabel = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
const uvLabel = (uv: number) => (uv < 3 ? "Low" : uv < 6 ? "Moderate" : uv < 8 ? "High" : uv < 11 ? "Very high" : "Extreme");

function advice(rain: number, temp: number) {
  if (rain >= 60) return "Rain is likely. Bring an umbrella and leave about 10 minutes earlier.";
  if (rain >= 30) return "Showers are possible. Pack a light rain cover.";
  if (temp >= 33) return "It will be hot. Bring water and a hat.";
  return "Good conditions. Nothing special to bring.";
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Squircle radius={20} className="bg-card p-4">
      <div className="text-[12px]">{label}</div>
      <div className="text-[22px] text-foreground">{value}</div>
      {sub && <div className="text-[12px]">{sub}</div>}
    </Squircle>
  );
}

export function WeatherSheet({ open, onClose, w, t, classTime }: { open: boolean; onClose: () => void; w: Weather | null; t: Tracker; classTime: string }) {
  // when you'll leave, and the hour of the forecast that matches it (tomorrow if that time already passed today)
  const leaveMin = leaveByMinutes(classTime, bestService(t), t.delayMin);
  const lm = ((leaveMin % 1440) + 1440) % 1440;
  const [ch, cm] = classTime.split(":").map(Number);
  const tomorrow = w?.hours.find((x) => x.date !== w.today)?.date;
  const leaveDate = w && lm >= w.nowHour * 60 ? w.today : tomorrow;
  const leaveHour: Hour | undefined = w?.hours.find((x) => x.date === leaveDate && x.h === Math.floor(lm / 60));
  const at = w ? w.hours.findIndex((x) => x.date === w.today && x.h === w.nowHour) : -1;
  const strip = w && at >= 0 ? w.hours.slice(at, at + 12) : [];

  return (
    <BottomSheet open={open} onClose={onClose} title="Weather · Laoag City">
      {!w ? (
        <p className="py-8 text-center text-[14px]">Loading the forecast…</p>
      ) : (
        <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto">
          {/* 1. now */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[48px] leading-none text-foreground">{w.temp}°</div>
              <div className="mt-1 text-[15px]">{w.label} · feels like {w.feels}°</div>
            </div>
            {(() => { const Icon = iconFor(w.code); return <Icon size={64} className="text-primary" />; })()}
          </div>

          {/* 2. for your commute */}
          <Squircle radius={24} className="bg-card p-4">
            <div className="text-[13px]">For your commute</div>
            <div className="text-[18px] text-foreground">
              {leaveHour ? `Leave at ${fmt12(lm)} · ${leaveHour.temp}° · ${leaveHour.rain}% rain` : `Leave at ${fmt12(lm)}`}
            </div>
            <div className="mt-1 text-[14px] text-foreground">{leaveHour ? advice(leaveHour.rain, leaveHour.temp) : advice(w.rainChance, w.temp)}</div>
          </Squircle>

          {/* 3. next 12 hours */}
          <div>
            <div className="mb-2 text-[13px]">Next 12 hours</div>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
              {strip.map((x, i) => {
                const Icon = iconFor(x.code);
                const tag = x.date === leaveDate && x.h === Math.floor(lm / 60) ? "Leave" : x.date === leaveDate && x.h === ch ? "Class" : "";
                return (
                  <Squircle key={`${x.date}${x.h}`} radius={20} className={cn("flex w-[68px] shrink-0 flex-col items-center gap-1 py-3", tag ? "bg-primary/12" : "bg-card")}>
                    <span className="text-[12px]">{i === 0 ? "Now" : hourLabel(x.h)}</span>
                    <Icon size={24} className="text-primary" />
                    <span className="text-[16px] text-foreground">{x.temp}°</span>
                    <span className="text-[12px] text-primary">{x.rain}%</span>
                    <span className="h-4 text-[11px] text-primary">{tag}</span>
                  </Squircle>
                );
              })}
            </div>
          </div>

          {/* 4. today */}
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Peak rain chance" value={`${w.maxRain}%`} sub="today" />
            <Tile label="UV index" value={String(w.uv)} sub={uvLabel(w.uv)} />
            <Tile label="Wind" value={`${w.wind} km/h`} />
            <Tile label="Humidity" value={`${w.humidity}%`} />
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
