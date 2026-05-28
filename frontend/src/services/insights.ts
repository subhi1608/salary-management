import { apiClient } from '../api/client';
import { ApiResponse, SalaryByCountry, SalaryByJobTitle, InsightSummary } from '../types';

export const insightKeys = {
  summary: ['insights', 'summary'] as const,
  salaryByCountry: ['insights', 'salary-by-country'] as const,
  salaryByJobTitle: (country: string) => ['insights', 'salary-by-jobtitle', country] as const,
};

export const fetchSummary = () =>
  apiClient.get<ApiResponse<InsightSummary>>('/insights/summary').then(r => r.data.data);

export const fetchSalaryByCountry = () =>
  apiClient.get<ApiResponse<SalaryByCountry[]>>('/insights/salary-by-country').then(r => r.data.data);

export const fetchSalaryByJobTitle = (country: string) =>
  apiClient.get<ApiResponse<SalaryByJobTitle[]>>('/insights/salary-by-jobtitle', { params: { country } }).then(r => r.data.data);
