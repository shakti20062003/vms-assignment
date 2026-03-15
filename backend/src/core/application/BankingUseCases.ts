import { BankEntry } from '../domain/Compliance';
import { computeComplianceBalance } from '../domain/Compliance';
import { IBankingRepository, IComplianceRepository, IRouteRepository } from '../ports/repositories';

export class GetBankRecordsUseCase {
  constructor(private readonly bankingRepo: IBankingRepository) {}

  async execute(shipId: string, year: number): Promise<{ entries: BankEntry[]; total: number }> {
    const entries = await this.bankingRepo.findBankEntries(shipId, year);
    const total = await this.bankingRepo.getTotalBanked(shipId, year);
    return { entries, total };
  }
}

export class BankSurplusUseCase {
  constructor(
    private readonly bankingRepo: IBankingRepository,
    private readonly routeRepo: IRouteRepository
  ) {}

  async execute(shipId: string, year: number): Promise<{ entry: BankEntry; cbBefore: number; cbAfter: number }> {
    const routes = await this.routeRepo.findAll();
    const route = routes.find(r => r.routeId === shipId && r.year === year)
      ?? routes.find(r => r.year === year);

    if (!route) throw new Error(`No route data found for ship ${shipId}`);

    const cb = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);
    if (cb <= 0) throw new Error(`Ship ${shipId} has no surplus to bank (CB = ${cb.toFixed(2)})`);

    const already = await this.bankingRepo.getTotalBanked(shipId, year);
    const entry = await this.bankingRepo.createBankEntry({ shipId, year, amountGco2eq: cb });

    return {
      entry,
      cbBefore: cb,
      cbAfter: 0, // after banking, operational CB is 0 (surplus moved to bank)
    };
  }
}

export class ApplyBankedUseCase {
  constructor(
    private readonly bankingRepo: IBankingRepository,
    private readonly routeRepo: IRouteRepository
  ) {}

  async execute(shipId: string, year: number, amount: number): Promise<{ applied: number; cbBefore: number; cbAfter: number }> {
    if (amount <= 0) throw new Error('Amount must be positive');

    const routes = await this.routeRepo.findAll();
    const route = routes.find(r => r.routeId === shipId && r.year === year)
      ?? routes.find(r => r.year === year);

    if (!route) throw new Error(`No route data found for ship ${shipId}`);

    const cbRaw = computeComplianceBalance(route.ghgIntensity, route.fuelConsumption);
    const available = await this.bankingRepo.getTotalBanked(shipId, year);

    if (available <= 0) throw new Error(`No banked surplus available for ship ${shipId}`);
    if (amount > available) throw new Error(`Cannot apply ${amount} — only ${available.toFixed(2)} banked`);

    await this.bankingRepo.deductBankEntry(shipId, year, amount);

    return {
      applied: amount,
      cbBefore: cbRaw,
      cbAfter: cbRaw + amount,
    };
  }
}
