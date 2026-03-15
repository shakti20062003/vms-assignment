import { v4 as uuidv4 } from 'uuid';
import { BankEntry } from '../../../core/domain/Compliance';
import { IBankingRepository } from '../../../core/ports/repositories';
import { query, queryOne } from '../../../infrastructure/db/client';

interface BankRow {
  id: string;
  ship_id: string;
  year: number;
  amount_gco2eq: string;
  created_at: Date;
}

function rowToEntry(row: BankRow): BankEntry {
  return {
    id: row.id,
    shipId: row.ship_id,
    year: Number(row.year),
    amountGco2eq: Number(row.amount_gco2eq),
    createdAt: row.created_at,
  };
}

export class PostgresBankingRepository implements IBankingRepository {
  async findBankEntries(shipId: string, year: number): Promise<BankEntry[]> {
    const rows = await query<BankRow>(
      'SELECT * FROM bank_entries WHERE ship_id=$1 AND year=$2 ORDER BY created_at DESC',
      [shipId, year]
    );
    return rows.map(rowToEntry);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const row = await queryOne<{ total: string }>(
      'SELECT COALESCE(SUM(amount_gco2eq),0) AS total FROM bank_entries WHERE ship_id=$1 AND year=$2',
      [shipId, year]
    );
    return Number(row?.total ?? 0);
  }

  async createBankEntry(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry> {
    const id = uuidv4();
    const row = await queryOne<BankRow>(
      'INSERT INTO bank_entries (id,ship_id,year,amount_gco2eq) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, entry.shipId, entry.year, entry.amountGco2eq]
    );
    return rowToEntry(row!);
  }

  async deductBankEntry(shipId: string, year: number, amount: number): Promise<void> {
    // Insert a negative entry to represent deduction
    const id = uuidv4();
    await queryOne(
      'INSERT INTO bank_entries (id,ship_id,year,amount_gco2eq) VALUES ($1,$2,$3,$4)',
      [id, shipId, year, -amount]
    );
  }
}
