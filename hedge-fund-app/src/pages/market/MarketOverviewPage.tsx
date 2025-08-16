import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon
} from '@mui/icons-material';

// Components
import LoadingIndicator from '../../components/common/LoadingIndicator';
import DataTable from '../../components/common/DataTable';
import ChartContainer from '../../components/common/ChartContainer';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Store
import { RootState } from '../../store';
import { fetchMarketSummary, addToWatchlist, removeFromWatchlist, MarketMover } from '../../store/slices/marketSlice';

// Types
import { Column } from '../../components/common/DataTable';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`market-tabpanel-${index}`}
      aria-labelledby={`market-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MarketOverviewPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  
  // Redux state
  const { marketSummary, watchlists, loading, error } = useSelector((state: RootState) => state.market);
  const defaultWatchlist = watchlists['default'];
  
  // Load market data
  useEffect(() => {
    dispatch(fetchMarketSummary() as any);
  }, [dispatch]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchMarketSummary() as any);
  };
  
  // Handle watchlist toggle
  const handleWatchlistToggle = (symbol: string) => {
    if (defaultWatchlist.symbols.includes(symbol)) {
      dispatch(removeFromWatchlist({ watchlistId: 'default', symbol }) as any);
    } else {
      dispatch(addToWatchlist({ watchlistId: 'default', symbol }) as any);
    }
  };
  
  // Handle stock click
  const handleStockClick = (stock: MarketMover) => {
    navigate(`/market/${stock.symbol}`);
  };
  
  // Handle sector filter change
  const handleSectorFilterChange = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };
  
  // Filter sectors based on selected filters
  const filteredSectors = marketSummary?.sectors.filter(sector => 
    selectedSectors.length === 0 || selectedSectors.includes(sector.name)
  ) || [];
  
  // Filter stocks based on search term
  const filterStocks = (stocks: MarketMover[]) => {
    if (!searchTerm) return stocks;
    
    return stocks.filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Table columns
  const stockColumns: Column<MarketMover>[] = [
    {
      id: 'symbol',
      label: 'Symbol',
      width: '15%',
      format: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      width: '30%',
    },
    {
      id: 'price',
      label: 'Price',
      numeric: true,
      width: '15%',
      format: (value) => `$${value.toFixed(2)}`,
    },
    {
      id: 'change',
      label: 'Change',
      numeric: true,
      width: '15%',
      format: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {value > 0 ? (
            <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
          ) : (
            <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
          )}
          <Typography
            variant="body2"
            color={value > 0 ? 'success.main' : 'error.main'}
          >
            {value > 0 ? '+' : ''}{value.toFixed(2)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'changePercent',
      label: 'Change %',
      numeric: true,
      width: '15%',
      format: (value) => (
        <Typography
          variant="body2"
          color={value > 0 ? 'success.main' : 'error.main'}
        >
          {value > 0 ? '+' : ''}{value.toFixed(2)}%
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      disableSort: true,
      width: '10%',
      format: (_, row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleWatchlistToggle(row.symbol);
          }}
        >
          {defaultWatchlist.symbols.includes(row.symbol) ? (
            <StarIcon fontSize="small" color="primary" />
          ) : (
            <StarBorderIcon fontSize="small" />
          )}
        </IconButton>
      ),
    },
  ];
  
  // Render loading state
  if (loading && !marketSummary) {
    return <LoadingIndicator message="Loading market data..." />;
  }
  
  // Render error state
  if (error && !marketSummary) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading market data
        </Typography>
        <Typography color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Market Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {marketSummary ? (
              `Last updated: ${new Date(marketSummary.timestamp).toLocaleString()}`
            ) : (
              'Loading market data...'
            )}
          </Typography>
        </Box>
        
        <Button
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          variant="outlined"
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Market Indices */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {marketSummary?.indices.map((index) => (
          <Grid item xs={12} sm={6} md={3} key={index.symbol}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                height: '100%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight="medium">
                  {index.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {index.symbol}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {index.price.toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {index.change > 0 ? (
                  <>
                    <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                      +{index.change.toFixed(2)} (+{index.changePercent.toFixed(2)}%)
                    </Typography>
                  </>
                ) : (
                  <>
                    <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 'medium' }}>
                      {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                    </Typography>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Market Sectors */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Sector Performance
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {marketSummary?.sectors.map((sector) => (
            <Chip
              key={sector.id}
              label={`${sector.name} ${sector.performance > 0 ? '+' : ''}${sector.performance.toFixed(1)}%`}
              color={sector.performance > 0 ? 'success' : 'error'}
              variant={selectedSectors.includes(sector.name) ? 'filled' : 'outlined'}
              onClick={() => handleSectorFilterChange(sector.name)}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
        
        <ErrorBoundary>
          <ChartContainer
            title="Sector Performance"
            subtitle="Today's sector performance"
            height={300}
            onRefresh={handleRefresh}
          >
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                [Sector Performance Chart - Placeholder]
              </Typography>
            </Box>
          </ChartContainer>
        </ErrorBoundary>
      </Box>
      
      {/* Market Movers */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Market Movers
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="market movers tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Top Gainers" />
            <Tab label="Top Losers" />
            <Tab label="Most Active" />
            <Tab label="My Watchlist" />
          </Tabs>
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <TextField
            size="small"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<FilterListIcon />}
              variant="outlined"
            >
              Filter
            </Button>
            <Button
              size="small"
              startIcon={<SortIcon />}
              variant="outlined"
            >
              Sort
            </Button>
          </Box>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <DataTable
            columns={stockColumns}
            data={filterStocks(marketSummary?.topGainers || [])}
            onRowClick={handleStockClick}
            getRowId={(row) => row.symbol}
            emptyMessage="No gainers found"
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <DataTable
            columns={stockColumns}
            data={filterStocks(marketSummary?.topLosers || [])}
            onRowClick={handleStockClick}
            getRowId={(row) => row.symbol}
            emptyMessage="No losers found"
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <DataTable
            columns={stockColumns}
            data={filterStocks(marketSummary?.mostActive || [])}
            onRowClick={handleStockClick}
            getRowId={(row) => row.symbol}
            emptyMessage="No active stocks found"
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {defaultWatchlist.symbols.length > 0 ? (
            <DataTable
              columns={stockColumns}
              data={filterStocks(
                marketSummary?.mostActive
                  .filter(stock => defaultWatchlist.symbols.includes(stock.symbol)) || []
              )}
              onRowClick={handleStockClick}
              getRowId={(row) => row.symbol}
              emptyMessage="No stocks in watchlist match your search"
            />
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" paragraph>
                Your watchlist is empty. Add stocks by clicking the star icon.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Box>
      
      {/* Market News */}
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Market News
        </Typography>
        
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}
        >
          <Typography variant="body1" paragraph>
            Market news feed will be implemented in the next phase.
          </Typography>
          <Button variant="outlined">
            View Market News
          </Button>
        </Paper>
      </Box>
    </Box>
  );
};

export default MarketOverviewPage;