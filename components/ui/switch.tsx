"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch as SwitchPrimitive } from "radix-ui"

// Flat, iOS-sized switch: green when on, white track when off (it sits on gray cards).
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full transition-colors outline-none after:absolute after:-inset-x-2 after:-inset-y-2 data-[state=checked]:bg-success data-[state=unchecked]:bg-[#D1D1D6] data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-7 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
