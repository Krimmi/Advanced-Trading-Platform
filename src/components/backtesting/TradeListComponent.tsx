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
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { BacktestResult, Trade, TradeDirection, TradeStatus } from '../../types/backtesting';
import { BacktestingService } from '../../services';

interface TradeListComponentProps {
  backtestResult: BacktestResult | null;
  onTradeSelected?: (trade: Trade) => void;
}

type Order = 'asc' | 'desc';

interface HeadCell {
  id: keyof Trade | 'pnlPercentageFormatted';
  label: string;
  numeric: boolean;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'symbol', label: 'Symbol', numeric: false, sortable: true },
  { id: 'direction', label: 'Direction', numeric: false, sortable: true },
  { id: 'entryDate', label: 'Entry Date', numeric: false, sortable: true },
  { id: 'entryPrice', label: 'Entry Price', numeric: true, sortable: true },
  { id: 'exitDate', label: 'Exit Date', numeric: false, sortable: true },
  { id: 'exitPrice', label: 'Exit Price', numeric: true, sortable: true },
  { id: 'quantity', label: 'Quantity', numeric: true, sortable: true },
  { id: 'pnl', label: 'P&L', numeric: true, sortable: true },
  { id: 'pnlPercentageFormatted', label: 'P&L %', numeric: true, sortable: true },
  { id: 'status', label: 'Status', numeric: false, sortable: true },
];

