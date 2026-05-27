import { createPool } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { config } from '../src/config';

export default async function globalSetup() {
  const pool = createPool(config.testDatabaseUrl);
  await runMigrations(pool);
  await pool.end();
}
