export type HeroScenePolicy = {
  mode: "static" | "full" | "lite";
  fps: number;
  maxDpr: number;
  scale: number;
};

export function heroScenePolicy({
  width,
  reducedMotion,
  saveData,
  cores,
  memory,
}: {
  width: number;
  reducedMotion: boolean;
  saveData: boolean;
  cores?: number;
  memory?: number;
}): HeroScenePolicy {
  if (
    reducedMotion ||
    saveData ||
    width <= 640 ||
    (cores !== undefined && cores <= 2) ||
    (memory !== undefined && memory <= 2)
  )
    return { mode: "static", fps: 0, maxDpr: 1, scale: 1 };
  if (width <= 1024 || (cores !== undefined && cores <= 4))
    return { mode: "lite", fps: 30, maxDpr: 1, scale: 0.75 };
  return { mode: "full", fps: 60, maxDpr: 1.25, scale: 1 };
}

// One color buffer, no depth/FBO/bloom passes. Bound fill rate even at 4K/DPR3.
export function heroSceneBuffer(
  width: number,
  height: number,
  dpr: number,
  policy: HeroScenePolicy,
) {
  const ratio =
    Math.min(
      Math.max(0.1, dpr),
      policy.maxDpr,
      Math.sqrt(1_000_000 / Math.max(1, width * height)),
    ) * policy.scale;
  return {
    width: Math.max(1, Math.floor(width * ratio)),
    height: Math.max(1, Math.floor(height * ratio)),
  };
}
