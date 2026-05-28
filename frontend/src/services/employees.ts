import { apiClient } from '../api/client';
import {
  ApiResponse, Employee, CreateEmployeeInput,
  UpdateEmployeeInput, PaginatedEmployees, EmployeeFilters,
} from '../types';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (f: EmployeeFilters) => [...employeeKeys.all, 'list', f] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
};

export const fetchEmployees = (f: EmployeeFilters) =>
  apiClient.get<ApiResponse<PaginatedEmployees>>('/employees', { params: f }).then(r => r.data.data);

export const createEmployee = (input: CreateEmployeeInput) =>
  apiClient.post<ApiResponse<Employee>>('/employees', input).then(r => r.data.data);

export const updateEmployee = (id: string, input: UpdateEmployeeInput) =>
  apiClient.patch<ApiResponse<Employee>>(`/employees/${id}`, input).then(r => r.data.data);

export const deactivateEmployee = (id: string) =>
  apiClient.delete<ApiResponse<Employee>>(`/employees/${id}`).then(r => r.data.data);

export const fetchDepartments = () =>
  apiClient.get<ApiResponse<Array<{ id: number; name: string }>>>('/employees/departments').then(r => r.data.data);
