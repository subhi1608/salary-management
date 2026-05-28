import { Router } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/authenticate';
import { createEmployeeController } from '../controllers/employeeController';

export function createEmployeeRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createEmployeeController(pool);

  router.use(authenticate);

  
  router.get('/departments', async (_req, res, next) => {
    try {
      const result = await pool.query('SELECT id, name FROM departments ORDER BY name');
      res.json({ data: result.rows });
    } catch (err) { next(err); }
  });

  router.get('/', ctrl.list.bind(ctrl));
  router.get('/:id', ctrl.getOne.bind(ctrl));
  router.post('/', ctrl.create.bind(ctrl));
  router.patch('/:id', ctrl.update.bind(ctrl));
  router.delete('/:id', ctrl.deactivate.bind(ctrl));

  return router;
}
