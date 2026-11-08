"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import type { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconBus, IconCloudy, IconRainy, IconSun, IconClockAlert, IconWarningSign } from "central-icons";
import { Squircle } from "./squircle";
import { useWeather } from "@/lib/use-weather";
import { notifyOnce, toastOnce } from "@/lib/notify";
import { cn } from "@/lib/utils";

type Alert = { id: string; kind: "rush" | "weather" | "delay" | "arrival"; title: string; body: string; Icon: typeof IconSun; tone: string; push?: boolean };

const KIND = { roadworks: "Roadworks", accident: "Accident", traffic: "Heavy traffic", flood: "Flooding" } as const;

export function useAlerts(user: Doc<"users">) {
  const w = useWeather();
  const reports = useQuery(api.reports.active) ?? [];
  const arrivals = useQuery(api.alerts.mine) ?? [];
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const weekday = now.getDay() >= 1 && now.getDay() <= 5;
  const toPeak = 17 * 60 - mins;
  const home = user.homePlace ?? "your stop";

  return useMemo(() => {
    const list: Alert[] = arrivals.map((a) => ({
      id: a._id, kind: "arrival", Icon: IconBus, tone: "text-primary", title: a.title, body: a.body, push: Date.now() - a.createdAt < 5 * 60 * 1000,
    }));
    if (user.notifyWeather && w) {
      const Icon = w.rainy ? IconRainy : w.hot ? IconSun : IconCloudy;
      list.push({
        id: "weather", kind: "weather", Icon, tone: "text-primary",
        title: w.rainy ? `${w.rainChance}% chance of rain` : w.hot ? `It's ${w.temp}° out` : `${w.temp}° · ${w.label}`,
        body: w.rainy ? "Bring an umbrella or rain jacket before you leave." : w.hot ? "Bring water and a hat, and leave a little earlier." : "No weather problems on your usual route.",
        push: w.rainy || w.hot,
      });
    }
    if (user.notifyRush) {
      const soon = weekday && toPeak <= 20 && toPeak > -60;
      list.push({
        id: "rush", kind: "rush", Icon: IconClockAlert, tone: "text-success",
        title: soon ? (toPeak > 0 ? `Rush hour in ${toPeak} min` : "Rush hour is on now") : "Rush hour 5–6 PM",
        body: now.getDay() === 5 ? `Friday crush near ${home}. Leave before 4:40 PM or wait elsewhere.` : `Expect full vehicles near ${home}. Leave before 4:40 PM to beat it.`,
        push: soon,
      });
    }
    if (user.notifyDelay) {
      for (const r of reports) {
        list.push({
          id: r._id, kind: "delay", Icon: IconWarningSign, tone: "text-destructive",
          title: `${KIND[r.kind]} · +${r.delayMin} min`,
          body: `Reported by ${r.authorName} ${Math.max(1, Math.round((Date.now() - r.createdAt) / 60000))} min ago. Expires in ${Math.max(1, Math.round((r.expiresAt - Date.now()) / 60000))} min.`,
          push: true,
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, reports.length, arrivals.length, user.notifyWeather, user.notifyRush, user.notifyDelay, toPeak, home]);
}

export function AlertsScreen({ user }: { user: Doc<"users"> }) {
  const alerts = useAlerts(user);
  return (
    <div className="h-full overflow-y-auto px-4 pb-32 pt-4">
      <h1 className="mb-3 text-[28px]">Alerts</h1>
      <div className="flex flex-col gap-2">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <Image src="/illustrations/empty-alerts.svg" alt="A quiet bell with a check" width={220} height={220} />
            <p className="text-[14px]">You're all caught up.</p>
          </div>
        )}
        {alerts.map((a) => (
          <Squircle key={a.id} radius={24} className="flex gap-3 bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-background"><a.Icon size={24} className={cn(a.tone)} /></span>
            <span>
              <span className="block text-[16px] text-foreground">{a.title}</span>
              <span className="block text-[13px]">{a.body}</span>
            </span>
          </Squircle>
        ))}
      </div>
    </div>
  );
}

/** Mounted once in the shell so push-style alerts fire from any tab. */
export function AlertNotifier({ user }: { user: Doc<"users"> }) {
  const alerts = useAlerts(user);
  useEffect(() => {
    for (const a of alerts) {
      if (!a.push) continue;
      const key = `${a.kind}-${a.id}`;
      toastOnce(key, a.kind === "arrival" ? "success" : a.kind === "delay" ? "warning" : "info", a.title, a.body);
      notifyOnce(key, a.title, a.body);
    }
  }, [alerts]);
  return null;
}
