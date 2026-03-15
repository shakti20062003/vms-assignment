import { Route } from '../domain/Route';
import { ComplianceBalance, BankEntry, Pool, PoolMember } from '../domain/Compliance';

// ---- Route Repository Port ----
export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(id: string): Promise<Route>;
  save(route: Omit<Route, 'id'>): Promise<Route>;
}

// ---- Compliance Repository Port ----
export interface IComplianceRepository {
  findCBByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null>;
  saveCB(cb: Omit<ComplianceBalance, 'id' | 'computedAt'>): Promise<ComplianceBalance>;
  upsertCB(cb: Omit<ComplianceBalance, 'id' | 'computedAt'>): Promise<ComplianceBalance>;
}

// ---- Banking Repository Port ----
export interface IBankingRepository {
  findBankEntries(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  createBankEntry(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
  deductBankEntry(shipId: string, year: number, amount: number): Promise<void>;
}

// ---- Pool Repository Port ----
export interface IPoolRepository {
  createPool(year: number, members: Omit<PoolMember, 'poolId'>[]): Promise<Pool & { members: PoolMember[] }>;
  findPool(id: string): Promise<(Pool & { members: PoolMember[] }) | null>;
  findAllPools(year?: number): Promise<Pool[]>;
}
