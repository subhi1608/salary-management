import { createPool } from './db/pool';
import { createApp } from './app';
import { config } from './config';
import { runMigrations } from './db/migrate';

async function main() {
  const pool = createPool(config.databaseUrl);
  await runMigrations(pool);
  const app = createApp(pool);
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
