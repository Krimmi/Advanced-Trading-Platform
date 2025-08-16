/**
 * Watchlist Widget
 * 
 * This widget displays a customizable watchlist of securities with
 * real-time price updates and key metrics.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { WidgetProps } from '../WidgetRegistry';

// Default settings for the widget
const DEFAULT_SETTINGS = {
  symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'],
  columns: ['price', 'change', 'changePercent', 'volume', 'marketCap'],
  sortBy: 'changePercent',
  sortDirection: 'desc',
  refreshInterval: 30 // seconds
};

// Available columns for display
const AVAILABLE_COLUMNS = [
  { id: 'price', name: 'Price' },
  { id: 'change', name: 'Change' },
  { id: 'changePercent', name: 'Change %' },
  { id: 'volume', name: 'Volume' },
  { id: 'marketCap', name: 'Market Cap' },
  { id: 'pe', name: 'P/E Ratio' },
  { id: 'dividend', name: 'Dividend' },
  { id: 'yield', name: 'Yield' },
  { id: '52wkHigh', name: '52wk High' },
  { id: '52wkLow', name: '52wk Low' }
];

// Sample watchlist data (in a real app, this would come from an API)
const SAMPLE_WATCHLIST_DATA = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 178.72,
    change: 1.25,
    changePercent: 0.70,
    volume: 52500000,
    marketCap: 2800000000000,
    pe: 29.5,
    dividend: 0.92,
    yield: 0.51,
    '52wkHigh': 198.23,
    '52wkLow': 124.17,
    isFavorite: true
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 338.11,
    change: 2.35,
    changePercent: 0.70,
    volume: 21300000,
    marketCap: 2500000000000,
    pe: 36.2,
    dividend: 2.72,
    yield: 0.80,
    '52wkHigh': 366.78,
    '52wkLow': 219.35,
    isFavorite: false
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    price: 137.14,
    change: -0.86,
    changePercent: -0.62,
    volume: 28700000,
    marketCap: 1700000000000,
    pe: 25.1,
    dividend: 0,
    yield: 0,
    '52wkHigh': 153.78,
    '52wkLow': 83.34,
    isFavorite: true
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 145.24,
    change: 0.98,
    changePercent: 0.68,
    volume: 35600000,
    marketCap: 1500000000000,
    pe: 112.8,
    dividend: 0,
    yield: 0,
    '52wkHigh': 149.26,
    '52wkLow': 81.43,
    isFavorite: false
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 215.49,
    change: -3.27,
    changePercent: -1.49,
    volume: 108900000,
    marketCap: 680000000000,
    pe: 55.3,
    dividend: 0,
    yield: 0,
    '52wkHigh': 299.29,
    '52wkLow': 101.81,
    isFavorite: true
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 312.81,
    change: 4.23,
    changePercent: 1.37,
    volume: 15700000,
    marketCap: 800000000000,
    pe: 27.4,
    dividend: 0,
    yield: 0,
    '52wkHigh': 326.20,
    '52wkLow': 88.09,
    isFavorite: false
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    price: 437.53,
    change: 9.87,
    changePercent: 2.31,
    volume: 42100000,
    marketCap: 1100000000000,
    pe: 104.2,
    dividend: 0.16,
    yield: 0.04,
    '52wkHigh': 502.66,
    '52wkLow': 108.13,
    isFavorite: true
  }
];

const WatchlistWidget: React.FC<WidgetProps> = ({
  id,
  settings,
  isEditing,
  onSettingsChange,
  loading,
  data
}) => {
  const theme = useTheme();
  const [newSymbol, setNewSymbol] = useState('');
  
  // Merge default settings with user settings
  const widgetSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // Use provided data or sample data
  const watchlistData = data || SAMPLE_WATCHLIST_DATA;
  
  // Filter data based on selected symbols
  const filteredData = watchlistData.filter(item => 
    widgetSettings.symbols.includes(item.symbol)
  );
  
  // Sort data based on settings
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[widgetSettings.sortBy as keyof typeof a];
    const bValue = b[widgetSettings.sortBy as keyof typeof b];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return widgetSettings.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return widgetSettings.sortDirection === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });
  
  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...widgetSettings,
        [key]: value
      });
    }
  };
  
  // Handle column toggle
  const handleColumnToggle = (columnId: string) => {
    const currentColumns = [...widgetSettings.columns];
    const index = currentColumns.indexOf(columnId);
    
    if (index === -1) {
      // Add column
      handleSettingChange('columns', [...currentColumns, columnId]);
    } else {
      // Remove column
      currentColumns.splice(index, 1);
      handleSettingChange('columns', currentColumns);
    }
  };
  
  // Handle add symbol
  const handleAddSymbol = () => {
    if (!newSymbol || widgetSettings.symbols.includes(newSymbol)) return;
    
    handleSettingChange('symbols', [...widgetSettings.symbols, newSymbol.toUpperCase()]);
    setNewSymbol('');
  };
  
  // Handle remove symbol
  const handleRemoveSymbol = (symbol: string) => {
    const updatedSymbols = widgetSettings.symbols.filter(s => s !== symbol);
    handleSettingChange('symbols', updatedSymbols);
  };
  
  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000000000) {
      return `$${(num / 1000000000000).toFixed(2)}T`;
    }
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };
  
  // Format volume
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000000) {
      return `${(volume / 1000000000).toFixed(2)}B`;
    }
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toString();
  };
  
  // If in editing mode, show settings
  if (isEditing) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Widget Settings
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Symbols
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {widgetSettings.symbols.map(symbol => (
              <Chip
                key={symbol}
                label={symbol}
                onDelete={() => handleRemoveSymbol(symbol)}
                size="small"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              label="Add Symbol"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              size="small"
              sx={{ mr: 1 }}
            />
            <IconButton onClick={handleAddSymbol} color="primary" size="small">
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Display Columns
          </Typography>
          <FormGroup>
            {AVAILABLE_COLUMNS.map(column => (
              <FormControlLabel
                key={column.id}
                control={
                  <Checkbox
                    checked={widgetSettings.columns.includes(column.id)}
                    onChange={() => handleColumnToggle(column.id)}
                    size="small"
                  />
                }
                label={column.name}
              />
            ))}
          </FormGroup>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Sort By
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Column</InputLabel>
            <Select
              value={widgetSettings.sortBy}
              label="Column"
              onChange={(e) => handleSettingChange('sortBy', e.target.value)}
            >
              {AVAILABLE_COLUMNS.map(column => (
                <MenuItem key={column.id} value={column.id}>
                  {column.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth size="small">
            <InputLabel>Direction</InputLabel>
            <Select
              value={widgetSettings.sortDirection}
              label="Direction"
              onChange={(e) => handleSettingChange('sortDirection', e.target.value)}
            >
              <MenuItem value="asc">Ascending</MenuItem>
              <MenuItem value="desc">Descending</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Box>
          <Typography variant="body2" gutterBottom>
            Refresh Interval
          </Typography>
          <TextField
            label="Seconds"
            type="number"
            value={widgetSettings.refreshInterval}
            onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
            fullWidth
            size="small"
            InputProps={{ inputProps: { min: 5, max: 300 } }}
          />
        </Box>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {loading ? (
        <LinearProgress />
      ) : (
        <TableContainer component={Paper} sx={{ height: '100%', boxShadow: 'none' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                {widgetSettings.columns.includes('price') && (
                  <TableCell align="right">Price</TableCell>
                )}
                {widgetSettings.columns.includes('change') && (
                  <TableCell align="right">Change</TableCell>
                )}
                {widgetSettings.columns.includes('changePercent') && (
                  <TableCell align="right">Change %</TableCell>
                )}
                {widgetSettings.columns.includes('volume') && (
                  <TableCell align="right">Volume</TableCell>
                )}
                {widgetSettings.columns.includes('marketCap') && (
                  <TableCell align="right">Market Cap</TableCell>
                )}
                {widgetSettings.columns.includes('pe') && (
                  <TableCell align="right">P/E</TableCell>
                )}
                {widgetSettings.columns.includes('dividend') && (
                  <TableCell align="right">Div</TableCell>
                )}
                {widgetSettings.columns.includes('yield') && (
                  <TableCell align="right">Yield</TableCell>
                )}
                {widgetSettings.columns.includes('52wkHigh') && (
                  <TableCell align="right">52wk High</TableCell>
                )}
                {widgetSettings.columns.includes('52wkLow') && (
                  <TableCell align="right">52wk Low</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow
                  key={item.symbol}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { bgcolor: theme.palette.action.hover }
                  }}
                >
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {item.isFavorite ? (
                        <StarIcon fontSize="small" sx={{ color: theme.palette.warning.main, mr: 0.5 }} />
                      ) : (
                        <StarBorderIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 0.5 }} />
                      )}
                      <Tooltip title={item.name}>
                        <Typography variant="body2" component="span">
                          {item.symbol}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  
                  {widgetSettings.columns.includes('price') && (
                    <TableCell align="right">
                      ${item.price.toFixed(2)}
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('change') && (
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: item.change > 0 
                          ? theme.palette.success.main 
                          : item.change < 0 
                          ? theme.palette.error.main 
                          : 'inherit'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {item.change > 0 ? (
                          <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                        ) : item.change < 0 ? (
                          <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                        ) : null}
                        {item.change > 0 ? '+' : ''}{item.change.toFixed(2)}
                      </Box>
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('changePercent') && (
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: item.changePercent > 0 
                          ? theme.palette.success.main 
                          : item.changePercent < 0 
                          ? theme.palette.error.main 
                          : 'inherit'
                      }}
                    >
                      {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('volume') && (
                    <TableCell align="right">
                      {formatVolume(item.volume)}
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('marketCap') && (
                    <TableCell align="right">
                      {formatNumber(item.marketCap)}
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('pe') && (
                    <TableCell align="right">
                      {item.pe.toFixed(1)}
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('dividend') && (
                    <TableCell align="right">
                      ${item.dividend.toFixed(2)}
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('yield') && (
                    <TableCell align="right">
                      {item.yield.toFixed(2)}%
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('52wkHigh') && (
                    <TableCell align="right">
                      ${item['52wkHigh'].toFixed(2)}
                    </TableCell>
                  )}
                  
                  {widgetSettings.columns.includes('52wkLow') && (
                    <TableCell align="right">
                      ${item['52wkLow'].toFixed(2)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={1 + widgetSettings.columns.length} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No symbols in watchlist
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default WatchlistWidget;