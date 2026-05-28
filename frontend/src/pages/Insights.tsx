import { Grid, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { PageLayout } from '../components/PageLayout';
import { SummaryCards } from '../features/insights/SummaryCards';
import { SalaryByCountryTable } from '../features/insights/SalaryByCountryTable';
import { SalaryByJobTitleTable } from '../features/insights/SalaryByJobTitleTable';
import { DepartmentHeadcountTable } from '../features/insights/DepartmentHeadcountTable';
import { useSummary, useSalaryByCountry } from '../hooks/useInsights';

export default function Insights() {
  const { data: summary, isLoading, error } = useSummary();
  const { data: salaryByCountry = [] } = useSalaryByCountry();

  if (isLoading) return <PageLayout><Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box></PageLayout>;
  if (error) return <PageLayout><Alert severity="error">Failed to load insights.</Alert></PageLayout>;
  if (!summary) return null;

  return (
    <PageLayout>
      <Typography variant="h5" mb={3}>Salary Insights</Typography>
      <SummaryCards summary={summary!} />
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12}><SalaryByCountryTable data={salaryByCountry} /></Grid>
        <Grid item xs={12} md={7}><SalaryByJobTitleTable /></Grid>
        <Grid item xs={12} md={5}><DepartmentHeadcountTable summary={summary!} /></Grid>
      </Grid>
    </PageLayout>
  );
}
