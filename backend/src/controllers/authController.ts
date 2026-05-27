import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';
import { login, refreshAccessToken } from '../services/authService';
import { findUserById } from '../repositories/userRepository';
import { AppError } from '../types';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createAuthController(pool: Pool) {
  return {
    async loginHandler(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
        }
        const { accessToken, refreshToken, user } = await login(pool, parsed.data);
        res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
        res.json({ data: { accessToken, user } });
      } catch (err) {
        next(err);
      }
    },

    async refreshHandler(req: Request, res: Response, next: NextFunction) {
      try {
        const token = req.cookies[REFRESH_COOKIE];
        if (!token) throw new AppError('UNAUTHORIZED', 'No refresh token', 401);
        const { accessToken, userId } = refreshAccessToken(token);
        const found = await findUserById(pool, userId);
        if (!found) throw new AppError('UNAUTHORIZED', 'User not found', 401);
        const { password_hash: _, ...user } = found;
        res.json({ data: { accessToken, user } });
      } catch (err) {
        next(err);
      }
    },

    logoutHandler(_req: Request, res: Response) {
      res.clearCookie(REFRESH_COOKIE);
      res.status(204).send();
    },
  };
}
