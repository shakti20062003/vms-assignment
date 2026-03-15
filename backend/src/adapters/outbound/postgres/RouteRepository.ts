import { v4 as uuidv4 } from 'uuid';
import { Route } from '../../../core/domain/Route';
import { IRouteRepository } from '../../../core/ports/repositories';
import { query, queryOne } from '../../../infrastructure/db/client';

interface RouteRow {
  id: string;
  route_id: string;
  vessel_type: string;
  fuel_type: string;
  year: number;
  ghg_intensity: string;
  fuel_consumption: string;
  distance: string;
  total_emissions: string;
  is_baseline: boolean;
}

function rowToRoute(row: RouteRow): Route {
  return {
    id: row.id,
    routeId: row.route_id,
    vesselType: row.vessel_type,
    fuelType: row.fuel_type,
    year: Number(row.year),
    ghgIntensity: Number(row.ghg_intensity),
    fuelConsumption: Number(row.fuel_consumption),
    distance: Number(row.distance),
    totalEmissions: Number(row.total_emissions),
    isBaseline: row.is_baseline,
  };
}

export class PostgresRouteRepository implements IRouteRepository {
  async findAll(): Promise<Route[]> {
    const rows = await query<RouteRow>('SELECT * FROM routes ORDER BY year, route_id');
    return rows.map(rowToRoute);
  }

  async findById(id: string): Promise<Route | null> {
    const row = await queryOne<RouteRow>('SELECT * FROM routes WHERE id = $1', [id]);
    return row ? rowToRoute(row) : null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const row = await queryOne<RouteRow>('SELECT * FROM routes WHERE route_id = $1', [routeId]);
    return row ? rowToRoute(row) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const row = await queryOne<RouteRow>('SELECT * FROM routes WHERE is_baseline = TRUE LIMIT 1');
    return row ? rowToRoute(row) : null;
  }

  async setBaseline(id: string): Promise<Route> {
    // Clear existing baseline
    await query('UPDATE routes SET is_baseline = FALSE WHERE is_baseline = TRUE');
    const row = await queryOne<RouteRow>(
      'UPDATE routes SET is_baseline = TRUE WHERE id = $1 RETURNING *',
      [id]
    );
    if (!row) throw new Error(`Route ${id} not found`);
    return rowToRoute(row);
  }

  async save(route: Omit<Route, 'id'>): Promise<Route> {
    const id = uuidv4();
    const row = await queryOne<RouteRow>(
      `INSERT INTO routes (id, route_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [id, route.routeId, route.vesselType, route.fuelType, route.year, route.ghgIntensity,
       route.fuelConsumption, route.distance, route.totalEmissions, route.isBaseline]
    );
    return rowToRoute(row!);
  }
}
