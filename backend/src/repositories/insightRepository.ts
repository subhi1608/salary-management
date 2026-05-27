import { Pool } from 'pg';
import { InsightSummary } from '../types';

export async function getSalaryByCountry(pool: Pool): Promise<Record<string, unknown>[]> {
  const result = await pool.query(`
    SELECT country,
           MIN(salary) AS min_salary,
           MAX(salary) AS max_salary,
           AVG(salary) AS avg_salary,
           COUNT(*)    AS employee_count
    FROM employees
    WHERE is_active = true
    GROUP BY country
    ORDER BY country
  `);
  return result.rows;
}

export async function getSalaryByJobTitle(
  pool: Pool,
  country: string
): Promise<Record<string, unknown>[]> {
  const result = await pool.query(`
    SELECT job_title,
           AVG(salary) AS avg_salary,
           COUNT(*)    AS employee_count
    FROM employees
    WHERE country = $1 AND is_active = true
    GROUP BY job_title
    ORDER BY avg_salary DESC
  `, [country]);
  return result.rows;
}

export async function getInsightSummary(pool: Pool): Promise<InsightSummary> {
  const [totals, byCountry, byDept] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS total_employees,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) AS active_employees,
        SUM(CASE WHEN NOT is_active THEN 1 ELSE 0 END) AS former_employees,
        AVG(CASE WHEN is_active THEN salary END) AS avg_salary
      FROM employees
    `),
    pool.query(`
      SELECT country, COUNT(*) AS count
      FROM employees WHERE is_active=true
      GROUP BY country ORDER BY count DESC LIMIT 10
    `),
    pool.query(`
      SELECT d.name AS department, COUNT(*) AS count
      FROM employees e LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.is_active=true GROUP BY d.name ORDER BY count DESC
    `),
  ]);

  const row = totals.rows[0];
  return {
    total_employees: parseInt(row.total_employees ?? 0, 10),
    active_employees: parseInt(row.active_employees ?? 0, 10),
    former_employees: parseInt(row.former_employees ?? 0, 10),
    avg_salary: parseFloat(parseFloat(row.avg_salary ?? 0).toFixed(2)),
    headcount_by_country: byCountry.rows.map(r => ({ country: r.country, count: parseInt(r.count, 10) })),
    headcount_by_department: byDept.rows.map(r => ({ department: r.department, count: parseInt(r.count, 10) })),
  };
}
