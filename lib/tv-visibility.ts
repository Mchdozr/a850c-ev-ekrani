import type { HomeDesign } from "@/lib/design";

/** The first direction reveals the clock's dock without skipping its first app. */
export function clockWaitingForInput(design: HomeDesign): boolean {
  return design.layout === "saat" && document.querySelector('[data-clock-apps="hidden"]') !== null;
}
