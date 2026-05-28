import axios from 'axios';
import { apiClient } from '../api/client';
import { ApiResponse, User } from '../types';

export async function loginApi(
  email: string,
  password: string
): Promise<{ accessToken: string; user: User }> {
  const res = await apiClient.post<ApiResponse<{ accessToken: string; user: User }>>(
    '/auth/login',
    { email, password }
  );
  return res.data.data;
}

export async function refreshApi(): Promise<{ accessToken: string; user: User }> {
  // Use plain axios (not apiClient) to avoid triggering the 401 interceptor recursively
  const res = await axios.post<ApiResponse<{ accessToken: string; user: User }>>(
    '/api/v1/auth/refresh',
    {},
    { withCredentials: true }
  );
  return res.data.data;
}
