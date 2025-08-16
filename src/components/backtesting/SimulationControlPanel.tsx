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
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import WarningIcon from '@mui/icons-material/Warning';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';

import { BacktestResult } from '../../types/backtesting';
import { 
  SimulationConfig, 
  ScenarioType, 
  MonteCarloParameters,
  StressTestParameters,
  RegimeChangeParameters,
  CorrelationBreakdownParameters,
  BlackSwanParameters
} from '../../types/backtesting/simulationTypes';
import { BacktestingService, MarketSimulationService, MonteCarloService } from '../../services';
import MonteCarloSimulationPanel from './MonteCarloSimulationPanel';

interface SimulationControlPanelProps {
  backtestResult: BacktestResult | null;
  onSimulationCreated?: (simulationConfig: SimulationConfig) => void;
  onSimulationRun?: (simulationResult: any) => void;
}

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
      id={`simulation-tabpanel-${index}`}
      aria-labelledby={`simulation-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const SimulationControlPanel: React.FC<SimulationControlPanelProps> = ({
  backtestResult,
  onSimulationCreated,
  onSimulationRun
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarioType, setScenarioType] = useState<ScenarioType>(ScenarioType.MONTE_CARLO);
  const [simulationName, setSimulationName] = useState<string>('');
  const [simulationDescription, setSimulationDescription] = useState<string>('');
  
  // Monte Carlo parameters
  const [monteCarloParams, setMonteCarloParams] = useState<MonteCarloParameters>({
    iterations: 1000,
    confidenceInterval: 0.95,
    returnDistribution: 'normal',
    volatilityModel: 'constant',
    correlationModel: 'constant',
    seed: Math.floor(Math.random() * 10000)
  });
  
  // Stress test parameters
  const [stressTestParams, setStressTestParams] = useState<StressTestParameters>({
    scenario: 'market_crash',
    magnitude: 'moderate',
    duration: 30,
    affectedSectors: []
  });
  
  // Regime change parameters
  const [regimeChangeParams, setRegimeChangeParams] = useState<RegimeChangeParameters>({
    fromRegime: 'bull_market',
    toRegime: 'bear_market',
    transitionSpeed: 'gradual',
    transitionDate: new Date().toISOString().split('T')[0]
  });
  
  // Correlation breakdown parameters
  const [correlationParams, setCorrelationParams] = useState<CorrelationBreakdownParameters>({
    correlationShift: -0.5,
    affectedAssets: [],
    duration: 30,
    startDate: new Date().toISOString().split('T')[0]
  });
  
  // Black swan parameters
  const [blackSwanParams, setBlackSwanParams] = useState<BlackSwanParameters>({
    eventType: 'market_crash',
    impactMagnitude: 0.7,
    recoveryPattern: 'v_shaped',
    recoveryDuration: 90,
    affectedSectors: []
  });
  
  const backtestingService = new BacktestingService();
  const simulationService = new MarketSimulationService();
  const monteCarloService = new MonteCarloService();
  
  useEffect(() => {
    if (backtestResult) {
      setSimulationName(`${backtestResult.configId} - Simulation`);
      setSimulationDescription(`Simulation based on backtest ${backtestResult.configId}`);
      
      // If backtest has symbols, set them as affected assets
      if (backtestResult.symbols && backtestResult.symbols.length > 0) {
        setCorrelationParams(prev => ({
          ...prev,
          affectedAssets: backtestResult.symbols
        }));
      }
    }
  }, [backtestResult]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleScenarioTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setScenarioType(event.target.value as ScenarioType);
  };
  
  const handleMonteCarloParamChange = (param: keyof MonteCarloParameters, value: any) => {
    setMonteCarloParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleStressTestParamChange = (param: keyof StressTestParameters, value: any) => {
    setStressTestParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleRegimeChangeParamChange = (param: keyof RegimeChangeParameters, value: any) => {
    setRegimeChangeParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleCorrelationParamChange = (param: keyof CorrelationBreakdownParameters, value: any) => {
    setCorrelationParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const handleBlackSwanParamChange = (param: keyof BlackSwanParameters, value: any) => {
    setBlackSwanParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const getScenarioParameters = () => {
    switch (scenarioType) {
      case ScenarioType.MONTE_CARLO:
        return monteCarloParams;
      case ScenarioType.STRESS_TEST:
        return stressTestParams;
      case ScenarioType.REGIME_CHANGE:
        return regimeChangeParams;
      case ScenarioType.CORRELATION_BREAKDOWN:
        return correlationParams;
      case ScenarioType.BLACK_SWAN:
        return blackSwanParams;
      default:
        return {};
    }
  };
  
  const handleCreateSimulation = async () => {
    if (!backtestResult) {
      setError('No backtest result selected');
      return;
    }
    
    if (!simulationName) {
      setError('Simulation name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const simulationConfig: SimulationConfig = {
        name: simulationName,
        description: simulationDescription,
        backtestConfigId: backtestResult.configId,
        scenarioType,
        parameters: getScenarioParameters()
      };
      
      const createdConfig = await simulationService.createSimulationConfig(simulationConfig);
      
      if (onSimulationCreated) {
        onSimulationCreated(createdConfig);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error creating simulation:', err);
      setError('Failed to create simulation. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleRunSimulation = async () => {
    if (!backtestResult) {
      setError('No backtest result selected');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const simulationConfig: SimulationConfig = {
        name: simulationName,
        description: simulationDescription,
        backtestConfigId: backtestResult.configId,
        scenarioType,
        parameters: getScenarioParameters()
      };
      
      const simulationResult = await simulationService.runSimulation(simulationConfig);
      
      if (onSimulationRun) {
        onSimulationRun(simulationResult);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error running simulation:', err);
      setError('Failed to run simulation. Please try again later.');
      setLoading(false);
    }
  };
  
  const renderMonteCarloParams = () => (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Monte Carlo Simulation Parameters" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Number of Iterations"
              type="number"
              value={monteCarloParams.iterations}
              onChange={(e) => handleMonteCarloParamChange('iterations', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 100, max: 10000 } }}
              helperText="Number of simulation runs (100-10000)"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Return Distribution</InputLabel>
              <Select
                value={monteCarloParams.returnDistribution}
                onChange={(e) => handleMonteCarloParamChange('returnDistribution', e.target.value)}
                label="Return Distribution"
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="empirical">Empirical</MenuItem>
                <MenuItem value="student-t">Student-t</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Statistical distribution for returns</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Volatility Model</InputLabel>
              <Select
                value={monteCarloParams.volatilityModel}
                onChange={(e) => handleMonteCarloParamChange('volatilityModel', e.target.value)}
                label="Volatility Model"
              >
                <MenuItem value="constant">Constant</MenuItem>
                <MenuItem value="garch">GARCH</MenuItem>
                <MenuItem value="ewma">EWMA</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Model for estimating volatility</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Correlation Model</InputLabel>
              <Select
                value={monteCarloParams.correlationModel}
                onChange={(e) => handleMonteCarloParamChange('correlationModel', e.target.value)}
                label="Correlation Model"
              >
                <MenuItem value="constant">Constant</MenuItem>
                <MenuItem value="dynamic">Dynamic</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Model for asset correlations</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Confidence Interval</Typography>
            <Slider
              value={monteCarloParams.confidenceInterval * 100}
              onChange={(e, newValue) => handleMonteCarloParamChange('confidenceInterval', (newValue as number) / 100)}
              valueLabelDisplay="auto"
              step={1}
              marks={[
                { value: 90, label: '90%' },
                { value: 95, label: '95%' },
                { value: 99, label: '99%' }
              ]}
              min={80}
              max={99}
            />
            <FormHelperText>Statistical confidence level for results</FormHelperText>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Random Seed"
              type="number"
              value={monteCarloParams.seed}
              onChange={(e) => handleMonteCarloParamChange('seed', parseInt(e.target.value))}
              helperText="Seed for random number generation (for reproducibility)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<BarChartIcon />}
              onClick={() => setActiveTab(1)}
              sx={{ mt: 2 }}
            >
              Use Advanced Monte Carlo Simulation
            </Button>
            <FormHelperText>
              Switch to the advanced Monte Carlo simulation panel for more detailed configuration and analysis
            </FormHelperText>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  const renderStressTestParams = () => (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Stress Test Parameters" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Scenario</InputLabel>
              <Select
                value={stressTestParams.scenario}
                onChange={(e) => handleStressTestParamChange('scenario', e.target.value)}
                label="Scenario"
              >
                <MenuItem value="market_crash">Market Crash</MenuItem>
                <MenuItem value="recession">Recession</MenuItem>
                <MenuItem value="interest_rate_spike">Interest Rate Spike</MenuItem>
                <MenuItem value="liquidity_crisis">Liquidity Crisis</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Type of stress scenario to simulate</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Magnitude</InputLabel>
              <Select
                value={stressTestParams.magnitude}
                onChange={(e) => handleStressTestParamChange('magnitude', e.target.value)}
                label="Magnitude"
              >
                <MenuItem value="mild">Mild</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="severe">Severe</MenuItem>
                <MenuItem value="extreme">Extreme</MenuItem>
              </Select>
              <FormHelperText>Severity of the stress event</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duration (days)"
              type="number"
              value={stressTestParams.duration}
              onChange={(e) => handleStressTestParamChange('duration', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 365 } }}
              helperText="Duration of the stress event in days"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Affected Sectors</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Technology', 'Financial', 'Healthcare', 'Energy', 'Consumer', 'Industrial', 'All'].map((sector) => (
                <Chip
                  key={sector}
                  label={sector}
                  onClick={() => {
                    const updatedSectors = stressTestParams.affectedSectors?.includes(sector)
                      ? stressTestParams.affectedSectors.filter(s => s !== sector)
                      : [...(stressTestParams.affectedSectors || []), sector];
                    handleStressTestParamChange('affectedSectors', updatedSectors);
                  }}
                  color={stressTestParams.affectedSectors?.includes(sector) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            <FormHelperText>Select sectors affected by the stress event</FormHelperText>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  const renderRegimeChangeParams = () => (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Regime Change Parameters" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>From Regime</InputLabel>
              <Select
                value={regimeChangeParams.fromRegime}
                onChange={(e) => handleRegimeChangeParamChange('fromRegime', e.target.value)}
                label="From Regime"
              >
                <MenuItem value="bull_market">Bull Market</MenuItem>
                <MenuItem value="bear_market">Bear Market</MenuItem>
                <MenuItem value="high_volatility">High Volatility</MenuItem>
                <MenuItem value="low_volatility">Low Volatility</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Starting market regime</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>To Regime</InputLabel>
              <Select
                value={regimeChangeParams.toRegime}
                onChange={(e) => handleRegimeChangeParamChange('toRegime', e.target.value)}
                label="To Regime"
              >
                <MenuItem value="bull_market">Bull Market</MenuItem>
                <MenuItem value="bear_market">Bear Market</MenuItem>
                <MenuItem value="high_volatility">High Volatility</MenuItem>
                <MenuItem value="low_volatility">Low Volatility</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Ending market regime</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Transition Speed</InputLabel>
              <Select
                value={regimeChangeParams.transitionSpeed}
                onChange={(e) => handleRegimeChangeParamChange('transitionSpeed', e.target.value)}
                label="Transition Speed"
              >
                <MenuItem value="instant">Instant</MenuItem>
                <MenuItem value="fast">Fast</MenuItem>
                <MenuItem value="gradual">Gradual</MenuItem>
                <MenuItem value="slow">Slow</MenuItem>
              </Select>
              <FormHelperText>Speed of transition between regimes</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Transition Date"
              type="date"
              value={regimeChangeParams.transitionDate}
              onChange={(e) => handleRegimeChangeParamChange('transitionDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Date when regime change begins"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  const renderCorrelationBreakdownParams = () => (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Correlation Breakdown Parameters" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography gutterBottom>Correlation Shift</Typography>
            <Slider
              value={correlationParams.correlationShift * 100}
              onChange={(e, newValue) => handleCorrelationParamChange('correlationShift', (newValue as number) / 100)}
              valueLabelDisplay="auto"
              step={5}
              marks={[
                { value: -100, label: '-1.0' },
                { value: -50, label: '-0.5' },
                { value: 0, label: '0' },
                { value: 50, label: '0.5' },
                { value: 100, label: '1.0' }
              ]}
              min={-100}
              max={100}
            />
            <FormHelperText>Change in correlation coefficient (-1 to 1)</FormHelperText>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Duration (days)"
              type="number"
              value={correlationParams.duration}
              onChange={(e) => handleCorrelationParamChange('duration', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 365 } }}
              helperText="Duration of correlation breakdown in days"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={correlationParams.startDate}
              onChange={(e) => handleCorrelationParamChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Date when correlation breakdown begins"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Affected Assets</Typography>
            {backtestResult?.symbols && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {backtestResult.symbols.map((symbol) => (
                  <Chip
                    key={symbol}
                    label={symbol}
                    onClick={() => {
                      const updatedAssets = correlationParams.affectedAssets.includes(symbol)
                        ? correlationParams.affectedAssets.filter(s => s !== symbol)
                        : [...correlationParams.affectedAssets, symbol];
                      handleCorrelationParamChange('affectedAssets', updatedAssets);
                    }}
                    color={correlationParams.affectedAssets.includes(symbol) ? 'primary' : 'default'}
                  />
                ))}
              </Box>
            )}
            <FormHelperText>Select assets affected by correlation breakdown</FormHelperText>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  const renderBlackSwanParams = () => (
    <Card sx={{ mt: 2 }}>
      <CardHeader title="Black Swan Event Parameters" />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={blackSwanParams.eventType}
                onChange={(e) => handleBlackSwanParamChange('eventType', e.target.value)}
                label="Event Type"
              >
                <MenuItem value="market_crash">Market Crash</MenuItem>
                <MenuItem value="natural_disaster">Natural Disaster</MenuItem>
                <MenuItem value="geopolitical_crisis">Geopolitical Crisis</MenuItem>
                <MenuItem value="pandemic">Pandemic</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Type of black swan event</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Recovery Pattern</InputLabel>
              <Select
                value={blackSwanParams.recoveryPattern}
                onChange={(e) => handleBlackSwanParamChange('recoveryPattern', e.target.value)}
                label="Recovery Pattern"
              >
                <MenuItem value="v_shaped">V-Shaped</MenuItem>
                <MenuItem value="u_shaped">U-Shaped</MenuItem>
                <MenuItem value="l_shaped">L-Shaped</MenuItem>
                <MenuItem value="w_shaped">W-Shaped</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
              <FormHelperText>Market recovery pattern after event</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Impact Magnitude</Typography>
            <Slider
              value={blackSwanParams.impactMagnitude * 100}
              onChange={(e, newValue) => handleBlackSwanParamChange('impactMagnitude', (newValue as number) / 100)}
              valueLabelDisplay="auto"
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' }
              ]}
              min={0}
              max={100}
            />
            <FormHelperText>Severity of market impact (0-100%)</FormHelperText>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Recovery Duration (days)"
              type="number"
              value={blackSwanParams.recoveryDuration}
              onChange={(e) => handleBlackSwanParamChange('recoveryDuration', parseInt(e.target.value))}
              InputProps={{ inputProps: { min: 1, max: 1000 } }}
              helperText="Duration of market recovery in days"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography gutterBottom>Affected Sectors</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Technology', 'Financial', 'Healthcare', 'Energy', 'Consumer', 'Industrial', 'All'].map((sector) => (
                <Chip
                  key={sector}
                  label={sector}
                  onClick={() => {
                    const updatedSectors = blackSwanParams.affectedSectors?.includes(sector)
                      ? blackSwanParams.affectedSectors.filter(s => s !== sector)
                      : [...(blackSwanParams.affectedSectors || []), sector];
                    handleBlackSwanParamChange('affectedSectors', updatedSectors);
                  }}
                  color={blackSwanParams.affectedSectors?.includes(sector) ? 'primary' : 'default'}
                />
              ))}
            </Box>
            <FormHelperText>Select sectors affected by the event</FormHelperText>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
  
  const renderScenarioParams = () => {
    switch (scenarioType) {
      case ScenarioType.MONTE_CARLO:
        return renderMonteCarloParams();
      case ScenarioType.STRESS_TEST:
        return renderStressTestParams();
      case ScenarioType.REGIME_CHANGE:
        return renderRegimeChangeParams();
      case ScenarioType.CORRELATION_BREAKDOWN:
        return renderCorrelationBreakdownParams();
      case ScenarioType.BLACK_SWAN:
        return renderBlackSwanParams();
      default:
        return null;
    }
  };
  
  const renderBasicSimulationTab = () => {
    if (!backtestResult) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">No backtest result selected</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please run a backtest or select a result to create a simulation.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Card sx={{ mb: 2 }}>
          <CardHeader title="Simulation Configuration" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Simulation Name"
                  value={simulationName}
                  onChange={(e) => setSimulationName(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Scenario Type</InputLabel>
                  <Select
                    value={scenarioType}
                    onChange={(e: any) => handleScenarioTypeChange(e)}
                    label="Scenario Type"
                  >
                    <MenuItem value={ScenarioType.MONTE_CARLO}>Monte Carlo</MenuItem>
                    <MenuItem value={ScenarioType.STRESS_TEST}>Stress Test</MenuItem>
                    <MenuItem value={ScenarioType.REGIME_CHANGE}>Regime Change</MenuItem>
                    <MenuItem value={ScenarioType.CORRELATION_BREAKDOWN}>Correlation Breakdown</MenuItem>
                    <MenuItem value={ScenarioType.BLACK_SWAN}>Black Swan Event</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={simulationDescription}
                  onChange={(e) => setSimulationDescription(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {renderScenarioParams()}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={handleCreateSimulation}
            disabled={loading}
          >
            Save Configuration
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunSimulation}
            disabled={loading}
            color="primary"
          >
            Run Simulation
          </Button>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" icon={<WarningIcon />}>
            <Typography variant="body2">
              Simulations are hypothetical and do not guarantee future results. They are based on historical data and assumptions that may not hold in the future.
            </Typography>
          </Alert>
        </Box>
      </Box>
    );
  };
  
  if (!backtestResult) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No backtest result selected</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please run a backtest or select a result to create a simulation.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h5" component="h1">
              Market Simulation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create and run market simulations based on backtest results
            </Typography>
          </Grid>
          <Grid item>
            {activeTab === 0 && (
              <>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleRunSimulation}
                  disabled={loading}
                  sx={{ mr: 1 }}
                >
                  Run Simulation
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleCreateSimulation}
                  disabled={loading}
                >
                  Save Configuration
                </Button>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {!loading && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab 
                icon={<SettingsIcon />} 
                iconPosition="start" 
                label="Basic Simulation" 
                id="simulation-tab-0" 
                aria-controls="simulation-tabpanel-0" 
              />
              <Tab 
                icon={<TimelineIcon />} 
                iconPosition="start" 
                label="Advanced Monte Carlo" 
                id="simulation-tab-1" 
                aria-controls="simulation-tabpanel-1" 
              />
            </Tabs>
          </Box>
          
          <TabPanel value={activeTab} index={0}>
            {renderBasicSimulationTab()}
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <MonteCarloSimulationPanel 
              backtestResult={backtestResult}
              onSimulationRun={(result) => {
                if (onSimulationRun) {
                  onSimulationRun(result);
                }
              }}
            />
          </TabPanel>
        </Box>
      )}
    </Box>
  );
};

export default SimulationControlPanel;