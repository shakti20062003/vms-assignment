export interface Route {
  id: string;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
  computedAt: string;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: string;
}

export interface BankRecords {
  entries: BankEntry[];
  total: number;
}

export interface BankingResult {
  cbBefore: number;
  cbAfter: number;
  applied?: number;
  entry?: BankEntry;
}

export interface AdjustedCB {
  shipId: string;
  year: number;
  cbRaw: number;
  banked: number;
  cbAdjusted: number;
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: string;
  members: PoolMember[];
  totalCb: number;
}

export const TARGET_INTENSITY = 89.3368;

export type VesselType = 'Container' | 'BulkCarrier' | 'Tanker' | 'RoRo';
export type FuelType = 'HFO' | 'LNG' | 'MGO';
