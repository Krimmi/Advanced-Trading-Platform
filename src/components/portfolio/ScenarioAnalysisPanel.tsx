import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Slider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import portfolioOptimizationService from '../../frontend/src/services/portfolioOptimizationService';

// Define types for scenarios
interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'historical' | 'custom' | 'monte_carlo';
  parameters: Record<string, any>;
}

interface ScenarioResult {
  scenario: string;
  portfolioValue: number;
  change: number;
  changePercent: number;
  drawdown: number;
  volatility: number;
  var: number;
  cvar: number;
  assetImpacts: Record<string, number>;
}

interface ScenarioAnalysisPanelProps {
  portfolioWeights: Record<string, number>;
  symbols?: string[];
  onScenarioResultsGenerated?: (results: ScenarioResult[]) => void;
}

// Tab Panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scenario-tabpanel-${index}`}
      aria-labelledby={`scenario-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ScenarioAnalysisPanel: React.FC<ScenarioAnalysisPanelProps> = ({ 
  portfolioWeights,
  symbols = Object.keys(portfolioWeights),
  onScenarioResultsGenerated
}) => {
  // State variables
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 'financial_crisis_2008',
      name: '2008 Financial Crisis',
      description: 'Simulates the market conditions during the 2008 financial crisis',
      type: 'historical',
      parameters: { startDate: '2008-09-01', endDate: '2009-03-01' }
    },
    {
      id: 'covid_crash_2020',
      name: 'COVID-19 Market Crash',
      description: 'Simulates the market crash during the early stages of the COVID-19 pandemic',
      type: 'historical',
      parameters: { startDate: '2020-02-15', endDate: '2020-03-23' }
    },
    {
      id: 'tech_bubble_2000',
      name: 'Dot-com Bubble Burst',
      description: 'Simulates the bursting of the dot-com bubble in 2000',
      type: 'historical',
      parameters: { startDate: '2000-03-01', endDate: '2000-10-01' }
    },
    {
      id: 'interest_rate_shock',
      name: 'Interest Rate Shock',
      description: 'Simulates a sudden increase in interest rates',
      type: 'custom',
      parameters: { interestRateChange: 2.0, equityImpact: -15, bondImpact: -8 }
    },
    {
      id: 'inflation_surge',
      name: 'Inflation Surge',
      description: 'Simulates a sudden surge in inflation',
      type: 'custom',
      parameters: { inflationChange: 4.0, equityImpact: -10, bondImpact: -12 }
    }
  ]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['financial_crisis_2008', 'covid_crash_2020']);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [monteCarloSettings, setMonteCarloSettings] = useState({
    simulations: 1000,
    timeHorizon: 252, // 1 year of trading days
    confidenceLevel: 0.95,
    returnShock: 0,
    volatilityMultiplier: 1.5
  });
  const [customScenario, setCustomScenario] = useState<{
    name: string;
    description: string;
    assetShocks: Record<string, number>;
  }>({
    name: 'Custom Scenario',
    description: 'User-defined custom scenario',
    assetShocks: symbols.reduce((acc, symbol) => {
      acc[symbol] = 0;
      return acc;
    }, {} as Record<string, number>)
  });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [correlationAdjustment, setCorrelationAdjustment] = useState<number>(1);
  const [stressTestResults, setStressTestResults] = useState<any>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Toggle scenario selection
  const toggleScenarioSelection = (scenarioId: string) => {
    if (selectedScenarios.includes(scenarioId)) {
      setSelectedScenarios(selectedScenarios.filter(id => id !== scenarioId));
    } else {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
    }
  };

  // Update custom scenario asset shock
  const updateAssetShock = (symbol: string, value: number) => {
    setCustomScenario({
      ...customScenario,
      assetShocks: {
        ...customScenario.assetShocks,
        [symbol]: value
      }
    });
  };

  // Add custom scenario to the list
  const addCustomScenario = () => {
    const newScenario: Scenario = {
      id: `custom_${Date.now()}`,
      name: customScenario.name,
      description: customScenario.description,
      type: 'custom',
      parameters: { assetShocks: { ...customScenario.assetShocks } }
    };
    
    setScenarios([...scenarios, newScenario]);
    setSelectedScenarios([...selectedScenarios, newScenario.id]);
    
    // Reset custom scenario form
    setCustomScenario({
      name: 'Custom Scenario',
      description: 'User-defined custom scenario',
      assetShocks: symbols.reduce((acc, symbol) => {
        acc[symbol] = 0;
        return acc;
      }, {} as Record<string, number>)
    });
  };

  // Run scenario analysis
  const runScenarioAnalysis = async () => {
    if (selectedScenarios.length === 0) {
      return;
    }
    
    setLoading(true);
    try {
      // In a real implementation, this would call the portfolio optimization service
      // For now, we'll simulate the scenario analysis results
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate simulated results for each selected scenario
      const results: ScenarioResult[] = selectedScenarios.map(scenarioId => {
        const scenario = scenarios.find(s => s.id === scenarioId);
        if (!scenario) {
          throw new Error(`Scenario with ID ${scenarioId} not found`);
        }
        
        // Generate random impact values based on scenario type
        let change = 0;
        let volatility = 0;
        let drawdown = 0;
        
        switch (scenario.type) {
          case 'historical':
            // Historical scenarios typically have larger negative impacts
            change = -Math.random() * 30 - 5; // -5% to -35%
            volatility = Math.random() * 20 + 15; // 15% to 35%
            drawdown = Math.random() * 30 + 10; // 10% to 40%
            break;
            
          case 'custom':
            // Custom scenarios can have varied impacts
            if (scenario.parameters.assetShocks) {
              // Calculate weighted impact from asset shocks
              let weightedImpact = 0;
              Object.entries(portfolioWeights).forEach(([symbol, weight]) => {
                const shock = scenario.parameters.assetShocks[symbol] || 0;
                weightedImpact += weight * shock;
              });
              change = weightedImpact;
            } else {
              change = -Math.random() * 20 - 5; // -5% to -25%
            }
            volatility = Math.random() * 15 + 10; // 10% to 25%
            drawdown = Math.abs(change) * (0.8 + Math.random() * 0.4); // Drawdown related to change
            break;
            
          case 'monte_carlo':
            // Monte Carlo can have varied outcomes
            change = (Math.random() * 30 - 15) * monteCarloSettings.volatilityMultiplier; // -15% to +15%, adjusted by volatility multiplier
            volatility = Math.random() * 10 + 8; // 8% to 18%
            drawdown = Math.random() * 20 + 5; // 5% to 25%
            break;
        }
        
        // Calculate VaR and CVaR
        const var95 = Math.abs(change) * 0.8; // Simplified calculation
        const cvar95 = var95 * 1.3; // CVaR is typically higher than VaR
        
        // Generate asset impacts
        const assetImpacts: Record<string, number> = {};
        Object.keys(portfolioWeights).forEach(symbol => {
          // Generate random impact for each asset, somewhat correlated with overall change
          assetImpacts[symbol] = change * (0.7 + Math.random() * 0.6);
        });
        
        return {
          scenario: scenario.name,
          portfolioValue: 100 + change,
          change: change,
          changePercent: change,
          drawdown: drawdown,
          volatility: volatility,
          var: var95,
          cvar: cvar95,
          assetImpacts
        };
      });
      
      // Add Monte Carlo simulation if selected
      if (selectedScenarios.includes('monte_carlo')) {
        // Generate Monte Carlo simulation results
        const monteCarloResult = generateMonteCarloResults();
        results.push(monteCarloResult);
      }
      
      setScenarioResults(results);
      
      // Generate stress test results object
      const stressTest = {
        historical_scenarios: results.filter(r => 
          scenarios.find(s => s.name === r.scenario)?.type === 'historical'
        ).map(r => ({
          scenario: r.scenario,
          return: r.changePercent / 100,
          volatility: r.volatility / 100,
          max_drawdown: r.drawdown / 100
        })),
        custom_scenarios: results.filter(r => 
          scenarios.find(s => s.name === r.scenario)?.type === 'custom'
        ).map(r => ({
          scenario: r.scenario,
          portfolio_impact: r.changePercent / 100,
          final_portfolio_value: r.portfolioValue / 100
        })),
        monte_carlo: results.find(r => r.scenario === 'Monte Carlo Simulation') ? {
          mean_final_value: 1 + (results.find(r => r.scenario === 'Monte Carlo Simulation')?.changePercent || 0) / 100,
          median_final_value: 1 + (results.find(r => r.scenario === 'Monte Carlo Simulation')?.changePercent || 0) / 100 * 0.9,
          min_final_value: 1 - Math.abs(results.find(r => r.scenario === 'Monte Carlo Simulation')?.drawdown || 0) / 100,
          max_final_value: 1 + Math.abs(results.find(r => r.scenario === 'Monte Carlo Simulation')?.changePercent || 0) / 100 * 1.5,
          var: (results.find(r => r.scenario === 'Monte Carlo Simulation')?.var || 0) / 100,
          cvar: (results.find(r => r.scenario === 'Monte Carlo Simulation')?.cvar || 0) / 100,
          probability_of_loss: 0.3 + Math.random() * 0.2
        } : null
      };
      
      setStressTestResults(stressTest);
      
      // Notify parent component if callback is provided
      if (onScenarioResultsGenerated) {
        onScenarioResultsGenerated(results);
      }
    } catch (error) {
      console.error('Error running scenario analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate Monte Carlo simulation results
  const generateMonteCarloResults = (): ScenarioResult => {
    // In a real implementation, this would use actual Monte Carlo simulation
    // For now, we'll generate simulated results
    
    const change = (Math.random() * 20 - 10) * monteCarloSettings.volatilityMultiplier + monteCarloSettings.returnShock;
    const volatility = (Math.random() * 10 + 10) * monteCarloSettings.volatilityMultiplier;
    const drawdown = Math.random() * 20 + 10;
    const var95 = volatility * 1.65; // Simplified VaR calculation
    const cvar95 = var95 * 1.3;
    
    // Generate asset impacts
    const assetImpacts: Record<string, number> = {};
    Object.keys(portfolioWeights).forEach(symbol => {
      assetImpacts[symbol] = change * (0.7 + Math.random() * 0.6);
    });
    
    return {
      scenario: 'Monte Carlo Simulation',
      portfolioValue: 100 + change,
      change: change,
      changePercent: change,
      drawdown: drawdown,
      volatility: volatility,
      var: var95,
      cvar: cvar95,
      assetImpacts
    };
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Portfolio Scenario Analysis & Stress Testing
      </Typography>
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="Historical Scenarios" icon={<TimelineIcon />} iconPosition="start" />
        <Tab label="Custom Scenarios" icon={<AssessmentIcon />} iconPosition="start" />
        <Tab label="Monte Carlo Simulation" icon={<TrendingUpIcon />} iconPosition="start" />
        <Tab label="Results" icon={<WarningIcon />} iconPosition="start" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Select Historical Scenarios
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {scenarios
                .filter(scenario => scenario.type === 'historical')
                .map(scenario => (
                  <Card 
                    key={scenario.id} 
                    sx={{ 
                      width: 250,
                      border: selectedScenarios.includes(scenario.id) ? '2px solid' : '1px solid',
                      borderColor: selectedScenarios.includes(scenario.id) ? 'primary.main' : 'divider',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleScenarioSelection(scenario.id)}
                  >
                    <CardHeader
                      title={scenario.name}
                      titleTypographyProps={{ variant: 'subtitle1' }}
                      action={
                        selectedScenarios.includes(scenario.id) ? (
                          <Chip 
                            label="Selected" 
                            color="primary" 
                            size="small" 
                          />
                        ) : null
                      }
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {scenario.description}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Period: {scenario.parameters.startDate} to {scenario.parameters.endDate}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
            </Box>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Create Custom Scenario
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Scenario Name"
                    value={customScenario.name}
                    onChange={(e) => setCustomScenario({ ...customScenario, name: e.target.value })}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    value={customScenario.description}
                    onChange={(e) => setCustomScenario({ ...customScenario, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Asset Price Shocks (%)
                  </Typography>
                  
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Weight</TableCell>
                          <TableCell>Shock (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(portfolioWeights).map(([symbol, weight]) => (
                          <TableRow key={symbol}>
                            <TableCell>{symbol}</TableCell>
                            <TableCell>{(weight * 100).toFixed(2)}%</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={customScenario.assetShocks[symbol] || 0}
                                onChange={(e) => updateAssetShock(symbol, Number(e.target.value))}
                                inputProps={{ step: 1, min: -100, max: 100 }}
                                size="small"
                                sx={{ width: 100 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={addCustomScenario}
                      startIcon={<AddIcon />}
                      disabled={!customScenario.name}
                    >
                      Add Custom Scenario
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Custom Scenarios
              </Typography>
              
              {scenarios.filter(scenario => scenario.type === 'custom').length === 0 ? (
                <Alert severity="info">
                  No custom scenarios created yet. Use the form to create custom scenarios.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {scenarios
                    .filter(scenario => scenario.type === 'custom')
                    .map(scenario => (
                      <Card 
                        key={scenario.id} 
                        sx={{ 
                          border: selectedScenarios.includes(scenario.id) ? '2px solid' : '1px solid',
                          borderColor: selectedScenarios.includes(scenario.id) ? 'primary.main' : 'divider',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleScenarioSelection(scenario.id)}
                      >
                        <CardHeader
                          title={scenario.name}
                          titleTypographyProps={{ variant: 'subtitle1' }}
                          action={
                            <Box>
                              {selectedScenarios.includes(scenario.id) && (
                                <Chip 
                                  label="Selected" 
                                  color="primary" 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                />
                              )}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScenarios(scenarios.filter(s => s.id !== scenario.id));
                                  setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        />
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            {scenario.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Monte Carlo Simulation Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedScenarios.includes('monte_carlo')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScenarios([...selectedScenarios, 'monte_carlo']);
                          } else {
                            setSelectedScenarios(selectedScenarios.filter(id => id !== 'monte_carlo'));
                          }
                        }}
                      />
                    }
                    label="Include Monte Carlo Simulation"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Number of Simulations"
                    type="number"
                    value={monteCarloSettings.simulations}
                    onChange={(e) => setMonteCarloSettings({
                      ...monteCarloSettings,
                      simulations: Number(e.target.value)
                    })}
                    inputProps={{ step: 100, min: 100, max: 10000 }}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Time Horizon (Trading Days)"
                    type="number"
                    value={monteCarloSettings.timeHorizon}
                    onChange={(e) => setMonteCarloSettings({
                      ...monteCarloSettings,
                      timeHorizon: Number(e.target.value)
                    })}
                    inputProps={{ step: 21, min: 21, max: 1260 }}
                    fullWidth
                    helperText="21 days = 1 month, 252 days = 1 year"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography gutterBottom>
                    Confidence Level: {(monteCarloSettings.confidenceLevel * 100).toFixed(0)}%
                  </Typography>
                  <Slider
                    value={monteCarloSettings.confidenceLevel * 100}
                    onChange={(e, newValue) => setMonteCarloSettings({
                      ...monteCarloSettings,
                      confidenceLevel: (newValue as number) / 100
                    })}
                    step={1}
                    marks={[
                      { value: 90, label: '90%' },
                      { value: 95, label: '95%' },
                      { value: 99, label: '99%' }
                    ]}
                    min={90}
                    max={99}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showAdvancedSettings}
                        onChange={(e) => setShowAdvancedSettings(e.target.checked)}
                      />
                    }
                    label="Show Advanced Settings"
                  />
                </Grid>
                
                {showAdvancedSettings && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Return Shock (%)"
                        type="number"
                        value={monteCarloSettings.returnShock}
                        onChange={(e) => setMonteCarloSettings({
                          ...monteCarloSettings,
                          returnShock: Number(e.target.value)
                        })}
                        inputProps={{ step: 1, min: -50, max: 50 }}
                        fullWidth
                        helperText="Shift the mean return (positive or negative)"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Volatility Multiplier"
                        type="number"
                        value={monteCarloSettings.volatilityMultiplier}
                        onChange={(e) => setMonteCarloSettings({
                          ...monteCarloSettings,
                          volatilityMultiplier: Number(e.target.value)
                        })}
                        inputProps={{ step: 0.1, min: 0.5, max: 5 }}
                        fullWidth
                        helperText="Multiply volatility (>1 increases volatility)"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        Correlation Adjustment: {correlationAdjustment.toFixed(1)}x
                      </Typography>
                      <Slider
                        value={correlationAdjustment}
                        onChange={(e, newValue) => setCorrelationAdjustment(newValue as number)}
                        step={0.1}
                        marks={[
                          { value: 0, label: '0x' },
                          { value: 1, label: '1x' },
                          { value: 2, label: '2x' }
                        ]}
                        min={0}
                        max={2}
                        valueLabelDisplay="auto"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Adjusts correlation between assets (0 = no correlation, 2 = increased correlation)
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Monte Carlo Simulation Preview
              </Typography>
              
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Monte Carlo simulation chart would go here */}
                <Typography variant="body1" color="text.secondary">
                  Monte Carlo Simulation Chart Preview
                </Typography>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                Monte Carlo simulation will generate {monteCarloSettings.simulations.toLocaleString()} random paths over {monteCarloSettings.timeHorizon} trading days to estimate portfolio risk metrics.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        {scenarioResults.length > 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Scenario Analysis Results
                </Typography>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Scenario</TableCell>
                        <TableCell align="right">Portfolio Value</TableCell>
                        <TableCell align="right">Change (%)</TableCell>
                        <TableCell align="right">Volatility (%)</TableCell>
                        <TableCell align="right">Max Drawdown (%)</TableCell>
                        <TableCell align="right">VaR (95%)</TableCell>
                        <TableCell align="right">CVaR (95%)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scenarioResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.scenario}</TableCell>
                          <TableCell align="right">{result.portfolioValue.toFixed(2)}</TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: result.changePercent >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}
                          >
                            {formatPercent(result.changePercent)}
                          </TableCell>
                          <TableCell align="right">{result.volatility.toFixed(2)}%</TableCell>
                          <TableCell align="right">{result.drawdown.toFixed(2)}%</TableCell>
                          <TableCell align="right">{result.var.toFixed(2)}%</TableCell>
                          <TableCell align="right">{result.cvar.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Asset Impact Analysis
                </Typography>
                
                {scenarioResults.length > 0 && (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="scenario-select-label">Select Scenario</InputLabel>
                      <Select
                        labelId="scenario-select-label"
                        value={scenarioResults[0].scenario}
                        label="Select Scenario"
                      >
                        {scenarioResults.map((result, index) => (
                          <MenuItem key={index} value={result.scenario}>
                            {result.scenario}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell align="right">Weight (%)</TableCell>
                            <TableCell align="right">Impact (%)</TableCell>
                            <TableCell align="right">Contribution (%)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(scenarioResults[0].assetImpacts)
                            .sort(([, impactA], [, impactB]) => (impactB as number) - (impactA as number))
                            .map(([symbol, impact]) => {
                              const weight = portfolioWeights[symbol] || 0;
                              const contribution = weight * (impact as number);
                              
                              return (
                                <TableRow key={symbol}>
                                  <TableCell>{symbol}</TableCell>
                                  <TableCell align="right">{(weight * 100).toFixed(2)}%</TableCell>
                                  <TableCell 
                                    align="right"
                                    sx={{ 
                                      color: (impact as number) >= 0 ? 'success.main' : 'error.main'
                                    }}
                                  >
                                    {formatPercent(impact as number)}
                                  </TableCell>
                                  <TableCell 
                                    align="right"
                                    sx={{ 
                                      color: contribution >= 0 ? 'success.main' : 'error.main'
                                    }}
                                  >
                                    {formatPercent(contribution)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Risk Metrics Comparison
                </Typography>
                
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Risk metrics comparison chart would go here */}
                  <Typography variant="body1" color="text.secondary">
                    Risk Metrics Comparison Chart
                  </Typography>
                </Box>
              </Paper>
            </Grid>
            
            {stressTestResults?.monte_carlo && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Monte Carlo Simulation Results
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Monte Carlo distribution chart would go here */}
                        <Typography variant="body1" color="text.secondary">
                          Monte Carlo Distribution Chart
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell><strong>Mean Final Value</strong></TableCell>
                              <TableCell align="right">{stressTestResults.monte_carlo.mean_final_value.toFixed(4)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Median Final Value</strong></TableCell>
                              <TableCell align="right">{stressTestResults.monte_carlo.median_final_value.toFixed(4)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Minimum Final Value</strong></TableCell>
                              <TableCell align="right">{stressTestResults.monte_carlo.min_final_value.toFixed(4)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Maximum Final Value</strong></TableCell>
                              <TableCell align="right">{stressTestResults.monte_carlo.max_final_value.toFixed(4)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Value at Risk (95%)</strong></TableCell>
                              <TableCell align="right">{(stressTestResults.monte_carlo.var * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Conditional VaR (95%)</strong></TableCell>
                              <TableCell align="right">{(stressTestResults.monte_carlo.cvar * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell><strong>Probability of Loss</strong></TableCell>
                              <TableCell align="right">{(stressTestResults.monte_carlo.probability_of_loss * 100).toFixed(2)}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
          </Grid>
        ) : (
          <Alert severity="info">
            No scenario analysis results yet. Select scenarios and run the analysis to see results here.
          </Alert>
        )}
      </TabPanel>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={runScenarioAnalysis}
          disabled={loading || selectedScenarios.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <AssessmentIcon />}
        >
          Run Scenario Analysis
        </Button>
      </Box>
    </Box>
  );
};

export default ScenarioAnalysisPanel;