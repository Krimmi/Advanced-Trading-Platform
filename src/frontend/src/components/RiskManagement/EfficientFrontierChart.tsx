import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceDot } from 'recharts';
import { EfficientFrontierPortfolio } from '../../api/riskManagementService';

interface EfficientFrontierChartProps {
  efficientFrontier: EfficientFrontierPortfolio[];
  currentPortfolio?: {
    return: number;
    volatility: number;
    sharpe_ratio: number;
  };
}

const EfficientFrontierChart: React.FC<EfficientFrontierChartProps> = ({ efficientFrontier, currentPortfolio }) => {
  const theme = useTheme();

  // Prepare data for visualization
  const chartData = efficientFrontier.map(portfolio => ({
    x: portfolio.volatility * 100, // Convert to percentage
    y: portfolio.return * 100, // Convert to percentage
    z: portfolio.sharpe_ratio,
    name: `Return: ${(portfolio.return * 100).toFixed(2)}%, Volatility: ${(portfolio.volatility * 100).toFixed(2)}%, Sharpe: ${portfolio.sharpe_ratio.toFixed(2)}`
  }));

  // Find min and max values for axes
  const minVolatility = Math.floor(Math.min(...chartData.map(d => d.x)));
  const maxVolatility = Math.ceil(Math.max(...chartData.map(d => d.x)));
  const minReturn = Math.floor(Math.min(...chartData.map(d => d.y)));
  const maxReturn = Math.ceil(Math.max(...chartData.map(d => d.y)));

  // Find maximum Sharpe ratio portfolio
  const maxSharpePortfolio = efficientFrontier.reduce(
    (max, portfolio) => (portfolio.sharpe_ratio > max.sharpe_ratio ? portfolio : max),
    efficientFrontier[0]
  );

  const maxSharpePoint = {
    x: maxSharpePortfolio.volatility * 100,
    y: maxSharpePortfolio.return * 100,
    z: maxSharpePortfolio.sharpe_ratio,
    name: 'Maximum Sharpe Ratio'
  };

  // Find minimum volatility portfolio
  const minVolPortfolio = efficientFrontier.reduce(
    (min, portfolio) => (portfolio.volatility < min.volatility ? portfolio : min),
    efficientFrontier[0]
  );

  const minVolPoint = {
    x: minVolPortfolio.volatility * 100,
    y: minVolPortfolio.return * 100,
    z: minVolPortfolio.sharpe_ratio,
    name: 'Minimum Volatility'
  };

  // Current portfolio point if provided
  const currentPoint = currentPortfolio ? {
    x: currentPortfolio.volatility * 100,
    y: currentPortfolio.return * 100,
    z: currentPortfolio.sharpe_ratio,
    name: 'Current Portfolio'
  } : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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

  return (
    <Box sx={{ width: '100%', height: 500 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Efficient Frontier
      </Typography>
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
            domain={[minVolatility, maxVolatility]}
            label={{ value: 'Volatility (%)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Return" 
            domain={[minReturn, maxReturn]}
            label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Sharpe Ratio" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
          <Legend />
          
          {/* Efficient frontier line */}
          <Scatter 
            name="Efficient Frontier" 
            data={chartData} 
            fill={theme.palette.primary.main} 
            line={{ stroke: theme.palette.primary.main, strokeWidth: 2 }}
            lineType="fitting"
          />
          
          {/* Maximum Sharpe ratio point */}
          <Scatter 
            name="Maximum Sharpe Ratio" 
            data={[maxSharpePoint]} 
            fill={theme.palette.success.main}
            shape="star"
            legendType="star"
          />
          
          {/* Minimum volatility point */}
          <Scatter 
            name="Minimum Volatility" 
            data={[minVolPoint]} 
            fill={theme.palette.info.main}
            shape="triangle"
            legendType="triangle"
          />
          
          {/* Current portfolio point if provided */}
          {currentPoint && (
            <Scatter 
              name="Current Portfolio" 
              data={[currentPoint]} 
              fill={theme.palette.error.main}
              shape="circle"
              legendType="circle"
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default EfficientFrontierChart;