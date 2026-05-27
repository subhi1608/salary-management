import { Router } from 'express';
import { Pool } from 'pg';
import { authRateLimiter } from '../middleware/rateLimiter';
import { createAuthController } from '../controllers/authController';

export function createAuthRouter(pool: Pool): Router {
  const router = Router();
  const ctrl = createAuthController(pool);

  router.post('/login', authRateLimiter, ctrl.loginHandler.bind(ctrl));
  router.post('/refresh', ctrl.refreshHandler.bind(ctrl));
  router.post('/logout', ctrl.logoutHandler.bind(ctrl));

  return router;
}
