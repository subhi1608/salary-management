import { Router } from 'express';
import { Pool } from 'pg';
import { authenticate } from '../middleware/authenticate';
import { createInsightController } from '../controllers/insightController';

export function createInsightRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createInsightController(pool);

  router.use(authenticate);
  router.get('/summary', ctrl.summary.bind(ctrl));
  router.get('/salary-by-country', ctrl.salaryByCountry.bind(ctrl));
  router.get('/salary-by-jobtitle', ctrl.salaryByJobTitle.bind(ctrl));

  return router;
}
