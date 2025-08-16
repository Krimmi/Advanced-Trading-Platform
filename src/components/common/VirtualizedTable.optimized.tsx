import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  useTheme
} from '@mui/material';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useComponentPerformance } from '../../utils/withPerformanceTracking.optimized';
import PerformanceMonitor from '../../utils/performanceMonitor.optimized';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string | JSX.Element;
  sortable?: boolean;
}

export interface VirtualizedTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  error?: string | null;
  rowHeight?: number;
  headerHeight?: number;
  defaultSortBy?: string;
  defaultSortDirection?: 'asc' | 'desc';
  onRowClick?: (row: any) => void;
  getRowId?: (row: any) => string | number;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  virtualizationThreshold?: number;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = React.memo(({
  columns,
  data,
  loading = false,
  error = null,
  rowHeight = 53,
  headerHeight = 56,
  defaultSortBy,
  defaultSortDirection = 'asc',
  onRowClick,
  getRowId = (row) => row.id,
  emptyMessage = 'No data available',
  className,
  stickyHeader = true,
  maxHeight = 400,
  virtualizationThreshold = 100
}) => {
  const theme = useTheme();
  const { trackOperation } = useComponentPerformance('VirtualizedTable');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for sorting
  const [sortBy, setSortBy] = useState<string | undefined>(defaultSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  
  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortBy || !data || data.length === 0) return data;
    
    return trackOperation('sortData', () => {
      return [...data].sort((a, b) => {
        const valueA = a[sortBy];
        const valueB = b[sortBy];
        
        // Handle different data types
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortDirection === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        
        if (valueA === valueB) return 0;
        
        if (valueA === null || valueA === undefined) return sortDirection === 'asc' ? -1 : 1;
        if (valueB === null || valueB === undefined) return sortDirection === 'asc' ? 1 : -1;
        
        return sortDirection === 'asc' 
          ? (valueA < valueB ? -1 : 1)
          : (valueA < valueB ? 1 : -1);
      });
    }, data.length);
  }, [data, sortBy, sortDirection, trackOperation]);
  
  // Handle sort change
  const handleSort = useCallback((columnId: string) => {
    setSortBy(columnId);
    setSortDirection(prevDirection => 
      sortBy === columnId && prevDirection === 'asc' ? 'desc' : 'asc'
    );
  }, [sortBy]);
  
  // Row renderer for virtualized list
  const RowRenderer = useCallback(({ index, style }: ListChildComponentProps) => {
    const row = sortedData[index];
    const rowId = getRowId(row);
    
    return (
      <TableRow
        hover
        tabIndex={-1}
        key={rowId}
        style={{
          ...style,
          cursor: onRowClick ? 'pointer' : 'default',
        }}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {columns.map((column) => {
          const value = row[column.id];
          return (
            <TableCell
              key={`${rowId}-${column.id}`}
              align={column.align || 'left'}
              style={{ height: rowHeight }}
            >
              {column.format ? column.format(value) : value}
            </TableCell>
          );
        })}
      </TableRow>
    );
  }, [sortedData, columns, getRowId, onRowClick, rowHeight]);
  
  // Register container for visibility tracking
  useEffect(() => {
    if (containerRef.current) {
      PerformanceMonitor.registerComponentForVisibilityTracking(
        containerRef.current,
        'VirtualizedTable'
      );
    }
    
    return () => {
      if (containerRef.current) {
        PerformanceMonitor.unregisterComponentFromVisibilityTracking(
          containerRef.current
        );
      }
    };
  }, []);
  
  // Determine whether to use virtualization based on data size
  const useVirtualization = useMemo(() => {
    return data.length > virtualizationThreshold;
  }, [data.length, virtualizationThreshold]);
  
  // Render table header
  const tableHeader = useMemo(() => (
    <TableHead>
      <TableRow style={{ height: headerHeight }}>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align || 'left'}
            style={{ 
              minWidth: column.minWidth,
              fontWeight: 'bold',
              cursor: column.sortable ? 'pointer' : 'default',
              backgroundColor: theme.palette.background.paper,
            }}
            onClick={column.sortable ? () => handleSort(column.id) : undefined}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {column.label}
              {sortBy === column.id && (
                <Box component="span" sx={{ ml: 0.5 }}>
                  {sortDirection === 'asc' ? '▲' : '▼'}
                </Box>
              )}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  ), [columns, headerHeight, sortBy, sortDirection, handleSort, theme]);
  
  // Render standard table rows (for small datasets)
  const standardTableRows = useMemo(() => (
    <TableBody>
      {sortedData.map((row) => {
        const rowId = getRowId(row);
        return (
          <TableRow
            hover
            tabIndex={-1}
            key={rowId}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            {columns.map((column) => {
              const value = row[column.id];
              return (
                <TableCell key={`${rowId}-${column.id}`} align={column.align || 'left'}>
                  {column.format ? column.format(value) : value}
                </TableCell>
              );
            })}
          </TableRow>
        );
      })}
    </TableBody>
  ), [sortedData, columns, getRowId, onRowClick]);
  
  // Render virtualized table rows (for large datasets)
  const virtualizedTableRows = useMemo(() => (
    <TableBody>
      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={columns.length}>
          <div style={{ height: Math.min(rowHeight * sortedData.length, typeof maxHeight === 'number' ? maxHeight - headerHeight : 400) }}>
            <AutoSizer>
              {({ height, width }) => (
                <FixedSizeList
                  height={height}
                  width={width}
                  itemCount={sortedData.length}
                  itemSize={rowHeight}
                  overscanCount={5}
                >
                  {RowRenderer}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  ), [sortedData, columns, rowHeight, headerHeight, maxHeight, RowRenderer]);
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="body1">{error}</Typography>
      </Box>
    );
  }
  
  // Render empty state
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">{emptyMessage}</Typography>
      </Box>
    );
  }
  
  return (
    <Paper className={className} ref={containerRef}>
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader={stickyHeader} aria-label="virtualized table">
          {tableHeader}
          {useVirtualization ? virtualizedTableRows : standardTableRows}
        </Table>
      </TableContainer>
    </Paper>
  );
});

VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedTable;