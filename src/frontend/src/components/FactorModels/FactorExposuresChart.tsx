import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface FactorExposuresChartProps {
  data: {
    [symbol: string]: {
      [factor: string]: number;
    };
  };
}

const FactorExposuresChart: React.FC<FactorExposuresChartProps> = ({ data }) => {
  // Extract symbols and factors from data
  const symbols = Object.keys(data);
  const factors = symbols.length > 0 ? Object.keys(data[symbols[0]]) : [];
  
  // State for selected symbol (for detailed view)
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbols[0] || '');
  
  // Prepare data for overview chart (all symbols, selected factors)
  const prepareOverviewData = () => {
    // For overview, we'll show all symbols but limit to key factors
    // Key factors are typically market, size, value, etc.
    const keyFactors = ['market', 'size', 'value', 'profitability', 'investment'].filter(
      factor => factors.includes(factor)
    );
    
    // If no key factors found, use first 3 factors
    const factorsToShow = keyFactors.length > 0 ? keyFactors : factors.slice(0, 3);
    
    return symbols.map(symbol => {
      const item: any = { symbol };
      factorsToShow.forEach(factor => {
        item[factor] = data[symbol][factor];
      });
      return item;
    });
  };
  
  // Prepare data for detailed chart (single symbol, all factors)
  const prepareDetailedData = () => {
    if (!selectedSymbol || !data[selectedSymbol]) return [];
    
    return factors.map(factor => ({
      factor,
      exposure: data[selectedSymbol][factor]
    }));
  };
  
  // Generate colors for bars
  const generateColors = (count: number) => {
    const baseColors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe',
      '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
    ];
    
    // If we have more factors than colors, repeat colors
    return Array(count).fill(0).map((_, i) => baseColors[i % baseColors.length]);
  };
  
  const overviewData = prepareOverviewData();
  const detailedData = prepareDetailedData();
  const overviewFactors = overviewData.length > 0 ? 
    Object.keys(overviewData[0]).filter(key => key !== 'symbol') : [];
  const colors = generateColors(Math.max(overviewFactors.length, factors.length));
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Factor Exposures (Betas)
      </Typography>
      
      <Grid container spacing={3}>
        {/* Overview Chart - All Symbols */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Overview - Key Factor Exposures
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={overviewData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Legend />
                {overviewFactors.map((factor, index) => (
                  <Bar 
                    key={factor} 
                    dataKey={factor} 
                    fill={colors[index]} 
                    name={`${factor.charAt(0).toUpperCase() + factor.slice(1)} Factor`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Detailed Chart - Single Symbol */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Detailed Factor Exposures
              </Typography>
              
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="symbol-select-label">Select Symbol</InputLabel>
                <Select
                  labelId="symbol-select-label"
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value as string)}
                  label="Select Symbol"
                  size="small"
                >
                  {symbols.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <ResponsiveContainer width="100%" height="80%">
              <BarChart
                data={detailedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="factor" type="category" />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="exposure" 
                  fill="#8884d8" 
                  name="Factor Exposure (Beta)" 
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Factor Exposures Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Factor Exposures Table
            </Typography>
            
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Symbol</th>
                    {factors.map(factor => (
                      <th key={factor} style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {factor.charAt(0).toUpperCase() + factor.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {symbols.map(symbol => (
                    <tr key={symbol}>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        <strong>{symbol}</strong>
                      </td>
                      {factors.map(factor => (
                        <td key={`${symbol}-${factor}`} style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                          {data[symbol][factor].toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FactorExposuresChart;