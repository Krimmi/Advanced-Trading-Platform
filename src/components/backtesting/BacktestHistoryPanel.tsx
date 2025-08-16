import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

import { BacktestResult, BacktestStatus } from '../../types/backtesting';
import { BacktestingService } from '../../services';

interface BacktestHistoryPanelProps {
  backtestResults: BacktestResult[];
  onBacktestSelected: (result: BacktestResult) => void;
  onRefresh: () => void;
  onCompare?: (results: BacktestResult[]) => void;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof BacktestResult | 'duration';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'configId', label: 'Config ID', numeric: false, sortable: true },
  { id: 'strategyId', label: 'Strategy', numeric: false, sortable: true },
  { id: 'startDate', label: 'Start Date', numeric: false, sortable: true },
  { id: 'endDate', label: 'End Date', numeric: false, sortable: true },
  { id: 'duration', label: 'Duration', numeric: false, sortable: true },
  { id: 'initialCapital', label: 'Initial Capital', numeric: true, sortable: true },
  { id: 'finalCapital', label: 'Final Capital', numeric: true, sortable: true },
  { id: 'totalReturn', label: 'Total Return', numeric: true, sortable: true },
  { id: 'maxDrawdown', label: 'Max Drawdown', numeric: true, sortable: true },
  { id: 'sharpeRatio', label: 'Sharpe Ratio', numeric: true, sortable: true },
  { id: 'status', label: 'Status', numeric: false, sortable: true },
];

