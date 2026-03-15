import { Route, RouteComparison, TARGET_INTENSITY_2025, computePercentDiff, isCompliant } from '../domain/Route';
import { IRouteRepository } from '../ports/repositories';

export class GetAllRoutesUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(filters?: { vesselType?: string; fuelType?: string; year?: number }): Promise<Route[]> {
    let routes = await this.routeRepo.findAll();
    if (filters?.vesselType) routes = routes.filter(r => r.vesselType === filters.vesselType);
    if (filters?.fuelType) routes = routes.filter(r => r.fuelType === filters.fuelType);
    if (filters?.year) routes = routes.filter(r => r.year === filters.year);
    return routes;
  }
}

export class SetBaselineUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(routeId: string): Promise<Route> {
    const route = await this.routeRepo.findByRouteId(routeId);
    if (!route) throw new Error(`Route ${routeId} not found`);
    return this.routeRepo.setBaseline(route.id);
  }
}

export class GetRouteComparisonUseCase {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(): Promise<RouteComparison[]> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) throw new Error('No baseline route set');

    const allRoutes = await this.routeRepo.findAll();
    const comparisons = allRoutes.filter(r => r.id !== baseline.id);

    return comparisons.map(route => ({
      baseline,
      comparison: route,
      percentDiff: computePercentDiff(baseline.ghgIntensity, route.ghgIntensity),
      compliant: isCompliant(route.ghgIntensity, TARGET_INTENSITY_2025),
    }));
  }
}
