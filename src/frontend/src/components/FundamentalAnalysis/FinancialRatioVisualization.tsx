import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface FinancialRatioVisualizationProps {
  symbol: string;
  financialRatios: {
    quarterly: any[];
    annual: any[];
    latestQuarter: any;
    industryAverages: any;
  };
}

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
      id={`ratio-tabpanel-${index}`}
      aria-labelledby={`ratio-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Ratio descriptions for tooltips
const ratioDescriptions: Record<string, string> = {
  currentRatio: "Current assets divided by current liabilities. Measures a company's ability to pay short-term obligations.",
  quickRatio: "Current assets minus inventory, divided by current liabilities. A more stringent measure of liquidity.",
  cashRatio: "Cash and cash equivalents divided by current liabilities. Measures ability to cover short-term liabilities with cash.",
  grossProfitMargin: "Gross profit divided by revenue. Indicates the efficiency of using materials and labor in the production process.",
  operatingProfitMargin: "Operating income divided by revenue. Shows the proportion of revenue left after paying variable costs.",
  netProfitMargin: "Net income divided by revenue. Shows how much profit is generated from revenue.",
  returnOnAssets: "Net income divided by total assets. Measures how efficiently a company is using its assets to generate earnings.",
  returnOnEquity: "Net income divided by shareholders' equity. Measures a company's profitability by revealing how much profit it generates with the money shareholders have invested.",
  debtToEquity: "Total debt divided by shareholders' equity. Shows the proportion of equity and debt used to finance a company's assets.",
  interestCoverage: "Earnings before interest and taxes (EBIT) divided by interest expense. Measures a company's ability to pay interest on its debt.",
  assetTurnover: "Revenue divided by average total assets. Measures the efficiency of a company's use of its assets in generating sales revenue.",
  inventoryTurnover: "Cost of goods sold divided by average inventory. Measures how many times a company's inventory is sold and replaced over a period.",
  receivablesTurnover: "Net credit sales divided by average accounts receivable. Measures how efficiently a company is collecting revenue.",
  payablesTurnover: "Total supplier purchases divided by average accounts payable. Measures how quickly a company pays its suppliers.",
  priceToEarnings: "Share price divided by earnings per share. Indicates the dollar amount an investor can expect to invest in a company to receive one dollar of that company's earnings.",
  priceToBook: "Share price divided by book value per share. Compares a company's market value to its book value.",
  priceToSales: "Market capitalization divided by total sales. Indicates how much investors are willing to pay per dollar of sales.",
  enterpriseValueToEBITDA: "Enterprise value divided by EBITDA. Used to determine the value of a company.",
  dividendYield: "Annual dividends per share divided by price per share. Shows how much a company pays out in dividends each year relative to its share price.",
  payoutRatio: "Dividends per share divided by earnings per share. Shows the proportion of earnings paid out as dividends to shareholders."
};

// Group ratios by category
const ratioCategories = {
  liquidity: ['currentRatio', 'quickRatio', 'cashRatio'],
  profitability: ['grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin', 'returnOnAssets', 'returnOnEquity'],
  leverage: ['debtToEquity', 'interestCoverage'],
  efficiency: ['assetTurnover', 'inventoryTurnover', 'receivablesTurnover', 'payablesTurnover'],
  valuation: ['priceToEarnings', 'priceToBook', 'priceToSales', 'enterpriseValueToEBITDA'],
  dividend: ['dividendYield', 'payoutRatio']
};

// Format ratio names for display
const formatRatioName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
};

const FinancialRatioVisualization: React.FC<FinancialRatioVisualizationProps> = ({ symbol, financialRatios }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [timeframeTabValue, setTimeframeTabValue] = useState<number>(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleTimeframeTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTimeframeTabValue(newValue);
  };

  // Get trend direction for a ratio
  const getTrendDirection = (ratio: string, data: any[]): 'up' | 'down' | 'flat' => {
    if (data.length < 2) return 'flat';
    
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sortedData[0][ratio];
    const last = sortedData[sortedData.length - 1][ratio];
    
    // Calculate percentage change
    const change = ((last - first) / Math.abs(first)) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'flat';
  };

  // Get color based on ratio trend and whether higher is better
  const getTrendColor = (ratio: string, trend: 'up' | 'down' | 'flat'): string => {
    // Ratios where higher is generally better
    const higherIsBetter = [
      'currentRatio', 'quickRatio', 'cashRatio', 
      'grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin', 
      'returnOnAssets', 'returnOnEquity', 'interestCoverage',
      'assetTurnover', 'inventoryTurnover', 'receivablesTurnover'
    ];
    
    // Ratios where lower is generally better
    const lowerIsBetter = [
      'debtToEquity', 'payablesTurnover'
    ];
    
    // For valuation metrics, it depends on the context, but generally lower is better
    const valuationMetrics = [
      'priceToEarnings', 'priceToBook', 'priceToSales', 'enterpriseValueToEBITDA'
    ];
    
    if (trend === 'flat') return '#757575'; // Gray for flat trend
    
    if (higherIsBetter.includes(ratio)) {
      return trend === 'up' ? '#4caf50' : '#f44336'; // Green for up, red for down
    }
    
    if (lowerIsBetter.includes(ratio) || valuationMetrics.includes(ratio)) {
      return trend === 'down' ? '#4caf50' : '#f44336'; // Green for down, red for up
    }
    
    // Default case
    return trend === 'up' ? '#4caf50' : '#f44336';
  };

  // Get trend icon based on direction
  const getTrendIcon = (trend: 'up' | 'down' | 'flat', color: string) => {
    if (trend === 'up') return <TrendingUpIcon sx={{ color }} />;
    if (trend === 'down') return <TrendingDownIcon sx={{ color }} />;
    return <TrendingFlatIcon sx={{ color }} />;
  };

  // Prepare data for radar chart comparison with industry
  const prepareRadarData = (category: string) => {
    const ratios = ratioCategories[category as keyof typeof ratioCategories];
    const latestQuarter = financialRatios.latestQuarter;
    const industryAvg = financialRatios.industryAverages;
    
    return ratios.map(ratio => {
      // Normalize values for better visualization
      const companyValue = latestQuarter[ratio];
      const industryValue = industryAvg[ratio];
      
      // Skip if either value is missing
      if (companyValue === undefined || industryValue === undefined) {
        return {
          ratio: formatRatioName(ratio),
          company: 0,
          industry: 0
        };
      }
      
      return {
        ratio: formatRatioName(ratio),
        company: companyValue,
        industry: industryValue
      };
    });
  };

  // Prepare data for historical trend charts
  const prepareHistoricalData = (ratio: string) => {
    const data = timeframeTabValue === 0 
      ? financialRatios.quarterly.slice(-8) // Last 8 quarters
      : financialRatios.annual.slice(-5);   // Last 5 years
    
    return data.map(period => ({
      date: timeframeTabValue === 0 
        ? `Q${period.quarter} ${period.year}`
        : `${period.year}`,
      value: period[ratio]
    }));
  };

  // Render summary cards for a category
  const renderSummaryCards = (category: string) => {
    const ratios = ratioCategories[category as keyof typeof ratioCategories];
    const latestData = financialRatios.latestQuarter;
    const industryAvg = financialRatios.industryAverages;
    const historicalData = timeframeTabValue === 0 
      ? financialRatios.quarterly
      : financialRatios.annual;
    
    return (
      <Grid container spacing={2}>
        {ratios.map(ratio => {
          const trend = getTrendDirection(ratio, historicalData);
          const trendColor = getTrendColor(ratio, trend);
          const value = latestData[ratio];
          const industryValue = industryAvg[ratio];
          
          // Skip if value is undefined
          if (value === undefined) return null;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={ratio}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" component="div">
                      {formatRatioName(ratio)}
                    </Typography>
                    <Tooltip title={ratioDescriptions[ratio] || ''}>
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                    <Typography variant="h5" component="div" sx={{ mr: 1 }}>
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </Typography>
                    {getTrendIcon(trend, trendColor)}
                  </Box>
                  
                  {industryValue !== undefined && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Industry Average:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {typeof industryValue === 'number' ? industryValue.toFixed(2) : industryValue}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Difference:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="medium"
                          color={value > industryValue ? 'success.main' : 'error.main'}
                        >
                          {((value - industryValue) / industryValue * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  // Render radar chart for category comparison with industry
  const renderRadarChart = (category: string) => {
    const data = prepareRadarData(category);
    
    // Skip if no valid data
    if (data.every(item => item.company === 0 && item.industry === 0)) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No industry comparison data available
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: 400, mt: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Industry Comparison: {category.charAt(0).toUpperCase() + category.slice(1)} Ratios
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius={150} data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="ratio" />
            <PolarRadiusAxis />
            <Radar
              name={symbol}
              dataKey="company"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Radar
              name="Industry Average"
              dataKey="industry"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.6}
            />
            <Legend />
            <RechartsTooltip />
          </RadarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  // Render historical trend chart for a specific ratio
  const renderHistoricalChart = (ratio: string) => {
    const data = prepareHistoricalData(ratio);
    
    // Skip if no valid data
    if (data.length === 0 || data.every(item => item.value === undefined)) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No historical data available
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: 300, mt: 3 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Historical Trend: {formatRatioName(ratio)}
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={timeframeTabValue} onChange={handleTimeframeTabChange} aria-label="timeframe tabs">
          <Tab label="Quarterly" />
          <Tab label="Annual" />
        </Tabs>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ratio category tabs">
          <Tab label="Liquidity" />
          <Tab label="Profitability" />
          <Tab label="Leverage" />
          <Tab label="Efficiency" />
          <Tab label="Valuation" />
          <Tab label="Dividend" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderSummaryCards('liquidity')}
        {renderRadarChart('liquidity')}
        {renderHistoricalChart('currentRatio')}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderSummaryCards('profitability')}
        {renderRadarChart('profitability')}
        {renderHistoricalChart('netProfitMargin')}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderSummaryCards('leverage')}
        {renderRadarChart('leverage')}
        {renderHistoricalChart('debtToEquity')}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderSummaryCards('efficiency')}
        {renderRadarChart('efficiency')}
        {renderHistoricalChart('assetTurnover')}
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        {renderSummaryCards('valuation')}
        {renderRadarChart('valuation')}
        {renderHistoricalChart('priceToEarnings')}
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        {renderSummaryCards('dividend')}
        {renderRadarChart('dividend')}
        {renderHistoricalChart('dividendYield')}
      </TabPanel>
    </Box>
  );
};

export default FinancialRatioVisualization;