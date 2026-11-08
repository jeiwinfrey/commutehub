"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "./sheet-picker";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android";

const STEPS: Record<Platform, { title: string; steps: string[]; note: string }> = {
  ios: {
    title: "iPhone and iPad (Safari)",
    steps: [
      "Open CommuteHub in Safari. It won't work from Chrome or an in-app browser.",
      "Tap the Share button, the square with an arrow pointing up, in the toolbar.",
      "Scroll down and tap Add to Home Screen.",
      "Tap Add. CommuteHub now opens full screen from your home screen.",
    ],
    note: "On iPhone, notifications only work once the app is added to the Home Screen (iOS 16.4 or newer).",
  },
  android: {
    title: "Android (Chrome)",
    steps: [
      "Open CommuteHub in Chrome.",
      "Tap the three-dot menu in the top-right corner.",
      "Tap Install app (or Add to Home screen).",
      "Tap Install. CommuteHub now opens full screen from your app drawer and home screen.",
    ],
    note: "Samsung Internet works too: tap the menu, then Add page to, then Home screen.",
  },
};

type InstallEvent = Event & { prompt: () => Promise<unknown> };

/** Row for Me: how to add the PWA to the home screen, with a one-tap install where the browser allows it. */
export function InstallGuide({ row }: { row: (label: string, right: React.ReactNode) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("android");
  const [installed, setInstalled] = useState(false);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    setPlatform(/iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "android");
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const h = (e: Event) => { e.preventDefault(); setPrompt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const info = STEPS[platform];
  return (
    <>
      {row(
        "Install app",
        installed ? (
          <span className="text-[14px]">Installed</span>
        ) : (
          <button onClick={() => setOpen(true)} className="rounded-full bg-background px-3.5 py-1.5 text-[14px] text-foreground">How to</button>
        ),
      )}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Install CommuteHub">
        <div className="mb-4 flex gap-2">
          {(["ios", "android"] as const).map((p) => (
            <button key={p} onClick={() => setPlatform(p)} className={cn("flex-1 rounded-full py-2.5 text-[14px]", platform === p ? "bg-foreground text-background" : "bg-card text-foreground")}>
              {p === "ios" ? "iPhone" : "Android"}
            </button>
          ))}
        </div>
        <p className="mb-3 text-[14px] text-foreground">{info.title}</p>
        <ol className="mb-3 flex flex-col gap-2">
          {info.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3 rounded-2xl bg-card p-3.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[13px] text-white">{i + 1}</span>
              <span className="text-[14px] text-foreground">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mb-4 text-[13px]">{info.note}</p>
        {platform === "android" && prompt ? (
          <button onClick={() => { prompt.prompt(); setOpen(false); }} className="w-full rounded-full bg-primary py-4 text-[16px] text-white">Install now</button>
        ) : (
          <button onClick={() => setOpen(false)} className="w-full rounded-full bg-foreground py-4 text-[16px] text-background">Got it</button>
        )}
      </BottomSheet>
    </>
  );
}
