import { Router, Request, Response } from 'express';
import { GetBankRecordsUseCase, BankSurplusUseCase, ApplyBankedUseCase } from '../../../core/application/BankingUseCases';
import { PostgresBankingRepository } from '../../outbound/postgres/BankingRepository';
import { PostgresRouteRepository } from '../../outbound/postgres/RouteRepository';

const router = Router();

const bankingRepo = new PostgresBankingRepository();
const routeRepo = new PostgresRouteRepository();

const getRecords = new GetBankRecordsUseCase(bankingRepo);
const bankSurplus = new BankSurplusUseCase(bankingRepo, routeRepo);
const applyBanked = new ApplyBankedUseCase(bankingRepo, routeRepo);

// GET /banking/records?shipId=&year=
router.get('/records', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const result = await getRecords.execute(String(shipId), Number(year));
    return res.json({ data: result });
  } catch (err: unknown) {
    return res.status(500).json({ error: String(err) });
  }
});

// POST /banking/bank  { shipId, year }
router.post('/bank', async (req: Request, res: Response) => {
  try {
    const { shipId, year } = req.body;
    if (!shipId || !year) {
      return res.status(400).json({ error: 'shipId and year are required' });
    }
    const result = await bankSurplus.execute(String(shipId), Number(year));
    return res.json({
      data: result,
      message: `Surplus banked for ship ${shipId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

// POST /banking/apply  { shipId, year, amount }
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const { shipId, year, amount } = req.body;
    if (!shipId || !year || amount === undefined) {
      return res.status(400).json({ error: 'shipId, year and amount are required' });
    }
    const result = await applyBanked.execute(String(shipId), Number(year), Number(amount));
    return res.json({
      data: result,
      message: `Applied ${amount} banked surplus to ship ${shipId}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(400).json({ error: msg });
  }
});

export default router;
