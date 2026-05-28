import { Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell, TableContainer } from '@mui/material';
import { InsightSummary } from '../../types';
import { ColDef, useSortable, SortableHeaderCell } from './tableSort';

type OrderBy = 'department' | 'count';

const COLS: ColDef<OrderBy>[] = [
  { id: 'department', label: 'Department', sortable: false },
  { id: 'count', label: 'Headcount' },
];

export function DepartmentHeadcountTable({ summary }: { summary: InsightSummary }) {
  const { orderBy, order, handleSort, sortRows } = useSortable<OrderBy>('count');
  const sorted = sortRows(summary.headcount_by_department);

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" mb={2}>Headcount by Department</Typography>
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
              <TableRow key={row.department}>
                <TableCell>{row.department}</TableCell>
                <TableCell>{row.count.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
