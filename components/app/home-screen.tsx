"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MapView } from "./map-view";
import { FromTo, RadiusSlider, RideChooser, SeatBadge, VehicleList, WeatherChip, fmtRadius } from "./parts";
import { Squircle } from "./squircle";
import { TYPE_LABEL, useTracker, type Tracker } from "@/lib/use-tracker";
import { useWeather } from "@/lib/use-weather";
import { WeatherSheet } from "./weather-sheet";
import { ensurePermission } from "@/lib/notify";
import { useSafeTop } from "@/lib/use-safe-top";

// floats above the tab bar so nothing white sits underneath it
const LIFT = "bottom-[var(--lift)]";
const PRIMARY_BTN = "w-full rounded-full bg-primary py-4 text-[16px] text-white disabled:opacity-40";
const CHIP_BTN = "rounded-full bg-card px-3 py-1.5 text-[13px] text-foreground";

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className={`absolute inset-x-4 ${LIFT} z-20`}>
      <Squircle radius={32} className="bg-background p-5">{children}</Squircle>
    </div>
  );
}

function RideAlternatives({ t, vehicleId, onSelect, onPlan }: {
  t: Tracker; vehicleId: string | null; onSelect: (route: string, vehicleId: string) => void; onPlan: () => void;
}) {
  if (!t.active) return null;
  const servesPickup = t.active.servesPickup;
  const incoming = t.active.vehicles.filter((entry) => entry.status === "incoming");
  const usual = vehicleId ? incoming.find(({ v }) => v._id === vehicleId) : incoming[0];
  if (servesPickup && usual?.v.seat === "open") return null;

  const alternatives = t.services
    .filter((service) => service.servesPickup)
    .flatMap(({ route, vehicles }) => vehicles
      .filter(({ v, status }) => status === "incoming" && v.seat !== "full" && v._id !== usual?.v._id &&
        (usual?.v.seat !== "few" || v.seat === "open" || !servesPickup))
      .map((entry) => ({ ...entry, route })))
    .sort((a, b) => Number(a.v.seat === "few") - Number(b.v.seat === "few") || a.eta - b.eta);
  const alternative = alternatives[0];

  return (
    <section aria-label="Other ways to ride" className="mb-3 rounded-2xl bg-card p-3">
      <h3 className="text-[15px] text-foreground">Limited availability</h3>
      {alternative ? (
        <button
          type="button"
          onClick={() => onSelect(alternative.route.slug, alternative.v._id)}
          className="mt-1 flex min-h-10 w-full items-center justify-between gap-2 rounded-xl bg-background px-3 py-2 text-left text-[13px]"
        >
          <span>
            <span className="block text-foreground">Track {alternative.v.label}</span>
            <span className="tabular-nums">{TYPE_LABEL[alternative.route.type]} · {alternative.eta} min</span>
          </span>
          <SeatBadge seat={alternative.v.seat} />
        </button>
      ) : (
        <p className="mt-1 text-[13px]">No other approaching rides with more seats near this pickup.</p>
      )}
      <button type="button" onClick={onPlan} className="mt-1 min-h-10 text-left text-[13px] text-primary underline underline-offset-2">
        Explore other routes from {t.fromPlace?.name ?? "your origin"}
      </button>
    </section>
  );
}

/** Step 3: pick one vehicle. A fixed card at its final size; only the vehicle list scrolls. */
function DetailsCard({ t, vehicleId, onSelect, onAlternative, onPlan, onChangeRide, onNext }: {
  t: Tracker; vehicleId: string | null; onSelect: (id: string) => void;
  onAlternative: (route: string, id: string) => void; onPlan: () => void; onChangeRide: () => void; onNext: () => void;
}) {
  return (
    <div className={`absolute inset-x-4 ${LIFT} z-20`}>
      <Squircle radius={32} className="flex max-h-[calc(100dvh-env(safe-area-inset-top)-var(--lift)-120px)] flex-col bg-background p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <span className="min-w-0 truncate text-[13px]">Pickup · {t.pickupLabel}</span>
          <button onClick={onChangeRide} className={CHIP_BTN}>Change ride</button>
        </div>
        <div className="mb-3 min-h-0 flex-1 overflow-y-auto">
          <RideAlternatives t={t} vehicleId={vehicleId} onSelect={onAlternative} onPlan={onPlan} />
          <VehicleList t={t} selectedId={vehicleId} onSelect={onSelect} />
        </div>
        <button disabled={!vehicleId} onClick={onNext} className={PRIMARY_BTN}>{vehicleId ? "Set pickup alert" : "Select a vehicle to set an alert"}</button>
      </Squircle>
    </div>
  );
}

