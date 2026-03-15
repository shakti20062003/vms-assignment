import { Router, Request, Response } from 'express';
import { ComputeCBUseCase, GetAdjustedCBUseCase } from '../../../core/application/ComplianceUseCases';
import { PostgresComplianceRepository } from '../../outbound/postgres/ComplianceRepository';
import { PostgresRouteRepository } from '../../outbound/postgres/RouteRepository';
import { PostgresBankingRepository } from '../../outbound/postgres/BankingRepository';

const router = Router();

const complianceRepo = new PostgresComplianceRepository();
const routeRepo = new PostgresRouteRepository();
const bankingRepo = new PostgresBankingRepository();

const computeCB = new ComputeCBUseCase(complianceRepo, routeRepo);
const getAdjustedCB = new GetAdjustedCBUseCase(complianceRepo, bankingRepo, routeRepo);

// GET /compliance/cb?shipId=&year=
router.get('/cb', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const cb = await computeCB.execute(String(shipId), Number(year));
    return res.json({ data: cb });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

// GET /compliance/adjusted-cb?shipId=&year=
router.get('/adjusted-cb', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const result = await getAdjustedCB.execute(String(shipId), Number(year));
    return res.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default router;
