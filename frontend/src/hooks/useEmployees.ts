import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeFilters, UpdateEmployeeInput } from '../types';
import {
  fetchEmployees, createEmployee, updateEmployee,
  deactivateEmployee, fetchDepartments, employeeKeys,
} from '../services/employees';

export const useEmployees = (f: EmployeeFilters) =>
  useQuery({ queryKey: employeeKeys.list(f), queryFn: () => fetchEmployees(f) });

export const useDepartments = () =>
  useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmployeeInput }) => updateEmployee(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: () => qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
