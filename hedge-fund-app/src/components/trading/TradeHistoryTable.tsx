import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

// Types
export interface Trade {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
  exchange?: string;
  conditions?: string[];
  isAggressorBuy?: boolean;
  isOutsideRegularHours?: boolean;
}

type SortField = 'price' | 'size' | 'timestamp';
type SortDirection = 'asc' | 'desc';

interface TradeHistoryTableProps {
  trades: Trade[];
  symbol: string;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string | null;
  height?: number | string;
  width?: number | string;
  maxRows?: number;
  showExchange?: boolean;
  showConditions?: boolean;
  onTradeClick?: (trade: Trade) => void;
}

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({
  trades,
  symbol,
  onRefresh,
  loading = false,
  error = null,
  height = 400,
  width = '100%',
  maxRows = 100,
  showExchange = true,
  showConditions = true,
  onTradeClick,
}) => {
  const theme = useTheme();
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>(trades);
  const [showBuysOnly, setShowBuysOnly] = useState<boolean>(false);
  const [showSellsOnly, setShowSellsOnly] = useState<boolean>(false);
  const [timeFormat, setTimeFormat] = useState<'relative' | 'absolute'>('relative');

  // Apply sorting and filtering
  useEffect(() => {
    let result = [...trades];
    
    // Apply filters
    if (showBuysOnly) {
      result = result.filter(trade => trade.side === 'buy');
    } else if (showSellsOnly) {
      result = result.filter(trade => trade.side === 'sell');
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Limit to max rows
    result = result.slice(0, maxRows);
    
    setFilteredTrades(result);
  }, [trades, sortField, sortDirection, showBuysOnly, showSellsOnly, maxRows]);

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortDirection(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Handle filter toggles
  const handleBuysOnlyToggle = () => {
    setShowBuysOnly(!showBuysOnly);
    setShowSellsOnly(false);
  };

  const handleSellsOnlyToggle = () => {
    setShowSellsOnly(!showSellsOnly);
    setShowBuysOnly(false);
  };

  // Handle time format change
  const handleTimeFormatChange = (
    event: React.MouseEvent<HTMLElement>,
    newFormat: 'relative' | 'absolute',
  ) => {
    if (newFormat !== null) {
      setTimeFormat(newFormat);
    }
  };

  // Format price with appropriate precision
  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  // Format size with appropriate precision
  const formatSize = (size: number): string => {
    if (size >= 1000000) {
      return (size / 1000000).toFixed(2) + 'M';
    } else if (size >= 1000) {
      return (size / 1000).toFixed(2) + 'K';
    } else {
      return size.toFixed(2);
    }
  };

  // Format timestamp based on selected format
  const formatTimestamp = (timestamp: number): string => {
    if (timeFormat === 'absolute') {
      return new Date(timestamp).toLocaleTimeString();
    } else {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      
      if (seconds < 60) {
        return `${seconds}s ago`;
      } else if (seconds < 3600) {
        return `${Math.floor(seconds / 60)}m ago`;
      } else if (seconds < 86400) {
        return `${Math.floor(seconds / 3600)}h ago`;
      } else {
        return `${Math.floor(seconds / 86400)}d ago`;
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height,
        width,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3">
            Trade History
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={onRefresh} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Filter">
              <IconButton size="small">
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {symbol} • {filteredTrades.length} trades
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<TrendingUpIcon />}
                label="Buys"
                size="small"
                color={showBuysOnly ? 'success' : 'default'}
                variant={showBuysOnly ? 'filled' : 'outlined'}
                onClick={handleBuysOnlyToggle}
              />
              <Chip
                icon={<TrendingDownIcon />}
                label="Sells"
                size="small"
                color={showSellsOnly ? 'error' : 'default'}
                variant={showSellsOnly ? 'filled' : 'outlined'}
                onClick={handleSellsOnlyToggle}
              />
            </Box>
            
            <ToggleButtonGroup
              size="small"
              value={timeFormat}
              exclusive
              onChange={handleTimeFormatChange}
              aria-label="time format"
            >
              <ToggleButton value="relative" aria-label="relative time">
                Relative
              </ToggleButton>
              <ToggleButton value="absolute" aria-label="absolute time">
                Absolute
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      {/* Table Content */}
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        {error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'timestamp'}
                    direction={sortField === 'timestamp' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('timestamp')}
                  >
                    Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'price'}
                    direction={sortField === 'price' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('price')}
                  >
                    Price
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'size'}
                    direction={sortField === 'size' ? sortDirection : 'asc'}
                    onClick={() => handleSortChange('size')}
                  >
                    Size
                  </TableSortLabel>
                </TableCell>
                {showExchange && (
                  <TableCell>Exchange</TableCell>
                )}
                {showConditions && (
                  <TableCell>Conditions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTrades.map((trade) => (
                <TableRow
                  key={trade.id}
                  hover
                  onClick={() => onTradeClick && onTradeClick(trade)}
                  sx={{
                    cursor: onTradeClick ? 'pointer' : 'default',
                    backgroundColor: trade.isOutsideRegularHours
                      ? alpha(theme.palette.info.light, 0.05)
                      : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(trade.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {trade.side === 'buy' ? (
                        <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.error.main, mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: trade.side === 'buy'
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          fontWeight: 'medium',
                        }}
                      >
                        {formatPrice(trade.price)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatSize(trade.size)}
                    </Typography>
                  </TableCell>
                  {showExchange && (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {trade.exchange || '-'}
                      </Typography>
                    </TableCell>
                  )}
                  {showConditions && (
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {trade.conditions && trade.conditions.length > 0 ? (
                          trade.conditions.map((condition, index) => (
                            <Chip
                              key={index}
                              label={condition}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Footer */}
      <Box
        sx={{
          p: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Showing {filteredTrades.length} of {trades.length} trades
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default TradeHistoryTable;