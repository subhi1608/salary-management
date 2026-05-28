import { Box, Paper, Typography } from '@mui/material';
import { LoginForm } from '../features/auth/LoginForm';
import { useAuth } from '../features/auth/useAuth';

export default function Login() {
  const { handleLoginSuccess } = useAuth();
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default' }}
    >
      <Paper
        elevation={0}
        sx={{ p: 4, width: '100%', maxWidth: 400, border: 1, borderColor: 'divider' }}
      >
        <Box mb={3} textAlign="center">
          <Typography variant="h5" color="primary">HR Portal</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sign in to manage your workforce
          </Typography>
        </Box>
        <LoginForm onSuccess={handleLoginSuccess} />
      </Paper>
    </Box>
  );
}
