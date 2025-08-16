import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  ShowChart, 
  PieChart,
  Public,
  Grain
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import DataCard from '../../components/common/DataCard';
import StockChart from '../../components/common/StockChart';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';
import ValueChangeIndicator from '../../components/common/ValueChangeIndicator';

// Services
import { marketService } from '../../services';

// Redux actions
import { fetchMarketData } from '../../store/slices/marketSlice';

// Types
import { RootState } from '../../store';

// Tab Panel Component
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `market-tab-${index}`,
    'aria-controls': `market-tabpanel-${index}`,
  };
}

const MarketOverviewPage: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  
  // Additional state for forex, commodities, and crypto
  const [forex, setForex] = useState<any[]>([]);
  const [commodities, setCommodities] = useState<any[]>([]);
  const [crypto, setCrypto] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redux state
  const { 
    indexes, 
    sectors, 
    gainers, 
    losers, 
    active,
    loading: marketLoading, 
    error: marketError 
  } = useSelector((state: RootState) => state.market);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Fetch market data on component mount
  useEffect(() => {
    dispatch(fetchMarketData() as any);
    
    const fetchAdditionalData = async () => {
      try {
        setLoading(true);
        
        // Fetch forex data
        const forexData = await marketService.getForexData();
        setForex(forexData);
        
        // Fetch commodities data
        const commoditiesData = await marketService.getCommodities();
        setCommodities(commoditiesData);
        
        // Fetch crypto data
        const cryptoData = await marketService.getCrypto();
        setCrypto(cryptoData);
        
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch additional market data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdditionalData();
  }, [dispatch]);
  
  // Show loading state
  if ((loading && marketLoading) || marketLoading) {
    return <LoadingIndicator />;
  }
  
  // Show error state
  if ((error && marketError) || marketError) {
    return <ErrorDisplay message={error || marketError || 'Failed to load market data'} />;
  }
  
  return (
    <Box>
      <PageHeader 
        title="Market Overview" 
        subtitle="Comprehensive view of global markets"
        icon={<ShowChart />}
      />
      
      {/* Market Indexes */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom>Major Indexes</Typography>
        <Grid container spacing={2}>
          {indexes && indexes.map((index) => (
            <Grid item xs={12} sm={6} md={3} key={index.symbol}>
              <StatsCard
                title={index.name}
                value={index.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                change={index.change}
                changePercent={index.changePercent}
                icon={index.changePercent >= 0 ? <TrendingUp /> : <TrendingDown />}
                iconColor={index.changePercent >= 0 ? 'success.main' : 'error.main'}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Market Data Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="market data tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TrendingUp />} iconPosition="start" label="Gainers" {...a11yProps(0)} />
          <Tab icon={<TrendingDown />} iconPosition="start" label="Losers" {...a11yProps(1)} />
          <Tab icon={<ShowChart />} iconPosition="start" label="Most Active" {...a11yProps(2)} />
          <Tab icon={<PieChart />} iconPosition="start" label="Sectors" {...a11yProps(3)} />
          <Tab icon={<Public />} iconPosition="start" label="Forex" {...a11yProps(4)} />
          <Tab icon={<Grain />} iconPosition="start" label="Crypto" {...a11yProps(5)} />
        </Tabs>
        
        {/* Gainers Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Change</TableCell>
                  <TableCell align="right">% Change</TableCell>
                  <TableCell align="right">Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gainers && gainers.map((stock) => (
                  <TableRow key={stock.symbol} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1" fontWeight="medium">{stock.symbol}</Typography>
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell align="right">
                      {stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">
                        +{stock.change.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main">
                        +{stock.changePercent.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {(stock.volume / 1000000).toFixed(2)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Losers Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Change</TableCell>
                  <TableCell align="right">% Change</TableCell>
                  <TableCell align="right">Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {losers && losers.map((stock) => (
                  <TableRow key={stock.symbol} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1" fontWeight="medium">{stock.symbol}</Typography>
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell align="right">
                      {stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error.main">
                        {stock.change.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="error.main">
                        {stock.changePercent.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {(stock.volume / 1000000).toFixed(2)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Most Active Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Change</TableCell>
                  <TableCell align="right">% Change</TableCell>
                  <TableCell align="right">Volume</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {active && active.map((stock) => (
                  <TableRow key={stock.symbol} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1" fontWeight="medium">{stock.symbol}</Typography>
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell align="right">
                      {stock.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={stock.change >= 0 ? 'success.main' : 'error.main'}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={stock.changePercent >= 0 ? 'success.main' : 'error.main'}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {(stock.volume / 1000000).toFixed(2)}M
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Sectors Tab */}
        <TabPanel value={tabValue} index={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sector</TableCell>
                  <TableCell align="right">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sectors && sectors.map((sector) => (
                  <TableRow key={sector.sector} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1">{sector.sector}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={sector.performance >= 0 ? 'success.main' : 'error.main'}>
                        {sector.performance >= 0 ? '+' : ''}{(sector.performance * 100).toFixed(2)}%
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Forex Tab */}
        <TabPanel value={tabValue} index={4}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <ErrorDisplay message="Failed to load forex data" />
          ) : forex && forex.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Currency Pair</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="right">% Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {forex.map((pair) => (
                    <TableRow key={pair.ticker} hover>
                      <TableCell component="th" scope="row">
                        <Typography variant="body1" fontWeight="medium">{pair.ticker}</Typography>
                      </TableCell>
                      <TableCell align="right">{pair.bid}</TableCell>
                      <TableCell align="right">
                        <Typography color={pair.changes >= 0 ? 'success.main' : 'error.main'}>
                          {pair.changes >= 0 ? '+' : ''}{pair.changes.toFixed(4)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color={pair.changes >= 0 ? 'success.main' : 'error.main'}>
                          {pair.changes >= 0 ? '+' : ''}{(pair.changes / pair.bid * 100).toFixed(2)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <NoData message="No forex data available" />
          )}
        </TabPanel>
        
        {/* Crypto Tab */}
        <TabPanel value={tabValue} index={5}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <ErrorDisplay message="Failed to load crypto data" />
          ) : crypto && crypto.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell align="right">% Change</TableCell>
                    <TableCell align="right">Market Cap</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {crypto.map((coin) => (
                    <TableRow key={coin.symbol} hover>
                      <TableCell component="th" scope="row">
                        <Typography variant="body1" fontWeight="medium">{coin.symbol}</Typography>
                      </TableCell>
                      <TableCell>{coin.name}</TableCell>
                      <TableCell align="right">
                        {coin.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell align="right">
                        <Typography color={coin.change >= 0 ? 'success.main' : 'error.main'}>
                          {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color={coin.changesPercentage >= 0 ? 'success.main' : 'error.main'}>
                          {coin.changesPercentage >= 0 ? '+' : ''}{coin.changesPercentage.toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(coin.marketCap / 1000000000).toFixed(2)}B
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <NoData message="No crypto data available" />
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MarketOverviewPage;