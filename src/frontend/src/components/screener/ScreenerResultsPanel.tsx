import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { ScreenerResult } from '../../services/screenerService';

interface ScreenerResultsPanelProps {
  results: ScreenerResult[];
  loading: boolean;
  totalResults: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onExportResults: () => void;
}

const ScreenerResultsPanel: React.FC<ScreenerResultsPanelProps> = ({
  results,
  loading,
  totalResults,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sortBy,
  sortDirection,
  onSortChange,
  onExportResults,
}) => {
  const [favoriteSymbols, setFavoriteSymbols] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'symbol',
    'name',
    'price',
    'change',
    'changePercent',
    'marketCap',
    'volume',
    'pe',
    'sector',
  ]);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange(newPage + 1); // API uses 1-based indexing
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onLimitChange(parseInt(event.target.value, 10));
  };

  const handleRequestSort = (property: string) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    onSortChange(property, isAsc ? 'desc' : 'asc');
  };

  const toggleFavorite = (symbol: string) => {
    const newFavorites = new Set(favoriteSymbols);
    if (newFavorites.has(symbol)) {
      newFavorites.delete(symbol);
    } else {
      newFavorites.add(symbol);
    }
    setFavoriteSymbols(newFavorites);
  };

  const toggleExpandRow = (symbol: string) => {
    setExpandedSymbol(expandedSymbol === symbol ? null : symbol);
  };

  const handleColumnVisibilityChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setVisibleColumns(typeof value === 'string' ? value.split(',') : value);
  };

  const formatValue = (value: any, column: string): string => {
    if (value === null || value === undefined) return '-';

    switch (column) {
      case 'price':
        return `$${value.toFixed(2)}`;
      case 'change':
        return value > 0 ? `+$${value.toFixed(2)}` : `$${value.toFixed(2)}`;
      case 'changePercent':
        return value > 0 ? `+${value.toFixed(2)}%` : `${value.toFixed(2)}%`;
      case 'marketCap':
        return formatMarketCap(value);
      case 'volume':
      case 'avgVolume':
        return formatVolume(value);
      case 'pe':
      case 'eps':
      case 'beta':
        return value.toFixed(2);
      case 'dividendYield':
        return `${value.toFixed(2)}%`;
      default:
        return value.toString();
    }
  };

  const formatMarketCap = (value: number): string => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatVolume = (value: number): string => {
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    } else {
      return value.toString();
    }
  };

  const getColumnLabel = (column: string): string => {
    const columnLabels: Record<string, string> = {
      symbol: 'Symbol',
      name: 'Name',
      price: 'Price',
      change: 'Change',
      changePercent: 'Change %',
      marketCap: 'Market Cap',
      volume: 'Volume',
      avgVolume: 'Avg Volume',
      pe: 'P/E',
      eps: 'EPS',
      dividend: 'Dividend',
      dividendYield: 'Yield',
      beta: 'Beta',
      sector: 'Sector',
      industry: 'Industry',
    };

    return columnLabels[column] || column;
  };

  const allAvailableColumns = [
    'symbol',
    'name',
    'price',
    'change',
    'changePercent',
    'marketCap',
    'volume',
    'avgVolume',
    'pe',
    'eps',
    'dividend',
    'dividendYield',
    'beta',
    'sector',
    'industry',
  ];

  return (
    <Box>
      <Card>
        <CardHeader
          title={`Screening Results (${totalResults})`}
          subheader={loading ? 'Loading...' : `Showing ${results.length} of ${totalResults} results`}
          action={
            <Box display="flex" alignItems="center" gap={1}>
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Columns</InputLabel>
                <Select
                  multiple
                  value={visibleColumns}
                  onChange={handleColumnVisibilityChange}
                  label="Columns"
                  renderValue={(selected) => 'Columns'}
                >
                  {allAvailableColumns.map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box display="flex" alignItems="center" width="100%" justifyContent="space-between">
                        {getColumnLabel(column)}
                        {visibleColumns.includes(column) && <CheckIcon fontSize="small" />}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={onExportResults}
                disabled={results.length === 0 || loading}
              >
                Export
              </Button>
            </Box>
          }
        />
        <Divider />
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
            </Box>
          ) : results.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No results found. Try adjusting your screening criteria.
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell padding="checkbox" />
                      {visibleColumns.map((column) => (
                        <TableCell
                          key={column}
                          sortDirection={sortBy === column ? sortDirection : false}
                        >
                          <TableSortLabel
                            active={sortBy === column}
                            direction={sortBy === column ? sortDirection : 'asc'}
                            onClick={() => handleRequestSort(column)}
                          >
                            {getColumnLabel(column)}
                          </TableSortLabel>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((row) => (
                      <React.Fragment key={row.symbol}>
                        <TableRow
                          hover
                          onClick={() => toggleExpandRow(row.symbol)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(row.symbol);
                              }}
                            >
                              {favoriteSymbols.has(row.symbol) ? (
                                <StarIcon fontSize="small" color="primary" />
                              ) : (
                                <StarBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </TableCell>
                          <TableCell padding="checkbox">
                            <IconButton size="small">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          {visibleColumns.map((column) => (
                            <TableCell key={column}>
                              {column === 'changePercent' || column === 'change' ? (
                                <Box display="flex" alignItems="center">
                                  {row[column] > 0 ? (
                                    <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                  ) : row[column] < 0 ? (
                                    <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                                  ) : null}
                                  <Typography
                                    variant="body2"
                                    color={row[column] > 0 ? 'success.main' : row[column] < 0 ? 'error.main' : 'inherit'}
                                  >
                                    {formatValue(row[column], column)}
                                  </Typography>
                                </Box>
                              ) : (
                                formatValue(row[column], column)
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                        {expandedSymbol === row.symbol && (
                          <TableRow>
                            <TableCell colSpan={visibleColumns.length + 2}>
                              <Box p={2} bgcolor="background.default">
                                <Typography variant="subtitle1" gutterBottom>
                                  {row.name} ({row.symbol})
                                </Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Price Information
                                      </Typography>
                                      <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Price:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          ${row.price.toFixed(2)}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Change:</Typography>
                                        <Typography
                                          variant="body2"
                                          color={row.change > 0 ? 'success.main' : row.change < 0 ? 'error.main' : 'inherit'}
                                          fontWeight="bold"
                                        >
                                          {row.change > 0 ? '+' : ''}{row.change.toFixed(2)} ({row.changePercent.toFixed(2)}%)
                                        </Typography>
                                      </Box>
                                      <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Volume:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          {formatVolume(row.volume)}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2">Market Cap:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          {formatMarketCap(row.marketCap)}
                                        </Typography>
                                      </Box>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Fundamentals
                                      </Typography>
                                      <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">P/E Ratio:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          {row.pe ? row.pe.toFixed(2) : 'N/A'}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">EPS:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          ${row.eps ? row.eps.toFixed(2) : 'N/A'}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" justifyContent="space-between" mb={1}>
                                        <Typography variant="body2">Dividend:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          ${row.dividend ? row.dividend.toFixed(2) : 'N/A'}
                                        </Typography>
                                      </Box>
                                      <Box display="flex" justifyContent="space-between">
                                        <Typography variant="body2">Yield:</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                          {row.dividendYield ? `${row.dividendYield.toFixed(2)}%` : 'N/A'}
                                        </Typography>
                                      </Box>
                                    </Paper>
                                  </Grid>
                                </Grid>
                                <Box mt={2} display="flex" justifyContent="flex-end">
                                  <Button variant="outlined" size="small">
                                    View Full Details
                                  </Button>
                                </Box>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={totalResults}
                rowsPerPage={limit}
                page={page - 1} // API uses 1-based indexing, MUI uses 0-based
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ScreenerResultsPanel;