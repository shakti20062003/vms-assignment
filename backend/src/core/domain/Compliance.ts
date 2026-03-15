import { TARGET_INTENSITY_2025, ENERGY_CONVERSION_FACTOR } from './Route';

export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;        // gCO2e
  computedAt: Date;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: Date;
}

export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
  members?: PoolMember[];
}

export interface PoolMember {
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolCreationRequest {
  year: number;
  members: Array<{ shipId: string; cbBefore: number; allocation?: number }>;
}

export interface PoolCreationResult {
  poolId: string;
  members: Array<{ shipId: string; cbBefore: number; cbAfter: number }>;
  totalCb: number;
  valid: boolean;
}

/**
 * Core CB formula:
 * CB = (Target - Actual GHG Intensity) × Energy in scope (MJ)
 */
export function computeComplianceBalance(
  actualGhgIntensity: number,
  fuelConsumptionTonnes: number,
  target: number = TARGET_INTENSITY_2025
): number {
  const energyInScope = fuelConsumptionTonnes * ENERGY_CONVERSION_FACTOR;
  return (target - actualGhgIntensity) * energyInScope;
}

/**
 * Greedy pool allocation:
 * Sort desc by CB, transfer surplus from positive to negative members
 */
export function allocatePool(
  members: Array<{ shipId: string; cbBefore: number }>
): Array<{ shipId: string; cbBefore: number; cbAfter: number }> {
  const totalCb = members.reduce((sum, m) => sum + m.cbBefore, 0);
  if (totalCb < 0) {
    throw new Error('Pool sum of compliance balances must be >= 0');
  }

  // Start with cbAfter = cbBefore, then greedily fill deficits from surpluses
  const result = members.map(m => ({ ...m, cbAfter: m.cbBefore }));

  // Sort: surplus ships first (desc)
  const sorted = [...result].sort((a, b) => b.cbBefore - a.cbBefore);

  let surplusPool = sorted.filter(m => m.cbBefore > 0);
  let deficitPool = sorted.filter(m => m.cbBefore < 0);

  for (const deficit of deficitPool) {
    let needed = Math.abs(deficit.cbAfter);
    for (const surplus of surplusPool) {
      if (needed <= 0) break;
      const transfer = Math.min(surplus.cbAfter, needed);
      surplus.cbAfter -= transfer;
      deficit.cbAfter += transfer;
      needed -= transfer;
    }
  }

  // Validate: no surplus ship exits negative
  for (const m of surplusPool) {
    if (m.cbAfter < 0) {
      throw new Error(`Surplus ship ${m.shipId} would exit pool with negative CB`);
    }
  }

  // Merge back results preserving original order
  const resultMap = new Map(sorted.map(m => [m.shipId, m]));
  return result.map(m => resultMap.get(m.shipId)!);
}
