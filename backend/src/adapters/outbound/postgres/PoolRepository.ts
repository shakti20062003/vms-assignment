import { v4 as uuidv4 } from 'uuid';
import { Pool, PoolMember } from '../../../core/domain/Compliance';
import { IPoolRepository } from '../../../core/ports/repositories';
import { query, queryOne } from '../../../infrastructure/db/client';
import { db } from '../../../infrastructure/db/client';

export class PostgresPoolRepository implements IPoolRepository {
  async createPool(
    year: number,
    members: Omit<PoolMember, 'poolId'>[]
  ): Promise<Pool & { members: PoolMember[] }> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const poolId = uuidv4();
      const poolRow = await client.query(
        'INSERT INTO pools (id, year) VALUES ($1,$2) RETURNING *',
        [poolId, year]
      );

      const insertedMembers: PoolMember[] = [];
      for (const m of members) {
        await client.query(
          'INSERT INTO pool_members (pool_id,ship_id,cb_before,cb_after) VALUES ($1,$2,$3,$4)',
          [poolId, m.shipId, m.cbBefore, m.cbAfter]
        );
        insertedMembers.push({ poolId, ...m });
      }

      await client.query('COMMIT');
      return {
        id: poolRow.rows[0].id,
        year: poolRow.rows[0].year,
        createdAt: poolRow.rows[0].created_at,
        members: insertedMembers,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findPool(id: string): Promise<(Pool & { members: PoolMember[] }) | null> {
    const poolRow = await queryOne<{ id: string; year: number; created_at: Date }>(
      'SELECT * FROM pools WHERE id=$1',
      [id]
    );
    if (!poolRow) return null;

    const memberRows = await query<{ pool_id: string; ship_id: string; cb_before: string; cb_after: string }>(
      'SELECT * FROM pool_members WHERE pool_id=$1',
      [id]
    );

    return {
      id: poolRow.id,
      year: poolRow.year,
      createdAt: poolRow.created_at,
      members: memberRows.map(m => ({
        poolId: m.pool_id,
        shipId: m.ship_id,
        cbBefore: Number(m.cb_before),
        cbAfter: Number(m.cb_after),
      })),
    };
  }

  async findAllPools(year?: number): Promise<Pool[]> {
    const rows = year
      ? await query<{ id: string; year: number; created_at: Date }>('SELECT * FROM pools WHERE year=$1 ORDER BY created_at DESC', [year])
      : await query<{ id: string; year: number; created_at: Date }>('SELECT * FROM pools ORDER BY created_at DESC');
    return rows.map(r => ({ id: r.id, year: r.year, createdAt: r.created_at }));
  }
}
