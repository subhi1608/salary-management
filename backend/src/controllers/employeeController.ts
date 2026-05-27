import { Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthRequest } from '../middleware/authenticate';
import { AppError } from '../types';
import {
  CreateEmployeeSchema, UpdateEmployeeSchema,
  listEmployees, getEmployee, createEmployee, updateEmployee, deactivateEmployee,
} from '../services/employeeService';

export function createEmployeeController(pool: Pool) {
  return {
    async list(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const page = parseInt((req.query.page as string) || '1', 10);
        const limit = Math.min(parseInt((req.query.limit as string) || '25', 10), 100);
        const filters = {
          country: req.query.country as string | undefined,
          job_title: req.query.job_title as string | undefined,
          is_active: req.query.is_active !== undefined
            ? req.query.is_active === 'true'
            : undefined,
          search: req.query.search as string | undefined,
          page,
          limit,
        };
        const result = await listEmployees(pool, filters);
        res.json({ data: result });
      } catch (err) { next(err); }
    },

    async getOne(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const emp = await getEmployee(pool, req.params.id);
        res.json({ data: emp });
      } catch (err) { next(err); }
    },

    async create(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const parsed = CreateEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
        }
        const emp = await createEmployee(pool, parsed.data);
        res.status(201).json({ data: emp });
      } catch (err) { next(err); }
    },

    async update(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const parsed = UpdateEmployeeSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new AppError('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
        }
        const emp = await updateEmployee(pool, req.params.id, parsed.data);
        res.json({ data: emp });
      } catch (err) { next(err); }
    },

    async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
      try {
        const emp = await deactivateEmployee(pool, req.params.id);
        res.json({ data: emp });
      } catch (err) { next(err); }
    },
  };
}
