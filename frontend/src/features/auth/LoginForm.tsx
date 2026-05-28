import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField, Button, Box, Alert, CircularProgress } from '@mui/material';
import { User } from '../../types';
import { loginApi } from '../../services/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  onSuccess: (accessToken: string, user: User) => void;
  loginFn?: (email: string, password: string) => Promise<{ accessToken: string; user: User }>;
}

export function LoginForm({ onSuccess, loginFn = loginApi }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormValues) => {
    setServerError(null);
    try {
      const { accessToken, user } = await loginFn(email, password);
      onSuccess(accessToken, user);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Login failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {serverError && <Alert severity="error">{serverError}</Alert>}
      <TextField label="Email" type="email" inputProps={{ 'aria-label': 'Email' }}
        {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
      <TextField label="Password" type="password" inputProps={{ 'aria-label': 'Password' }}
        {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
        {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
      </Button>
    </Box>
  );
}
