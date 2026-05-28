import { useQuery } from '@tanstack/react-query';
import { fetchSummary, fetchSalaryByCountry, fetchSalaryByJobTitle, insightKeys } from '../services/insights';

export const useSummary = () => useQuery({ queryKey: insightKeys.summary, queryFn: fetchSummary });
export const useSalaryByCountry = () => useQuery({ queryKey: insightKeys.salaryByCountry, queryFn: fetchSalaryByCountry });
export const useSalaryByJobTitle = (country: string) =>
  useQuery({ queryKey: insightKeys.salaryByJobTitle(country), queryFn: () => fetchSalaryByJobTitle(country), enabled: !!country });
