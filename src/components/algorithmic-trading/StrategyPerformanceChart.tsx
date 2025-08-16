import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography,
  Grid,
  Chip
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
  BarChart,
  Bar
} from 'recharts';
import { IStrategy } from '../../services/algorithmic-trading/strategies/IStrategy';
import { StrategyTrade } from '../../models/algorithmic-trading/StrategyTypes';

interface StrategyPerformanceChartProps {
  strategy: IStrategy;
}

const StrategyPerformanceChart: React.FC<StrategyPerformanceChartProps> = ({ strategy }) => {
  const [chartType, setChartType] = useState<string>('equity');
  const [equityData, setEquityData] = useState<any[]>([]);
  const [tradesData, setTradesData] = useState<any[]>([]);
  const [drawdownData, setDrawdownData] = useState<any[]>([]);
  const [monthlyReturnsData, setMonthlyReturnsData] = useState<any[]>([]);
  
  useEffect(() => {
    if (strategy) {
      generateChartData();
    }
  }, [strategy]);
  
  const generateChartData = () => {
    const trades = strategy.tradeHistory;
    
    // Generate equity curve data
    const equityCurve = generateEquityCurve(trades);
    setEquityData(equityCurve);
    
    // Generate trades data
    const tradesChart = generateTradesChart(trades);
    setTradesData(tradesChart);
    
    // Generate drawdown data
    const drawdown = generateDrawdownChart(equityCurve);
    setDrawdownData(drawdown);
    
    // Generate monthly returns data
    const monthlyReturns = generateMonthlyReturns(trades);
    setMonthlyReturnsData(monthlyReturns);
  };
  
  const generateEquityCurve = (trades: StrategyTrade[]): any[] => {
    // Filter closed trades
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    
    if (closedTrades.length === 0) {
      return [];
    }
    
    // Sort trades by exit time
    const sortedTrades = [...closedTrades].sort((a, b) => {
      return (a.exitTime?.getTime() || 0) - (b.exitTime?.getTime() || 0);
    });
    
    // Generate equity curve
    const equityCurve = [];
    let equity = 100; // Start with 100 units
    
    // Add initial point
    equityCurve.push({
      date: sortedTrades[0].entryTime,
      equity: equity,
      drawdown: 0
    });
    
    let peak = equity;
    
    for (const trade of sortedTrades) {
      if (trade.pnl !== undefined && trade.exitTime) {
        // Update equity
        equity += trade.pnl;
        
        // Update peak
        if (equity > peak) {
          peak = equity;
        }
        
        // Calculate drawdown
        const drawdown = ((peak - equity) / peak) * 100;
        
        equityCurve.push({
          date: trade.exitTime,
          equity: equity,
          drawdown: drawdown
        });
      }
    }
    
    return equityCurve;
  };
  
  const generateTradesChart = (trades: StrategyTrade[]): any[] => {
    // Filter closed trades
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    
    if (closedTrades.length === 0) {
      return [];
    }
    
    // Sort trades by exit time
    const sortedTrades = [...closedTrades].sort((a, b) => {
      return (a.exitTime?.getTime() || 0) - (b.exitTime?.getTime() || 0);
    });
    
    // Generate trades chart data
    return sortedTrades.map((trade, index) => ({
      index: index + 1,
      pnl: trade.pnl || 0,
      pnlPercent: trade.pnlPercentage ? trade.pnlPercentage * 100 : 0,
      symbol: trade.symbol,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.exitPrice || 0,
      entryTime: trade.entryTime,
      exitTime: trade.exitTime,
      duration: trade.exitTime && trade.entryTime ? 
        (trade.exitTime.getTime() - trade.entryTime.getTime()) / (1000 * 60 * 60) : 0 // Duration in hours
    }));
  };
  
  const generateDrawdownChart = (equityCurve: any[]): any[] => {
    if (equityCurve.length === 0) {
      return [];
    }
    
    return equityCurve.map(point => ({
      date: point.date,
      drawdown: point.drawdown
    }));
  };
  
  const generateMonthlyReturns = (trades: StrategyTrade[]): any[] => {
    // Filter closed trades
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    
    if (closedTrades.length === 0) {
      return [];
    }
    
    // Group trades by month
    const monthlyPnL: Record<string, number> = {};
    
    for (const trade of closedTrades) {
      if (trade.pnl !== undefined && trade.exitTime) {
        const monthYear = `${trade.exitTime.getFullYear()}-${(trade.exitTime.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (!monthlyPnL[monthYear]) {
          monthlyPnL[monthYear] = 0;
        }
        
        monthlyPnL[monthYear] += trade.pnl;
      }
    }
    
    // Convert to array
    return Object.entries(monthlyPnL).map(([monthYear, pnl]) => ({
      month: monthYear,
      return: pnl
    }));
  };
  
  const handleChartTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setChartType(event.target.value as string);
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };
  
  const renderChart = () => {
    switch (chartType) {
      case 'equity':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={equityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                minTickGap={50}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => formatDate(new Date(label))}
                formatter={(value: any) => [value.toFixed(2), 'Equity']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="equity" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                name="Equity Curve"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'trades':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={tradesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [value.toFixed(2), 'P&L']}
              />
              <Legend />
              <Bar 
                dataKey="pnl" 
                fill={(data: any) => data.pnl >= 0 ? '#4caf50' : '#f44336'} 
                name="Trade P&L"
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'drawdown':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={drawdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                minTickGap={50}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => formatDate(new Date(label))}
                formatter={(value: any) => [value.toFixed(2) + '%', 'Drawdown']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="drawdown" 
                stroke="#f44336" 
                name="Drawdown"
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'monthly':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyReturnsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [value.toFixed(2), 'Return']}
              />
              <Legend />
              <Bar 
                dataKey="return" 
                fill={(data: any) => data.return >= 0 ? '#4caf50' : '#f44336'} 
                name="Monthly Return"
              />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };
  
  const renderPerformanceMetrics = () => {
    const { performance } = strategy;
    
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Total Return</Typography>
            <Typography variant="h6" color={performance.totalReturn >= 0 ? 'success.main' : 'error.main'}>
              {performance.totalReturn.toFixed(2)}%
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Win Rate</Typography>
            <Typography variant="h6">
              {(performance.winRate * 100).toFixed(2)}%
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Profit Factor</Typography>
            <Typography variant="h6">
              {performance.profitFactor.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Max Drawdown</Typography>
            <Typography variant="h6" color="error.main">
              {performance.maxDrawdown.toFixed(2)}%
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Avg Win</Typography>
            <Typography variant="h6" color="success.main">
              {performance.averageWin.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Avg Loss</Typography>
            <Typography variant="h6" color="error.main">
              {performance.averageLoss.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Expectancy</Typography>
            <Typography variant="h6" color={performance.expectancy >= 0 ? 'success.main' : 'error.main'}>
              {performance.expectancy.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2">Trades/Day</Typography>
            <Typography variant="h6">
              {performance.tradesPerDay.toFixed(2)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  };
  
  return (
    <Card>
      <CardHeader 
        title="Strategy Performance" 
        subheader={strategy.name}
        action={
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="chart-type-label">Chart Type</InputLabel>
            <Select
              labelId="chart-type-label"
              value={chartType}
              onChange={handleChartTypeChange as any}
              label="Chart Type"
            >
              <MenuItem value="equity">Equity Curve</MenuItem>
              <MenuItem value="trades">Trade P&L</MenuItem>
              <MenuItem value="drawdown">Drawdown</MenuItem>
              <MenuItem value="monthly">Monthly Returns</MenuItem>
            </Select>
          </FormControl>
        }
      />
      <Divider />
      <CardContent>
        {strategy.tradeHistory.length > 0 ? (
          <>
            <Box sx={{ height: 400 }}>
              {renderChart()}
            </Box>
            {renderPerformanceMetrics()}
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <Typography variant="body1" color="textSecondary">
              No trade history available for this strategy
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategyPerformanceChart;