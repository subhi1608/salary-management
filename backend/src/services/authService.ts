import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import { config } from '../config';
import { AppError, LoginInput, User } from '../types';
import { findUserByEmail } from '../repositories/userRepository';

export async function login(
  pool: Pool,
  input: LoginInput
): Promise<{ accessToken: string; refreshToken: string; user: User }> {
  const user = await findUserByEmail(pool, input.email);
  if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

  const accessToken = jwt.sign(
    { sub: user.id, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );

  const { password_hash: _, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

export function refreshAccessToken(refreshToken: string): { accessToken: string; userId: string } {
  try {
    const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as { sub: string };
    const accessToken = jwt.sign({ sub: payload.sub }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    return { accessToken, userId: payload.sub };
  } catch {
    throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
  }
}
