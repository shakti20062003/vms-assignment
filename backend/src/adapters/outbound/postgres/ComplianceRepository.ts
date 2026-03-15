import { v4 as uuidv4 } from 'uuid';
import { ComplianceBalance } from '../../../core/domain/Compliance';
import { IComplianceRepository } from '../../../core/ports/repositories';
import { query, queryOne } from '../../../infrastructure/db/client';

interface CBRow {
  id: string;
  ship_id: string;
  year: number;
  cb_gco2eq: string;
  computed_at: Date;
}

function rowToCB(row: CBRow): ComplianceBalance {
  return {
    id: row.id,
    shipId: row.ship_id,
    year: Number(row.year),
    cbGco2eq: Number(row.cb_gco2eq),
    computedAt: row.computed_at,
  };
}

export class PostgresComplianceRepository implements IComplianceRepository {
  async findCBByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null> {
    const row = await queryOne<CBRow>(
      'SELECT * FROM ship_compliance WHERE ship_id=$1 AND year=$2',
      [shipId, year]
    );
    return row ? rowToCB(row) : null;
  }

  async saveCB(cb: Omit<ComplianceBalance, 'id' | 'computedAt'>): Promise<ComplianceBalance> {
    const id = uuidv4();
    const row = await queryOne<CBRow>(
      `INSERT INTO ship_compliance (id, ship_id, year, cb_gco2eq)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, cb.shipId, cb.year, cb.cbGco2eq]
    );
    return rowToCB(row!);
  }

  async upsertCB(cb: Omit<ComplianceBalance, 'id' | 'computedAt'>): Promise<ComplianceBalance> {
    const row = await queryOne<CBRow>(
      `INSERT INTO ship_compliance (id, ship_id, year, cb_gco2eq)
       VALUES (gen_random_uuid(),$1,$2,$3)
       ON CONFLICT (ship_id, year) DO UPDATE SET cb_gco2eq=$3, computed_at=NOW()
       RETURNING *`,
      [cb.shipId, cb.year, cb.cbGco2eq]
    );
    return rowToCB(row!);
  }
}
