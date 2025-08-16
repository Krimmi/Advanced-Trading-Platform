import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Label,
  Cell,
  Line,
  ComposedChart,
  Bar
} from 'recharts';
import correlationAnalysisService from '../../services/correlationAnalysisService';
import eventService from '../../services/eventService';
import financialAnalysisService from '../../services/financialAnalysisService';

interface EventFundamentalCorrelationProps {
  symbol: string;
}

interface CorrelationData {
  eventType: string;
  fundamentalMetric: string;
  correlationCoefficient: number;
  pValue: number;
  dataPoints: Array<{
    eventDate: string;
    eventId: string;
    eventValue: number;
    metricValue: number;
    metricDate: string;
  }>;
  regressionLine?: Array<{
    x: number;
    y: number;
  }>;
}

interface EventType {
  value: string;
  label: string;
  description: string;
}

interface FundamentalMetric {
  value: string;
  label: string;
  description: string;
  category: string;
}

// Event types with descriptions
const eventTypes: EventType[] = [
  { value: 'earnings', label: 'Earnings Announcements', description: 'Quarterly or annual earnings reports released by the company' },
  { value: 'dividend', label: 'Dividend Announcements', description: 'Declarations of dividend payments to shareholders' },
  { value: 'split', label: 'Stock Splits', description: 'Division of existing shares into multiple shares' },
  { value: 'merger_acquisition', label: 'Mergers & Acquisitions', description: 'Announcements of company mergers or acquisitions' },
  { value: 'executive_change', label: 'Executive Changes', description: 'Changes in key executive positions like CEO or CFO' },
  { value: 'product_launch', label: 'Product Launches', description: 'Announcements of new product releases' },
  { value: 'legal_regulatory', label: 'Legal & Regulatory Events', description: 'Legal proceedings or regulatory decisions affecting the company' },
  { value: 'analyst_rating', label: 'Analyst Rating Changes', description: 'Changes in analyst recommendations or price targets' }
];

