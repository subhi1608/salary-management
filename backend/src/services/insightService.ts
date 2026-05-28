import { Pool } from 'pg';
import { SalaryByCountry, SalaryByJobTitle, InsightSummary } from '../types';
import * as repo from '../repositories/insightRepository';

export function normaliseSalaryStats(rows: Record<string, unknown>[]): SalaryByCountry[] {
  return rows.map(r => ({
    country: r.country as string,
    min_salary: parseFloat(r.min_salary as string),
    max_salary: parseFloat(r.max_salary as string),
    avg_salary: parseFloat(parseFloat(r.avg_salary as string).toFixed(2)),
    employee_count: parseInt(r.employee_count as string, 10),
  }));
}

export function normaliseJobTitleStats(rows: Record<string, unknown>[]): SalaryByJobTitle[] {
  return rows.map(r => ({
    job_title: r.job_title as string,
    avg_salary: parseFloat(parseFloat(r.avg_salary as string).toFixed(2)),
    employee_count: parseInt(r.employee_count as string, 10),
  }));
}

export async function getSalaryByCountry(pool: Pool): Promise<SalaryByCountry[]> {
  const rows = await repo.getSalaryByCountry(pool);
  return normaliseSalaryStats(rows);
}

export async function getSalaryByJobTitle(pool: Pool, country: string): Promise<SalaryByJobTitle[]> {
  const rows = await repo.getSalaryByJobTitle(pool, country);
  return normaliseJobTitleStats(rows);
}

export async function getInsightSummary(pool: Pool): Promise<InsightSummary> {
  return repo.getInsightSummary(pool);
}
