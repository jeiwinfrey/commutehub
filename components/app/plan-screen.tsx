"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IconBus, IconArrowRightLeft } from "central-icons";
import { BatacTransfer } from "./batac-transfer";
import { Squircle } from "./squircle";
import { SelectField } from "./sheet-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { planTrips } from "@/lib/plan";
import { TYPE_LABEL } from "@/lib/use-tracker";

export function PlanScreen({ initialFrom, initialTo, limitedRoute }: { initialFrom: string; initialTo: string; limitedRoute?: string }) {
  const places = useQuery(api.places.list);
  const routes = useQuery(api.routes.all);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  const deprioritizedRoute = from === initialFrom && to === initialTo ? limitedRoute : undefined;
  const trips = useMemo(
    () => routes ? planTrips(routes, from, to, deprioritizedRoute) : [],
    [routes, from, to, deprioritizedRoute],
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

      {!routes && <p role="status" className="py-8 text-center text-[14px]">Loading routes…</p>}
      {routes && trips.length === 0 && (
        <div className="flex flex-col items-center py-8 text-center">
          <Image src="/illustrations/transfer.svg" alt="A traveler changing from a jeepney to a tricycle" width={220} height={220} />
          <p className="text-[14px]">{from === to ? "Choose two different places." : "No connected route for this trip yet."}</p>
        </div>
      )}

      {/* collapsed by default; one trip open at a time */}
      <Accordion type="single" collapsible className="mt-4 gap-3">
        {trips.map(({ legs }) => {
          const transfers = legs.length - 1;
          const key = legs.map((leg) => `${leg.route._id}:${leg.from.slug}:${leg.to.slug}`).join("|");
          return (
            <Squircle key={key} radius={28} className="bg-card">
              <AccordionItem value={key}>
                <AccordionTrigger className="p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] text-foreground">{legs.map((leg) => TYPE_LABEL[leg.route.type]).join(" → ")}</span>
                    <span className="mt-0.5 block text-[13px]">
                      {transfers === 0 ? "Direct" : `${transfers} transfer${transfers === 1 ? "" : "s"}`}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-2">
                  <ol>
                    {legs.map((leg, index) => (
                      <li key={leg.route._id} className="flex gap-3">
                        <div className="flex flex-col items-center" aria-hidden="true">
                          <span className="grid size-10 place-items-center rounded-2xl bg-background text-primary"><IconBus size={22} /></span>
                          {index < transfers && <span className="my-1 w-1 flex-1 rounded-full bg-background" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-3">
                          <div className="text-[15px] text-foreground">{leg.from.name} → {leg.to.name}</div>
                          <div className="text-[12px]">{TYPE_LABEL[leg.route.type]} · {leg.route.name}</div>
                          {index < transfers && <div className="mt-1 text-[13px]">Transfer at {leg.to.name}</div>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Squircle>
          );
        })}
      </Accordion>
      <div className="mt-3 empty:hidden"><BatacTransfer from={from} to={to} /></div>
    </div>
  );
}
