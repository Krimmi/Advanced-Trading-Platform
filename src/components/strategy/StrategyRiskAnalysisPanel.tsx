import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  useTheme
} from '@mui/material';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { 
  TradingStrategy, 
  MarketCondition,
  Timeframe
} from '../../models/strategy/StrategyTypes';
import { StrategyRiskAnalysisService } from '../../services/strategy/StrategyRiskAnalysisService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock icons (replace with actual imports in a real implementation)
const WarningIcon = () => <Box sx={{ color: 'warning.main' }}>⚠️</Box>;
const ErrorIcon = () => <Box sx={{ color: 'error.main' }}>✖</Box>;
const CheckIcon = () => <Box sx={{ color: 'success.main' }}>✓</Box>;
const InfoIcon = () => <Box>ℹ️</Box>;
const RiskIcon = () => <Box>🛡️</Box>;
const VolatilityIcon = () => <Box>📈</Box>;
const DrawdownIcon = () => <Box>📉</Box>;
const CorrelationIcon = () => <Box>🔄</Box>;
const TailRiskIcon = () => <Box>🔍</Box>;
const StressTestIcon = () => <Box>🧪</Box>;

interface StrategyRiskAnalysisPanelProps {
  apiKey: string;
  baseUrl?: string;
  strategy: TradingStrategy;
  ticker: string;
}

