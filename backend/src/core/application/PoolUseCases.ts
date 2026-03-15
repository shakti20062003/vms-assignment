import { Pool, PoolMember, allocatePool } from '../domain/Compliance';
import { computeComplianceBalance } from '../domain/Compliance';
import { IPoolRepository, IRouteRepository, IBankingRepository } from '../ports/repositories';

export interface CreatePoolInput {
  year: number;
  memberShipIds: string[];
}

export class CreatePoolUseCase {
  constructor(
    private readonly poolRepo: IPoolRepository,
    private readonly routeRepo: IRouteRepository,
    private readonly bankingRepo: IBankingRepository
  ) {}

  async execute(input: CreatePoolInput): Promise<Pool & { members: PoolMember[]; totalCb: number }> {
    const routes = await this.routeRepo.findAll();

    // Build members with their adjusted CBs
    const members = await Promise.all(
      input.memberShipIds.map(async shipId => {
        const route = routes.find(r => r.routeId === shipId && r.year === input.year)
          ?? routes.find(r => r.year === input.year);

        let cbRaw = 0;
        if (route) {
          cbRaw = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);
        }
        const banked = await this.bankingRepo.getTotalBanked(shipId, input.year);
        return { shipId, cbBefore: cbRaw + banked };
      })
    );

    // Validate sum
    const totalCb = members.reduce((sum, m) => sum + m.cbBefore, 0);
    if (totalCb < 0) {
      throw new Error(`Pool invalid: sum of compliance balances is ${totalCb.toFixed(2)} (must be >= 0)`);
    }

    // Greedy allocation
    const allocated = allocatePool(members);

    const pool = await this.poolRepo.createPool(input.year, allocated);

    return { ...pool, totalCb };
  }
}

export class GetPoolUseCase {
  constructor(private readonly poolRepo: IPoolRepository) {}

  async execute(id: string): Promise<(Pool & { members: PoolMember[] }) | null> {
    return this.poolRepo.findPool(id);
  }
}
