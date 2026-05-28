import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid,
} from '@mui/material';
import { Employee, CreateEmployeeInput } from '../../types';
import { COUNTRIES, EMPLOYMENT_TYPES } from '../../lib/constants';

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  job_title: z.string().min(1, 'Job title is required'),
  department_id: z.number({ invalid_type_error: 'Select a department' }).int().positive(),
  country: z.string().min(1),
  salary: z.number({ invalid_type_error: 'Enter a salary' }).positive(),
  employment_type: z.enum(['full_time', 'part_time', 'contractor']),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  employee?: Employee;
  departments: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSubmit: (v: CreateEmployeeInput) => Promise<void>;
}

export function EmployeeModal({ open, mode, employee, departments, onClose, onSubmit }: Props) {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employment_type: 'full_time',
      country: 'US',
      department_id: departments[0]?.id,
    },
  });

  useEffect(() => {
    if (employee) reset({ ...employee });
    else reset({
      employment_type: 'full_time',
      country: 'US',
      department_id: departments[0]?.id,
    });
  }, [employee, reset, open, departments]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Add Employee' : 'Edit Employee'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={6}>
            <TextField fullWidth label="First Name" inputProps={{ 'aria-label': 'First Name' }}
              {...register('first_name')} error={!!errors.first_name} helperText={errors.first_name?.message} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Last Name" inputProps={{ 'aria-label': 'Last Name' }}
              {...register('last_name')} error={!!errors.last_name} helperText={errors.last_name?.message} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Email" inputProps={{ 'aria-label': 'Email' }}
              {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Job Title" inputProps={{ 'aria-label': 'Job Title' }}
              {...register('job_title')} error={!!errors.job_title} helperText={errors.job_title?.message} />
          </Grid>
          <Grid item xs={6}>
            <Controller name="department_id" control={control} render={({ field }) => (
              <TextField select fullWidth label="Department" inputProps={{ 'aria-label': 'Department' }}
                value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))}
                error={!!errors.department_id} helperText={errors.department_id?.message}>
                {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
              </TextField>
            )} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Country" inputProps={{ 'aria-label': 'Country' }}
              {...register('country')} defaultValue="US"
              error={!!errors.country} helperText={errors.country?.message}>
              {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Salary" type="number" inputProps={{ 'aria-label': 'Salary' }}
              {...register('salary', { valueAsNumber: true })}
              error={!!errors.salary} helperText={errors.salary?.message} />
          </Grid>
          <Grid item xs={6}>
            <TextField select fullWidth label="Employment Type" inputProps={{ 'aria-label': 'Employment Type' }}
              {...register('employment_type')} defaultValue="full_time"
              error={!!errors.employment_type} helperText={errors.employment_type?.message}>
              {EMPLOYMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Hire Date" type="date" InputLabelProps={{ shrink: true }}
              inputProps={{ 'aria-label': 'Hire Date' }}
              {...register('hire_date')} error={!!errors.hire_date} helperText={errors.hire_date?.message} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} aria-label="Cancel">Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting} aria-label="Save">Save</Button>
      </DialogActions>
    </Dialog>
  );
}