const TradeListComponent: React.FC<TradeListComponentProps> = ({ 
  backtestResult,
  onTradeSelected
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<keyof Trade | 'pnlPercentageFormatted'>('entryDate');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  const backtestingService = new BacktestingService();
  
  useEffect(() => {
    if (backtestResult) {
      fetchTrades();
    }
  }, [backtestResult]);
  
  useEffect(() => {
    applyFilters();
  }, [trades, searchTerm, statusFilter, directionFilter, symbolFilter]);
  
  const fetchTrades = async () => {
    if (!backtestResult) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const tradesData = await backtestingService.getBacktestTrades(backtestResult.id);
      setTrades(tradesData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trades:', err);
      setError('Failed to load trades. Please try again later.');
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...trades];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.entrySignal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.exitSignal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trade => trade.status === statusFilter);
    }
    
    // Apply direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(trade => trade.direction === directionFilter);
    }
    
    // Apply symbol filter
    if (symbolFilter !== 'all') {
      filtered = filtered.filter(trade => trade.symbol === symbolFilter);
    }
    
    // Apply sorting
    filtered = stableSort(filtered, getComparator(order, orderBy));
    
    setFilteredTrades(filtered);
  };
  
  const handleRequestSort = (property: keyof Trade | 'pnlPercentageFormatted') => {
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
  
  const handleDirectionFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setDirectionFilter(event.target.value as string);
    setPage(0);
  };
  
  const handleSymbolFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSymbolFilter(event.target.value as string);
    setPage(0);
  };
  
  const handleTradeMenuOpen = (event: React.MouseEvent<HTMLElement>, trade: Trade) => {
    setAnchorEl(event.currentTarget);
    setSelectedTrade(trade);
  };
  
  const handleTradeMenuClose = () => {
    setAnchorEl(null);
    setSelectedTrade(null);
  };
  
  const handleTradeClick = (trade: Trade) => {
    if (onTradeSelected) {
      onTradeSelected(trade);
    }
  };
  
  const handleExportTrades = () => {
    if (!trades.length) return;
    
    const headers = headCells.map(cell => cell.label).join(',');
    const rows = trades.map(trade => {
      return [
        trade.symbol,
        trade.direction,
        formatDate(trade.entryDate),
        trade.entryPrice,
        trade.exitDate ? formatDate(trade.exitDate) : '',
        trade.exitPrice || '',
        trade.quantity,
        trade.pnl || '',
        trade.pnlPercentage ? `${trade.pnlPercentage.toFixed(2)}%` : '',
        trade.status
      ].join(',');
    }).join('\n');
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trades_${backtestResult?.id || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return '-';
    return `${value.toFixed(2)}%`;
  };
  
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getTradeStatusColor = (status: TradeStatus): string => {
    switch (status) {
      case TradeStatus.OPEN:
        return theme.palette.info.main;
      case TradeStatus.CLOSED:
        return theme.palette.success.main;
      case TradeStatus.CANCELLED:
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  const getTradeDirectionIcon = (direction: TradeDirection) => {
    return direction === TradeDirection.LONG ? 
      <TrendingUpIcon fontSize="small" color="success" /> : 
      <TrendingDownIcon fontSize="small" color="error" />;
  };
  
  const getPnLColor = (value: number | undefined): string => {
    if (value === undefined) return theme.palette.text.secondary;
    return value > 0 ? theme.palette.success.main : value < 0 ? theme.palette.error.main : theme.palette.text.secondary;
  };
  
  function descendingComparator<T>(a: T, b: T, orderBy: keyof T | 'pnlPercentageFormatted') {
    if (orderBy === 'pnlPercentageFormatted') {
      const aValue = (a as any).pnlPercentage || 0;
      const bValue = (b as any).pnlPercentage || 0;
      if (bValue < aValue) {
        return -1;
      }
      if (bValue > aValue) {
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
  
  function getComparator<Key extends keyof any>(
    order: Order,
    orderBy: Key,
  ): (a: { [key in Key]: number | string | undefined }, b: { [key in Key]: number | string | undefined }) => number {
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
  
  const getUniqueSymbols = (): string[] => {
    const symbols = trades.map(trade => trade.symbol);
    return ['all', ...Array.from(new Set(symbols))];
  };
  
  if (!backtestResult) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No backtest result selected</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please run a backtest or select a result to view trades.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Trade List
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredTrades.length} trades for backtest {backtestResult.configId}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportTrades}
              disabled={!trades.length}
            >
              Export CSV
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
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    placeholder="Search trades..."
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
                <Grid item xs={12} sm={8}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        label="Status"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value={TradeStatus.OPEN}>Open</MenuItem>
                        <MenuItem value={TradeStatus.CLOSED}>Closed</MenuItem>
                        <MenuItem value={TradeStatus.CANCELLED}>Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Direction</InputLabel>
                      <Select
                        value={directionFilter}
                        onChange={handleDirectionFilterChange}
                        label="Direction"
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value={TradeDirection.LONG}>Long</MenuItem>
                        <MenuItem value={TradeDirection.SHORT}>Short</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Symbol</InputLabel>
                      <Select
                        value={symbolFilter}
                        onChange={handleSymbolFilterChange}
                        label="Symbol"
                      >
                        {getUniqueSymbols().map((symbol) => (
                          <MenuItem key={symbol} value={symbol}>
                            {symbol === 'all' ? 'All Symbols' : symbol}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
            <Divider />
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
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
                  {filteredTrades
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((trade) => (
                      <TableRow
                        hover
                        key={trade.id}
                        onClick={() => handleTradeClick(trade)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTradeDirectionIcon(trade.direction)}
                            <Typography variant="body2" sx={{ ml: 0.5 }}>
                              {trade.direction}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(trade.entryDate)}</TableCell>
                        <TableCell align="right">{formatCurrency(trade.entryPrice)}</TableCell>
                        <TableCell>{trade.exitDate ? formatDate(trade.exitDate) : '-'}</TableCell>
                        <TableCell align="right">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</TableCell>
                        <TableCell align="right">{trade.quantity}</TableCell>
                        <TableCell align="right" sx={{ color: getPnLColor(trade.pnl) }}>
                          {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: getPnLColor(trade.pnlPercentage) }}>
                          {trade.pnlPercentage ? formatPercentage(trade.pnlPercentage) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trade.status}
                            size="small"
                            sx={{
                              backgroundColor: getTradeStatusColor(trade.status),
                              color: '#fff'
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTradeMenuOpen(e, trade);
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {filteredTrades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No trades found
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
              count={filteredTrades.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Card>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleTradeMenuClose}
          >
            <MenuItem onClick={() => {
              if (selectedTrade && onTradeSelected) {
                onTradeSelected(selectedTrade);
              }
              handleTradeMenuClose();
            }}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>
          </Menu>
        </Box>
      )}
    </Box>
  );
};

export default TradeListComponent;