/** Step 4: size the alert zone around the pin, then watch it. */
function ZoneCard({ t, vehicleId, radius, setRadius, onBack, onDone }: {
  t: Tracker; vehicleId: string; radius: number; setRadius: (m: number) => void; onBack: () => void; onDone: () => void;
}) {
  const zone = useQuery(api.geofences.mine);
  const start = useMutation(api.geofences.start);
  const cancel = useMutation(api.geofences.cancel);
  const preview = useMutation(api.geofences.simulateArrival);
  const entry = t.active?.vehicles.find((x) => x.v._id === vehicleId);
  const label = entry?.v.label ?? "Your vehicle";
  const running = zone && zone.vehicleId === vehicleId && zone.status === "active";
  const fired = zone && zone.vehicleId === vehicleId && zone.status === "triggered";

  if (fired)
    return (
      <Card>
        <h2 className="text-[20px]">{label} is near</h2>
        <p className="mb-4 mt-1 text-[14px]">It came within {fmtRadius(zone.radiusM)} of your pin. Get ready to board.</p>
        <button onClick={() => { cancel({ id: zone._id }); onDone(); }} className={PRIMARY_BTN}>Done</button>
      </Card>
    );
  if (running)
    return (
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-[20px]">Alert is on</h2>
          <button onClick={() => preview({ id: zone._id })} className={CHIP_BTN}>Preview arrival</button>
        </div>
        <p className="mb-4 mt-1 text-[14px]">We’ll alert you when {label} comes within {fmtRadius(zone.radiusM)} of your pin{entry ? ` · ${entry.eta} min away now` : ""}.</p>
        <button onClick={() => cancel({ id: zone._id })} className="w-full rounded-full bg-card py-4 text-[16px] text-foreground">Stop alert</button>
      </Card>
    );
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[20px]">Set alert zone</h2>
        <button onClick={onBack} className={CHIP_BTN}>Back</button>
      </div>
      <p className="mb-2 text-[14px]">Alert me when {label} enters this circle.</p>
      <div className="mb-1 text-[28px] text-foreground">{fmtRadius(radius)}</div>
      <RadiusSlider value={radius} onChange={setRadius} />
      <button
        disabled={!t.pickupPoint || !t.active}
        onClick={() => {
          if (!t.pickupPoint || !t.active) return;
          ensurePermission();
          start({ vehicleId: vehicleId as Id<"vehicles">, dir: t.active.route.dir, lng: t.pickupPoint[0], lat: t.pickupPoint[1], radiusM: radius });
        }}
        className={`${PRIMARY_BTN} mt-4`}
      >
        Start alert
      </button>
    </Card>
  );
}

/** Tracker home: full-bleed map, floating route card, then pickup -> ride -> vehicle -> alert zone. */
export function HomeScreen({ initialFrom, initialTo, onPlan }: {
  initialFrom: string; initialTo: string; onPlan: (from: string, to: string, limitedRoute?: string) => void;
}) {
  const t = useTracker(initialFrom, initialTo);
  const openPlan = () => onPlan(t.from, t.to, t.active?.route.slug);
  const w = useWeather();
  const safeTop = useSafeTop();
  const [step, setStep] = useState<"route" | "pickup" | "ride" | "details" | "zone">("route");
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [weatherOpen, setWeatherOpen] = useState(false);

  const bottom = step === "zone" ? 420 : step === "details" ? 430 : step === "ride" ? 400 : step === "pickup" ? 330 : 300;
  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <MapView t={t} pickMode={step === "route" || step === "pickup"} tapToPick={step === "pickup"} vehicleId={step === "details" || step === "zone" ? vehicleId : null} zoneRadius={step === "zone" ? radius : null} pad={{ top: 80 + safeTop, bottom }} />
      </div>
      <div className="absolute inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] z-20 flex items-center justify-between">
        <WeatherChip w={w} className="bg-background" onClick={() => setWeatherOpen(true)} />
      </div>
      <WeatherSheet open={weatherOpen} onClose={() => setWeatherOpen(false)} w={w} />
      {step === "route" && (
        <Card>
          <h2 className="mb-3 text-[20px]">Where are you going?</h2>
          <FromTo t={t} />
          {t.from === t.to && <p className="mt-3 text-[13px]">Choose two different places.</p>}
          {t.hasRoutes === false ? (
            <>
              <p className="mt-3 text-[13px]">No direct ride to track between these places.</p>
              <button onClick={openPlan} className={`${PRIMARY_BTN} mt-4`}>Explore routes with transfers</button>
            </>
          ) : (
            <button disabled={t.from === t.to || !t.pickupPoint} onClick={() => setStep("pickup")} className={`${PRIMARY_BTN} mt-4`}>Continue</button>
          )}
        </Card>
      )}
      {step === "pickup" && (
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[20px]">Set your pickup</h2>
            <button onClick={() => setStep("route")} className={CHIP_BTN}>Change route</button>
          </div>
          <p className="mt-1 text-[13px] text-foreground">{t.fromPlace?.name} → {t.toPlace?.name}</p>
          <p className="mb-2 mt-2 text-[13px]">Common pickup spots</p>
          <div className="-mx-5 mb-2 flex gap-2 overflow-x-auto px-5">
            {t.pickupOptions.map((o) => (
              <button key={o.name} onClick={() => t.setPickup(o.point, o.name)} className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] ${t.pickupLabel === o.name ? "bg-primary text-white" : "bg-card text-foreground"}`}>{o.name}</button>
            ))}
          </div>
          <p className="mb-4 text-[13px]">Or tap the blue route where you’ll wait. The pin snaps to the road.</p>
          <button disabled={!t.pickupPoint} onClick={() => setStep("ride")} className={PRIMARY_BTN}>Confirm pickup</button>
        </Card>
      )}
      {step === "ride" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[20px]">Choose your ride</h2>
            <button onClick={() => setStep("pickup")} className={CHIP_BTN}>Change pickup</button>
          </div>
          <RideChooser t={t} />
          <button disabled={!t.active} onClick={() => setStep("details")} className={`${PRIMARY_BTN} mt-4`}>{t.active ? "Next" : "Select a ride to continue"}</button>
        </Card>
      )}
      {step === "details" && (
        <DetailsCard
          t={t}
          vehicleId={vehicleId}
          onSelect={setVehicleId}
          onAlternative={(route, id) => { t.setSelected(route); setVehicleId(id); }}
          onPlan={openPlan}
          onChangeRide={() => { setVehicleId(null); setStep("ride"); }}
          onNext={() => setStep("zone")}
        />
      )}
      {step === "zone" && vehicleId && (
        <ZoneCard t={t} vehicleId={vehicleId} radius={radius} setRadius={setRadius} onBack={() => setStep("details")} onDone={() => { t.reset(); setVehicleId(null); setStep("route"); }} />
      )}
    </div>
  );
}
