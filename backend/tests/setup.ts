import { Pool } from 'pg';
import { createPool } from '../src/db/pool';
import { config } from '../src/config';

let testPool: Pool;

export function getTestPool(): Pool {
  return testPool;
}

beforeAll(() => {
  testPool = createPool(config.testDatabaseUrl);
});

afterEach(async () => {
  await testPool.query(
    'TRUNCATE employees, users, departments RESTART IDENTITY CASCADE'
  );
  await testPool.query(`
    INSERT INTO departments (name) VALUES
      ('Engineering'),('Sales'),('HR'),('Finance'),
      ('Marketing'),('Operations'),('Legal'),('Product')
    ON CONFLICT (name) DO NOTHING
  `);
});

afterAll(async () => {
  await testPool.end();
});

function beforeAll(arg0: () => void) {
  throw new Error('Function not implemented.');
}

function afterEach(arg0: () => Promise<void>) {
  throw new Error('Function not implemented.');
}

function afterAll(arg0: () => Promise<void>) {
  throw new Error('Function not implemented.');
}

