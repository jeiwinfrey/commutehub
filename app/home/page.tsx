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

  useEffect(() => { if (!isLoading && !isAuthenticated) router.replace("/"); }, [isLoading, isAuthenticated, router]);
  useEffect(() => { if (isAuthenticated && user === null) ensure(); }, [isAuthenticated, user, ensure]);

  return (
    <PhoneFrame>
      {!user ? (
        <div className="grid h-full place-items-center text-[14px]">Loading…</div>
      ) : !user.onboarded ? (
        <Onboarding name={user.name} />
      ) : (
        <div className="relative h-full">
          <AlertNotifier user={user} />
          <div className="h-full">
            {tab === "home" && <HomeScreen classTime={user.classTime} />}
            {tab === "plan" && <PlanScreen />}
            {tab === "alerts" && <AlertsScreen user={user} />}
            {tab === "me" && <MeScreen user={user} />}
          </div>
          <TabBar active={tab} onChange={setTab} floating onMap={tab === "home"} />
        </div>
      )}
    </PhoneFrame>
  );
}
