"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { PhoneFrame } from "@/components/app/phone-frame";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [splash, setSplash] = useState(true);

  useEffect(() => { const id = setTimeout(() => setSplash(false), 1600); return () => clearTimeout(id); }, []);
  useEffect(() => { if (!splash && isLoaded && isSignedIn) router.replace("/home"); }, [splash, isLoaded, isSignedIn, router]);

  return (
    <PhoneFrame>
      <AnimatePresence mode="wait">
        {splash || !isLoaded ? (
          <motion.div key="splash" exit={{ opacity: 0 }} className="grid h-full place-items-center bg-background">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="flex flex-col items-center">
              <Image src="/illustrations/splash.svg" alt="" width={260} height={260} priority />
              <span className="text-[30px] text-primary">CommuteHub</span>
            </motion.div>
          </motion.div>
        ) : !isSignedIn ? (
          <motion.div key="in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col justify-end gap-3 p-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
            <div className="grid flex-1 place-items-center"><Image src="/illustrations/signin.svg" alt="A student waving at an approaching jeepney" width={320} height={320} priority /></div>
            <h1 className="text-[30px]">Know when your ride comes</h1>
            <p className="mb-3 text-[15px]">Live jeepney and bus ETAs, seat status and the best time to leave.</p>
            <SignInButton mode="modal" forceRedirectUrl="/home">
              <button className="rounded-full bg-foreground py-4 text-[16px] text-background">Continue with Google</button>
            </SignInButton>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </PhoneFrame>
  );
}
