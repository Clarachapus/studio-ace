"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

/** The home is a single screen: the footer only appears on inner pages. */
export function FooterGate({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
