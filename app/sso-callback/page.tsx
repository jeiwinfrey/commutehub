"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Landing spot after Google: Clerk finishes the sign-in (or creates the account) and sends you to /home.
export default function SsoCallback() {
  return (
    <>
      <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/home" signUpFallbackRedirectUrl="/home" />
      <div id="clerk-captcha" />
      <div className="grid min-h-dvh place-items-center text-[14px]">Signing you in…</div>
    </>
  );
}
