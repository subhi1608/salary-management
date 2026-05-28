import { useState, useEffect } from 'react';
import { Alert, Button, MenuItem, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { PageLayout } from '../components/PageLayout';
import { EmployeeTable } from '../features/employees/EmployeeTable';
import { EmployeeModal } from '../features/employees/EmployeeModal';
import {
  useEmployees, useCreateEmployee, useUpdateEmployee,
  useDeactivateEmployee, useDepartments,
} from '../hooks/useEmployees';
import { Employee, CreateEmployeeInput, EmployeeFilters } from '../types';
import { COUNTRIES, DEFAULT_PAGE_SIZE } from '../lib/constants';

type Snack = { open: boolean; message: string; severity: 'success' | 'error' };

export default function Employees() {
  const [filters, setFilters] = useState<EmployeeFilters>({ page: 1, limit: DEFAULT_PAGE_SIZE, is_active: true });
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput || undefined, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);
  const [editEmployee, setEditEmployee] = useState<Employee | undefined>();
  const [snack, setSnack] = useState<Snack>({ open: false, message: '', severity: 'success' });

  const { data, isLoading } = useEmployees(filters);
  const { data: departments = [] } = useDepartments();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deactivateMutation = useDeactivateEmployee();

  const notify = (message: string, severity: 'success' | 'error' = 'success') =>
    setSnack({ open: true, message, severity });

  const handleSubmit = async (values: CreateEmployeeInput) => {
    try {
      if (editEmployee) {
        await updateMutation.mutateAsync({ id: editEmployee.id, input: values });
        notify('Employee updated.');
      } else {
        await createMutation.mutateAsync(values);
        notify('Employee added.');
      }
      setModalOpen(false);
      setEditEmployee(undefined);
    } catch {
      notify('Something went wrong. Please try again.', 'error');
    }
  };

  return (
    <PageLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Employees</Typography>
        <Button variant="contained" onClick={() => { setEditEmployee(undefined); setModalOpen(true); }}>
          Add Employee
        </Button>
      </Stack>
      <Stack direction="row" spacing={2} mb={2}>
        <TextField size="small" label="Search" value={searchInput}
          onChange={e => setSearchInput(e.target.value)} />
        <TextField select size="small" label="Country" value={filters.country ?? ''} sx={{ minWidth: 100 }}
          onChange={e => setFilters(f => ({ ...f, country: e.target.value || undefined, page: 1 }))}>
          <MenuItem value="">All</MenuItem>
          {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status"
          value={filters.is_active === undefined ? '' : String(filters.is_active)} sx={{ minWidth: 110 }}
          onChange={e => setFilters(f => ({
            ...f,
            is_active: e.target.value === '' ? undefined : e.target.value === 'true',
            page: 1,
          }))}>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Former</MenuItem>
          <MenuItem value="">All</MenuItem>
        </TextField>
      </Stack>
      <EmployeeTable
        employees={data?.employees ?? []}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        pageSize={filters.limit ?? DEFAULT_PAGE_SIZE}
        loading={isLoading}
        onPageChange={(page, pageSize) => setFilters(f => ({ ...f, page, limit: pageSize }))}
        onEdit={emp => { setEditEmployee(emp); setModalOpen(true); }}
        onDeactivate={id => deactivateMutation.mutate(id, {
          onSuccess: () => notify('Employee deactivated.'),
          onError: () => notify('Failed to deactivate employee.', 'error'),
        })}
      />
      <EmployeeModal
        open={modalOpen}
        mode={editEmployee ? 'edit' : 'create'}
        employee={editEmployee}
        departments={departments}
        onClose={() => { setModalOpen(false); setEditEmployee(undefined); }}
        onSubmit={handleSubmit}
      />
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
}
