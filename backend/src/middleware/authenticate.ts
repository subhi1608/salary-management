import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError, AuthTokenPayload } from '../types';

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('UNAUTHORIZED', 'Missing token', 401));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
  }
}
