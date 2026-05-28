import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { errorHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/auth';
import { createEmployeeRouter } from './routes/employees';
import { createInsightRouter } from './routes/insights';
import { config } from './config';
import { logger } from './lib/logger';

export function createApp(pool: Pool) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.info({ method: req.method, url: req.url, status: res.statusCode, ms: Date.now() - start }, 'request');
    });
    next();
  });

  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'error', message: 'Database unavailable' });
    }
  });
  app.use('/api/v1/auth', createAuthRouter(pool));
  app.use('/api/v1/employees', createEmployeeRouter(pool));
  app.use('/api/v1/insights', createInsightRouter(pool));

  app.use(errorHandler);

  return app;
}