// Fundamental metrics with descriptions
const fundamentalMetrics: FundamentalMetric[] = [
  // Financial Performance
  { value: 'revenue_growth', label: 'Revenue Growth', description: 'Year-over-year percentage change in revenue', category: 'financial' },
  { value: 'eps_growth', label: 'EPS Growth', description: 'Year-over-year percentage change in earnings per share', category: 'financial' },
  { value: 'net_profit_margin', label: 'Net Profit Margin', description: 'Net income divided by revenue', category: 'financial' },
  { value: 'gross_profit_margin', label: 'Gross Profit Margin', description: 'Gross profit divided by revenue', category: 'financial' },
  { value: 'operating_margin', label: 'Operating Margin', description: 'Operating income divided by revenue', category: 'financial' },
  
  // Valuation
  { value: 'pe_ratio', label: 'P/E Ratio', description: 'Price to earnings ratio', category: 'valuation' },
  { value: 'pb_ratio', label: 'P/B Ratio', description: 'Price to book ratio', category: 'valuation' },
  { value: 'ps_ratio', label: 'P/S Ratio', description: 'Price to sales ratio', category: 'valuation' },
  { value: 'ev_ebitda', label: 'EV/EBITDA', description: 'Enterprise value to EBITDA ratio', category: 'valuation' },
  
  // Liquidity & Solvency
  { value: 'current_ratio', label: 'Current Ratio', description: 'Current assets divided by current liabilities', category: 'liquidity' },
  { value: 'quick_ratio', label: 'Quick Ratio', description: 'Liquid assets divided by current liabilities', category: 'liquidity' },
  { value: 'debt_to_equity', label: 'Debt to Equity', description: 'Total debt divided by shareholders\' equity', category: 'liquidity' },
  { value: 'interest_coverage', label: 'Interest Coverage', description: 'EBIT divided by interest expense', category: 'liquidity' },
  
  // Returns
  { value: 'roe', label: 'Return on Equity', description: 'Net income divided by shareholders\' equity', category: 'returns' },
  { value: 'roa', label: 'Return on Assets', description: 'Net income divided by total assets', category: 'returns' },
  { value: 'roic', label: 'Return on Invested Capital', description: 'Net operating profit after tax divided by invested capital', category: 'returns' }
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const EventFundamentalCorrelation: React.FC<EventFundamentalCorrelationProps> = ({ symbol }) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('earnings');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue_growth');
  const [timeframe, setTimeframe] = useState<string>('1y');
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [topCorrelations, setTopCorrelations] = useState<any[]>([]);

  useEffect(() => {
    fetchTopCorrelations();
  }, [symbol]);

  useEffect(() => {
    if (selectedEventType && selectedMetric) {
      fetchCorrelationData();
    }
  }, [selectedEventType, selectedMetric, timeframe]);

  const fetchTopCorrelations = async () => {
    try {
      const data = await correlationAnalysisService.getTopEventFundamentalCorrelations(symbol);
      setTopCorrelations(data);
    } catch (err) {
      console.error('Error fetching top correlations:', err);
    }
  };

  const fetchCorrelationData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await correlationAnalysisService.getEventFundamentalCorrelation(
        symbol,
        selectedEventType,
        selectedMetric,
        timeframe
      );
      setCorrelationData(data);
    } catch (err) {
      console.error('Error fetching correlation data:', err);
      setError('Failed to fetch correlation data. Please try again later.');
      setCorrelationData(null);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationStrength = (coefficient: number): string => {
    const absCoef = Math.abs(coefficient);
    if (absCoef < 0.3) return 'Weak';
    if (absCoef < 0.7) return 'Moderate';
    return 'Strong';
  };

  const getCorrelationColor = (coefficient: number): string => {
    if (coefficient > 0.7) return '#4caf50'; // Strong positive - green
    if (coefficient > 0.3) return '#8bc34a'; // Moderate positive - light green
    if (coefficient > -0.3) return '#9e9e9e'; // Weak - gray
    if (coefficient > -0.7) return '#ff9800'; // Moderate negative - orange
    return '#f44336'; // Strong negative - red
  };

  const formatPValue = (pValue: number): string => {
    if (pValue < 0.001) return 'p < 0.001 (Highly Significant)';
    if (pValue < 0.01) return `p = ${pValue.toFixed(3)} (Very Significant)`;
    if (pValue < 0.05) return `p = ${pValue.toFixed(3)} (Significant)`;
    if (pValue < 0.1) return `p = ${pValue.toFixed(3)} (Marginally Significant)`;
    return `p = ${pValue.toFixed(3)} (Not Significant)`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 2, boxShadow: 3 }}>
          <Typography variant="subtitle2">Event Date: {formatDate(data.eventDate)}</Typography>
          <Typography variant="body2">
            Event ID: {data.eventId}
          </Typography>
          <Typography variant="body2">
            Event Value: {data.eventValue.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            {fundamentalMetrics.find(m => m.value === selectedMetric)?.label}: {data.metricValue.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            Metric Date: {formatDate(data.metricDate)}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Render top correlations table
  const renderTopCorrelationsTable = () => {
    if (!topCorrelations || topCorrelations.length === 0) {
      return (
        <Alert severity="info">No significant correlations found.</Alert>
      );
    }

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Event Type</TableCell>
              <TableCell>Fundamental Metric</TableCell>
              <TableCell align="right">Correlation</TableCell>
              <TableCell align="right">Significance</TableCell>
              <TableCell align="right">Strength</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {topCorrelations.map((correlation, index) => {
              const eventType = eventTypes.find(e => e.value === correlation.eventType);
              const metric = fundamentalMetrics.find(m => m.value === correlation.fundamentalMetric);
              const correlationColor = getCorrelationColor(correlation.correlationCoefficient);
              
              return (
                <TableRow 
                  key={index}
                  hover
                  onClick={() => {
                    setSelectedEventType(correlation.eventType);
                    setSelectedMetric(correlation.fundamentalMetric);
                  }}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Tooltip title={eventType?.description || ''}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {eventType?.label || correlation.eventType}
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={metric?.description || ''}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {metric?.label || correlation.fundamentalMetric}
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ color: correlationColor, fontWeight: 'bold' }}
                  >
                    {correlation.correlationCoefficient.toFixed(3)}
                  </TableCell>
                  <TableCell align="right">
                    {correlation.pValue < 0.05 ? 'Significant' : 'Not Significant'}
                  </TableCell>
                  <TableCell align="right">
                    {getCorrelationStrength(correlation.correlationCoefficient)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render correlation scatter plot
  const renderCorrelationScatterPlot = () => {
    if (!correlationData || !correlationData.dataPoints || correlationData.dataPoints.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Typography variant="body1">
            No correlation data available for the selected parameters
          </Typography>
        </Box>
      );
    }

    const eventType = eventTypes.find(e => e.value === selectedEventType);
    const metric = fundamentalMetrics.find(m => m.value === selectedMetric);
    
    // Transform data for scatter plot
    const scatterData = correlationData.dataPoints.map((point, index) => ({
      x: point.eventValue,
      y: point.metricValue,
      eventDate: point.eventDate,
      eventId: point.eventId,
      metricDate: point.metricDate
    }));

    return (
      <Box sx={{ height: '400px' }}>
        <Typography variant="h6" align="center" gutterBottom>
          {eventType?.label || selectedEventType} vs. {metric?.label || selectedMetric}
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart
            margin={{ top: 20, right: 30, bottom: 60, left: 30 }}
            data={scatterData}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name={eventType?.label || selectedEventType} 
              type="number"
            >
              <Label value={eventType?.label || selectedEventType} position="bottom" offset={20} />
            </XAxis>
            <YAxis 
              dataKey="y" 
              name={metric?.label || selectedMetric}
            >
              <Label 
                value={metric?.label || selectedMetric} 
                position="left" 
                angle={-90} 
                offset={-15} 
              />
            </YAxis>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter 
              name="Data Points" 
              data={scatterData} 
              fill={getCorrelationColor(correlationData.correlationCoefficient)}
            />
            {correlationData.regressionLine && (
              <Line 
                name="Regression Line" 
                data={correlationData.regressionLine} 
                type="linear" 
                dataKey="y" 
                stroke="#ff7300" 
                dot={false} 
                activeDot={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  // Render time series chart
  const renderTimeSeriesChart = () => {
    if (!correlationData || !correlationData.dataPoints || correlationData.dataPoints.length === 0) {
      return null;
    }

    const eventType = eventTypes.find(e => e.value === selectedEventType);
    const metric = fundamentalMetrics.find(m => m.value === selectedMetric);
    
    // Sort data points by date
    const sortedData = [...correlationData.dataPoints].sort(
      (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );
    
    // Transform data for time series chart
    const timeSeriesData = sortedData.map((point, index) => ({
      name: formatDate(point.eventDate),
      eventValue: point.eventValue,
      metricValue: point.metricValue,
      eventDate: point.eventDate,
      eventId: point.eventId,
      metricDate: point.metricDate
    }));

    return (
      <Box sx={{ height: '400px', mt: 4 }}>
        <Typography variant="h6" align="center" gutterBottom>
          Time Series: {eventType?.label || selectedEventType} and {metric?.label || selectedMetric}
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <ComposedChart
            margin={{ top: 20, right: 30, bottom: 60, left: 30 }}
            data={timeSeriesData}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              type="category"
            >
              <Label value="Date" position="bottom" offset={20} />
            </XAxis>
            <YAxis 
              yAxisId="left"
              orientation="left"
            >
              <Label 
                value={eventType?.label || selectedEventType} 
                position="left" 
                angle={-90} 
                offset={-15} 
              />
            </YAxis>
            <YAxis 
              yAxisId="right"
              orientation="right"
            >
              <Label 
                value={metric?.label || selectedMetric} 
                position="right" 
                angle={90} 
                offset={-15} 
              />
            </YAxis>
            <RechartsTooltip />
            <Legend />
            <Bar 
              name={eventType?.label || selectedEventType} 
              dataKey="eventValue" 
              fill={COLORS[0]}
              yAxisId="left"
            />
            <Line 
              name={metric?.label || selectedMetric} 
              type="monotone" 
              dataKey="metricValue" 
              stroke={COLORS[1]}
              yAxisId="right"
              dot={{ r: 5 }}
              activeDot={{ r: 8 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Event-Fundamental Correlation Analysis
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top Correlations for {symbol}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          The table below shows the strongest correlations between events and fundamental metrics for {symbol}.
          Click on any row to analyze that specific correlation in detail.
        </Typography>
        {renderTopCorrelationsTable()}
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Correlation Analysis
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="event-type-select-label">Event Type</InputLabel>
                  <Select
                    labelId="event-type-select-label"
                    id="event-type-select"
                    value={selectedEventType}
                    label="Event Type"
                    onChange={(e) => setSelectedEventType(e.target.value)}
                  >
                    {eventTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="metric-select-label">Fundamental Metric</InputLabel>
                  <Select
                    labelId="metric-select-label"
                    id="metric-select"
                    value={selectedMetric}
                    label="Fundamental Metric"
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    <MenuItem disabled>
                      <em>Financial Performance</em>
                    </MenuItem>
                    {fundamentalMetrics.filter(m => m.category === 'financial').map((metric) => (
                      <MenuItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </MenuItem>
                    ))}
                    <MenuItem disabled>
                      <em>Valuation</em>
                    </MenuItem>
                    {fundamentalMetrics.filter(m => m.category === 'valuation').map((metric) => (
                      <MenuItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </MenuItem>
                    ))}
                    <MenuItem disabled>
                      <em>Liquidity & Solvency</em>
                    </MenuItem>
                    {fundamentalMetrics.filter(m => m.category === 'liquidity').map((metric) => (
                      <MenuItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </MenuItem>
                    ))}
                    <MenuItem disabled>
                      <em>Returns</em>
                    </MenuItem>
                    {fundamentalMetrics.filter(m => m.category === 'returns').map((metric) => (
                      <MenuItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
                  <Select
                    labelId="timeframe-select-label"
                    id="timeframe-select"
                    value={timeframe}
                    label="Timeframe"
                    onChange={(e) => setTimeframe(e.target.value)}
                  >
                    <MenuItem value="1y">1 Year</MenuItem>
                    <MenuItem value="3y">3 Years</MenuItem>
                    <MenuItem value="5y">5 Years</MenuItem>
                    <MenuItem value="10y">10 Years</MenuItem>
                  </Select>
                </FormControl>
                
                {correlationData && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Correlation Statistics
                    </Typography>
                    <Typography variant="body2">
                      Correlation Coefficient: {correlationData.correlationCoefficient.toFixed(3)}
                    </Typography>
                    <Typography variant="body2">
                      Strength: {getCorrelationStrength(correlationData.correlationCoefficient)}
                    </Typography>
                    <Typography variant="body2">
                      Statistical Significance: {formatPValue(correlationData.pValue)}
                    </Typography>
                    <Typography variant="body2">
                      Data Points: {correlationData.dataPoints.length}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Interpretation
                    </Typography>
                    <Typography variant="body2">
                      {correlationData.correlationCoefficient > 0 
                        ? `There is a ${getCorrelationStrength(correlationData.correlationCoefficient).toLowerCase()} positive correlation between ${eventTypes.find(e => e.value === selectedEventType)?.label} and ${fundamentalMetrics.find(m => m.value === selectedMetric)?.label}.`
                        : `There is a ${getCorrelationStrength(correlationData.correlationCoefficient).toLowerCase()} negative correlation between ${eventTypes.find(e => e.value === selectedEventType)?.label} and ${fundamentalMetrics.find(m => m.value === selectedMetric)?.label}.`
                      }
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {correlationData.pValue < 0.05
                        ? 'This correlation is statistically significant, suggesting a real relationship between these variables.'
                        : 'This correlation is not statistically significant, suggesting the relationship may be due to chance.'
                      }
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <Box>
                  {renderCorrelationScatterPlot()}
                  {renderTimeSeriesChart()}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default EventFundamentalCorrelation;