const StrategyRiskAnalysisPanel: React.FC<StrategyRiskAnalysisPanelProps> = ({
  apiKey,
  baseUrl,
  strategy,
  ticker
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<any | null>(null);
  const [drawdownAnalysis, setDrawdownAnalysis] = useState<any | null>(null);
  const [volatilityAnalysis, setVolatilityAnalysis] = useState<any | null>(null);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<any | null>(null);
  const [tailRiskAnalysis, setTailRiskAnalysis] = useState<any | null>(null);
  const [stressTestResults, setStressTestResults] = useState<any | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>(
    strategy.parameters.reduce((params, param) => {
      params[param.id] = param.defaultValue;
      return params;
    }, {} as Record<string, any>)
  );
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // 1 year ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [riskAnalysisService] = useState<StrategyRiskAnalysisService>(
    new StrategyRiskAnalysisService(apiKey, baseUrl)
  );

  // Load risk analysis when component mounts
  useEffect(() => {
    loadRiskAnalysis();
  }, [strategy, ticker]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Load data for the selected tab if not already loaded
    switch (newValue) {
      case 0: // Overview
        if (!riskAnalysis) {
          loadRiskAnalysis();
        }
        break;
      case 1: // Drawdown Analysis
        if (!drawdownAnalysis) {
          loadDrawdownAnalysis();
        }
        break;
      case 2: // Volatility Analysis
        if (!volatilityAnalysis) {
          loadVolatilityAnalysis();
        }
        break;
      case 3: // Correlation Analysis
        if (!correlationAnalysis) {
          loadCorrelationAnalysis();
        }
        break;
      case 4: // Tail Risk Analysis
        if (!tailRiskAnalysis) {
          loadTailRiskAnalysis();
        }
        break;
      case 5: // Stress Tests
        if (!stressTestResults) {
          loadStressTests();
        }
        break;
    }
  };

  // Handle date change
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(event.target.value));
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(event.target.value));
  };

  // Load risk analysis
  const loadRiskAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await riskAnalysisService.getRiskAnalysis(strategy.id, ticker);
      setRiskAnalysis(result);
    } catch (err) {
      console.error('Error loading risk analysis:', err);
      setError('Failed to load risk analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load drawdown analysis
  const loadDrawdownAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await riskAnalysisService.analyzeDrawdownRisk(
        strategy.id,
        ticker,
        parameters,
        startDate,
        endDate
      );
      setDrawdownAnalysis(result);
    } catch (err) {
      console.error('Error loading drawdown analysis:', err);
      setError('Failed to load drawdown analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load volatility analysis
  const loadVolatilityAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await riskAnalysisService.analyzeVolatilityRisk(
        strategy.id,
        ticker,
        parameters,
        startDate,
        endDate
      );
      setVolatilityAnalysis(result);
    } catch (err) {
      console.error('Error loading volatility analysis:', err);
      setError('Failed to load volatility analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load correlation analysis
  const loadCorrelationAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use some common tickers for correlation analysis
      const tickers = ['SPY', 'QQQ', 'IWM', 'GLD', 'TLT'];
      
      const result = await riskAnalysisService.analyzeCorrelationRisk(
        strategy.id,
        tickers,
        parameters,
        startDate,
        endDate
      );
      setCorrelationAnalysis(result);
    } catch (err) {
      console.error('Error loading correlation analysis:', err);
      setError('Failed to load correlation analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load tail risk analysis
  const loadTailRiskAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await riskAnalysisService.analyzeTailRisk(
        strategy.id,
        ticker,
        parameters,
        startDate,
        endDate,
        0.95
      );
      setTailRiskAnalysis(result);
    } catch (err) {
      console.error('Error loading tail risk analysis:', err);
      setError('Failed to load tail risk analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load stress tests
  const loadStressTests = async () => {
    setLoading(true);
    setError(null);

    try {
      // Define stress test scenarios
      const scenarios = [
        {
          name: '2008 Financial Crisis',
          description: 'Simulates market conditions similar to the 2008 financial crisis',
          marketCondition: MarketCondition.BEAR,
          volatilityMultiplier: 2.5,
          durationDays: 120
        },
        {
          name: '2020 COVID Crash',
          description: 'Simulates market conditions similar to the March 2020 COVID crash',
          marketCondition: MarketCondition.VOLATILE,
          volatilityMultiplier: 3.0,
          durationDays: 30
        },
        {
          name: 'Tech Bubble Burst',
          description: 'Simulates market conditions similar to the 2000 tech bubble burst',
          marketCondition: MarketCondition.BEAR,
          volatilityMultiplier: 2.0,
          durationDays: 180
        },
        {
          name: 'Flash Crash',
          description: 'Simulates a sudden market crash with quick recovery',
          marketCondition: MarketCondition.VOLATILE,
          volatilityMultiplier: 4.0,
          durationDays: 5
        },
        {
          name: 'Stagflation',
          description: 'Simulates a period of high inflation and low growth',
          marketCondition: MarketCondition.SIDEWAYS,
          volatilityMultiplier: 1.5,
          durationDays: 365
        }
      ];
      
      const result = await riskAnalysisService.runStressTests(
        strategy.id,
        ticker,
        scenarios,
        parameters
      );
      setStressTestResults(result);
    } catch (err) {
      console.error('Error loading stress tests:', err);
      setError('Failed to load stress tests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Get market condition label
  const getMarketConditionLabel = (condition: MarketCondition): string => {
    return condition.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Get risk level color
  const getRiskLevelColor = (risk: number): string => {
    if (risk >= 80) return theme.palette.error.main;
    if (risk >= 60) return theme.palette.warning.main;
    if (risk >= 40) return theme.palette.warning.light;
    if (risk >= 20) return theme.palette.success.light;
    return theme.palette.success.main;
  };

  // Get risk level icon
  const getRiskLevelIcon = (risk: number) => {
    if (risk >= 80) return <ErrorIcon />;
    if (risk >= 40) return <WarningIcon />;
    return <CheckIcon />;
  };

  // Render overview tab
  const renderOverviewTab = () => {
    if (!riskAnalysis) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No risk analysis data available. Please run the analysis.
          </Typography>
          <Button
            variant="contained"
            onClick={loadRiskAnalysis}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Run Risk Analysis
          </Button>
        </Box>
      );
    }

    return (
      <Box>
        {/* Overall Risk Level */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Overall Risk Assessment
                </Typography>
                <Typography variant="body1" paragraph>
                  This strategy has an overall risk level of {riskAnalysis.overallRiskLevel}/100, which is considered {
                    riskAnalysis.overallRiskLevel >= 80 ? 'very high' :
                    riskAnalysis.overallRiskLevel >= 60 ? 'high' :
                    riskAnalysis.overallRiskLevel >= 40 ? 'moderate' :
                    riskAnalysis.overallRiskLevel >= 20 ? 'low' : 'very low'
                  }.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1, minWidth: 100 }}>
                    Risk Level:
                  </Typography>
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={riskAnalysis.overallRiskLevel} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(riskAnalysis.overallRiskLevel)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                    {riskAnalysis.overallRiskLevel}/100
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {
                    riskAnalysis.overallRiskLevel >= 80 ? 'Very high risk strategies may experience significant drawdowns and volatility. Suitable only for aggressive risk-tolerant investors.' :
                    riskAnalysis.overallRiskLevel >= 60 ? 'High risk strategies may experience substantial drawdowns. Suitable for risk-tolerant investors with a long time horizon.' :
                    riskAnalysis.overallRiskLevel >= 40 ? 'Moderate risk strategies balance risk and return. Suitable for most investors.' :
                    riskAnalysis.overallRiskLevel >= 20 ? 'Low risk strategies prioritize capital preservation over returns. Suitable for conservative investors.' :
                    'Very low risk strategies focus on capital preservation. Suitable for highly conservative investors.'
                  }
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Typography variant="h6" gutterBottom>
          Risk Factors
        </Typography>
        
        <Grid container spacing={2}>
          {riskAnalysis.riskFactors.map((factor: any, index: number) => (
            <Grid item xs={12} md={6} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getRiskLevelIcon(factor.impact)}
                      <Typography variant="subtitle1" sx={{ ml: 1 }}>
                        {factor.factor}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Impact: ${factor.impact}/100`} 
                      size="small"
                      sx={{ 
                        backgroundColor: getRiskLevelColor(factor.impact),
                        color: factor.impact >= 60 ? 'white' : 'inherit'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    {factor.description}
                  </Typography>
                  
                  <Typography variant="body2">
                    <strong>Mitigation:</strong> {factor.mitigationApproach}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Worst Case Scenario */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Worst Case Scenario
        </Typography>
        
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" gutterBottom>
                  Scenario Description
                </Typography>
                <Typography variant="body2" paragraph>
                  {riskAnalysis.worstCaseScenario.description}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Estimated Loss" 
                      secondary={formatPercentage(riskAnalysis.worstCaseScenario.estimatedLoss)}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ 
                        variant: 'body1',
                        color: 'error.main',
                        fontWeight: 'bold'
                      }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Probability" 
                      secondary={`${riskAnalysis.worstCaseScenario.probability}%`}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Stress Test Results */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Stress Test Results
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Scenario</TableCell>
                <TableCell align="right">Performance</TableCell>
                <TableCell align="right">Max Drawdown</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {riskAnalysis.stressTestResults.map((test: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{test.scenario}</TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: test.performance >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatPercentage(test.performance)}
                  </TableCell>
                  <TableCell 
                    align="right"
                    sx={{ 
                      color: 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatPercentage(test.maxDrawdown)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  // Render drawdown analysis tab
  const renderDrawdownAnalysisTab = () => {
    if (!drawdownAnalysis) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No drawdown analysis data available. Please run the analysis.
          </Typography>
          <Button
            variant="contained"
            onClick={loadDrawdownAnalysis}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Run Drawdown Analysis
          </Button>
        </Box>
      );
    }

    // Prepare chart data
    const drawdownChartData = {
      labels: drawdownAnalysis.drawdowns.map((d: any) => new Date(d.startDate).toLocaleDateString()),
      datasets: [
        {
          label: 'Drawdown Depth',
          data: drawdownAnalysis.drawdowns.map((d: any) => -d.depth * 100),
          backgroundColor: theme.palette.error.main,
          borderColor: theme.palette.error.dark,
          borderWidth: 1
        }
      ]
    };

    const drawdownChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Drawdown (%)'
          },
          reverse: true
        },
        x: {
          title: {
            display: true,
            text: 'Drawdown Start Date'
          }
        }
      },
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `Drawdown: ${context.raw.toFixed(2)}%`;
            }
          }
        }
      }
    };

    return (
      <Box>
        {/* Drawdown Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Maximum Drawdown
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {formatPercentage(drawdownAnalysis.maxDrawdown)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Average Drawdown
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {formatPercentage(drawdownAnalysis.averageDrawdown)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Drawdown Frequency
                </Typography>
                <Typography variant="h5" component="div">
                  {drawdownAnalysis.drawdownFrequency.toFixed(1)} per year
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Drawdown Chart */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Drawdown History" />
          <Divider />
          <CardContent sx={{ height: 300 }}>
            <Bar data={drawdownChartData} options={drawdownChartOptions as any} />
          </CardContent>
        </Card>

        {/* Recovery Stats */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Recovery Statistics" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Average Recovery Time
                </Typography>
                <Typography variant="body1">
                  {drawdownAnalysis.recoveryStats.averageRecoveryTime.toFixed(0)} days
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Maximum Recovery Time
                </Typography>
                <Typography variant="body1">
                  {drawdownAnalysis.recoveryStats.maxRecoveryTime.toFixed(0)} days
                </Typography>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Recovery Time Distribution
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Range</TableCell>
                    <TableCell align="right">Frequency</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drawdownAnalysis.recoveryStats.recoveryTimeDistribution.map((dist: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{dist.range}</TableCell>
                      <TableCell align="right">{dist.frequency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader title="Drawdown Risk Assessment" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Drawdown Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={drawdownAnalysis.riskAssessment.drawdownRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(drawdownAnalysis.riskAssessment.drawdownRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {drawdownAnalysis.riskAssessment.drawdownRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Recovery Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={drawdownAnalysis.riskAssessment.recoveryRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(drawdownAnalysis.riskAssessment.recoveryRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {drawdownAnalysis.riskAssessment.recoveryRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={drawdownAnalysis.riskAssessment.overallRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(drawdownAnalysis.riskAssessment.overallRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {drawdownAnalysis.riskAssessment.overallRisk}/100
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Render volatility analysis tab
  const renderVolatilityAnalysisTab = () => {
    if (!volatilityAnalysis) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No volatility analysis data available. Please run the analysis.
          </Typography>
          <Button
            variant="contained"
            onClick={loadVolatilityAnalysis}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Run Volatility Analysis
          </Button>
        </Box>
      );
    }

    // Prepare chart data for volatility regimes
    const volatilityRegimeData = {
      labels: volatilityAnalysis.volatilityRegimes.map((regime: any) => 
        `${new Date(regime.startDate).toLocaleDateString()} - ${new Date(regime.endDate).toLocaleDateString()}`
      ),
      datasets: [
        {
          label: 'Volatility',
          data: volatilityAnalysis.volatilityRegimes.map((regime: any) => regime.volatility * 100),
          backgroundColor: volatilityAnalysis.volatilityRegimes.map((regime: any) => {
            switch (regime.regime) {
              case 'low': return theme.palette.success.main;
              case 'medium': return theme.palette.warning.light;
              case 'high': return theme.palette.warning.main;
              case 'extreme': return theme.palette.error.main;
              default: return theme.palette.primary.main;
            }
          }),
          borderColor: theme.palette.divider,
          borderWidth: 1
        }
      ]
    };

    const volatilityRegimeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Volatility (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time Period'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const regime = volatilityAnalysis.volatilityRegimes[context.dataIndex];
              return [
                `Volatility: ${context.raw.toFixed(2)}%`,
                `Regime: ${regime.regime.charAt(0).toUpperCase() + regime.regime.slice(1)}`,
                `Performance: ${(regime.performance * 100).toFixed(2)}%`
              ];
            }
          }
        }
      }
    };

    return (
      <Box>
        {/* Volatility Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Overall Volatility
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercentage(volatilityAnalysis.overallVolatility)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Annualized Volatility
                </Typography>
                <Typography variant="h5" component="div">
                  {formatPercentage(volatilityAnalysis.annualizedVolatility)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Volatility Trend
                </Typography>
                <Typography variant="h5" component="div">
                  {volatilityAnalysis.volatilityTrend.charAt(0).toUpperCase() + volatilityAnalysis.volatilityTrend.slice(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Volatility Regimes Chart */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Volatility Regimes" />
          <Divider />
          <CardContent sx={{ height: 300 }}>
            <Bar data={volatilityRegimeData} options={volatilityRegimeOptions as any} />
          </CardContent>
        </Card>

        {/* Volatility by Market Condition */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Volatility by Market Condition" />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Market Condition</TableCell>
                    <TableCell align="right">Volatility</TableCell>
                    <TableCell align="right">Relative Difference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {volatilityAnalysis.volatilityByMarketCondition.map((condition: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{getMarketConditionLabel(condition.condition)}</TableCell>
                      <TableCell align="right">{formatPercentage(condition.volatility)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: condition.relativeDifference > 0 ? 'error.main' : 'success.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {condition.relativeDifference > 0 ? '+' : ''}{formatPercentage(condition.relativeDifference)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader title="Volatility Risk Assessment" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Volatility Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={volatilityAnalysis.riskAssessment.volatilityRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(volatilityAnalysis.riskAssessment.volatilityRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {volatilityAnalysis.riskAssessment.volatilityRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Regime Change Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={volatilityAnalysis.riskAssessment.regimeChangeRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(volatilityAnalysis.riskAssessment.regimeChangeRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {volatilityAnalysis.riskAssessment.regimeChangeRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={volatilityAnalysis.riskAssessment.overallRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(volatilityAnalysis.riskAssessment.overallRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {volatilityAnalysis.riskAssessment.overallRisk}/100
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Render correlation analysis tab
  const renderCorrelationAnalysisTab = () => {
    if (!correlationAnalysis) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No correlation analysis data available. Please run the analysis.
          </Typography>
          <Button
            variant="contained"
            onClick={loadCorrelationAnalysis}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Run Correlation Analysis
          </Button>
        </Box>
      );
    }

    // Prepare radar chart data for correlations
    const correlationData = {
      labels: correlationAnalysis.correlations.map((corr: any) => corr.ticker),
      datasets: [
        {
          label: 'Correlation',
          data: correlationAnalysis.correlations.map((corr: any) => corr.correlation),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }
      ]
    };

    const correlationOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: -1,
          suggestedMax: 1
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    return (
      <Box>
        {/* Correlation Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Market Correlation
                </Typography>
                <Typography variant="h5" component="div">
                  {correlationAnalysis.marketCorrelation.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Correlation Interpretation
                </Typography>
                <Typography variant="body2">
                  {correlationAnalysis.marketCorrelation > 0.7 ? 
                    'This strategy has a strong positive correlation with the market, indicating it will likely perform similarly to the overall market.' :
                   correlationAnalysis.marketCorrelation > 0.3 ?
                    'This strategy has a moderate positive correlation with the market, providing some diversification benefits while still capturing market upside.' :
                   correlationAnalysis.marketCorrelation > -0.3 ?
                    'This strategy has a low correlation with the market, providing good diversification benefits.' :
                   correlationAnalysis.marketCorrelation > -0.7 ?
                    'This strategy has a moderate negative correlation with the market, potentially providing protection during market downturns.' :
                    'This strategy has a strong negative correlation with the market, making it an excellent hedge against market declines.'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Correlation Chart */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Asset Correlations" />
          <Divider />
          <CardContent sx={{ height: 400 }}>
            <Radar data={correlationData} options={correlationOptions as any} />
          </CardContent>
        </Card>

        {/* Correlation Details */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Correlation Details" />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Asset</TableCell>
                    <TableCell align="right">Correlation</TableCell>
                    <TableCell align="right">Significance</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {correlationAnalysis.correlations.map((corr: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{corr.ticker}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: Math.abs(corr.correlation) > 0.7 ? 'error.main' : 
                                 Math.abs(corr.correlation) > 0.3 ? 'warning.main' : 
                                 'success.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {corr.correlation.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{corr.significance}/100</TableCell>
                      <TableCell>{corr.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader title="Correlation Risk Assessment" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Correlation Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={correlationAnalysis.riskAssessment.correlationRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(correlationAnalysis.riskAssessment.correlationRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {correlationAnalysis.riskAssessment.correlationRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Diversification Benefit
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={correlationAnalysis.riskAssessment.diversificationBenefit} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme.palette.success.main
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {correlationAnalysis.riskAssessment.diversificationBenefit}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={correlationAnalysis.riskAssessment.overallRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(correlationAnalysis.riskAssessment.overallRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {correlationAnalysis.riskAssessment.overallRisk}/100
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Render tail risk analysis tab
  const renderTailRiskAnalysisTab = () => {
    if (!tailRiskAnalysis) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No tail risk analysis data available. Please run the analysis.
          </Typography>
          <Button
            variant="contained"
            onClick={loadTailRiskAnalysis}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Run Tail Risk Analysis
          </Button>
        </Box>
      );
    }

    return (
      <Box>
        {/* Tail Risk Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Value at Risk (95%)
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {formatPercentage(tailRiskAnalysis.valueAtRisk)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Maximum expected loss with 95% confidence
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Conditional VaR (Expected Shortfall)
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {formatPercentage(tailRiskAnalysis.conditionalVaR)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average loss in the worst 5% of cases
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Maximum Loss
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {formatPercentage(tailRiskAnalysis.maxLoss)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Worst historical loss observed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tail Events */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Historical Tail Events" />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Loss</TableCell>
                    <TableCell>Cause</TableCell>
                    <TableCell align="right">Recovery (days)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tailRiskAnalysis.tailEvents.map((event: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatPercentage(event.loss)}
                      </TableCell>
                      <TableCell>{event.cause}</TableCell>
                      <TableCell align="right">
                        {event.recoveryDuration !== null ? `${event.recoveryDuration}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Tail Risk by Market Condition */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Tail Risk by Market Condition" />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Market Condition</TableCell>
                    <TableCell align="right">Value at Risk</TableCell>
                    <TableCell align="right">Conditional VaR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tailRiskAnalysis.tailRiskByMarketCondition.map((condition: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{getMarketConditionLabel(condition.condition)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatPercentage(condition.valueAtRisk)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatPercentage(condition.conditionalVaR)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader title="Tail Risk Assessment" />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Tail Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={tailRiskAnalysis.riskAssessment.tailRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(tailRiskAnalysis.riskAssessment.tailRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tailRiskAnalysis.riskAssessment.tailRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Extreme Event Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={tailRiskAnalysis.riskAssessment.extremeEventRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(tailRiskAnalysis.riskAssessment.extremeEventRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tailRiskAnalysis.riskAssessment.extremeEventRisk}/100
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Overall Risk
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={tailRiskAnalysis.riskAssessment.overallRisk} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 1,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: getRiskLevelColor(tailRiskAnalysis.riskAssessment.overallRisk)
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tailRiskAnalysis.riskAssessment.overallRisk}/100
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Render stress tests tab
  const renderStressTestsTab = () => {
    if (!stressTestResults) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No stress test results available. Please run the tests.
          </Typography>
          <Button
            variant="contained"
            onClick={loadStressTests}
            sx={{ mt: 2 }}
            disabled={loading}
          >
            Run Stress Tests
          </Button>
        </Box>
      );
    }

    // Prepare chart data for stress test results
    const stressTestData = {
      labels: stressTestResults.results.map((result: any) => result.scenario),
      datasets: [
        {
          label: 'Performance',
          data: stressTestResults.results.map((result: any) => result.performance * 100),
          backgroundColor: stressTestResults.results.map((result: any) => 
            result.performance >= 0 ? theme.palette.success.main : theme.palette.error.main
          ),
          borderColor: theme.palette.divider,
          borderWidth: 1
        }
      ]
    };

    const stressTestOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: {
            display: true,
            text: 'Performance (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Stress Test Scenario'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    };

    return (
      <Box>
        {/* Stress Test Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Average Performance
                </Typography>
                <Typography 
                  variant="h5" 
                  component="div"
                  color={stressTestResults.averagePerformance >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercentage(stressTestResults.averagePerformance)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Average Max Drawdown
                </Typography>
                <Typography variant="h5" component="div" color="error.main">
                  {formatPercentage(stressTestResults.averageMaxDrawdown)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Risk Score
                </Typography>
                <Typography variant="h5" component="div">
                  {stressTestResults.riskScore}/100
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Stress Test Chart */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="Stress Test Results" />
          <Divider />
          <CardContent sx={{ height: 300 }}>
            <Bar data={stressTestData} options={stressTestOptions as any} />
          </CardContent>
        </Card>

        {/* Stress Test Details */}
        <Card>
          <CardHeader title="Stress Test Details" />
          <Divider />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Scenario</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Performance</TableCell>
                    <TableCell align="right">Max Drawdown</TableCell>
                    <TableCell align="right">Win Rate</TableCell>
                    <TableCell align="right">Recovery Period</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stressTestResults.results.map((result: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{result.scenario}</TableCell>
                      <TableCell>{result.description}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: result.performance >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatPercentage(result.performance)}
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {formatPercentage(result.maxDrawdown)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(result.winRate)}
                      </TableCell>
                      <TableCell align="right">
                        {result.recoveryPeriod !== null ? `${result.recoveryPeriod} days` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Risk Analysis: {strategy.name} on {ticker}
      </Typography>
      
      {/* Date Range Selector */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={handleStartDateChange}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <TextField
            label="End Date"
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={handleEndDateChange}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={() => {
              // Reload data for the current tab
              switch (activeTab) {
                case 0:
                  loadRiskAnalysis();
                  break;
                case 1:
                  loadDrawdownAnalysis();
                  break;
                case 2:
                  loadVolatilityAnalysis();
                  break;
                case 3:
                  loadCorrelationAnalysis();
                  break;
                case 4:
                  loadTailRiskAnalysis();
                  break;
                case 5:
                  loadStressTests();
                  break;
              }
            }}
            disabled={loading}
          >
            Update
          </Button>
        </Grid>
      </Grid>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<RiskIcon />} iconPosition="start" label="Overview" />
          <Tab icon={<DrawdownIcon />} iconPosition="start" label="Drawdown" />
          <Tab icon={<VolatilityIcon />} iconPosition="start" label="Volatility" />
          <Tab icon={<CorrelationIcon />} iconPosition="start" label="Correlation" />
          <Tab icon={<TailRiskIcon />} iconPosition="start" label="Tail Risk" />
          <Tab icon={<StressTestIcon />} iconPosition="start" label="Stress Tests" />
        </Tabs>
      </Box>
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Loading risk analysis data...
          </Typography>
        </Box>
      )}
      
      {/* Tab content */}
      {!loading && (
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && renderOverviewTab()}
          {activeTab === 1 && renderDrawdownAnalysisTab()}
          {activeTab === 2 && renderVolatilityAnalysisTab()}
          {activeTab === 3 && renderCorrelationAnalysisTab()}
          {activeTab === 4 && renderTailRiskAnalysisTab()}
          {activeTab === 5 && renderStressTestsTab()}
        </Box>
      )}
    </Paper>
  );
};

export default StrategyRiskAnalysisPanel;