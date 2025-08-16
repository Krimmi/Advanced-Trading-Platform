import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Divider, 
  Tab, 
  Tabs,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  Timeline, 
  Notifications, 
  Article 
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import DataCard from '../../components/common/DataCard';
import StockChart from '../../components/common/StockChart';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';

// Services
import { marketService, mlService } from '../../services';

// Redux actions
import { fetchMarketData } from '../../store/slices/marketSlice';
import { RootState } from '../../store';

// Dashboard tabs
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
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
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketRegime, setMarketRegime] = useState<any>(null);
  const [topGainers, setTopGainers] = useState<any[]>([]);
  const [topLosers, setTopLosers] = useState<any[]>([]);
  const [mostActive, setMostActive] = useState<any[]>([]);
  const [sectorPerformance, setSectorPerformance] = useState<any[]>([]);
  
  // Get market data from Redux store
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
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch market data through Redux
        dispatch(fetchMarketData() as any);
        
        // Fetch market regime prediction
        const regimeData = await mlService.getMarketRegimePrediction();
        setMarketRegime(regimeData);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Update local state when Redux data changes
  useEffect(() => {
    if (gainers) setTopGainers(gainers.slice(0, 5));
    if (losers) setTopLosers(losers.slice(0, 5));
    if (active) setMostActive(active.slice(0, 5));
    if (sectors) setSectorPerformance(sectors);
  }, [gainers, losers, active, sectors]);

  // Show loading state
  if (loading || marketLoading) {
    return <LoadingIndicator />;
  }

  // Show error state
  if (error || marketError) {
    return <ErrorDisplay message={error || marketError || 'Failed to load dashboard'} />;
  }

  return (
    <Box>
      <PageHeader 
        title="Market Dashboard" 
        subtitle="Real-time market overview and insights"
        icon={<Timeline />}
      />
      
      {/* Market Indexes */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {indexes && indexes.slice(0, 4).map((index) => (
          <Grid item xs={12} sm={6} md={3} key={index.symbol}>
            <StatsCard
              title={index.name}
              value={`$${index.price.toLocaleString()}`}
              change={index.change}
              changePercent={index.changePercent}
              subtitle={`Last updated: ${new Date().toLocaleString()}`}
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Market Regime Prediction */}
      {marketRegime && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Market Regime Prediction
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">Current Regime:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {marketRegime.currentRegime}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">Predicted Next Regime:</Typography>
              <Typography variant="body1" fontWeight="bold">
                {marketRegime.nextRegime} 
                <Typography component="span" color="text.secondary">
                  ({Math.round(marketRegime.confidence * 100)}% confidence)
                </Typography>
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1">Implications:</Typography>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                {marketRegime.implications.slice(0, 2).map((item: string, index: number) => (
                  <li key={index}>
                    <Typography variant="body2">{item}</Typography>
                  </li>
                ))}
              </ul>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Market Data Tabs */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="market data tabs"
            variant="fullWidth"
          >
            <Tab 
              icon={<TrendingUp />} 
              iconPosition="start" 
              label="Top Gainers" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<TrendingDown />} 
              iconPosition="start" 
              label="Top Losers" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<Timeline />} 
              iconPosition="start" 
              label="Most Active" 
              {...a11yProps(2)} 
            />
            <Tab 
              icon={<Article />} 
              iconPosition="start" 
              label="Sector Performance" 
              {...a11yProps(3)} 
            />
          </Tabs>
        </Box>
        
        {/* Top Gainers */}
        <TabPanel value={tabValue} index={0}>
          {topGainers.length > 0 ? (
            <Grid container spacing={3}>
              {topGainers.map((stock) => (
                <Grid item xs={12} sm={6} md={4} key={stock.symbol}>
                  <DataCard
                    title={stock.symbol}
                    subtitle={stock.name}
                    value={`$${stock.price.toFixed(2)}`}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    additionalInfo={`Vol: ${(stock.volume / 1000000).toFixed(1)}M`}
                    link={`/stock/${stock.symbol}`}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <NoData message="No gainers data available" />
          )}
        </TabPanel>
        
        {/* Top Losers */}
        <TabPanel value={tabValue} index={1}>
          {topLosers.length > 0 ? (
            <Grid container spacing={3}>
              {topLosers.map((stock) => (
                <Grid item xs={12} sm={6} md={4} key={stock.symbol}>
                  <DataCard
                    title={stock.symbol}
                    subtitle={stock.name}
                    value={`$${stock.price.toFixed(2)}`}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    additionalInfo={`Vol: ${(stock.volume / 1000000).toFixed(1)}M`}
                    link={`/stock/${stock.symbol}`}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <NoData message="No losers data available" />
          )}
        </TabPanel>
        
        {/* Most Active */}
        <TabPanel value={tabValue} index={2}>
          {mostActive.length > 0 ? (
            <Grid container spacing={3}>
              {mostActive.map((stock) => (
                <Grid item xs={12} sm={6} md={4} key={stock.symbol}>
                  <DataCard
                    title={stock.symbol}
                    subtitle={stock.name}
                    value={`$${stock.price.toFixed(2)}`}
                    change={stock.change}
                    changePercent={stock.changePercent}
                    additionalInfo={`Vol: ${(stock.volume / 1000000).toFixed(1)}M`}
                    link={`/stock/${stock.symbol}`}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <NoData message="No active stocks data available" />
          )}
        </TabPanel>
        
        {/* Sector Performance */}
        <TabPanel value={tabValue} index={3}>
          {sectorPerformance.length > 0 ? (
            <Grid container spacing={3}>
              {sectorPerformance.map((sector) => (
                <Grid item xs={12} sm={6} md={4} key={sector.sector}>
                  <DataCard
                    title={sector.sector}
                    value=""
                    change={0}
                    changePercent={sector.performance * 100}
                    additionalInfo={`${sector.performance > 0 ? '+' : ''}${(sector.performance * 100).toFixed(2)}%`}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <NoData message="No sector performance data available" />
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default DashboardPage;