const BacktestHistoryPanel: React.FC<BacktestHistoryPanelProps> = ({
  backtestResults,
  onBacktestSelected,
  onRefresh,
  onCompare
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredResults, setFilteredResults] = useState<BacktestResult[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof BacktestResult | 'duration'>('createdAt');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedResults, setSelectedResults] = useState<BacktestResult[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBacktest, setSelectedBacktest] = useState<BacktestResult | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  
  const backtestingService = new BacktestingService();
  
  useEffect(() => {
    applyFilters();
  }, [backtestResults, searchTerm, statusFilter]);
  
  const applyFilters = () => {
    let filtered = [...backtestResults];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.configId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.strategyId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter);
    }
    
    // Apply sorting
    filtered = stableSort(filtered, getComparator(order, orderBy));
    
    setFilteredResults(filtered);
  };
  
  const handleRequestSort = (property: keyof BacktestResult | 'duration') => {
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
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
    setPage(0);
  };
  
  const handleBacktestMenuOpen = (event: React.MouseEvent<HTMLElement>, backtest: BacktestResult) => {
    setAnchorEl(event.currentTarget);
    setSelectedBacktest(backtest);
  };
  
  const handleBacktestMenuClose = () => {
    setAnchorEl(null);
    setSelectedBacktest(null);
  };
  
  const handleBacktestClick = (backtest: BacktestResult) => {
    onBacktestSelected(backtest);
  };
  
  const handleBacktestSelect = (backtest: BacktestResult, selected: boolean) => {
    if (selected) {
      setSelectedResults([...selectedResults, backtest]);
    } else {
      setSelectedResults(selectedResults.filter(result => result.id !== backtest.id));
    }
  };
  
  const handleCompareSelected = () => {
    if (onCompare && selectedResults.length >= 2) {
      onCompare(selectedResults);
    }
  };
  
  const handleDeleteBacktest = async () => {
    if (!selectedBacktest) return;
    
    try {
      setLoading(true);
      await backtestingService.deleteBacktestResult(selectedBacktest.id);
      onRefresh();
      setLoading(false);
      setDeleteDialogOpen(false);
      handleBacktestMenuClose();
    } catch (err) {
      console.error('Error deleting backtest:', err);
      setError('Failed to delete backtest. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleDuplicateBacktest = async () => {
    if (!selectedBacktest) return;
    
    try {
      setLoading(true);
      await backtestingService.duplicateBacktest(selectedBacktest.id);
      onRefresh();
      setLoading(false);
      handleBacktestMenuClose();
    } catch (err) {
      console.error('Error duplicating backtest:', err);
      setError('Failed to duplicate backtest. Please try again later.');
      setLoading(false);
    }
  };
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatDuration = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };
  
  const getBacktestStatusColor = (status: BacktestStatus): string => {
    switch (status) {
      case BacktestStatus.PENDING:
        return theme.palette.info.main;
      case BacktestStatus.RUNNING:
        return theme.palette.warning.main;
      case BacktestStatus.COMPLETED:
        return theme.palette.success.main;
      case BacktestStatus.FAILED:
        return theme.palette.error.main;
      case BacktestStatus.CANCELLED:
        return theme.palette.grey[500];
      default:
        return theme.palette.text.secondary;
    }
  };
  
  const getReturnColor = (value: number): string => {
    return value > 0 ? theme.palette.success.main : value < 0 ? theme.palette.error.main : theme.palette.text.secondary;
  };
  
  const getReturnIcon = (value: number) => {
    return value > 0 ? <TrendingUpIcon fontSize="small" /> : value < 0 ? <TrendingDownIcon fontSize="small" /> : null;
  };
  
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T | 'duration') {
    if (orderBy === 'duration') {
      const aDuration = getDurationInDays(a as unknown as BacktestResult);
      const bDuration = getDurationInDays(b as unknown as BacktestResult);
      if (bDuration < aDuration) {
        return -1;
      }
      if (bDuration > aDuration) {
        return 1;
      }
      return 0;
    }
    
    if ((b as any)[orderBy] < (a as any)[orderBy]) {
      return -1;
    }
    if ((b as any)[orderBy] > (a as any)[orderBy]) {
      return 1;
    }
    return 0;
  }
  
  function getDurationInDays(backtest: BacktestResult): number {
    const start = new Date(backtest.startDate);
    const end = new Date(backtest.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
  ): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
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
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Backtest History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredResults.length} backtest results
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<CompareArrowsIcon />}
              onClick={handleCompareSelected}
              disabled={selectedResults.length < 2}
            >
              Compare Selected
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {!loading && !error && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search backtests..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    size="small"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value={BacktestStatus.PENDING}>Pending</MenuItem>
                    <MenuItem value={BacktestStatus.RUNNING}>Running</MenuItem>
                    <MenuItem value={BacktestStatus.COMPLETED}>Completed</MenuItem>
                    <MenuItem value={BacktestStatus.FAILED}>Failed</MenuItem>
                    <MenuItem value={BacktestStatus.CANCELLED}>Cancelled</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedResults.length} backtests selected
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        sortDirection={orderBy === headCell.id ? order : false}
                      >
                        {headCell.sortable ? (
                          <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={() => handleRequestSort(headCell.id)}
                          >
                            {headCell.label}
                          </TableSortLabel>
                        ) : (
                          headCell.label
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredResults
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((backtest) => {
                      const isSelected = selectedResults.some(result => result.id === backtest.id);
                      
                      return (
                        <TableRow
                          hover
                          key={backtest.id}
                          onClick={() => handleBacktestClick(backtest)}
                          sx={{ 
                            cursor: 'pointer',
                            backgroundColor: isSelected ? `${theme.palette.primary.main}10` : 'inherit'
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleBacktestSelect(backtest, e.target.checked);
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>{backtest.configId}</TableCell>
                          <TableCell>{backtest.strategyId}</TableCell>
                          <TableCell>{formatDate(backtest.startDate)}</TableCell>
                          <TableCell>{formatDate(backtest.endDate)}</TableCell>
                          <TableCell>{formatDuration(backtest.startDate, backtest.endDate)}</TableCell>
                          <TableCell align="right">{formatCurrency(backtest.initialCapital)}</TableCell>
                          <TableCell align="right">{formatCurrency(backtest.finalCapital)}</TableCell>
                          <TableCell align="right" sx={{ color: getReturnColor(backtest.totalReturn) }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              {getReturnIcon(backtest.totalReturn)}
                              <Typography variant="body2" sx={{ ml: 0.5 }}>
                                {formatPercentage(backtest.totalReturn)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ color: theme.palette.error.main }}>
                            {formatPercentage(backtest.maxDrawdown)}
                          </TableCell>
                          <TableCell align="right">{backtest.sharpeRatio.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip
                              label={backtest.status}
                              size="small"
                              sx={{
                                backgroundColor: getBacktestStatusColor(backtest.status),
                                color: '#fff'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBacktestMenuOpen(e, backtest);
                              }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {filteredResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No backtest results found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              component="div"
              count={filteredResults.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Card>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleBacktestMenuClose}
          >
            <MenuItem onClick={() => {
              if (selectedBacktest) {
                onBacktestSelected(selectedBacktest);
              }
              handleBacktestMenuClose();
            }}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>
            <MenuItem onClick={() => {
              handleDuplicateBacktest();
            }}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              Duplicate
            </MenuItem>
            <MenuItem onClick={() => {
              setDeleteDialogOpen(true);
            }} sx={{ color: theme.palette.error.main }}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
          
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Delete Backtest</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this backtest? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDeleteBacktest} color="error">Delete</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
    </Box>
  );
};

// Add missing Checkbox component import
import { Checkbox } from '@mui/material';

export default BacktestHistoryPanel;