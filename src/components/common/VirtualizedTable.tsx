import React, { useState, useEffect, useRef, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { useIntersectionObserver } from '../../hooks';

interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row: T) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  initialRowsToRender?: number;
  rowsPerPage?: number;
  maxHeight?: number | string;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  rowStyle?: (item: T) => React.CSSProperties;
  onRowClick?: (item: T) => void;
}

function VirtualizedTable<T>({
  columns,
  data,
  keyExtractor,
  initialRowsToRender = 20,
  rowsPerPage = 10,
  maxHeight = 400,
  loading = false,
  emptyMessage = 'No data available',
  stickyHeader = true,
  rowStyle,
  onRowClick
}: VirtualizedTableProps<T>) {
  const [visibleRows, setVisibleRows] = useState<number>(initialRowsToRender);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  
  // Use intersection observer to detect when we're near the bottom
  const [loaderRef, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Load more rows when we're near the bottom
  useEffect(() => {
    if (isIntersecting && !loadingMore && visibleRows < data.length) {
      setLoadingMore(true);
      
      // Use setTimeout to simulate async loading and prevent UI freezing
      setTimeout(() => {
        setVisibleRows(prev => Math.min(prev + rowsPerPage, data.length));
        setLoadingMore(false);
      }, 100);
    }
  }, [isIntersecting, loadingMore, visibleRows, data.length, rowsPerPage]);

  // Reset visible rows when data changes
  useEffect(() => {
    setVisibleRows(initialRowsToRender);
  }, [data, initialRowsToRender]);

  // Render only the visible rows
  const visibleData = data.slice(0, visibleRows);

  return (
    <TableContainer 
      component={Paper} 
      sx={{ maxHeight, overflow: 'auto', position: 'relative' }}
    >
      <Table stickyHeader={stickyHeader} size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <CircularProgress size={24} sx={{ my: 2 }} />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            visibleData.map((row) => {
              const rowKey = keyExtractor(row);
              return (
                <TableRow
                  hover
                  tabIndex={-1}
                  key={rowKey}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ 
                    cursor: onRowClick ? 'pointer' : 'default',
                    ...(rowStyle ? rowStyle(row) : {})
                  }}
                >
                  {columns.map((column) => {
                    const value = (row as any)[column.id];
                    return (
                      <TableCell key={`${rowKey}-${column.id}`} align={column.align}>
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {/* Loader reference element */}
      {!loading && data.length > 0 && visibleRows < data.length && (
        <Box 
          ref={loaderRef} 
          sx={{ 
            width: '100%', 
            height: '20px', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            p: 1
          }}
        >
          {loadingMore && <CircularProgress size={20} />}
        </Box>
      )}
    </TableContainer>
  );
}

export default memo(VirtualizedTable) as typeof VirtualizedTable;