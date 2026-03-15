import {
  computeComplianceBalance,
  allocatePool,
} from '../../core/domain/Compliance';
import {
  computePercentDiff,
  isCompliant,
  TARGET_INTENSITY_2025,
  ENERGY_CONVERSION_FACTOR,
} from '../../core/domain/Route';

describe('ComputeComplianceBalance', () => {
  it('returns positive CB when GHG intensity is below target', () => {
    // R002: LNG, 88.0 gCO2e/MJ, 4800t fuel
    const cb = computeComplianceBalance(88.0, 4800);
    const energy = 4800 * ENERGY_CONVERSION_FACTOR;
    const expected = (TARGET_INTENSITY_2025 - 88.0) * energy;
    expect(cb).toBeCloseTo(expected, 2);
    expect(cb).toBeGreaterThan(0);
  });

  it('returns negative CB when GHG intensity exceeds target', () => {
    // R001: HFO, 91.0 gCO2e/MJ, 5000t fuel
    const cb = computeComplianceBalance(91.0, 5000);
    expect(cb).toBeLessThan(0);
  });

  it('returns zero CB when GHG intensity equals target', () => {
    const cb = computeComplianceBalance(TARGET_INTENSITY_2025, 5000);
    expect(cb).toBeCloseTo(0, 5);
  });

  it('uses custom target when provided', () => {
    const customTarget = 90.0;
    const cb = computeComplianceBalance(88.0, 5000, customTarget);
    const energy = 5000 * ENERGY_CONVERSION_FACTOR;
    expect(cb).toBeCloseTo((customTarget - 88.0) * energy, 2);
  });
});

describe('AllocatePool', () => {
  it('transfers surplus from positive to deficit ships', () => {
    const members = [
      { shipId: 'S1', cbBefore: 1000 },
      { shipId: 'S2', cbBefore: -500 },
    ];
    const result = allocatePool(members);
    const s1 = result.find(m => m.shipId === 'S1')!;
    const s2 = result.find(m => m.shipId === 'S2')!;
    expect(s2.cbAfter).toBeCloseTo(0, 5);
    expect(s1.cbAfter).toBeCloseTo(500, 5);
  });

  it('throws when pool sum is negative', () => {
    const members = [
      { shipId: 'S1', cbBefore: -1000 },
      { shipId: 'S2', cbBefore: 200 },
    ];
    expect(() => allocatePool(members)).toThrow(/Pool sum/);
  });

  it('handles zero-sum pool (all deficits balanced by surpluses)', () => {
    const members = [
      { shipId: 'S1', cbBefore: 500 },
      { shipId: 'S2', cbBefore: -500 },
    ];
    const result = allocatePool(members);
    result.forEach(m => expect(m.cbAfter).toBeCloseTo(0, 5));
  });

  it('does not make surplus ship go negative', () => {
    const members = [
      { shipId: 'S1', cbBefore: 100 },
      { shipId: 'S2', cbBefore: 500 },
      { shipId: 'S3', cbBefore: -50 },
    ];
    const result = allocatePool(members);
    result.forEach(m => {
      if (m.cbBefore >= 0) expect(m.cbAfter).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('ComputePercentDiff', () => {
  it('computes correct positive diff', () => {
    const diff = computePercentDiff(90, 93.5);
    expect(diff).toBeCloseTo(3.888, 2);
  });

  it('computes correct negative diff', () => {
    const diff = computePercentDiff(91, 88);
    expect(diff).toBeCloseTo(-3.296, 2);
  });

  it('returns 0 for equal values', () => {
    expect(computePercentDiff(90, 90)).toBeCloseTo(0, 5);
  });
});

describe('isCompliant', () => {
  it('marks ship as compliant when below target', () => {
    expect(isCompliant(88.0)).toBe(true);
    expect(isCompliant(89.3368)).toBe(true);
  });

  it('marks ship as non-compliant when above target', () => {
    expect(isCompliant(91.0)).toBe(false);
    expect(isCompliant(93.5)).toBe(false);
  });
});
