import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Paper,
  Typography,
  Toolbar,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

// Types
type Order = 'asc' | 'desc';

interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  numeric?: boolean;
  disablePadding?: boolean;
  disableSort?: boolean;
  width?: string | number;
  format?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  defaultSortColumn?: keyof T;
  defaultSortDirection?: Order;
  title?: string;
  loading?: boolean;
  error?: string | null;
  rowsPerPageOptions?: number[];
  onRefresh?: () => void;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string | number;
  actions?: React.ReactNode;
  emptyMessage?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  filterOptions?: {
    label: string;
    value: string;
    color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  }[];
  onFilterChange?: (filters: string[]) => void;
  exportData?: boolean;
  exportFilename?: string;
  exportHeaders?: string[];
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator<T>(
  order: Order,
  orderBy: keyof T,
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function EnhancedTableHead<T>(props: {
  columns: Column<T>[];
  order: Order;
  orderBy: string;
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof T) => void;
}) {
  const { columns, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property: keyof T) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={String(column.id)}
            align={column.numeric ? 'right' : 'left'}
            padding={column.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === column.id ? order : false}
            style={{ width: column.width }}
          >
            {column.disableSort ? (
              column.label
            ) : (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id as keyof T)}
              >
                {column.label}
                {orderBy === column.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar<T>(props: {
  title?: string;
  onRefresh?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  filterOptions?: {
    label: string;
    value: string;
    color?: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  }[];
  onFilterChange?: (filters: string[]) => void;
  selectedFilters: string[];
  exportData?: boolean;
  exportFilename?: string;
  exportHeaders?: string[];
  data: T[];
  actions?: React.ReactNode;
}) {
  const {
    title,
    onRefresh,
    showSearch,
    searchPlaceholder,
    onSearch,
    filterOptions,
    onFilterChange,
    selectedFilters,
    exportData,
    exportFilename,
    exportHeaders,
    data,
    actions
  } = props;

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterToggle = (filter: string) => {
    if (!onFilterChange) return;
    
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    onFilterChange(newFilters);
  };

  const handleExport = () => {
    if (!exportData || !data.length) return;
    
    // Convert data to CSV
    const headers = exportHeaders || Object.keys(data[0] as object);
    const csvContent = [
      headers.join(','),
      ...data.map(row => {
        return headers.map(header => {
          const value = (row as any)[header];
          // Handle strings with commas by wrapping in quotes
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',');
      })
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFilename || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1
      }}
    >
      {title && (
        <Typography
          sx={{ flex: '1 1 auto' }}
          variant="h6"
          id="tableTitle"
          component="div"
        >
          {title}
        </Typography>
      )}
      
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {showSearch && (
          <TextField
            size="small"
            placeholder={searchPlaceholder || "Search..."}
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 200 } }}
          />
        )}
        
        {filterOptions && filterOptions.length > 0 && (
          <>
            <Tooltip title="Filter list">
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            
            {showFilters && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, width: '100%', mt: 1 }}>
                {filterOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    color={option.color || 'default'}
                    variant={selectedFilters.includes(option.value) ? 'filled' : 'outlined'}
                    onClick={() => handleFilterToggle(option.value)}
                    size="small"
                  />
                ))}
              </Box>
            )}
          </>
        )}
        
        {exportData && (
          <Tooltip title="Export data">
            <IconButton onClick={handleExport} disabled={!data.length}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {onRefresh && (
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {actions}
      </Box>
    </Toolbar>
  );
}

function DataTable<T extends object>({
  columns,
  data,
  defaultSortColumn,
  defaultSortDirection = 'asc',
  title,
  loading = false,
  error = null,
  rowsPerPageOptions = [5, 10, 25],
  onRefresh,
  onRowClick,
  getRowId,
  actions,
  emptyMessage = "No data available",
  showSearch = false,
  searchPlaceholder,
  onSearch,
  filterOptions,
  onFilterChange,
  exportData = false,
  exportFilename,
  exportHeaders
}: DataTableProps<T>) {
  const theme = useTheme();
  const [order, setOrder] = useState<Order>(defaultSortDirection);
  const [orderBy, setOrderBy] = useState<keyof T>(defaultSortColumn || (columns[0].id as keyof T));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Reset pagination when data changes
  useEffect(() => {
    setPage(0);
  }, [data.length]);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof T,
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (filters: string[]) => {
    setSelectedFilters(filters);
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };

  // Calculate empty rows to maintain consistent page height
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  // Sort and paginate data
  const sortedData = stableSort(data, getComparator(order, orderBy));
  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <EnhancedTableToolbar
          title={title}
          onRefresh={onRefresh}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          selectedFilters={selectedFilters}
          exportData={exportData}
          exportFilename={exportFilename}
          exportHeaders={exportHeaders}
          data={data}
          actions={actions}
        />
        
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table
            stickyHeader
            aria-labelledby="tableTitle"
            size="medium"
          >
            <EnhancedTableHead
              columns={columns}
              order={order}
              orderBy={String(orderBy)}
              onRequestSort={handleRequestSort}
            />
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading data...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                    <Typography color="error">
                      {error}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedData.map((row, index) => {
                    const rowId = getRowId ? getRowId(row) : index;
                    
                    return (
                      <TableRow
                        hover
                        onClick={() => onRowClick && onRowClick(row)}
                        tabIndex={-1}
                        key={rowId}
                        sx={{ 
                          cursor: onRowClick ? 'pointer' : 'default',
                          '&:last-child td, &:last-child th': { border: 0 }
                        }}
                      >
                        {columns.map((column) => {
                          const cellValue = column.id !== 'actions' ? row[column.id as keyof T] : null;
                          
                          return (
                            <TableCell
                              key={`${rowId}-${String(column.id)}`}
                              align={column.numeric ? 'right' : 'left'}
                              padding={column.disablePadding ? 'none' : 'normal'}
                            >
                              {column.format && cellValue !== null ? column.format(cellValue) : cellValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={columns.length} />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}

export default DataTable;
export type { Column, Order };