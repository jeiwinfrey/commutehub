"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useClerk, useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Squircle } from "./squircle";
import { SelectField, TimeField } from "./sheet-picker";
import { ensurePermission } from "@/lib/notify";
import { Switch } from "@/components/ui/switch";
import { InstallGuide } from "./install-guide";
import { PreviewAlerts } from "./preview-alerts";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-2.5"><span className="text-[15px] text-foreground">{label}</span>{children}</div>;
}

export function MeScreen({ user }: { user: Doc<"users"> }) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const update = useMutation(api.users.update);
  const places = useQuery(api.places.list);
  const opts = (places ?? []).map((p) => ({ value: p.slug, label: p.name }));

  return (
    <div className="h-full overflow-y-auto px-4 pb-32 pt-4">
      <h1 className="mb-3 text-[28px]">Me</h1>
      <Squircle radius={28} className="mb-3 flex items-center gap-3 bg-card p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {clerkUser?.imageUrl ? <img src={clerkUser.imageUrl} alt="" className="size-14 rounded-full" /> : <span className="size-14 rounded-full bg-background" />}
        <div>
          <div className="text-[18px] text-foreground">{user.name}</div>
          <div className="text-[13px]">{user.email}</div>
        </div>
      </Squircle>

      <h2 className="mb-1 mt-4 px-1 text-[13px] text-muted-foreground">Your commute</h2>
      <Squircle radius={24} className="bg-card px-4 py-1">
        <Row label="Home stop">
          <SelectField variant="pill" label="Home stop" value={user.homePlace ?? ""} options={opts} onChange={(v) => update({ homePlace: v })} />
        </Row>
        <Row label="School">
          <SelectField variant="pill" label="School" value={user.schoolPlace ?? ""} options={opts} onChange={(v) => update({ schoolPlace: v })} />
        </Row>
        <Row label="First class at">
          <TimeField label="First class at" value={user.classTime} onChange={(v) => update({ classTime: v })} />
        </Row>
      </Squircle>

      <h2 className="mb-1 mt-4 px-1 text-[13px] text-muted-foreground">Notifications</h2>
      <Squircle radius={24} className="bg-card px-4 py-1">
        <Row label="Rush-hour alerts"><Switch checked={user.notifyRush} onCheckedChange={(v) => { update({ notifyRush: v }); if (v) ensurePermission(); }} /></Row>
        <Row label="Weather alerts"><Switch checked={user.notifyWeather} onCheckedChange={(v) => { update({ notifyWeather: v }); if (v) ensurePermission(); }} /></Row>
        <Row label="Delay reports"><Switch checked={user.notifyDelay} onCheckedChange={(v) => { update({ notifyDelay: v }); if (v) ensurePermission(); }} /></Row>
      </Squircle>

      <h2 className="mb-1 mt-4 px-1 text-[13px] text-muted-foreground">App</h2>
      <Squircle radius={24} className="bg-card px-4 py-1">
        <InstallGuide row={(label, right) => <Row label={label}>{right}</Row>} />
        <PreviewAlerts row={(label, right) => <Row label={label}>{right}</Row>} />
        <Row label="Distance units"><span className="text-[14px]">Kilometers</span></Row>
        <Row label="Version"><span className="text-[14px]">1.0.0</span></Row>
      </Squircle>

      <button onClick={() => signOut({ redirectUrl: "/" })} className="mt-5 w-full rounded-full bg-card py-4 text-[15px] text-destructive">Sign out</button>
    </div>
  );
}
