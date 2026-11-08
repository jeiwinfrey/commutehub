"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconBus, IconWarningSign, IconArrowRightLeft, IconCheckmark1 } from "central-icons";
import { Squircle } from "./squircle";
import { SelectField } from "./sheet-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { planTrips } from "@/lib/plan";
import { TYPE_LABEL } from "@/lib/use-tracker";
import { cn } from "@/lib/utils";

const TRANSFER = { jeepney: "jeepney terminal", modern_jeepney: "jeepney terminal", bus: "bus terminal", tricycle: "tricycle stand" } as const;

export function PlanScreen() {
  const places = useQuery(api.places.list);
  const routes = useQuery(api.routes.all);
  const vehicles = useQuery(api.vehicles.all);
  const reports = useQuery(api.reports.active);
  const [from, setFrom] = useState("bacarra");
  const [to, setTo] = useState("mmsu");

  const trips = useMemo(
    () => (routes && vehicles ? planTrips(routes, vehicles, reports ?? [], from, to) : []),
    [routes, vehicles, reports, from, to],
  );
  const opts = (places ?? []).map((p) => ({ value: p.slug, label: p.name }));

  return (
    <div className="h-full overflow-y-auto px-4 pb-32 pt-4">
      <h1 className="mb-3 text-[28px]">Plan a trip</h1>
      <Squircle radius={24} className="flex items-center gap-2 bg-card px-4 py-3">
        <SelectField label="From" value={from} onChange={setFrom} options={opts} />
        <button aria-label="Swap" onClick={() => { setFrom(to); setTo(from); }} className="grid size-9 shrink-0 place-items-center rounded-full bg-background text-primary">
          <IconArrowRightLeft size={18} />
        </button>
        <SelectField label="To" value={to} onChange={setTo} options={opts} />
      </Squircle>

      {trips.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <Image src="/illustrations/transfer.svg" alt="A traveler changing from a jeepney to a tricycle" width={220} height={220} />
          <p className="text-[14px]">No connected route for this trip yet.</p>
        </div>
      )}

      {/* collapsed by default; one trip open at a time */}
      <Accordion type="single" collapsible className="mt-4 gap-3">
        {trips.map((trip, ti) => {
          const risky = trip.risks.some(Boolean);
          return (
            <Squircle key={ti} radius={28} className="bg-card">
              <AccordionItem value={`trip-${ti}`}>
                <AccordionTrigger className="p-4">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[22px] text-foreground">{trip.total} min</span>
                      <span className="text-[13px]">{trip.legs.length === 1 ? "Direct" : `${trip.legs.length - 1} transfer${trip.legs.length > 2 ? "s" : ""}`} · ₱{Math.ceil(trip.fare)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px]">{trip.legs.map((l) => TYPE_LABEL[l.route.type]).join(" → ")}</span>
                    {risky && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-destructive/12 px-3 py-1 text-[12px] text-destructive">
                        <IconWarningSign size={14} /> Connection at risk
                      </span>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-2">
                  {trip.legs.map((leg, i) => (
                    <div key={leg.route._id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="grid size-10 place-items-center rounded-2xl bg-background text-primary"><IconBus size={22} /></span>
                        {i < trip.legs.length - 1 && <span className="my-1 w-1 flex-1 rounded-full bg-background" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-3">
                        <div className="text-[15px] text-foreground">{leg.fromName} → {leg.toName}</div>
                        <div className="text-[12px]">{TYPE_LABEL[leg.route.type]} · {leg.route.name}</div>
                        <div className="text-[12px]">Wait {leg.wait} min · ride {leg.ride} min</div>
                        {i < trip.legs.length - 1 && (
                          <div className={cn("mt-2 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]", trip.risks[i] ? "bg-destructive/12 text-destructive" : "bg-success/15 text-success")}>
                            {trip.risks[i] ? <IconWarningSign size={14} /> : <IconCheckmark1 size={14} />}
                            {trip.risks[i] ? "Connection at risk" : "Connection on time"} · {leg.toName} {TRANSFER[trip.legs[i + 1].route.type]}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Squircle>
          );
        })}
      </Accordion>
    </div>
  );
}
