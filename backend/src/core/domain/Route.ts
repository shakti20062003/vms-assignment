export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;       // gCO2e/MJ
  fuelConsumption: number;    // tonnes
  distance: number;           // km
  totalEmissions: number;     // tonnes
  isBaseline: boolean;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export const TARGET_INTENSITY_2025 = 89.3368; // gCO2e/MJ (2% below 91.16)
export const ENERGY_CONVERSION_FACTOR = 41000; // MJ/tonne

export function computeEnergyInScope(fuelConsumptionTonnes: number): number {
  return fuelConsumptionTonnes * ENERGY_CONVERSION_FACTOR;
}

export function computePercentDiff(baseline: number, comparison: number): number {
  return ((comparison / baseline) - 1) * 100;
}

export function isCompliant(ghgIntensity: number, target: number = TARGET_INTENSITY_2025): boolean {
  return ghgIntensity <= target;
}
