import React from 'react';
import { Box, Typography, useTheme, Paper, Grid } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  LineChart, Line, ReferenceLine
} from 'recharts';

interface StressTestChartProps {
  stressTestResults: any;
}

const StressTestChart: React.FC<StressTestChartProps> = ({ stressTestResults }) => {
  const theme = useTheme();

  // Process historical scenarios data if available
  const historicalData = stressTestResults?.historical_scenarios?.map((scenario: any) => ({
    name: scenario.scenario,
    return: scenario.return * 100, // Convert to percentage
    volatility: scenario.volatility * 100, // Convert to percentage
    maxDrawdown: scenario.max_drawdown * 100, // Convert to percentage
    color: scenario.return > 0 ? theme.palette.success.main : theme.palette.error.main
  })) || [];

  // Process custom scenarios data if available
  const customData = stressTestResults?.custom_scenarios?.map((scenario: any) => ({
    name: scenario.scenario,
    impact: scenario.portfolio_impact * 100, // Convert to percentage
    finalValue: scenario.final_portfolio_value,
    color: scenario.portfolio_impact > 0 ? theme.palette.success.main : theme.palette.error.main
  })) || [];

  // Process Monte Carlo data if available
  const monteCarloData = stressTestResults?.monte_carlo ? [
    { name: 'Mean', value: stressTestResults.monte_carlo.mean_final_value },
    { name: 'Median', value: stressTestResults.monte_carlo.median_final_value },
    { name: 'Min', value: stressTestResults.monte_carlo.min_final_value },
    { name: 'Max', value: stressTestResults.monte_carlo.max_final_value },
    { name: '5th Percentile', value: stressTestResults.monte_carlo.percentile_5 || 0 },
    { name: '95th Percentile', value: stressTestResults.monte_carlo.percentile_95 || 0 }
  ] : [];

  // Process percentile data for distribution chart
  const percentileData = stressTestResults?.monte_carlo ? [
    { name: '1%', value: stressTestResults.monte_carlo.percentile_1 || 0 },
    { name: '5%', value: stressTestResults.monte_carlo.percentile_5 || 0 },
    { name: '10%', value: stressTestResults.monte_carlo.percentile_10 || 0 },
    { name: '25%', value: stressTestResults.monte_carlo.percentile_25 || 0 },
    { name: '50%', value: stressTestResults.monte_carlo.percentile_50 || 0 },
    { name: '75%', value: stressTestResults.monte_carlo.percentile_75 || 0 },
    { name: '90%', value: stressTestResults.monte_carlo.percentile_90 || 0 },
    { name: '95%', value: stressTestResults.monte_carlo.percentile_95 || 0 },
    { name: '99%', value: stressTestResults.monte_carlo.percentile_99 || 0 }
  ] : [];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="textPrimary">
            <strong>{label || payload[0].payload.name}</strong>
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" color="textSecondary">
              {`${entry.name}: ${entry.value.toFixed(2)}${entry.name.includes('return') || entry.name.includes('impact') || entry.name.includes('drawdown') ? '%' : ''}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Stress Test Results
      </Typography>

      <Grid container spacing={3}>
        {/* Historical Scenarios Chart */}
        {historicalData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Historical Scenario Analysis
              </Typography>
              <Box sx={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={historicalData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 100,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis 
                      label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="return" name="Return (%)" fill={theme.palette.primary.main}>
                      {historicalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="maxDrawdown" name="Max Drawdown (%)" fill={theme.palette.error.main} />
                    <Bar dataKey="volatility" name="Volatility (%)" fill={theme.palette.warning.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Custom Scenarios Chart */}
        {customData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Custom Scenario Analysis
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={customData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      label={{ value: 'Impact (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#000" />
                    <Bar dataKey="impact" name="Portfolio Impact (%)" fill={theme.palette.primary.main}>
                      {customData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Monte Carlo Simulation Chart */}
        {monteCarloData.length > 0 && (
          <Grid item xs={12} md={customData.length > 0 ? 6 : 12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Monte Carlo Simulation Results
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monteCarloData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      domain={[
                        Math.min(0.8, Math.floor(monteCarloData[2]?.value * 10) / 10), // Min value
                        Math.max(1.2, Math.ceil(monteCarloData[3]?.value * 10) / 10)  // Max value
                      ]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine y={1} stroke="#000" strokeDasharray="3 3" label="Initial Value" />
                    <Bar dataKey="value" name="Portfolio Value" fill={theme.palette.primary.main}>
                      {monteCarloData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.value >= 1 ? theme.palette.success.main : theme.palette.error.main} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Percentile Distribution Chart */}
        {percentileData.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Monte Carlo Percentile Distribution
              </Typography>
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={percentileData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      domain={[
                        Math.min(0.8, Math.floor(percentileData[0]?.value * 10) / 10), // Min value
                        Math.max(1.2, Math.ceil(percentileData[percentileData.length - 1]?.value * 10) / 10)  // Max value
                      ]}
                      label={{ value: 'Portfolio Value', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine y={1} stroke="#000" strokeDasharray="3 3" label="Initial Value" />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Portfolio Value" 
                      stroke={theme.palette.primary.main} 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* No data message */}
        {!historicalData.length && !customData.length && !monteCarloData.length && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
              <Typography variant="body1" color="textSecondary">
                No stress test data available. Run stress tests to see results.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default StressTestChart;