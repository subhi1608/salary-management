import { Pool } from 'pg';
import { User } from '../types';

export async function findUserByEmail(
  pool: Pool,
  email: string
): Promise<(User & { password_hash: string }) | null> {
  const result = await pool.query(
    'SELECT id, email, full_name, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(
  pool: Pool,
  id: string
): Promise<(User & { password_hash: string }) | null> {
  const result = await pool.query(
    'SELECT id, email, full_name, password_hash, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}
