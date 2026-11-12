"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconBus, IconCloudy, IconRainy, IconSun } from "central-icons";
import { Squircle } from "./squircle";
import { useWeather } from "@/lib/use-weather";
import { notifyOnce, toastOnce } from "@/lib/notify";

type Alert = { id: string; kind: "weather" | "arrival"; title: string; body: string; Icon: typeof IconSun; push?: boolean; createdAt?: number };

function useAlerts(user: Doc<"users">) {
  const weather = useWeather();
  const saved = useQuery(api.alerts.mine);
  return useMemo(() => {
    const alerts: Alert[] = [];
    for (const alert of saved ?? []) {
      if (alert.kind !== "arrival" && alert.kind !== "weather") continue;
      alerts.push({
        id: alert._id,
        kind: alert.kind,
        title: alert.title,
        body: alert.body,
        Icon: alert.kind === "arrival" ? IconBus : IconRainy,
        createdAt: alert.createdAt,
      });
    }
    if (user.notifyWeather && weather) {
      const { rainy, hot, rainChance, temp, label } = weather;
      alerts.push({
        id: "weather", kind: "weather", Icon: rainy ? IconRainy : hot ? IconSun : IconCloudy,
        title: rainy ? `${rainChance}% chance of rain` : hot ? `It's ${temp}° out` : `${temp}° · ${label}`,
        body: rainy ? "Bring an umbrella or rain jacket before you leave." : hot ? "Bring water and a hat." : "Conditions are clear for your commute.",
        push: rainy || hot,
      });
    }
    return { alerts, hasSaved: alerts.some((alert) => alert.id !== "weather") };
  }, [weather, saved, user.notifyWeather]);
}

export function AlertsScreen({ user }: { user: Doc<"users"> }) {
  const { alerts, hasSaved } = useAlerts(user);
  const clear = useMutation(api.alerts.clear);
  return (
    <div className="h-full overflow-y-auto px-4 pb-32 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-[28px]">Alerts</h1>
        {hasSaved && <button onClick={() => clear()} className="rounded-full bg-card px-3.5 py-1.5 text-[14px] text-foreground">Clear</button>}
      </div>
      <div className="flex flex-col gap-2">
        {alerts.length === 0 && (
          <div className="flex flex-col items-center py-8 text-center">
            <Image src="/illustrations/empty-alerts.svg" alt="A quiet bell with a check" width={220} height={220} />
            <p className="text-[14px]">You’re all caught up.</p>
          </div>
        )}
        {alerts.map((a) => (
          <Squircle key={a.id} radius={24} className="flex gap-3 bg-card p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-background"><a.Icon size={24} className="text-primary" /></span>
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
  const { alerts } = useAlerts(user);
  useEffect(() => {
    for (const a of alerts) {
      const recent = a.createdAt !== undefined && Date.now() - a.createdAt < 5 * 60 * 1000;
      if (!a.push && !recent) continue;
      const key = `${a.kind}-${a.id}`;
      toastOnce(key, a.kind === "arrival" ? "success" : "info", a.title, a.body);
      notifyOnce(key, a.title, a.body);
    }
  }, [alerts]);
  return null;
}
