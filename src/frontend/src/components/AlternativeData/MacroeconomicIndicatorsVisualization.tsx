import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import alternativeDataService from '../../services/alternativeDataService';

interface MacroeconomicIndicatorsVisualizationProps {
  symbol: string;
}

const MacroeconomicIndicatorsVisualization: React.FC<MacroeconomicIndicatorsVisualizationProps> = ({ symbol }) => {
  const [macroData, setMacroData] = useState<any>({});
  const [correlation, setCorrelation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('90');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['gdp', 'unemployment', 'inflation', 'interest_rates', 'housing']);

  const availableIndicators = [
    { value: 'gdp', label: 'GDP Growth Rate' },
    { value: 'unemployment', label: 'Unemployment Rate' },
    { value: 'inflation', label: 'Inflation Rate (CPI)' },
    { value: 'interest_rates', label: 'Federal Funds Rate' },
    { value: 'housing', label: 'Housing Price Index' },
    { value: 'consumer_confidence', label: 'Consumer Confidence Index' },
    { value: 'retail_sales', label: 'Retail Sales Growth' },
    { value: 'industrial_production', label: 'Industrial Production Index' },
    { value: 'pmi', label: 'Purchasing Managers Index' },
    { value: 'trade_balance', label: 'Trade Balance' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeframe));

        // Format dates as YYYY-MM-DD
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Fetch macroeconomic indicators
        const macroResults = await alternativeDataService.getMacroIndicators(
          selectedIndicators,
          startDateStr,
          endDateStr
        );
        
        setMacroData(macroResults);

        // Fetch correlation data for the symbol and macro indicators
        const correlationResult = await alternativeDataService.getAlternativeDataCorrelation(
          symbol,
          'macro',
          parseInt(timeframe)
        );
        
        setCorrelation(correlationResult);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching macroeconomic data:', err);
        setError('Failed to load macroeconomic indicators. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, timeframe, selectedIndicators]);

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handleIndicatorChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedIndicators(typeof value === 'string' ? value.split(',') : value);
  };

  // Process correlation data for visualization
  const processCorrelationData = () => {
    if (!correlation) return [];
    
    // Combine price and alternative data with dates
    const combinedData = [];
    for (let i = 0; i < correlation.price_data.length; i++) {
      combinedData.push({
        date: correlation.price_data[i].date,
        price: correlation.price_data[i].value,
        indicator: correlation.alternative_data[i].value
      });
    }
    
    return combinedData;
  };

  const correlationData = processCorrelationData();

  // Process macro indicators for visualization
  const processIndicatorData = (indicator: string) => {
    if (!macroData || !macroData[indicator] || !macroData[indicator].data) return [];
    
    return macroData[indicator].data.map((item: any) => ({
      date: item.date,
      value: item.value,
      change: item.change
    }));
  };

  // Calculate correlation metrics for display
  const getCorrelationMetrics = () => {
    if (!correlation) return null;
    
    return {
      correlation: correlation.correlation.toFixed(2),
      lagDays: correlation.lag_days,
      significance: correlation.significance.toFixed(3),
      predictivePower: correlation.analysis.predictive_power.toFixed(2),
      confidenceInterval: [
        correlation.analysis.confidence_interval[0].toFixed(2),
        correlation.analysis.confidence_interval[1].toFixed(2)
      ]
    };
  };

  const correlationMetrics = getCorrelationMetrics();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={12}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-select-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="60">Last 60 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="180">Last 180 days</MenuItem>
                <MenuItem value="365">Last 365 days</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 300, maxWidth: 600 }}>
              <InputLabel id="indicators-select-label">Indicators</InputLabel>
              <Select
                labelId="indicators-select-label"
                id="indicators-select"
                multiple
                value={selectedIndicators}
                label="Indicators"
                onChange={handleIndicatorChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip 
                        key={value} 
                        label={availableIndicators.find(i => i.value === value)?.label || value} 
                        size="small" 
                      />
                    ))}
                  </Box>
                )}
              >
                {availableIndicators.map((indicator) => (
                  <MenuItem key={indicator.value} value={indicator.value}>
                    {indicator.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Correlation with Stock Price */}
        {correlation && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {symbol} Price vs. Macroeconomic Indicators
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">
                  Correlation: {correlationMetrics?.correlation} (Lag: {correlationMetrics?.lagDays} days)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Significance: {correlationMetrics?.significance} | Predictive Power: {correlationMetrics?.predictivePower}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confidence Interval: [{correlationMetrics?.confidenceInterval[0]}, {correlationMetrics?.confidenceInterval[1]}]
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={correlationData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="price" name={`${symbol} Price`} stroke="#8884d8" />
                  <Line yAxisId="right" type="monotone" dataKey="indicator" name="Macro Indicator" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Macroeconomic Indicators */}
        {selectedIndicators.map((indicator) => {
          const indicatorData = processIndicatorData(indicator);
          const indicatorInfo = macroData[indicator];
          
          if (!indicatorInfo) return null;
          
          return (
            <Grid item xs={12} md={6} key={indicator}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {indicatorInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Unit: {indicatorInfo.unit} | Frequency: {indicatorInfo.frequency}
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={indicatorData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name={indicatorInfo.name} stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          );
        })}

        {/* Correlation by Timeframe */}
        {correlation && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Correlation by Timeframe
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { timeframe: '7 days', correlation: correlation.analysis.correlation_by_timeframe['7d'] },
                    { timeframe: '30 days', correlation: correlation.analysis.correlation_by_timeframe['30d'] },
                    { timeframe: '90 days', correlation: correlation.analysis.correlation_by_timeframe['90d'] }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeframe" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correlation" name="Correlation" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Indicator Impact on Stock Price */}
        {correlation && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Indicator Impact on {symbol}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Impact Analysis:
                </Typography>
                <Typography variant="body2" paragraph>
                  {correlation.correlation > 0.5 ? 
                    `Strong positive correlation between macroeconomic indicators and ${symbol} price movements. The stock tends to move in the same direction as the broader economic indicators.` :
                    correlation.correlation < -0.5 ?
                    `Strong negative correlation between macroeconomic indicators and ${symbol} price movements. The stock tends to move in the opposite direction of the broader economic indicators.` :
                    correlation.correlation > 0.3 ?
                    `Moderate positive correlation between macroeconomic indicators and ${symbol} price movements.` :
                    correlation.correlation < -0.3 ?
                    `Moderate negative correlation between macroeconomic indicators and ${symbol} price movements.` :
                    `Weak correlation between macroeconomic indicators and ${symbol} price movements. The stock appears to be less influenced by the broader economic factors tracked.`
                  }
                </Typography>
                <Typography variant="body2" paragraph>
                  {correlation.lag_days > 0 ?
                    `There appears to be a ${correlation.lag_days}-day lag between changes in economic indicators and corresponding movements in ${symbol} stock price. This suggests the stock may be a lagging indicator of economic changes.` :
                    correlation.lag_days < 0 ?
                    `${symbol} price movements appear to precede changes in economic indicators by ${Math.abs(correlation.lag_days)} days, suggesting the stock may be a leading indicator of economic changes.` :
                    `${symbol} price movements appear to be synchronized with economic indicator changes with no significant lag.`
                  }
                </Typography>
                <Typography variant="body2">
                  Predictive power: {(correlation.analysis.predictive_power * 100).toFixed(1)}% - 
                  {correlation.analysis.predictive_power > 0.7 ? 
                    ` High predictive value. Economic indicators could be useful for forecasting ${symbol} price movements.` :
                    correlation.analysis.predictive_power > 0.4 ?
                    ` Moderate predictive value. Economic indicators may provide some insight for ${symbol} price movements.` :
                    ` Low predictive value. Economic indicators may not be reliable for forecasting ${symbol} price movements.`
                  }
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default MacroeconomicIndicatorsVisualization;