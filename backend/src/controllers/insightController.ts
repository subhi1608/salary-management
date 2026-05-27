import { Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../middleware/authenticate';
import { AppError } from '../types';
import { getSalaryByCountry, getSalaryByJobTitle, getInsightSummary } from '../services/insightService';

export function createInsightController(pool: Pool) {
  return {
    async summary(_req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const data = await getInsightSummary(pool);
        res.json({ data });
      } catch (err) { next(err); }
    },

    async salaryByCountry(_req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const data = await getSalaryByCountry(pool);
        res.json({ data });
      } catch (err) { next(err); }
    },

    async salaryByJobTitle(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const country = req.query.country as string;
        if (!country) throw new AppError('VALIDATION_ERROR', 'country query param is required', 400);
        const data = await getSalaryByJobTitle(pool, country);
        res.json({ data });
      } catch (err) { next(err); }
    },
  };
}
