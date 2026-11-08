"use client";

import { SmoothCorners } from "@lisse/react";
import type { ComponentProps } from "react";

type Props = ComponentProps<"div"> & { radius?: number };

/** Flat surface with iOS-style continuous corners. */
export function Squircle({ radius = 24, style, ...rest }: Props) {
  return <SmoothCorners corners={{ radius, smoothing: 0.6 }} style={style} {...(rest as object)} />;
}
