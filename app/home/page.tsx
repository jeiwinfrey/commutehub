"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PhoneFrame } from "@/components/app/phone-frame";
import { TabBar, type TabId } from "@/components/app/tab-bar";
import { HomeScreen } from "@/components/app/home-screen";
import { PlanScreen } from "@/components/app/plan-screen";
import { AlertNotifier, AlertsScreen } from "@/components/app/alerts-screen";
import { MeScreen } from "@/components/app/me-screen";
import { Onboarding } from "@/components/app/onboarding";

export default function HomePage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.me);
  const ensure = useMutation(api.users.ensure);
  const [tab, setTab] = useState<TabId>("home");
  const [planStops, setPlanStops] = useState<{ from: string; to: string; limitedRoute?: string } | null>(null);

  useEffect(() => { if (!isLoading && !isAuthenticated) router.replace("/"); }, [isLoading, isAuthenticated, router]);
  useEffect(() => { if (isAuthenticated && user === null) ensure(); }, [isAuthenticated, user, ensure]);

  return (
    <PhoneFrame>
      {!user ? (
        <div className="grid h-full place-items-center text-[14px]">Loading…</div>
      ) : !user.onboarded ? (
        <div className="h-full pt-[env(safe-area-inset-top)]"><Onboarding name={user.name} /></div>
      ) : (
        <div className="relative h-full">
          <AlertNotifier user={user} />
          {tab === "home" ? (
            <HomeScreen
              initialFrom={user.homePlace ?? "laoag"}
              initialTo={user.schoolPlace ?? "batac"}
              onPlan={(from, to, limitedRoute) => { setPlanStops({ from, to, limitedRoute }); setTab("plan"); }}
            />
          ) : (
            <div className="h-full pt-[env(safe-area-inset-top)]">
              {tab === "plan" && (
                <PlanScreen
                  initialFrom={planStops?.from ?? user.homePlace ?? "bacarra"}
                  initialTo={planStops?.to ?? user.schoolPlace ?? "mmsu"}
                  limitedRoute={planStops?.limitedRoute}
                />
              )}
              {tab === "alerts" && <AlertsScreen user={user} />}
              {tab === "me" && <MeScreen user={user} />}
            </div>
          )}
          <TabBar active={tab} onChange={(next) => { if (next !== tab) setPlanStops(null); setTab(next); }} floating onMap={tab === "home"} />
        </div>
      )}
    </PhoneFrame>
  );
}
