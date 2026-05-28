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

export function createApp(pool: Pool) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.frontendUrl, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/v1/auth', createAuthRouter(pool));
  app.use('/api/v1/employees', createEmployeeRouter(pool));
  app.use('/api/v1/insights', createInsightRouter(pool));

  app.use(errorHandler);

  return app;
}
