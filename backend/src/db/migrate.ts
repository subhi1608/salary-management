import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

export async function runMigrations(pool: Pool): Promise<void> {
  const files = fs.readdirSync(MIGRATIONS_DIR).sort();
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    await pool.query(sql);
  }
}

if (require.main === module) {
  const { createPool } = require('./pool');
  const { config } = require('../config');
  const pool = createPool(config.databaseUrl);
  runMigrations(pool)
    .then(() => { console.log('Migrations complete'); process.exit(0); })
    .catch(err => { console.error(err); process.exit(1); });
}
