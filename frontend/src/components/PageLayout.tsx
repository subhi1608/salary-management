import { Box, AppBar, Toolbar, Typography, Button, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';

export function PageLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await apiClient.post('/auth/logout').catch(() => {});
    clearAuth();
    navigate({ to: '/login' });
  };

  const tab = pathname.startsWith('/insights') ? '/insights' : '/employees';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="primary" sx={{ flexGrow: 1, fontWeight: 700 }}>
            HR Portal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
            {user?.full_name}
          </Typography>
          <Button size="small" variant="outlined" color="primary" onClick={handleLogout}>
            Sign out
          </Button>
        </Toolbar>
        <Tabs value={tab} indicatorColor="primary" textColor="primary" sx={{ px: 1 }}>
          <Tab label="Employees" value="/employees" onClick={() => navigate({ to: '/employees' })} />
          <Tab label="Insights" value="/insights" onClick={() => navigate({ to: '/insights' })} />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>{children}</Box>
    </Box>
  );
}
