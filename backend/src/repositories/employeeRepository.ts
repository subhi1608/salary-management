import { Pool } from 'pg';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput, PaginatedEmployees } from '../types';

function mapRow(row: Record<string, unknown>): Employee {
  return {
    ...row,
    salary: parseFloat(row.salary as string),
  } as Employee;
}

export async function findEmployees(
  pool: Pool,
  where: string,
  params: unknown[],
  page: number,
  limit: number
): Promise<PaginatedEmployees> {
  const offset = (page - 1) * limit;
  const countResult = await pool.query(`SELECT COUNT(*) FROM employees ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const dataResult = await pool.query(
    `SELECT e.*, d.name as department_name FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     ${where} ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return {
    employees: dataResult.rows.map(mapRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findEmployeeById(pool: Pool, id: string): Promise<Employee | null> {
  const result = await pool.query(
    `SELECT e.*, d.name as department_name FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE e.id = $1`,
    [id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function createEmployee(pool: Pool, input: CreateEmployeeInput): Promise<Employee> {
  const result = await pool.query(
    `INSERT INTO employees (first_name, last_name, email, job_title, department_id, country, salary, employment_type, hire_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [input.first_name, input.last_name, input.email, input.job_title, input.department_id,
     input.country, input.salary, input.employment_type, input.hire_date]
  );
  return mapRow(result.rows[0]);
}

export async function updateEmployee(
  pool: Pool,
  id: string,
  input: UpdateEmployeeInput
): Promise<Employee | null> {
  const fields = Object.keys(input).filter(k => (input as Record<string, unknown>)[k] !== undefined);
  if (fields.length === 0) return findEmployeeById(pool, id);

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map(f => (input as Record<string, unknown>)[f]);

  const result = await pool.query(
    `UPDATE employees SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function findAllDepartments(pool: Pool): Promise<{ id: number; name: string }[]> {
  const result = await pool.query('SELECT id, name FROM departments ORDER BY name');
  return result.rows;
}

export async function softDeleteEmployee(pool: Pool, id: string): Promise<Employee | null> {
  const result = await pool.query(
    `UPDATE employees SET is_active = false, termination_date = CURRENT_DATE, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}
