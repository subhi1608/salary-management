import { Pool } from 'pg';
import { config } from '../config';

export function createPool(connectionString: string): Pool {
  return new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export const pool = createPool(config.databaseUrl);
