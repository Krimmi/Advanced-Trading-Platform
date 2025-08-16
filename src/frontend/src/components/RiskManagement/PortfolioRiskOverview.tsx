import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { Portfolio } from '../../services/portfolioConstructionService';
import { PortfolioRiskMetrics } from '../../services/riskManagementService';
import riskManagementService from '../../services/riskManagementService';

interface PortfolioRiskOverviewProps {
  portfolio: Portfolio | null;
  riskMetrics: PortfolioRiskMetrics | null;
  benchmark: string;
  timeframe: string;
}

const PortfolioRiskOverview: React.FC<PortfolioRiskOverviewProps> = ({ 
  portfolio, 
  riskMetrics, 
  benchmark,
  timeframe
}) => {
  const [historicalRisk, setHistoricalRisk] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  useEffect(() => {
    if (portfolio) {
      fetchHistoricalRiskData();
    }
  }, [portfolio, benchmark, timeframe]);

  const fetchHistoricalRiskData = async () => {
    if (!portfolio) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await riskManagementService.getHistoricalRiskMetrics(portfolio.id, {
        metrics: ['volatility', 'var_95', 'beta', 'sharpe_ratio'],
        frequency: timeframe === '1m' ? 'daily' : timeframe === '3m' ? 'daily' : 'weekly'
      });
      
      setHistoricalRisk(data);
    } catch (err) {
      console.error('Error fetching historical risk data:', err);
      setError('Failed to load historical risk data');
    } finally {
      setLoading(false);
    }
  };

  if (!portfolio || !riskMetrics) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="body1">
          No portfolio data available.
        </Typography>
      </Paper>
    );
  }

  // Format allocation data for pie chart
  const assetClassData = Object.entries(portfolio.allocations.asset_class).map(([name, value]) => ({
    name,
    value: value * 100 // Convert to percentage
  }));

  // Format sector data for pie chart
  const sectorData = Object.entries(portfolio.allocations.sector).map(([name, value]) => ({
    name,
    value: value * 100 // Convert to percentage
  }));

  // Format risk contribution data (if available)
  const riskContributionData = [
    { name: 'Market Risk', value: 65 },
    { name: 'Sector Risk', value: 15 },
    { name: 'Style Risk', value: 10 },
    { name: 'Specific Risk', value: 10 }
  ];

  // Format risk metrics for radar chart
  const normalizeValue = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const riskRadarData = [
    {
      metric: 'Volatility',
      value: riskMetrics.volatility ? normalizeValue(riskMetrics.volatility, 0, 0.3) : 0,
      fullMark: 100
    },
    {
      metric: 'VaR',
      value: riskMetrics.var_95 ? normalizeValue(Math.abs(riskMetrics.var_95), 0, 0.1) : 0,
      fullMark: 100
    },
    {
      metric: 'Beta',
      value: riskMetrics.beta ? normalizeValue(riskMetrics.beta, 0, 2) : 0,
      fullMark: 100
    },
    {
      metric: 'Max DD',
      value: riskMetrics.max_drawdown ? normalizeValue(Math.abs(riskMetrics.max_drawdown), 0, 0.5) : 0,
      fullMark: 100
    },
    {
      metric: 'Tracking Error',
      value: riskMetrics.tracking_error ? normalizeValue(riskMetrics.tracking_error, 0, 0.1) : 0,
      fullMark: 100
    }
  ];

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Risk Overview Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Risk Profile" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={portfolio.name}
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value) => value.toFixed(2)} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Risk profile radar chart showing key risk metrics relative to their typical ranges.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Asset Allocation Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Asset Allocation" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetClassData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetClassData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Asset allocation by asset class. Diversification helps reduce unsystematic risk.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Historical Volatility Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Historical Volatility" />
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : historicalRisk ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historicalRisk.dates.map((date: string, index: number) => ({
                        date,
                        volatility: historicalRisk.metrics.volatility[index] * 100 // Convert to percentage
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis 
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value.toFixed(2)}%`, 'Volatility']}
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="volatility" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                        name="Volatility"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No historical volatility data available.
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Rolling 30-day annualized volatility over time.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Risk Contribution Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Risk Contribution" />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskContributionData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Contribution']} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="% of Total Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                Breakdown of portfolio risk by source. Market risk typically dominates diversified portfolios.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Risk Assessment Summary
        </Typography>
        <Typography variant="body1" paragraph>
          This portfolio exhibits {getRiskLevelDescription(riskMetrics.volatility)} with a volatility of {formatPercent(riskMetrics.volatility)}.
          The Value at Risk (95%) indicates a maximum expected loss of {formatPercent(Math.abs(riskMetrics.var_95))} in a single day under normal market conditions.
        </Typography>
        <Typography variant="body1" paragraph>
          With a beta of {riskMetrics.beta?.toFixed(2)}, the portfolio {getBetaDescription(riskMetrics.beta)} compared to the {benchmark} benchmark.
          The Sharpe ratio of {riskMetrics.sharpe_ratio?.toFixed(2)} indicates {getSharpeDescription(riskMetrics.sharpe_ratio)} given the level of risk taken.
        </Typography>
        <Typography variant="body1">
          The maximum historical drawdown of {formatPercent(Math.abs(riskMetrics.max_drawdown))} represents the worst peak-to-trough decline experienced by this portfolio.
          {riskMetrics.tracking_error && ` The tracking error of ${formatPercent(riskMetrics.tracking_error)} shows ${getTrackingErrorDescription(riskMetrics.tracking_error)} from the benchmark.`}
        </Typography>
      </Box>
    </Box>
  );
};

// Helper functions
const formatPercent = (value: number | null): string => {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(2)}%`;
};

const getRiskLevelDescription = (volatility: number | null): string => {
  if (volatility === null) return 'an unknown risk level';
  if (volatility < 0.1) return 'a low risk level';
  if (volatility < 0.15) return 'a moderate risk level';
  if (volatility < 0.25) return 'a high risk level';
  return 'a very high risk level';
};

const getBetaDescription = (beta: number | null): string => {
  if (beta === null) return 'has an unknown sensitivity';
  if (beta < 0.8) return 'is less volatile';
  if (beta < 1.2) return 'has similar volatility';
  return 'is more volatile';
};

const getSharpeDescription = (sharpe: number | null): string => {
  if (sharpe === null) return 'an unknown risk-adjusted return';
  if (sharpe < 0) return 'poor risk-adjusted returns';
  if (sharpe < 0.5) return 'below-average risk-adjusted returns';
  if (sharpe < 1) return 'average risk-adjusted returns';
  if (sharpe < 1.5) return 'good risk-adjusted returns';
  return 'excellent risk-adjusted returns';
};

const getTrackingErrorDescription = (trackingError: number | null): string => {
  if (trackingError === null) return 'unknown deviation';
  if (trackingError < 0.02) return 'minimal deviation';
  if (trackingError < 0.05) return 'moderate deviation';
  return 'significant deviation';
};

export default PortfolioRiskOverview;