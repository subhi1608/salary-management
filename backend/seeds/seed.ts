import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createPool } from '../src/db/pool';
import { runMigrations } from '../src/db/migrate';
import { config } from '../src/config';
import { JOB_TITLES } from './data/jobTitles';
import { pickWeightedCountry } from './data/countries';
import { getSalaryForRole } from './data/salaryMatrix';

const TOTAL = 10_000;
const BATCH_SIZE = 1_000;

function readLines(filename: string): string[] {
  return fs.readFileSync(path.join(__dirname, filename), 'utf-8')
    .split('\n').map(l => l.trim()).filter(Boolean);
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(yearsBack: number): string {
  const now = Date.now();
  const past = now - yearsBack * 365 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past)).toISOString().split('T')[0];
}

async function getDepartmentMap(pool: Pool): Promise<Record<string, number>> {
  const res = await pool.query('SELECT id, name FROM departments');
  return Object.fromEntries(res.rows.map((r: { name: string; id: number }) => [r.name, r.id]));
}

async function seed() {
  const pool = createPool(config.databaseUrl);
  await runMigrations(pool);

  const firstNames = readLines('first_names.txt');
  const lastNames = readLines('last_names.txt');
  const deptMap = await getDepartmentMap(pool);
  const deptNames = Object.keys(deptMap);
  const empTypes = ['full_time', 'full_time', 'full_time', 'part_time', 'contractor'] as const;

  console.time('seed');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let batch = 0; batch < TOTAL / BATCH_SIZE; batch++) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const idx = batch * BATCH_SIZE + i;
        const firstName = pick(firstNames);
        const lastName = pick(lastNames);
        const jobTitle = pick(JOB_TITLES);
        const country = pickWeightedCountry(Math.random());
        const salary = getSalaryForRole(jobTitle, country);
        const deptId = deptMap[pick(deptNames)];
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${idx}@company.com`;
        const hireDate = randomDate(10);
        const isActive = Math.random() > 0.05;
        const terminationDate = isActive ? null : randomDate(2);
        const empType = pick(empTypes);
        const base = i * 11;
        placeholders.push(`($${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11})`);
        values.push(firstName, lastName, email, jobTitle, deptId, country, salary, empType, hireDate, isActive, terminationDate);
      }
      await client.query(
        `INSERT INTO employees (first_name,last_name,email,job_title,department_id,country,salary,employment_type,hire_date,is_active,termination_date)
         VALUES ${placeholders.join(',')} ON CONFLICT (email) DO NOTHING`,
        values
      );
      console.log(`Batch ${batch + 1}/${TOTAL / BATCH_SIZE} done`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.timeEnd('seed');
  const { rows } = await pool.query('SELECT COUNT(*) FROM employees');
  console.log(`Total employees: ${rows[0].count}`);
  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
