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
  Paper,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert
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
  RiskScenario,
  StressTestResult,
  PositionStressResult,
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

const ScenarioCard = styled(Paper)<{ selected?: boolean }>(({ theme, selected }) => ({
  padding: theme.spacing(2),
  cursor: 'pointer',
  border: selected ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: theme.shadows[3],
    borderColor: selected ? theme.palette.primary.main : theme.palette.divider
  }
}));

const PositiveChange = styled(Typography)(({ theme }) => ({
  color: theme.palette.success.main,
  fontWeight: 'bold'
}));

const NegativeChange = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontWeight: 'bold'
}));

// Interface for component props
interface StressTestingPanelProps {
  portfolioId: string;
  onRefresh?: () => void;
}

/**
 * StressTestingPanel displays stress test results and scenarios
 */
const StressTestingPanel: React.FC<StressTestingPanelProps> = ({
  portfolioId,
  onRefresh
}) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [scenarios, setScenarios] = useState<RiskScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [stressTestResult, setStressTestResult] = useState<StressTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chart data
  const [impactChartData, setImpactChartData] = useState<any[]>([]);
  
  // Load data
  useEffect(() => {
    loadData();
  }, [portfolioId]);
  
  // Load portfolio and scenario data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      
      // Get portfolio
      const portfolioData = await riskService.getPortfolio(portfolioId);
      setPortfolio(portfolioData);
      
      // Get available scenarios
      const scenariosData = await riskService.getAvailableScenarios();
      setScenarios(scenariosData);
      
      // Set selected scenario if not already set
      if (scenariosData.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(scenariosData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run stress test
  const runStressTest = async () => {
    if (!selectedScenarioId || !portfolio) {
      return;
    }
    
    setIsRunningTest(true);
    setError(null);
    
    try {
      const riskService = RiskCalculationServiceFactory.getService();
      
      // Run stress test
      const result = await riskService.runStressTest(portfolioId, selectedScenarioId);
      setStressTestResult(result);
      
      // Prepare chart data
      prepareChartData(result);
    } catch (err) {
      console.error('Error running stress test:', err);
      setError(`Failed to run stress test: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunningTest(false);
    }
  };
  
  // Prepare chart data
  const prepareChartData = (result: StressTestResult) => {
    // Sort positions by absolute impact
    const sortedPositions = [...result.positionResults]
      .sort((a, b) => Math.abs(b.absoluteChange) - Math.abs(a.absoluteChange));
    
    // Create chart data
    const chartData = sortedPositions.map(position => ({
      symbol: position.symbol,
      impact: position.absoluteChange,
      percentageChange: position.percentageChange * 100
    }));
    
    setImpactChartData(chartData);
  };
  
  // Handle scenario selection
  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setStressTestResult(null);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadData();
    setStressTestResult(null);
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Get selected scenario
  const getSelectedScenario = (): RiskScenario | undefined => {
    return scenarios.find(s => s.id === selectedScenarioId);
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
    return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
  };
  
  // Get severity level based on percentage change
  const getImpactSeverity = (percentageChange: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (percentageChange >= -0.05) {
      return 'low';
    } else if (percentageChange >= -0.15) {
      return 'medium';
    } else if (percentageChange >= -0.25) {
      return 'high';
    } else {
      return 'critical';
    }
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
  if (!portfolio) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="400px">
        <Typography color="textSecondary" gutterBottom>No portfolio data available</Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Refresh
        </Button>
      </Box>
    );
  }
  
  // Get selected scenario
  const selectedScenario = getSelectedScenario();
  
  return (
    <StyledCard>
      <CardHeader
        title="Stress Testing"
        subheader={`Portfolio: ${portfolio.name}`}
        action={
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }
      />
      
      <Divider />
      
      <CardContent>
        {/* Scenarios */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>Available Scenarios</Typography>
          <Grid container spacing={2}>
            {scenarios.map(scenario => (
              <Grid item xs={12} md={6} lg={4} key={scenario.id}>
                <ScenarioCard 
                  selected={scenario.id === selectedScenarioId}
                  onClick={() => handleScenarioSelect(scenario.id)}
                >
                  <Typography variant="subtitle2" gutterBottom>{scenario.name}</Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {scenario.description}
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip 
                      label={scenario.isHistorical ? 'Historical' : 'Hypothetical'} 
                      size="small"
                      color={scenario.isHistorical ? 'primary' : 'default'}
                    />
                    {scenario.isHistorical && scenario.date && (
                      <Typography variant="caption" color="textSecondary">
                        {new Date(scenario.date).getFullYear()}
                      </Typography>
                    )}
                  </Box>
                </ScenarioCard>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Selected Scenario Details */}
        {selectedScenario && (
          <Box mb={4}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h6" gutterBottom>{selectedScenario.name}</Typography>
                  <Typography variant="body2" paragraph>
                    {selectedScenario.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={runStressTest}
                  disabled={isRunningTest}
                  startIcon={isRunningTest ? <CircularProgress size={20} /> : undefined}
                >
                  {isRunningTest ? 'Running...' : 'Run Stress Test'}
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Risk Factor Shifts</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Factor</TableCell>
                      <TableCell>Shift Type</TableCell>
                      <TableCell align="right">Shift Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedScenario.factors.map((factor, index) => (
                      <TableRow key={index}>
                        <TableCell>{factor.factorName}</TableCell>
                        <TableCell>
                          {factor.shiftType === 'percentage' ? 'Percentage' : 
                           factor.shiftType === 'absolute' ? 'Absolute' : 
                           'Relative'}
                        </TableCell>
                        <TableCell align="right">
                          {factor.shiftType === 'percentage' ? 
                            formatPercentage(factor.shiftValue) : 
                            factor.shiftValue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {selectedScenario.probability && (
                <Box mt={2}>
                  <Typography variant="body2">
                    Estimated probability: {formatPercentage(selectedScenario.probability)}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        )}
        
        {/* Stress Test Results */}
        {stressTestResult && (
          <>
            {/* Key Metrics */}
            <Box mb={4}>
              <Typography variant="subtitle1" gutterBottom>Stress Test Results</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <MetricCard>
                    <MetricValue severity={getImpactSeverity(stressTestResult.percentageChange)}>
                      {formatPercentage(stressTestResult.percentageChange)}
                    </MetricValue>
                    <MetricLabel>
                      Portfolio Impact
                    </MetricLabel>
                  </MetricCard>
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricCard>
                    <MetricValue severity={getImpactSeverity(stressTestResult.percentageChange)}>
                      {formatCurrency(stressTestResult.absoluteChange, portfolio.currency)}
                    </MetricValue>
                    <MetricLabel>
                      Absolute Change
                    </MetricLabel>
                  </MetricCard>
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricCard>
                    <MetricValue>
                      {formatCurrency(stressTestResult.portfolioValueBefore, portfolio.currency)}
                    </MetricValue>
                    <MetricLabel>
                      Value Before
                    </MetricLabel>
                  </MetricCard>
                </Grid>
                <Grid item xs={12} md={3}>
                  <MetricCard>
                    <MetricValue>
                      {formatCurrency(stressTestResult.portfolioValueAfter, portfolio.currency)}
                    </MetricValue>
                    <MetricLabel>
                      Value After
                    </MetricLabel>
                  </MetricCard>
                </Grid>
              </Grid>
            </Box>
            
            {/* Impact Chart */}
            <Box mb={4}>
              <Typography variant="subtitle1" gutterBottom>Position Impact Analysis</Typography>
              <Paper sx={{ p: 2, height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={impactChartData.slice(0, 10)} // Show top 10
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="symbol" type="category" width={80} />
                    <RechartsTooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${formatCurrency(value, portfolio.currency)} (${props.payload.percentageChange.toFixed(2)}%)`,
                        'Impact'
                      ]}
                    />
                    <Bar 
                      dataKey="impact" 
                      fill="#8884d8"
                      // Color based on positive/negative impact
                      fill={(data) => data.impact >= 0 ? '#4caf50' : '#f44336'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
            
            {/* Position Details */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>Position Details</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell align="right">Value Before</TableCell>
                      <TableCell align="right">Value After</TableCell>
                      <TableCell align="right">Absolute Change</TableCell>
                      <TableCell align="right">Percentage Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stressTestResult.positionResults.map((position) => (
                      <TableRow key={position.symbol}>
                        <TableCell component="th" scope="row">
                          {position.symbol}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(position.valueBefore, portfolio.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(position.valueAfter, portfolio.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {position.absoluteChange >= 0 ? (
                            <PositiveChange>
                              {formatCurrency(position.absoluteChange, portfolio.currency)}
                            </PositiveChange>
                          ) : (
                            <NegativeChange>
                              {formatCurrency(position.absoluteChange, portfolio.currency)}
                            </NegativeChange>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {position.percentageChange >= 0 ? (
                            <PositiveChange>
                              {formatPercentage(position.percentageChange)}
                            </PositiveChange>
                          ) : (
                            <NegativeChange>
                              {formatPercentage(position.percentageChange)}
                            </NegativeChange>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Add cash row if portfolio has cash */}
                    {portfolio.cash > 0 && (
                      <TableRow>
                        <TableCell component="th" scope="row">
                          Cash
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(portfolio.cash, portfolio.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(portfolio.cash, portfolio.currency)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography>
                            {formatCurrency(0, portfolio.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography>
                            {formatPercentage(0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            {/* Recommendations */}
            {stressTestResult.percentageChange < -0.1 && (
              <Box mt={4}>
                <Alert severity="warning">
                  <AlertTitle>Risk Mitigation Recommendations</AlertTitle>
                  <Typography variant="body2" paragraph>
                    This stress test shows significant portfolio vulnerability to the {stressTestResult.scenarioName} scenario.
                    Consider the following risk mitigation strategies:
                  </Typography>
                  <ul>
                    <li>Reduce exposure to the most impacted positions</li>
                    <li>Implement hedging strategies for key risk factors</li>
                    <li>Diversify across less correlated asset classes</li>
                    <li>Set up stop-loss orders for high-risk positions</li>
                  </ul>
                </Alert>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default StressTestingPanel;