import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fueleu_maritime',
  max: 10,
  idleTimeoutMillis: 30000,
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const res = await db.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const res = await db.query(text, params);
  return (res.rows[0] as T) ?? null;
}
