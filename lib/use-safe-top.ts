"use client";

import { useEffect, useState } from "react";

/** Height in px of the status bar / notch area (0 on devices without one). */
export function useSafeTop() {
  const [px, setPx] = useState(0);
  useEffect(() => {
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top)";
    document.body.appendChild(el);
    setPx(el.getBoundingClientRect().height);
    el.remove();
  }, []);
  return px;
}
