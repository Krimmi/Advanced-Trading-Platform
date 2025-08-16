import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { RiskMetrics } from '../../api/riskManagementService';

interface RiskMetricsChartProps {
  metrics: RiskMetrics;
}

const RiskMetricsChart: React.FC<RiskMetricsChartProps> = ({ metrics }) => {
  const theme = useTheme();

  // Prepare data for visualization
  const riskData = [
    {
      name: 'Expected Return',
      value: metrics.annualized_return * 100,
      color: theme.palette.success.main,
      description: 'Annualized expected return (%)'
    },
    {
      name: 'Volatility',
      value: metrics.annualized_volatility * 100,
      color: theme.palette.warning.main,
      description: 'Annualized volatility (%)'
    },
    {
      name: 'Max Drawdown',
      value: Math.abs(metrics.max_drawdown) * 100,
      color: theme.palette.error.main,
      description: 'Maximum historical drawdown (%)'
    },
    {
      name: 'VaR (95%)',
      value: metrics.var_95 * 100,
      color: theme.palette.info.main,
      description: 'Value at Risk at 95% confidence (%)'
    },
    {
      name: 'CVaR (95%)',
      value: metrics.cvar_95 * 100,
      color: theme.palette.secondary.main,
      description: 'Conditional VaR at 95% confidence (%)'
    }
  ];

  // Ratio data for separate chart
  const ratioData = [
    {
      name: 'Sharpe Ratio',
      value: metrics.sharpe_ratio,
      color: theme.palette.primary.main,
      description: 'Risk-adjusted return measure'
    },
    {
      name: 'Sortino Ratio',
      value: metrics.sortino_ratio,
      color: theme.palette.success.dark,
      description: 'Return per unit of downside risk'
    }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
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
            <strong>{data.name}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Value: ${data.value.toFixed(2)}${data.name.includes('%') ? '%' : ''}`}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {data.description}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Risk Metrics
      </Typography>
      
      {/* Risk metrics chart */}
      <Box sx={{ width: '100%', height: 300, mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Risk Measures (%)
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={riskData}
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
              label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} 
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="Value (%)" fill={theme.palette.primary.main}>
              {riskData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Ratio metrics chart */}
      <Box sx={{ width: '100%', height: 200 }}>
        <Typography variant="subtitle1" gutterBottom>
          Performance Ratios
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ratioData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="Ratio Value" fill={theme.palette.primary.main}>
              {ratioData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default RiskMetricsChart;