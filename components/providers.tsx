"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sileo";
import "sileo/styles.css";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
  }, []);
  return (
    <ClerkProvider appearance={{ variables: { colorPrimary: "#00A6FF", fontFamily: "inherit" } }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
        <Toaster theme="dark" options={{ fill: "#000000", styles: { title: "text-white!", description: "text-white/70!" } }} position="top-center" offset={{ top: "calc(env(safe-area-inset-top) + 8px)" }} />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
