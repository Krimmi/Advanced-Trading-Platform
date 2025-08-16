import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PortfolioWeights } from '../../api/riskManagementService';

interface PortfolioAllocationChartProps {
  weights: PortfolioWeights;
}

const PortfolioAllocationChart: React.FC<PortfolioAllocationChartProps> = ({ weights }) => {
  const theme = useTheme();

  // Convert weights to data format for pie chart
  const data = Object.entries(weights)
    .filter(([_, weight]) => weight > 0.001) // Filter out very small allocations
    .map(([symbol, weight]) => ({
      symbol,
      value: weight,
      percentage: (weight * 100).toFixed(2)
    }))
    .sort((a, b) => b.value - a.value); // Sort by weight descending

  // Generate colors for pie chart
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
    '#8dd1e1',
    '#a4de6c',
    '#d0ed57',
    '#83a6ed',
    '#8884d8',
    '#ffc658',
  ];

  // Custom tooltip for pie chart
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
            <strong>{payload[0].name}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`Weight: ${payload[0].value * 100}%`}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height: 400 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Portfolio Allocation
      </Typography>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              nameKey="symbol"
              label={({ symbol, percentage }) => `${symbol}: ${percentage}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Typography variant="body1" color="textSecondary">
            No portfolio data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PortfolioAllocationChart;