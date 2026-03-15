import type {
  Route, RouteComparison, ComplianceBalance, BankRecords,
  BankingResult, AdjustedCB, Pool
} from '../domain/types';

export interface IRoutesPort {
  getRoutes(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<RouteComparison[]>;
}

export interface ICompliancePort {
  getCB(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedCB(shipId: string, year: number): Promise<AdjustedCB>;
}

export interface IBankingPort {
  getBankRecords(shipId: string, year: number): Promise<BankRecords>;
  bankSurplus(shipId: string, year: number): Promise<BankingResult>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankingResult>;
}

export interface IPoolsPort {
  createPool(year: number, memberShipIds: string[]): Promise<Pool>;
  getPool(id: string): Promise<Pool>;
}
