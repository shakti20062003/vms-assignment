import { apiClient } from './apiClient';
import type { IRoutesPort } from '../../core/ports/api';
import type { Route, RouteComparison } from '../../core/domain/types';

export const routesAdapter: IRoutesPort = {
  async getRoutes(filters) {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.set('vesselType', filters.vesselType);
    if (filters?.fuelType) params.set('fuelType', filters.fuelType);
    if (filters?.year) params.set('year', String(filters.year));
    const res = await apiClient.get<{ data: Route[] }>(`/routes?${params}`);
    return res.data.data;
  },
  async setBaseline(routeId) {
    const res = await apiClient.post<{ data: Route }>(`/routes/${routeId}/baseline`);
    return res.data.data;
  },
  async getComparison() {
    const res = await apiClient.get<{ data: RouteComparison[] }>('/routes/comparison');
    return res.data.data;
  },
};
