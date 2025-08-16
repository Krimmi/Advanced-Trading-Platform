import React from 'react';
import { Box, Typography, useTheme, Paper, Grid } from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Scatter, ScatterChart, ZAxis
} from 'recharts';

interface StrategyComparisonChartProps {
  comparison: any[];
}

const StrategyComparisonChart: React.FC<StrategyComparisonChartProps> = ({ comparison }) => {
  const theme = useTheme();

  // Strategy name mapping for better display
  const strategyNameMap: { [key: string]: string } = {
    'maximum_sharpe': 'Max Sharpe',
    'minimum_volatility': 'Min Volatility',
    'maximum_return': 'Max Return',
    'risk_parity': 'Risk Parity',
    'maximum_diversification': 'Max Diversification',
    'minimum_cvar': 'Min CVaR',
    'hierarchical_risk_parity': 'HRP',
    'equal_weight': 'Equal Weight',
    'inverse_volatility': 'Inv Volatility'
  };

  // Format data for bar chart
  const barChartData = comparison.map(strategy => ({
    name: strategyNameMap[strategy.method] || strategy.method,
    return: strategy.expected_return * 100, // Convert to percentage
    volatility: strategy.volatility * 100, // Convert to percentage
    sharpeRatio: strategy.sharpe_ratio,
    maxDrawdown: strategy.max_drawdown ? strategy.max_drawdown * 100 : 0, // Convert to percentage
    color: theme.palette.primary.main
  }));

  // Format data for radar chart - normalize values
  const getMaxValue = (key: string) => Math.max(...comparison.map(s => s[key]));
  const getMinValue = (key: string) => Math.min(...comparison.map(s => s[key]));

  const normalizeValue = (value: number, key: string) => {
    const min = getMinValue(key);
    const max = getMaxValue(key);
    return max === min ? 0.5 : (value - min) / (max - min);
  };

  const radarChartData = comparison.map(strategy => ({
    name: strategyNameMap[strategy.method] || strategy.method,
    return: normalizeValue(strategy.expected_return, 'expected_return'),
    risk: 1 - normalizeValue(strategy.volatility, 'volatility'), // Invert so higher is better
    sharpe: normalizeValue(strategy.sharpe_ratio, 'sharpe_ratio'),
    drawdown: strategy.max_drawdown ? 1 - normalizeValue(strategy.max_drawdown, 'max_drawdown') : 0.5, // Invert so higher is better
    diversification: strategy.diversification_ratio ? normalizeValue(strategy.diversification_ratio, 'diversification_ratio') : 0.5
  }));

  // Format data for risk-return scatter chart
  const scatterData = comparison.map(strategy => ({
    x: strategy.volatility * 100, // Volatility on x-axis (%)
    y: strategy.expected_return * 100, // Return on y-axis (%)
    z: strategy.sharpe_ratio, // Sharpe ratio determines point size
    name: strategyNameMap[strategy.method] || strategy.method
  }));

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
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}${entry.name.includes('return') || entry.name.includes('volatility') || entry.name.includes('drawdown') ? '%' : ''}`}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // Custom tooltip for scatter chart
  const ScatterTooltip = ({ active, payload }: any) => {
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
            <strong>{payload[0].payload.name}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Return: ${payload[0].payload.y.toFixed(2)}%`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Volatility: ${payload[0].payload.x.toFixed(2)}%`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Sharpe Ratio: ${payload[0].payload.z.toFixed(2)}`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // Generate colors for strategies
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Strategy Comparison
      </Typography>

      <Grid container spacing={3}>
        {/* Return and Volatility Bar Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Return and Risk Comparison
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
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
                    label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="return" name="Expected Return (%)" fill={theme.palette.success.main} />
                  <Bar dataKey="volatility" name="Volatility (%)" fill={theme.palette.error.main} />
                  <Bar dataKey="maxDrawdown" name="Max Drawdown (%)" fill={theme.palette.warning.main} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Sharpe Ratio Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Sharpe Ratio Comparison
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
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
                    label={{ value: 'Sharpe Ratio', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="sharpeRatio" name="Sharpe Ratio" fill={theme.palette.primary.main}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Risk-Return Scatter Plot */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Risk-Return Profile
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Volatility" 
                    label={{ value: 'Volatility (%)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Return" 
                    label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <ZAxis type="number" dataKey="z" range={[50, 400]} name="Sharpe Ratio" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
                  <Legend />
                  <Scatter 
                    name="Strategies" 
                    data={scatterData} 
                    fill={theme.palette.primary.main}
                  >
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Strategy Radar Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Strategy Performance Radar
            </Typography>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} />
                  {comparison.map((strategy, index) => (
                    <Radar
                      key={index}
                      name={strategyNameMap[strategy.method] || strategy.method}
                      dataKey={(val: any) => {
                        const stratName = strategyNameMap[strategy.method] || strategy.method;
                        return val.name === stratName ? 
                          {return: val.return, risk: val.risk, sharpe: val.sharpe, drawdown: val.drawdown, diversification: val.diversification} : 
                          {return: 0, risk: 0, sharpe: 0, drawdown: 0, diversification: 0};
                      }}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StrategyComparisonChart;