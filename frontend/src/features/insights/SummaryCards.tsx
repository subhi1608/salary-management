import { Grid } from '@mui/material';
import { StatCard } from '../../components/StatCard';
import { InsightSummary } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';

export function SummaryCards({ summary }: { summary: InsightSummary }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Total Employees" value={summary.total_employees.toLocaleString()} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Active Employees" value={summary.active_employees.toLocaleString()} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Former Employees" value={summary.former_employees.toLocaleString()} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard title="Avg Salary (Active)" value={formatCurrency(summary.avg_salary)} subtitle="USD" />
      </Grid>
    </Grid>
  );
}
