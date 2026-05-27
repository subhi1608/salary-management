import bcrypt from 'bcryptjs';
import { createPool } from '../src/db/pool';
import { config } from '../src/config';

const DEFAULT_EMAIL = 'admin@salary.local';
const DEFAULT_PASSWORD = 'Admin1234!';
const DEFAULT_NAME = 'Admin User';

async function createAdmin() {
  const pool = createPool(config.databaseUrl);
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const { rowCount } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING`,
    [DEFAULT_EMAIL, passwordHash, DEFAULT_NAME],
  );

  if (rowCount === 0) {
    console.log(`Admin already exists: ${DEFAULT_EMAIL}`);
  } else {
    console.log('Admin user created:');
    console.log(`  Email:    ${DEFAULT_EMAIL}`);
    console.log(`  Password: ${DEFAULT_PASSWORD}`);
    console.log('Change the password after first login.');
  }

  await pool.end();
}

createAdmin().catch(err => { console.error(err); process.exit(1); });
