import { designRegions, type DesignRegionId } from "@/lib/design-registry";

// Apply to the component's existing semantic root. No new layout wrapper.
export function designRegionProps(id: DesignRegionId) {
  return {
    "data-design-region": id,
    "data-design-label": designRegions[id].label,
  };
}
