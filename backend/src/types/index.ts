export type EmploymentType = 'full_time' | 'part_time' | 'contractor';

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  job_title: string;
  department_id: number;
  country: string;
  salary: number;
  employment_type: EmploymentType;
  hire_date: string;
  is_active: boolean;
  termination_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeInput {
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  department_id: number;
  country: string;
  salary: number;
  employment_type: EmploymentType;
  hire_date: string;
}

export interface UpdateEmployeeInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  job_title?: string;
  department_id?: number;
  country?: string;
  salary?: number;
  employment_type?: EmploymentType;
  hire_date?: string;
}

export interface EmployeeFilters {
  country?: string;
  job_title?: string;
  is_active?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export interface PaginatedEmployees {
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalaryByCountry {
  country: string;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
  employee_count: number;
}

export interface SalaryByJobTitle {
  job_title: string;
  avg_salary: number;
  employee_count: number;
}

export interface InsightSummary {
  total_employees: number;
  active_employees: number;
  former_employees: number;
  avg_salary: number;
  headcount_by_country: Array<{ country: string; count: number }>;
  headcount_by_department: Array<{ department: string; count: number }>;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
