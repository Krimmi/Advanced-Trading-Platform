import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Grid,
  Divider,
  CircularProgress,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  TextField,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import { 
  RiskCalculationServiceFactory 
} from '../../services/risk/RiskCalculationServiceFactory';
import {
  Portfolio,
  Position,
  RiskMetricType,
  VaRResult,
  VaRConfig,
  AssetClass
} from '../../services/risk/models/RiskModels';

// Import chart components
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[8],
    transform: 'translateY(-2px)'
  }
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center'
}));

const MetricValue = styled(Typography)<{ severity?: 'low' | 'medium' | 'high' | 'critical' }>(({ theme, severity }) => {
  let color = theme.palette.text.primary;
  
  if (severity === 'low') {
    color = theme.palette.success.main;
  } else if (severity === 'medium') {
    color = theme.palette.warning.main;
  } else if (severity === 'high') {
    color = theme.palette.error.main;
  } else if (severity === 'critical') {
    color = theme.palette.error.dark;
  }
  
  return {
    fontWeight: 'bold',
    color,
    fontSize: '1.5rem'
  };
});

const MetricLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem'
}));

const SettingsContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

// Color schemes for charts
const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  [AssetClass.EQUITY]: '#1976d2',
  [AssetClass.FIXED_INCOME]: '#388e3c',
  [AssetClass.COMMODITY]: '#f57c00',
  [AssetClass.CURRENCY]: '#7b1fa2',
  [AssetClass.CRYPTO]: '#d32f2f',
  [AssetClass.OPTION]: '#0097a7',
  [AssetClass.FUTURE]: '#fbc02d',
  [AssetClass.ETF]: '#5d4037',
  [AssetClass.MUTUAL_FUND]: '#00796b',
  [AssetClass.OTHER]: '#757575'
};

// Interface for component props
interface VaRVisualizationPanelProps {
  portfolioId: string;
  onRefresh?: () => void;
}

/**
 * VaRVisualizationPanel displays Value at Risk (VaR) metrics and visualizations
 */
