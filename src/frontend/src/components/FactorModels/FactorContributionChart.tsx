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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

interface FactorContributionChartProps {
  data: {
    [symbol: string]: {
      [date: string]: {
        [factor: string]: number;
        total: number;
      };
    };
  };
}

const FactorContributionChart: React.FC<FactorContributionChartProps> = ({ data }) => {
  // Extract symbols from data
  const symbols = Object.keys(data);
  
  // State for selected symbol and chart type
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbols[0] || '');
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  
  // Handle chart type change
  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newChartType: 'line' | 'area' | 'bar' | null
  ) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };
  
  // Prepare data for charts
  const prepareChartData = () => {
    if (!selectedSymbol || !data[selectedSymbol]) return [];
    
    const symbolData = data[selectedSymbol];
    const dates = Object.keys(symbolData).sort();
    const factors = dates.length > 0 
      ? Object.keys(symbolData[dates[0]]).filter(key => key !== 'total') 
      : [];
    
    return dates.map(date => {
      const dateData = symbolData[date];
      const result: any = { date };
      
      // Add factor contributions
      factors.forEach(factor => {
        result[factor] = dateData[factor];
      });
      
      // Add total
      result.total = dateData.total;
      
      return result;
    });
  };
  
  // Generate colors for chart lines/areas
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ];
  
  const chartData = prepareChartData();
  
  // Get factors for chart
  const factors = chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== 'date' && key !== 'total') 
    : [];
  
  // Render appropriate chart based on selected type
  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {factors.map((factor, index) => (
              <Line 
                key={factor} 
                type="monotone" 
                dataKey={factor} 
                stroke={COLORS[index % COLORS.length]} 
                name={factor.charAt(0).toUpperCase() + factor.slice(1)}
              />
            ))}
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#000000" 
              strokeWidth={2} 
              name="Total Return"
            />
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {factors.map((factor, index) => (
              <Area 
                key={factor} 
                type="monotone" 
                dataKey={factor} 
                stackId="1"
                stroke={COLORS[index % COLORS.length]} 
                fill={COLORS[index % COLORS.length]} 
                name={factor.charAt(0).toUpperCase() + factor.slice(1)}
              />
            ))}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            {factors.map((factor, index) => (
              <Bar 
                key={factor} 
                dataKey={factor} 
                stackId="a"
                fill={COLORS[index % COLORS.length]} 
                name={factor.charAt(0).toUpperCase() + factor.slice(1)}
              />
            ))}
            <Bar 
              dataKey="total" 
              fill="#000000" 
              name="Total Return" 
            />
          </BarChart>
        );
      
      default:
        return null;
    }
  };
  
  // Calculate cumulative contributions
  const calculateCumulativeData = () => {
    if (chartData.length === 0) return [];
    
    const cumulativeData = [...chartData];
    const cumulativeFactors = [...factors, 'total'];
    
    // Initialize cumulative values
    const cumulative: { [key: string]: number } = {};
    cumulativeFactors.forEach(factor => {
      cumulative[factor] = 0;
    });
    
    // Calculate cumulative values
    return cumulativeData.map((item, index) => {
      const result: any = { date: item.date };
      
      cumulativeFactors.forEach(factor => {
        cumulative[factor] += item[factor] || 0;
        result[factor] = cumulative[factor];
      });
      
      return result;
    });
  };
  
  const cumulativeData = calculateCumulativeData();
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Factor Contribution Analysis
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
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          aria-label="chart type"
          size="small"
        >
          <ToggleButton value="line" aria-label="line chart">
            Line
          </ToggleButton>
          <ToggleButton value="area" aria-label="area chart">
            Area
          </ToggleButton>
          <ToggleButton value="bar" aria-label="bar chart">
            Bar
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Grid container spacing={3}>
        {/* Daily Factor Contributions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedSymbol} - Daily Factor Contributions
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              {renderChart()}
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Cumulative Factor Contributions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedSymbol} - Cumulative Factor Contributions
            </Typography>
            
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={cumulativeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {factors.map((factor, index) => (
                  <Line 
                    key={factor} 
                    type="monotone" 
                    dataKey={factor} 
                    stroke={COLORS[index % COLORS.length]} 
                    name={factor.charAt(0).toUpperCase() + factor.slice(1)}
                  />
                ))}
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#000000" 
                  strokeWidth={2} 
                  name="Total Return"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Factor Contribution Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedSymbol} - Factor Contribution Summary
            </Typography>
            
            {chartData.length > 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Factor</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Average Daily Contribution</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Cumulative Contribution</th>
                      <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Contribution %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factors.map(factor => {
                      // Calculate average and cumulative contribution
                      const avgContribution = chartData.reduce((sum, item) => sum + (item[factor] || 0), 0) / chartData.length;
                      const cumulativeContribution = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1][factor] : 0;
                      const totalCumulative = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].total : 0;
                      const contributionPercent = totalCumulative !== 0 ? (cumulativeContribution / totalCumulative) * 100 : 0;
                      
                      return (
                        <tr key={factor}>
                          <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                            <strong>{factor.charAt(0).toUpperCase() + factor.slice(1)}</strong>
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {avgContribution.toFixed(5)}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {cumulativeContribution.toFixed(5)}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {contributionPercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                        Total
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                        {chartData.reduce((sum, item) => sum + (item.total || 0), 0) / chartData.length}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                        {cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].total.toFixed(5) : 'N/A'}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                        100.00%
                      </td>
                    </tr>
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

export default FactorContributionChart;