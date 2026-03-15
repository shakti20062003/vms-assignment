import { GetAllRoutesUseCase, SetBaselineUseCase, GetRouteComparisonUseCase } from '../../core/application/RouteUseCases';
import { BankSurplusUseCase, ApplyBankedUseCase } from '../../core/application/BankingUseCases';
import { CreatePoolUseCase } from '../../core/application/PoolUseCases';
import { IRouteRepository, IBankingRepository, IPoolRepository } from '../../core/ports/repositories';
import { Route } from '../../core/domain/Route';
import { Pool, PoolMember } from '../../core/domain/Compliance';

const mockRoutes: Route[] = [
  { id: '1', routeId: 'R001', vesselType: 'Container', fuelType: 'HFO', year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true },
  { id: '2', routeId: 'R002', vesselType: 'BulkCarrier', fuelType: 'LNG', year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
  { id: '3', routeId: 'R003', vesselType: 'Tanker', fuelType: 'MGO', year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false },
];

const makeRouteRepo = (overrides: Partial<IRouteRepository> = {}): IRouteRepository => ({
  findAll: jest.fn().mockResolvedValue(mockRoutes),
  findById: jest.fn().mockResolvedValue(mockRoutes[0]),
  findByRouteId: jest.fn().mockImplementation((id: string) =>
    Promise.resolve(mockRoutes.find(r => r.routeId === id) ?? null)
  ),
  findBaseline: jest.fn().mockResolvedValue(mockRoutes[0]),
  setBaseline: jest.fn().mockResolvedValue({ ...mockRoutes[1], isBaseline: true }),
  save: jest.fn(),
  ...overrides,
});

const makeBankingRepo = (overrides: Partial<IBankingRepository> = {}): IBankingRepository => ({
  findBankEntries: jest.fn().mockResolvedValue([]),
  getTotalBanked: jest.fn().mockResolvedValue(0),
  createBankEntry: jest.fn().mockImplementation((entry) =>
    Promise.resolve({ id: 'b1', createdAt: new Date(), ...entry })
  ),
  deductBankEntry: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makePoolRepo = (overrides: Partial<IPoolRepository> = {}): IPoolRepository => ({
  createPool: jest.fn().mockImplementation((year, members) =>
    Promise.resolve({
      id: 'pool-1',
      year,
      createdAt: new Date(),
      members: members.map((m: Omit<PoolMember, 'poolId'>) => ({ poolId: 'pool-1', ...m })),
    })
  ),
  findPool: jest.fn().mockResolvedValue(null),
  findAllPools: jest.fn().mockResolvedValue([]),
  ...overrides,
});

describe('GetAllRoutesUseCase', () => {
  it('returns all routes without filters', async () => {
    const uc = new GetAllRoutesUseCase(makeRouteRepo());
    const result = await uc.execute();
    expect(result).toHaveLength(3);
  });

  it('filters by vesselType', async () => {
    const uc = new GetAllRoutesUseCase(makeRouteRepo());
    const result = await uc.execute({ vesselType: 'Container' });
    expect(result.every(r => r.vesselType === 'Container')).toBe(true);
  });

  it('filters by year', async () => {
    const uc = new GetAllRoutesUseCase(makeRouteRepo());
    const result = await uc.execute({ year: 2024 });
    expect(result.every(r => r.year === 2024)).toBe(true);
  });
});

describe('SetBaselineUseCase', () => {
  it('sets a new baseline route', async () => {
    const repo = makeRouteRepo();
    const uc = new SetBaselineUseCase(repo);
    const result = await uc.execute('R002');
    expect(repo.setBaseline).toHaveBeenCalled();
    expect(result.isBaseline).toBe(true);
  });

  it('throws when route not found', async () => {
    const repo = makeRouteRepo({ findByRouteId: jest.fn().mockResolvedValue(null) });
    const uc = new SetBaselineUseCase(repo);
    await expect(uc.execute('INVALID')).rejects.toThrow(/not found/);
  });
});

describe('GetRouteComparisonUseCase', () => {
  it('returns comparisons with percentDiff and compliant flags', async () => {
    const uc = new GetRouteComparisonUseCase(makeRouteRepo());
    const result = await uc.execute();
    expect(result.length).toBeGreaterThan(0);
    result.forEach(c => {
      expect(typeof c.percentDiff).toBe('number');
      expect(typeof c.compliant).toBe('boolean');
    });
  });

  it('throws when no baseline set', async () => {
    const repo = makeRouteRepo({ findBaseline: jest.fn().mockResolvedValue(null) });
    const uc = new GetRouteComparisonUseCase(repo);
    await expect(uc.execute()).rejects.toThrow(/No baseline/);
  });
});

describe('BankSurplusUseCase', () => {
  it('banks positive CB surplus', async () => {
    // R002: ghgIntensity=88 < target 89.3368 → positive CB
    const uc = new BankSurplusUseCase(makeBankingRepo(), makeRouteRepo());
    const result = await uc.execute('R002', 2024);
    expect(result.cbBefore).toBeGreaterThan(0);
    expect(result.entry.amountGco2eq).toBeGreaterThan(0);
  });

  it('throws when route has no surplus (negative CB)', async () => {
    // R001: ghgIntensity=91 > target → negative CB
    const uc = new BankSurplusUseCase(makeBankingRepo(), makeRouteRepo());
    await expect(uc.execute('R001', 2024)).rejects.toThrow(/no surplus/);
  });
});

describe('ApplyBankedUseCase', () => {
  it('applies banked amount to deficit', async () => {
    const bankRepo = makeBankingRepo({ getTotalBanked: jest.fn().mockResolvedValue(500000) });
    const uc = new ApplyBankedUseCase(bankRepo, makeRouteRepo());
    const result = await uc.execute('R001', 2024, 100000);
    expect(result.applied).toBe(100000);
    expect(bankRepo.deductBankEntry).toHaveBeenCalledWith('R001', 2024, 100000);
  });

  it('throws when applying more than banked', async () => {
    const bankRepo = makeBankingRepo({ getTotalBanked: jest.fn().mockResolvedValue(100) });
    const uc = new ApplyBankedUseCase(bankRepo, makeRouteRepo());
    await expect(uc.execute('R001', 2024, 999999)).rejects.toThrow(/Cannot apply/);
  });

  it('throws when nothing banked', async () => {
    const uc = new ApplyBankedUseCase(makeBankingRepo(), makeRouteRepo());
    await expect(uc.execute('R001', 2024, 100)).rejects.toThrow(/No banked surplus/);
  });
});

describe('CreatePoolUseCase', () => {
  it('creates pool when sum CB >= 0', async () => {
    // Mock routes where both ships are compliant (positive CB)
    const surplusRoutes: Route[] = [
      { id: '1', routeId: 'S1', vesselType: 'Container', fuelType: 'LNG', year: 2024, ghgIntensity: 85.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4000, isBaseline: false },
      { id: '2', routeId: 'S2', vesselType: 'Tanker', fuelType: 'LNG', year: 2024, ghgIntensity: 86.0, fuelConsumption: 4800, distance: 11000, totalEmissions: 3900, isBaseline: false },
    ];
    const surplusRouteRepo = makeRouteRepo({ findAll: jest.fn().mockResolvedValue(surplusRoutes) });
    const uc = new CreatePoolUseCase(makePoolRepo(), surplusRouteRepo, makeBankingRepo());
    const result = await uc.execute({ year: 2024, memberShipIds: ['S1', 'S2'] });
    expect(result.id).toBeDefined();
    expect(result.totalCb).toBeGreaterThan(0);
  });

  it('throws when pool sum is negative', async () => {
    // Both routes non-compliant → negative CB sum
    const deficitRoutes: Route[] = [
      { id: '1', routeId: 'D1', vesselType: 'Container', fuelType: 'HFO', year: 2024, ghgIntensity: 95.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false },
      { id: '2', routeId: 'D2', vesselType: 'Tanker', fuelType: 'HFO', year: 2024, ghgIntensity: 96.0, fuelConsumption: 4800, distance: 11000, totalEmissions: 4200, isBaseline: false },
    ];
    const deficitRouteRepo = makeRouteRepo({ findAll: jest.fn().mockResolvedValue(deficitRoutes) });
    const uc = new CreatePoolUseCase(makePoolRepo(), deficitRouteRepo, makeBankingRepo());
    await expect(uc.execute({ year: 2024, memberShipIds: ['D1', 'D2'] })).rejects.toThrow(/Pool invalid/);
  });
});
