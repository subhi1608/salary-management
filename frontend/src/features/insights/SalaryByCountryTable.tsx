import { Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import { SalaryByCountry } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';
import { ColDef, useSortable, SortableHeaderCell } from './tableSort';

type OrderBy = 'country' | 'min_salary' | 'avg_salary' | 'max_salary' | 'employee_count';

const COLS: ColDef<OrderBy>[] = [
  { id: 'country', label: 'Country', sortable: false },
  { id: 'min_salary', label: 'Min Salary' },
  { id: 'avg_salary', label: 'Avg Salary' },
  { id: 'max_salary', label: 'Max Salary' },
  { id: 'employee_count', label: 'Employees' },
];

export function SalaryByCountryTable({ data }: { data: SalaryByCountry[] }) {
  const { orderBy, order, handleSort, sortRows } = useSortable<OrderBy>('avg_salary');
  const sorted = sortRows(data);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>Salary by Country (USD)</Typography>
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
              <TableRow key={row.country}>
                <TableCell>{row.country}</TableCell>
                <TableCell>{formatCurrency(row.min_salary)}</TableCell>
                <TableCell>{formatCurrency(row.avg_salary)}</TableCell>
                <TableCell>{formatCurrency(row.max_salary)}</TableCell>
                <TableCell>{row.employee_count.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
