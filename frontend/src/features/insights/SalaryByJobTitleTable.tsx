import { useState } from 'react';
import {
  Paper, Typography, Box, TextField, MenuItem, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
} from '@mui/material';
import { useSalaryByJobTitle } from '../../hooks/useInsights';
import { COUNTRIES } from '../../lib/constants';
import { formatCurrency } from '../../lib/formatCurrency';
import { ColDef, useSortable, SortableHeaderCell } from './tableSort';

type OrderBy = 'job_title' | 'avg_salary' | 'employee_count';

const COLS: ColDef<OrderBy>[] = [
  { id: 'job_title', label: 'Job Title', sortable: false },
  { id: 'avg_salary', label: 'Avg Salary' },
  { id: 'employee_count', label: 'Employees' },
];

export function SalaryByJobTitleTable() {
  const [country, setCountry] = useState('US');
  const { orderBy, order, handleSort, sortRows } = useSortable<OrderBy>('avg_salary');
  const { data = [], isLoading } = useSalaryByJobTitle(country);
  const sorted = sortRows(data);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Avg Salary by Job Title</Typography>
        <TextField
          select size="small" label="Country" value={country}
          onChange={e => setCountry(e.target.value)}
          sx={{ minWidth: 100 }}
        >
          {COUNTRIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
      </Box>
      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress size={24} />
        </Box>
      ) : sorted.length === 0 ? (
        <Box display="flex" justifyContent="center" p={4}>
          <Typography variant="body2" color="text.secondary">No salary data for {country}</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {COLS.map(col => (
                  <SortableHeaderCell key={col.id} col={col} orderBy={orderBy} order={order} onSort={handleSort} />
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map(row => (
                <TableRow key={row.job_title}>
                  <TableCell>{row.job_title}</TableCell>
                  <TableCell>{formatCurrency(row.avg_salary)}</TableCell>
                  <TableCell>{row.employee_count.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
