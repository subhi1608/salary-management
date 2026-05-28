import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { refreshApi } from '../services/auth';

const Login = lazy(() => import('../pages/Login'));
const Employees = lazy(() => import('../pages/Employees'));
const Insights = lazy(() => import('../pages/Insights'));

const Spinner = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress />
  </Box>
);

const rootRoute = createRootRoute();
const loginRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/login',
  component: () => <Suspense fallback={<Spinner />}><Login /></Suspense>,
});
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute, id: '_authenticated',
  beforeLoad: async () => {
    if (!useAuthStore.getState().accessToken) {
      try {
        const { accessToken, user } = await refreshApi();
        useAuthStore.getState().setAuth(accessToken, user);
      } catch {
        throw redirect({ to: '/login' });
      }
    }
  },
});
const employeesRoute = createRoute({
  getParentRoute: () => authenticatedRoute, path: '/employees',
  component: () => <Suspense fallback={<Spinner />}><Employees /></Suspense>,
});
const insightsRoute = createRoute({
  getParentRoute: () => authenticatedRoute, path: '/insights',
  component: () => <Suspense fallback={<Spinner />}><Insights /></Suspense>,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute, path: '/',
  beforeLoad: () => { throw redirect({ to: '/employees' }); },
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute, loginRoute,
    authenticatedRoute.addChildren([employeesRoute, insightsRoute]),
  ]),
});

declare module '@tanstack/react-router' { interface Register { router: typeof router } }
