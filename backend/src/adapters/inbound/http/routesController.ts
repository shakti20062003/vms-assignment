import { Router, Request, Response } from 'express';
import { GetAllRoutesUseCase, SetBaselineUseCase, GetRouteComparisonUseCase } from '../../../core/application/RouteUseCases';
import { PostgresRouteRepository } from '../../outbound/postgres/RouteRepository';

const router = Router();
const routeRepo = new PostgresRouteRepository();
const getAllRoutes = new GetAllRoutesUseCase(routeRepo);
const setBaseline = new SetBaselineUseCase(routeRepo);
const getComparison = new GetRouteComparisonUseCase(routeRepo);

// GET /routes
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      vesselType: req.query.vesselType as string | undefined,
      fuelType: req.query.fuelType as string | undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
    };
    const routes = await getAllRoutes.execute(filters);
    res.json({ data: routes, count: routes.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /routes/comparison
router.get('/comparison', async (_req: Request, res: Response) => {
  try {
    const comparisons = await getComparison.execute();
    res.json({ data: comparisons });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

// POST /routes/:routeId/baseline
router.post('/:routeId/baseline', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const route = await setBaseline.execute(routeId);
    res.json({ data: route, message: `Route ${routeId} set as baseline` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
});

export default router;