const VaRVisualizationPanel: React.FC<VaRVisualizationPanelProps> = ({
  portfolioId,
  onRefresh
}) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [varResult, setVarResult] = useState<VaRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // VaR configuration
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [timeHorizon, setTimeHorizon] = useState<number>(1);
  const [method, setMethod] = useState<'historical' | 'parametric' | 'monte_carlo'>('historical');
  const [lookbackPeriod, setLookbackPeriod] = useState<number>(252);
  
  // Chart data
  const [contributionChartData, setContributionChartData] = useState<any[]>([]);
  const [assetClassChartData, setAssetClassChartData] = useState<any[]>([]);
  
  // Load data
  useEffect(() => {
    loadData();
  }, [portfolioId]);
  
  // Load portfolio and VaR data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      
      // Get portfolio
      const portfolioData = await riskService.getPortfolio(portfolioId);
      setPortfolio(portfolioData);
      
      // Calculate VaR
      const varConfig: VaRConfig = {
        confidenceLevel,
        timeHorizon,
        method,
        lookbackPeriod
      };
      
      const varData = await riskService.calculateVaR(portfolioId, varConfig);
      setVarResult(varData);
      
      // Prepare chart data
      prepareChartData(varData);
    } catch (err) {
      console.error('Error loading risk data:', err);
      setError(`Failed to load risk data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Prepare chart data
  const prepareChartData = (varData: VaRResult) => {
    // Contribution by position chart data
    const positionData = Object.entries(varData.contributionByPosition)
      .map(([symbol, value]) => ({
        symbol,
        value,
        percentage: (value / varData.value) * 100
      }))
      .sort((a, b) => b.value - a.value);
    
    setContributionChartData(positionData);
    
    // Contribution by asset class chart data
    const assetClassData = Object.entries(varData.contributionByAssetClass)
      .map(([assetClass, value]) => ({
        assetClass,
        value,
        percentage: (value / varData.value) * 100
      }))
      .sort((a, b) => b.value - a.value);
    
    setAssetClassChartData(assetClassData);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadData();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Handle confidence level change
  const handleConfidenceLevelChange = (event: Event, newValue: number | number[]) => {
    setConfidenceLevel(newValue as number);
  };
  
  // Handle time horizon change
  const handleTimeHorizonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setTimeHorizon(value);
    }
  };
  
  // Handle method change
  const handleMethodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setMethod(event.target.value as 'historical' | 'parametric' | 'monte_carlo');
  };
  
  // Handle lookback period change
  const handleLookbackPeriodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setLookbackPeriod(value);
    }
  };
  
  // Handle apply settings
  const handleApplySettings = () => {
    loadData();
  };
  
  // Get severity level based on VaR percentage
  const getVaRSeverity = (varPercentage: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (varPercentage < 0.05) {
      return 'low';
    } else if (varPercentage < 0.1) {
      return 'medium';
    } else if (varPercentage < 0.15) {
      return 'high';
    } else {
      return 'critical';
    }
  };
  
  // Format currency
  const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
        <WarningIcon color="error" fontSize="large" sx={{ mb: 2 }} />
        <Typography color="error" gutterBottom>{error}</Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }
  
  // Render no data state
  if (!portfolio || !varResult) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
        <Typography color="textSecondary" gutterBottom>No portfolio data available</Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>
    );
  }
  
  return (
    <StyledCard>
      <CardHeader
        title="Value at Risk (VaR) Analysis"
        subheader={`Portfolio: ${portfolio.name}`}
        action={
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }
      />
      
      <Divider />
      
      <CardContent>
        {/* Settings */}
        <SettingsContainer>
          <Typography variant="subtitle1" gutterBottom>VaR Configuration</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Method</InputLabel>
                <Select
                  value={method}
                  onChange={handleMethodChange}
                  label="Method"
                >
                  <MenuItem value="historical">Historical</MenuItem>
                  <MenuItem value="parametric">Parametric</MenuItem>
                  <MenuItem value="monte_carlo">Monte Carlo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box>
                <Typography gutterBottom>Confidence Level: {(confidenceLevel * 100).toFixed(0)}%</Typography>
                <Slider
                  value={confidenceLevel}
                  onChange={handleConfidenceLevelChange}
                  min={0.9}
                  max={0.99}
                  step={0.01}
                  marks={[
                    { value: 0.9, label: '90%' },
                    { value: 0.95, label: '95%' },
                    { value: 0.99, label: '99%' }
                  ]}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Time Horizon (days)"
                type="number"
                value={timeHorizon}
                onChange={handleTimeHorizonChange}
                InputProps={{ inputProps: { min: 1 } }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Lookback Period (days)"
                type="number"
                value={lookbackPeriod}
                onChange={handleLookbackPeriodChange}
                InputProps={{ inputProps: { min: 30 } }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Box display="flex" alignItems="center" height="100%">
                <Button
                  variant="contained"
                  onClick={handleApplySettings}
                  fullWidth
                >
                  Apply
                </Button>
              </Box>
            </Grid>
          </Grid>
        </SettingsContainer>
        
        {/* Key Metrics */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>Key Risk Metrics</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <MetricCard>
                <MetricValue severity={getVaRSeverity(varResult.percentOfPortfolio)}>
                  {formatCurrency(varResult.value, portfolio.currency)}
                </MetricValue>
                <MetricLabel>
                  Value at Risk ({(confidenceLevel * 100).toFixed(0)}%, {timeHorizon} day)
                </MetricLabel>
                <Tooltip title={`There is a ${((1 - confidenceLevel) * 100).toFixed(0)}% chance of losing more than this amount over the next ${timeHorizon} day(s)`}>
                  <InfoIcon fontSize="small" color="action" sx={{ mt: 1 }} />
                </Tooltip>
              </MetricCard>
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard>
                <MetricValue severity={getVaRSeverity(varResult.percentOfPortfolio)}>
                  {formatPercentage(varResult.percentOfPortfolio)}
                </MetricValue>
                <MetricLabel>
                  VaR as % of Portfolio
                </MetricLabel>
                <Tooltip title="Value at Risk as a percentage of total portfolio value">
                  <InfoIcon fontSize="small" color="action" sx={{ mt: 1 }} />
                </Tooltip>
              </MetricCard>
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard>
                <MetricValue>
                  {formatCurrency(portfolio.totalValue, portfolio.currency)}
                </MetricValue>
                <MetricLabel>
                  Portfolio Value
                </MetricLabel>
              </MetricCard>
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard>
                <MetricValue>
                  {portfolio.positions.length}
                </MetricValue>
                <MetricLabel>
                  Number of Positions
                </MetricLabel>
              </MetricCard>
            </Grid>
          </Grid>
        </Box>
        
        {/* Charts */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>Risk Contribution Analysis</Typography>
          <Grid container spacing={3}>
            {/* VaR Contribution by Position */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="subtitle2" gutterBottom>VaR Contribution by Position</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={contributionChartData.slice(0, 10)} // Show top 10
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="symbol" type="category" width={80} />
                    <RechartsTooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${formatCurrency(value, portfolio.currency)} (${formatPercentage(props.payload.percentage / 100)})`,
                        'VaR Contribution'
                      ]}
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            {/* VaR Contribution by Asset Class */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="subtitle2" gutterBottom>VaR Contribution by Asset Class</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={assetClassChartData}
                      dataKey="value"
                      nameKey="assetClass"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.assetClass}
                    >
                      {assetClassChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ASSET_CLASS_COLORS[entry.assetClass as AssetClass] || '#757575'}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${formatCurrency(value, portfolio.currency)} (${formatPercentage(props.payload.percentage / 100)})`,
                        name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* Method Information */}
        <Box mt={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>About {method.charAt(0).toUpperCase() + method.slice(1)} VaR</Typography>
            <Typography variant="body2">
              {method === 'historical' && (
                "Historical VaR uses actual historical returns to estimate potential losses. It makes no assumptions about the distribution of returns and directly uses empirical data to determine the VaR at the specified confidence level."
              )}
              {method === 'parametric' && (
                "Parametric VaR assumes returns follow a normal distribution. It uses the mean and standard deviation of historical returns to estimate potential losses, applying statistical properties of the normal distribution."
              )}
              {method === 'monte_carlo' && (
                "Monte Carlo VaR uses simulation to generate thousands of possible scenarios based on the statistical properties of historical returns. It provides a more comprehensive view of potential outcomes, especially for complex portfolios."
              )}
            </Typography>
            <Box mt={2} display="flex" gap={1}>
              <Chip label={`${(confidenceLevel * 100).toFixed(0)}% Confidence`} color="primary" size="small" />
              <Chip label={`${timeHorizon} Day Horizon`} color="primary" size="small" />
              <Chip label={`${lookbackPeriod} Day History`} color="primary" size="small" />
            </Box>
          </Paper>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default VaRVisualizationPanel;