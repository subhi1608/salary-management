import { Pool } from 'pg';
import { z } from 'zod';
import {
  CreateEmployeeInput, Employee, EmployeeFilters,
  PaginatedEmployees, UpdateEmployeeInput, AppError,
} from '../types';
import * as repo from '../repositories/employeeRepository';

export const CreateEmployeeSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  job_title: z.string().min(1).max(150),
  department_id: z.number().int().positive(),
  country: z.string().min(1).max(100),
  salary: z.number().positive(),
  employment_type: z.enum(['full_time', 'part_time', 'contractor']),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export interface FilterQuery {
  where: string;
  params: unknown[];
}

export function buildEmployeeFiltersQuery(
  filters: Omit<EmployeeFilters, 'page' | 'limit'>
): FilterQuery {
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (filters.country !== undefined) {
    params.push(filters.country);
    conditions.push(`country = $${params.length}`);
  }
  if (filters.job_title !== undefined) {
    params.push(filters.job_title);
    conditions.push(`job_title = $${params.length}`);
  }
  if (filters.is_active !== undefined) {
    params.push(filters.is_active);
    conditions.push(`is_active = $${params.length}`);
  }
  if (filters.search !== undefined) {
    params.push(`%${filters.search}%`);
    conditions.push(`full_name ILIKE $${params.length}`);
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, params };
}

export async function listEmployees(pool: Pool, filters: EmployeeFilters): Promise<PaginatedEmployees> {
  const { where, params } = buildEmployeeFiltersQuery(filters);
  return repo.findEmployees(pool, where, params, filters.page, filters.limit);
}

export async function getEmployee(pool: Pool, id: string): Promise<Employee> {
  const emp = await repo.findEmployeeById(pool, id);
  if (!emp) throw new AppError('NOT_FOUND', 'Employee not found', 404);
  return emp;
}

export async function createEmployee(pool: Pool, input: CreateEmployeeInput): Promise<Employee> {
  return repo.createEmployee(pool, input);
}

export async function updateEmployee(
  pool: Pool,
  id: string,
  input: UpdateEmployeeInput
): Promise<Employee> {
  const emp = await repo.updateEmployee(pool, id, input);
  if (!emp) throw new AppError('NOT_FOUND', 'Employee not found', 404);
  return emp;
}

export async function deactivateEmployee(pool: Pool, id: string): Promise<Employee> {
  const emp = await repo.softDeleteEmployee(pool, id);
  if (!emp) throw new AppError('NOT_FOUND', 'Employee not found', 404);
  return emp;
}
