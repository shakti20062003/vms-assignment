import { Router, Request, Response } from 'express';
import { CreatePoolUseCase, GetPoolUseCase } from '../../../core/application/PoolUseCases';
import { PostgresPoolRepository } from '../../outbound/postgres/PoolRepository';
import { PostgresRouteRepository } from '../../outbound/postgres/RouteRepository';
import { PostgresBankingRepository } from '../../outbound/postgres/BankingRepository';

const router = Router();

const poolRepo = new PostgresPoolRepository();
const routeRepo = new PostgresRouteRepository();
const bankingRepo = new PostgresBankingRepository();

const createPool = new CreatePoolUseCase(poolRepo, routeRepo, bankingRepo);
const getPool = new GetPoolUseCase(poolRepo);

// POST /pools  { year, memberShipIds: string[] }
router.post('/', async (req: Request, res: Response) => {
  try {
    const { year, memberShipIds } = req.body;
    if (!year || !Array.isArray(memberShipIds) || memberShipIds.length < 2) {
      return res.status(400).json({ error: 'year and at least 2 memberShipIds are required' });
    }
    const pool = await createPool.execute({ year: Number(year), memberShipIds });
    return res.status(201).json({ data: pool, message: 'Pool created successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

// GET /pools/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const pool = await getPool.execute(req.params.id);
    if (!pool) return res.status(404).json({ error: 'Pool not found' });
    return res.json({ data: pool });
  } catch (err: unknown) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
