import { apiClient } from './apiClient';
import type { ICompliancePort, IBankingPort, IPoolsPort } from '../../core/ports/api';
import type { ComplianceBalance, BankRecords, BankingResult, AdjustedCB, Pool } from '../../core/domain/types';

export const complianceAdapter: ICompliancePort = {
  async getCB(shipId, year) {
    const res = await apiClient.get<{ data: ComplianceBalance }>(`/compliance/cb?shipId=${shipId}&year=${year}`);
    return res.data.data;
  },
  async getAdjustedCB(shipId, year) {
    const res = await apiClient.get<{ data: AdjustedCB }>(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
    return res.data.data;
  },
};

export const bankingAdapter: IBankingPort = {
  async getBankRecords(shipId, year) {
    const res = await apiClient.get<{ data: BankRecords }>(`/banking/records?shipId=${shipId}&year=${year}`);
    return res.data.data;
  },
  async bankSurplus(shipId, year) {
    const res = await apiClient.post<{ data: BankingResult }>('/banking/bank', { shipId, year });
    return res.data.data;
  },
  async applyBanked(shipId, year, amount) {
    const res = await apiClient.post<{ data: BankingResult }>('/banking/apply', { shipId, year, amount });
    return res.data.data;
  },
};

export const poolsAdapter: IPoolsPort = {
  async createPool(year, memberShipIds) {
    const res = await apiClient.post<{ data: Pool }>('/pools', { year, memberShipIds });
    return res.data.data;
  },
  async getPool(id) {
    const res = await apiClient.get<{ data: Pool }>(`/pools/${id}`);
    return res.data.data;
  },
};
