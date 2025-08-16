import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';

// Import chart components (assuming we're using recharts)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Import types
import { MarketBreadthData } from '../../types/analytics';

interface MarketBreadthPanelProps {
  data: MarketBreadthData;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`breadth-tabpanel-${index}`}
      aria-labelledby={`breadth-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const MarketBreadthPanel: React.FC<MarketBreadthPanelProps> = ({ data }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [timeframe, setTimeframe] = useState('1d');
  const [marketIndex, setMarketIndex] = useState('SPX');
  
  // Colors for charts
  const colors = {
    advancing: theme.palette.success.main,
    declining: theme.palette.error.main,
    unchanged: theme.palette.grey[500],
    volume: theme.palette.primary.main,
    newHigh: theme.palette.success.light,
    newLow: theme.palette.error.light
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };
  
  const handleMarketIndexChange = (event: SelectChangeEvent) => {
    setMarketIndex(event.target.value);
  };
  
  // Helper function to determine trend icon
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUpIcon sx={{ color: 'success.main' }} />;
    if (value < 0) return <TrendingDownIcon sx={{ color: 'error.main' }} />;
    return <TrendingFlatIcon />;
  };
  
  // Helper function to format percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Render the summary cards
  const renderSummaryCards = () => {
    const { advanceDecline, marketStats } = data;
    const currentStats = marketStats.find(stat => stat.index === marketIndex) || marketStats[0];
    
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Advancing Issues
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {advanceDecline.advancing}
                </Typography>
                <Chip 
                  icon={<ArrowUpwardIcon />} 
                  label={formatPercent(advanceDecline.advancingPercent)} 
                  color="success" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Declining Issues
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {advanceDecline.declining}
                </Typography>
                <Chip 
                  icon={<ArrowDownwardIcon />} 
                  label={formatPercent(advanceDecline.decliningPercent)} 
                  color="error" 
                  size="small" 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                A/D Ratio
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {advanceDecline.advanceDeclineRatio.toFixed(2)}
                </Typography>
                {getTrendIcon(advanceDecline.advanceDeclineRatio - 1)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                {currentStats.index} Change
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5">
                  {currentStats.percentChange > 0 ? '+' : ''}
                  {formatPercent(currentStats.percentChange)}
                </Typography>
                {getTrendIcon(currentStats.percentChange)}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Render the advance-decline chart
  const renderAdvanceDeclineChart = () => {
    const { advanceDeclineHistory } = data;
    
    // Filter data based on selected timeframe
    const filteredData = advanceDeclineHistory.filter(item => {
      if (timeframe === '1d') return true; // Show all for 1 day
      if (timeframe === '5d') return advanceDeclineHistory.length - advanceDeclineHistory.indexOf(item) <= 5;
      if (timeframe === '1m') return advanceDeclineHistory.length - advanceDeclineHistory.indexOf(item) <= 20;
      if (timeframe === '3m') return advanceDeclineHistory.length - advanceDeclineHistory.indexOf(item) <= 60;
      if (timeframe === '1y') return advanceDeclineHistory.length - advanceDeclineHistory.indexOf(item) <= 252;
      return true;
    });
    
    return (
      <Box sx={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="advanceDeclineRatio" 
              name="A/D Ratio" 
              stroke={theme.palette.primary.main} 
              activeDot={{ r: 8 }} 
            />
            <Line 
              type="monotone" 
              dataKey="advanceDeclineSpread" 
              name="A/D Spread" 
              stroke={theme.palette.secondary.main} 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the market breadth indicators
  const renderBreadthIndicators = () => {
    const { breadthIndicators } = data;
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Indicator</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Change</TableCell>
              <TableCell align="right">Signal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {breadthIndicators.map((indicator) => (
              <TableRow key={indicator.name}>
                <TableCell component="th" scope="row">
                  {indicator.name}
                </TableCell>
                <TableCell align="right">{indicator.value.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {indicator.change > 0 ? '+' : ''}
                    {indicator.change.toFixed(2)}
                    {getTrendIcon(indicator.change)}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Chip 
                    label={indicator.signal} 
                    color={
                      indicator.signal === 'Bullish' ? 'success' : 
                      indicator.signal === 'Bearish' ? 'error' : 
                      'default'
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Render the new highs/lows chart
  const renderHighsLowsChart = () => {
    const { highsLows } = data;
    
    // Filter data based on selected timeframe
    const filteredData = highsLows.filter(item => {
      if (timeframe === '1d') return true; // Show all for 1 day
      if (timeframe === '5d') return highsLows.length - highsLows.indexOf(item) <= 5;
      if (timeframe === '1m') return highsLows.length - highsLows.indexOf(item) <= 20;
      if (timeframe === '3m') return highsLows.length - highsLows.indexOf(item) <= 60;
      if (timeframe === '1y') return highsLows.length - highsLows.indexOf(item) <= 252;
      return true;
    });
    
    return (
      <Box sx={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="newHighs" name="New Highs" fill={colors.newHigh} />
            <Bar dataKey="newLows" name="New Lows" fill={colors.newLow} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the sector performance
  const renderSectorPerformance = () => {
    const { sectorPerformance } = data;
    
    // Sort sectors by performance
    const sortedSectors = [...sectorPerformance].sort((a, b) => b.performance - a.performance);
    
    return (
      <Box>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Sector</TableCell>
                <TableCell align="right">Performance</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">Breadth</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedSectors.map((sector) => (
                <TableRow key={sector.name}>
                  <TableCell component="th" scope="row">
                    {sector.name}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {sector.performance > 0 ? '+' : ''}
                      {formatPercent(sector.performance)}
                      {getTrendIcon(sector.performance)}
                    </Box>
                  </TableCell>
                  <TableCell align="right">{(sector.volume / 1000000).toFixed(1)}M</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {sector.advanceDeclineRatio.toFixed(2)}
                      {getTrendIcon(sector.advanceDeclineRatio - 1)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ height: 300, width: '100%', mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedSectors}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={['dataMin', 'dataMax']} tickFormatter={(value) => `${(value * 100).toFixed(1)}%`} />
              <YAxis type="category" dataKey="name" />
              <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
              <Bar dataKey="performance" name="Performance">
                {sortedSectors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.performance >= 0 ? colors.advancing : colors.declining} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="market-index-label">Market Index</InputLabel>
              <Select
                labelId="market-index-label"
                id="market-index-select"
                value={marketIndex}
                label="Market Index"
                onChange={handleMarketIndexChange}
              >
                {data.marketStats.map((stat) => (
                  <MenuItem key={stat.index} value={stat.index}>{stat.index}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeframe-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="1d">1 Day</MenuItem>
                <MenuItem value="5d">5 Days</MenuItem>
                <MenuItem value="1m">1 Month</MenuItem>
                <MenuItem value="3m">3 Months</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      {renderSummaryCards()}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="market breadth tabs"
        >
          <Tab label="Advance/Decline" />
          <Tab label="Breadth Indicators" />
          <Tab label="New Highs/Lows" />
          <Tab label="Sector Performance" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', mt: 2 }}>
        <TabPanel value={activeTab} index={0}>
          {renderAdvanceDeclineChart()}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {renderBreadthIndicators()}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {renderHighsLowsChart()}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {renderSectorPerformance()}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default MarketBreadthPanel;