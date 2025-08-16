import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Grid,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

interface RiskDecompositionChartProps {
  data: {
    [symbol: string]: {
      [factor: string]: {
        beta: number;
        marginal_contribution: number;
        component_contribution: number;
        percentage_contribution: number;
      };
    };
  };
}

const RiskDecompositionChart: React.FC<RiskDecompositionChartProps> = ({ data }) => {
  // Extract symbols from data
  const symbols = Object.keys(data);
  
  // State for selected symbol and view type
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbols[0] || '');
  const [viewType, setViewType] = useState<'percentage' | 'absolute'>('percentage');
  
  // Handle view type change
  const handleViewTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewType: 'percentage' | 'absolute' | null
  ) => {
    if (newViewType !== null) {
      setViewType(newViewType);
    }
  };
  
  // Prepare data for pie chart
  const preparePieChartData = () => {
    if (!selectedSymbol || !data[selectedSymbol]) return [];
    
    const symbolData = data[selectedSymbol];
    const factors = Object.keys(symbolData).filter(factor => factor !== 'total');
    
    return factors.map(factor => ({
      name: factor,
      value: viewType === 'percentage' 
        ? symbolData[factor].percentage_contribution 
        : symbolData[factor].component_contribution
    }));
  };
  
  // Prepare data for bar chart comparison
  const prepareBarChartData = () => {
    return symbols.map(symbol => {
      const symbolData = data[symbol];
      const factors = Object.keys(symbolData).filter(factor => factor !== 'total');
      
      // Calculate total risk for absolute view
      const totalRisk = symbolData.total?.component_contribution || 
        factors.reduce((sum, factor) => sum + symbolData[factor].component_contribution, 0);
      
      const result: any = { symbol };
      
      factors.forEach(factor => {
        result[factor] = viewType === 'percentage' 
          ? symbolData[factor].percentage_contribution 
          : symbolData[factor].component_contribution;
      });
      
      // Add total risk for absolute view
      if (viewType === 'absolute') {
        result.totalRisk = totalRisk;
      }
      
      return result;
    });
  };
  
  // Generate colors for chart segments
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ];
  
  const pieChartData = preparePieChartData();
  const barChartData = prepareBarChartData();
  
  // Get factors for bar chart
  const barChartFactors = symbols.length > 0 && data[symbols[0]] 
    ? Object.keys(data[symbols[0]]).filter(factor => factor !== 'total') 
    : [];
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Risk Decomposition Analysis
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewTypeChange}
          aria-label="view type"
          size="small"
        >
          <ToggleButton value="percentage" aria-label="percentage view">
            Percentage
          </ToggleButton>
          <ToggleButton value="absolute" aria-label="absolute view">
            Absolute
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Grid container spacing={3}>
        {/* Pie Chart for Selected Symbol */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedSymbol} - Risk Decomposition
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => viewType === 'percentage' ? `${name}: ${(percent * 100).toFixed(1)}%` : name}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => viewType === 'percentage' 
                    ? `${value.toFixed(2)}%` 
                    : value.toFixed(5)
                  } 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Bar Chart for All Symbols */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              Risk Comparison Across Symbols
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={barChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis 
                  label={{ 
                    value: viewType === 'percentage' ? 'Contribution (%)' : 'Risk Component', 
                    angle: -90, 
                    position: 'insideLeft' 
                  }} 
                />
                <Tooltip 
                  formatter={(value) => viewType === 'percentage' 
                    ? `${value.toFixed(2)}%` 
                    : value.toFixed(5)
                  }
                />
                <Legend />
                {viewType === 'absolute' && (
                  <Bar dataKey="totalRisk" fill="#000000" name="Total Risk" />
                )}
                {barChartFactors.map((factor, index) => (
                  <Bar 
                    key={factor} 
                    dataKey={factor} 
                    fill={COLORS[index % COLORS.length]} 
                    name={factor.charAt(0).toUpperCase() + factor.slice(1)}
                    stackId={viewType === 'percentage' ? "a" : undefined}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Risk Decomposition Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedSymbol} - Risk Decomposition Details
            </Typography>
            
            {selectedSymbol && data[selectedSymbol] && (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Factor</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Beta</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Marginal Contribution</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Component Contribution</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Percentage (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data[selectedSymbol])
                      .filter(([factor]) => factor !== 'total')
                      .map(([factor, values]) => (
                        <tr key={factor}>
                          <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                            <strong>{factor.charAt(0).toUpperCase() + factor.slice(1)}</strong>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {values.beta?.toFixed(3) || 'N/A'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {values.marginal_contribution?.toFixed(5) || 'N/A'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {values.component_contribution?.toFixed(5) || 'N/A'}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {values.percentage_contribution?.toFixed(2) || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    {data[selectedSymbol].total && (
                      <tr>
                        <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                          Total
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                          -
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                          -
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                          {data[selectedSymbol].total.component_contribution?.toFixed(5) || 'N/A'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                          {data[selectedSymbol].total.percentage_contribution?.toFixed(2) || 'N/A'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiskDecompositionChart;