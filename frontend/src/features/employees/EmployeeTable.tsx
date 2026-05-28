import { Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Employee } from '../../types';
import { formatCurrency } from '../../lib/formatCurrency';

interface Props {
  employees: Employee[]; total: number; page: number; pageSize: number; loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  onEdit: (emp: Employee) => void;
  onDeactivate: (id: string) => void;
}

function NoRowsOverlay() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={0.5}>
      <Typography variant="body2" color="text.secondary">No employees match the current filters</Typography>
      <Typography variant="caption" color="text.disabled">Try adjusting your search or status filter</Typography>
    </Box>
  );
}

export function EmployeeTable({
  employees, total, page, pageSize, loading, onPageChange, onEdit, onDeactivate,
}: Props) {
  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  const columns: GridColDef<Employee>[] = [
    { field: 'full_name', headerName: 'Name', flex: 1, minWidth: 150, disableColumnMenu: true },
    { field: 'job_title', headerName: 'Job Title', flex: 1, width: 250, sortable: false, disableColumnMenu: true },
    { field: 'country', headerName: 'Country', width: 90, disableColumnMenu: true },
    {
      field: 'salary', headerName: 'Salary', width: 120, disableColumnMenu: true,
      renderCell: ({ value }) => typeof value === 'number' ? formatCurrency(value) : '',
    },
    {
      field: 'employment_type', headerName: 'Type', width: 120, sortable: false, disableColumnMenu: true,
      renderCell: ({ value }) => (value as string)?.replace('_', ' ') ?? '',
    },
    {
      field: 'is_active', headerName: 'Status', width: 100, sortable: false, disableColumnMenu: true,
      renderCell: ({ value }) => (
        <Chip label={value ? 'Active' : 'Inactive'} color={value ? 'success' : 'default'} size="small" />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false, disableColumnMenu: true,
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" aria-label="Edit" onClick={() => onEdit(row)}>Edit</Button>
          {row.is_active && (
            <Button size="small" variant="outlined" color="error" aria-label="Deactivate" onClick={() => onDeactivate(row.id)}>
              Deactivate
            </Button>
          )}
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      rows={employees}
      columns={columns}
      rowCount={total}
      pageSizeOptions={[10, 25, 50]}
      paginationModel={{ page: page - 1, pageSize }}
      paginationMode="server"
      onPaginationModelChange={({ page: p, pageSize: ps }) => onPageChange(p + 1, ps)}
      disableRowSelectionOnClick
      autoHeight
      disableVirtualization
      slots={{ noRowsOverlay: NoRowsOverlay }}
    />
  );
}
