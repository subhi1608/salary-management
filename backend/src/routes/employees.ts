import { Router } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/authenticate';
import { createEmployeeController } from '../controllers/employeeController';
import { findAllDepartments } from '../repositories/employeeRepository';

export function createEmployeeRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createEmployeeController(pool);

  router.use(authenticate);

  
  router.get('/departments', async (_req, res, next) => {
    try {
      const departments = await findAllDepartments(pool);
      res.json({ data: departments });
    } catch (err) { next(err); }
  });

  router.get('/', ctrl.list.bind(ctrl));
  router.get('/:id', ctrl.getOne.bind(ctrl));
  router.post('/', ctrl.create.bind(ctrl));
  router.patch('/:id', ctrl.update.bind(ctrl));
  router.delete('/:id', ctrl.deactivate.bind(ctrl));

  return router;
}
