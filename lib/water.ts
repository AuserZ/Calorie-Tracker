// Daily hydration target. Default 2000 ml (~8 cups) per day.
// Scales up modestly with weight: ~35 ml/kg, clamped to [1500, 3500].

export function dailyWaterTarget(weightKg: number | null | undefined): number {
  if (!weightKg || !Number.isFinite(weightKg)) return 2000;
  const ml = Math.round(weightKg * 35);
  return Math.max(1500, Math.min(3500, ml));
}