import { ComplianceBalance, computeComplianceBalance } from '../domain/Compliance';
import { IComplianceRepository, IRouteRepository, IBankingRepository } from '../ports/repositories';

export class ComputeCBUseCase {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly routeRepo: IRouteRepository
  ) {}

  async execute(shipId: string, year: number): Promise<ComplianceBalance> {
    // Find the route acting as this ship's data for the year
    const routes = await this.routeRepo.findAll();
    const route = routes.find(r => r.routeId === shipId && r.year === year)
      ?? routes.find(r => r.year === year);

    if (!route) throw new Error(`No route data found for ship ${shipId} year ${year}`);

    const cbValue = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);

    return this.complianceRepo.upsertCB({
      shipId,
      year,
      cbGco2eq: cbValue,
    });
  }
}

export class GetAdjustedCBUseCase {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankingRepo: IBankingRepository,
    private readonly routeRepo: IRouteRepository
  ) {}

  async execute(shipId: string, year: number): Promise<{ shipId: string; year: number; cbRaw: number; banked: number; cbAdjusted: number }> {
    // Compute raw CB from route data
    const routes = await this.routeRepo.findAll();
    const route = routes.find(r => r.routeId === shipId && r.year === year)
      ?? routes.find(r => r.year === year);

    let cbRaw = 0;
    if (route) {
      cbRaw = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);
    }

    const banked = await this.bankingRepo.getTotalBanked(shipId, year);
    return {
      shipId,
      year,
      cbRaw,
      banked,
      cbAdjusted: cbRaw + banked,
    };
  }
}
