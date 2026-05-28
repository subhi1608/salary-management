import { useState } from 'react';
import { TableCell, TableSortLabel } from '@mui/material';

export interface ColDef<T extends string> {
  id: T;
  label: string;
  sortable?: boolean;
}

export function useSortable<T extends string>(defaultOrderBy: T) {
  const [orderBy, setOrderBy] = useState<T>(defaultOrderBy);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  function handleSort(col: T) {
    if (orderBy === col) {
      setOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(col);
      setOrder('desc');
    }
  }

  function sortRows<R extends { [K in T]: string | number }>(rows: R[]): R[] {
    return [...rows].sort((a, b) => {
      const av = a[orderBy];
      const bv = b[orderBy];
      const v = av < bv ? -1 : av > bv ? 1 : 0;
      return order === 'asc' ? v : -v;
    });
  }

  return { orderBy, order, handleSort, sortRows };
}

interface SortableHeaderCellProps<T extends string> {
  col: ColDef<T>;
  orderBy: T;
  order: 'asc' | 'desc';
  onSort: (id: T) => void;
}

export function SortableHeaderCell<T extends string>({ col, orderBy, order, onSort }: SortableHeaderCellProps<T>) {
  return (
    <TableCell sortDirection={col.sortable !== false && orderBy === col.id ? order : false}>
      {col.sortable !== false ? (
        <TableSortLabel
          active={orderBy === col.id}
          direction={orderBy === col.id ? order : 'asc'}
          onClick={() => onSort(col.id)}
        >
          {col.label}
        </TableSortLabel>
      ) : col.label}
    </TableCell>
  );
}
