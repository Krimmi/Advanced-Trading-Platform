import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControlLabel,
  Switch,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Label,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import eventService from '../../services/eventService';

interface EventDrivenStrategyBuilderProps {
  symbol: string;
}

interface EventType {
  value: string;
  label: string;
  description: string;
}

interface EventCondition {
  id: string;
  eventType: string;
  condition: string;
  value: number;
  operator: string;
}

interface StrategyRule {
  id: string;
  name: string;
  conditions: EventCondition[];
  action: string;
  positionSize: number;
  positionSizeType: string;
  stopLoss: number | null;
  takeProfit: number | null;
  holdingPeriod: number | null;
}

interface BacktestResult {
  performance: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    totalTrades: number;
  };
  equity: Array<{
    date: string;
    equity: number;
    benchmark: number;
  }>;
}

// Event types with descriptions
const eventTypes: EventType[] = [
  { value: 'earnings', label: 'Earnings Announcements', description: 'Quarterly or annual earnings reports released by the company' },
  { value: 'earnings_beat', label: 'Earnings Beat', description: 'When reported earnings exceed analyst expectations' },
  { value: 'earnings_miss', label: 'Earnings Miss', description: 'When reported earnings fall short of analyst expectations' },
  { value: 'dividend', label: 'Dividend Announcements', description: 'Declarations of dividend payments to shareholders' },
  { value: 'dividend_increase', label: 'Dividend Increase', description: 'Announcement of an increase in dividend payment' },
  { value: 'dividend_decrease', label: 'Dividend Decrease', description: 'Announcement of a decrease in dividend payment' },
  { value: 'split', label: 'Stock Splits', description: 'Division of existing shares into multiple shares' },
  { value: 'merger_acquisition', label: 'Mergers & Acquisitions', description: 'Announcements of company mergers or acquisitions' },
  { value: 'executive_change', label: 'Executive Changes', description: 'Changes in key executive positions like CEO or CFO' },
  { value: 'product_launch', label: 'Product Launches', description: 'Announcements of new product releases' },
  { value: 'legal_regulatory', label: 'Legal & Regulatory Events', description: 'Legal proceedings or regulatory decisions affecting the company' },
  { value: 'analyst_upgrade', label: 'Analyst Upgrades', description: 'When analysts improve their rating or price target for the stock' },
  { value: 'analyst_downgrade', label: 'Analyst Downgrades', description: 'When analysts lower their rating or price target for the stock' }
];

// Event conditions
const eventConditions = [
  { value: 'occurs', label: 'Occurs', description: 'The event happens' },
  { value: 'days_since', label: 'Days Since', description: 'Number of days since the event occurred' },
  { value: 'price_change_since', label: 'Price Change Since', description: 'Percentage price change since the event occurred' },
  { value: 'volume_change_since', label: 'Volume Change Since', description: 'Percentage volume change since the event occurred' },
  { value: 'volatility_change_since', label: 'Volatility Change Since', description: 'Percentage volatility change since the event occurred' }
];

// Condition operators
const conditionOperators = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'greater_than_or_equals', label: '≥' },
  { value: 'less_than_or_equals', label: '≤' }
];

// Strategy actions
const strategyActions = [
  { value: 'buy', label: 'Buy', description: 'Enter a long position' },
  { value: 'sell', label: 'Sell', description: 'Enter a short position' },
  { value: 'exit', label: 'Exit', description: 'Exit any existing position' }
];

// Position size types
const positionSizeTypes = [
  { value: 'percent', label: 'Percent of Portfolio', description: 'Percentage of total portfolio value' },
  { value: 'fixed', label: 'Fixed Dollar Amount', description: 'Fixed dollar amount per trade' },
  { value: 'shares', label: 'Number of Shares', description: 'Fixed number of shares per trade' }
];

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

const EventDrivenStrategyBuilder: React.FC<EventDrivenStrategyBuilderProps> = ({ symbol }) => {
  // Strategy state
  const [strategyName, setStrategyName] = useState<string>('');
  const [strategyDescription, setStrategyDescription] = useState<string>('');
  const [rules, setRules] = useState<StrategyRule[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Rule building state
  const [currentRuleName, setCurrentRuleName] = useState<string>('');
  const [currentConditions, setCurrentConditions] = useState<EventCondition[]>([]);
  const [currentAction, setCurrentAction] = useState<string>('buy');
  const [currentPositionSize, setCurrentPositionSize] = useState<number>(10);
  const [currentPositionSizeType, setCurrentPositionSizeType] = useState<string>('percent');
  const [useStopLoss, setUseStopLoss] = useState<boolean>(false);
  const [stopLoss, setStopLoss] = useState<number>(5);
  const [useTakeProfit, setUseTakeProfit] = useState<boolean>(false);
  const [takeProfit, setTakeProfit] = useState<number>(10);
  const [useHoldingPeriod, setUseHoldingPeriod] = useState<boolean>(false);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(10);
  
  // Backtest state
  const [startDate, setStartDate] = useState<string>('2020-01-01');
  const [endDate, setEndDate] = useState<string>('2023-12-31');
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [benchmark, setBenchmark] = useState<string>('SPY');
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);

  useEffect(() => {
    // Load saved strategies
    const loadSavedStrategies = async () => {
      try {
        const strategies = await eventService.getSavedEventStrategies(symbol);
        setSavedStrategies(strategies);
      } catch (err) {
        console.error('Error loading saved strategies:', err);
      }
    };
    
    loadSavedStrategies();
  }, [symbol]);

  // Add a new condition to the current rule
  const addCondition = () => {
    const newCondition: EventCondition = {
      id: generateId(),
      eventType: 'earnings',
      condition: 'occurs',
      value: 0,
      operator: 'equals'
    };
    
    setCurrentConditions([...currentConditions, newCondition]);
  };

  // Remove a condition from the current rule
  const removeCondition = (id: string) => {
    setCurrentConditions(currentConditions.filter(condition => condition.id !== id));
  };

  // Update a condition in the current rule
  const updateCondition = (id: string, field: keyof EventCondition, value: string | number) => {
    setCurrentConditions(currentConditions.map(condition => {
      if (condition.id === id) {
        return { ...condition, [field]: value };
      }
      return condition;
    }));
  };

  // Add the current rule to the strategy
  const addRule = () => {
    if (!currentRuleName || currentConditions.length === 0) {
      setError('Please provide a rule name and at least one condition');
      return;
    }
    
    const newRule: StrategyRule = {
      id: generateId(),
      name: currentRuleName,
      conditions: [...currentConditions],
      action: currentAction,
      positionSize: currentPositionSize,
      positionSizeType: currentPositionSizeType,
      stopLoss: useStopLoss ? stopLoss : null,
      takeProfit: useTakeProfit ? takeProfit : null,
      holdingPeriod: useHoldingPeriod ? holdingPeriod : null
    };
    
    setRules([...rules, newRule]);
    
    // Reset the rule building state
    setCurrentRuleName('');
    setCurrentConditions([]);
    setCurrentAction('buy');
    setCurrentPositionSize(10);
    setCurrentPositionSizeType('percent');
    setUseStopLoss(false);
    setUseTakeProfit(false);
    setUseHoldingPeriod(false);
    
    // Move to the next step
    setActiveStep(2);
  };

  // Remove a rule from the strategy
  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  // Run the backtest
  const runBacktest = async () => {
    if (rules.length === 0) {
      setError('Please add at least one rule to your strategy');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await eventService.runEventStrategyBacktest(symbol, {
        name: strategyName || 'Untitled Strategy',
        description: strategyDescription,
        rules,
        parameters: {
          startDate,
          endDate,
          initialCapital,
          benchmark
        }
      });
      
      setBacktestResult(result);
      setActiveStep(3);
    } catch (err) {
      console.error('Error running backtest:', err);
      setError('Failed to run backtest. Please check your strategy and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save the strategy
  const saveStrategy = async () => {
    if (!strategyName) {
      setError('Please provide a strategy name');
      return;
    }
    
    if (rules.length === 0) {
      setError('Please add at least one rule to your strategy');
      return;
    }
    
    try {
      await eventService.saveEventDrivenStrategy(symbol, {
        name: strategyName,
        description: strategyDescription,
        rules,
        performance: backtestResult ? {
          totalReturn: backtestResult.performance.totalReturn,
          sharpeRatio: backtestResult.performance.sharpeRatio,
          maxDrawdown: backtestResult.performance.maxDrawdown,
          winRate: backtestResult.performance.winRate
        } : null
      });
      
      // Reload saved strategies
      const strategies = await eventService.getSavedEventStrategies(symbol);
      setSavedStrategies(strategies);
      
      // Show success message
      alert('Strategy saved successfully!');
    } catch (err) {
      console.error('Error saving strategy:', err);
      setError('Failed to save strategy. Please try again.');
    }
  };

  // Load a saved strategy
  const loadStrategy = (strategy: any) => {
    setStrategyName(strategy.name);
    setStrategyDescription(strategy.description);
    setRules(strategy.rules);
    
    // Reset the rule building state
    setCurrentRuleName('');
    setCurrentConditions([]);
    setCurrentAction('buy');
    setCurrentPositionSize(10);
    setCurrentPositionSizeType('percent');
    setUseStopLoss(false);
    setUseTakeProfit(false);
    setUseHoldingPeriod(false);
    
    // Move to the strategy overview step
    setActiveStep(2);
  };

  // Format helpers
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Render the strategy setup step
  const renderStrategySetup = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Strategy Setup
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Strategy Name"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Description"
              value={strategyDescription}
              onChange={(e) => setStrategyDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Backtest Parameters
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Initial Capital"
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Number(e.target.value))}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
              margin="normal"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Benchmark"
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
              fullWidth
              helperText="Symbol to compare performance against (e.g., SPY)"
              margin="normal"
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={() => setActiveStep(1)}
            disabled={!strategyName}
          >
            Next: Add Rules
          </Button>
        </Box>
      </Box>
    );
  };

  // Render the rule builder step
  const renderRuleBuilder = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Rule Builder
        </Typography>
        
        <TextField
          label="Rule Name"
          value={currentRuleName}
          onChange={(e) => setCurrentRuleName(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Conditions
          </Typography>
          
          {currentConditions.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No conditions added yet. Add at least one condition to create a rule.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Operator</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentConditions.map((condition) => (
                    <TableRow key={condition.id}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={condition.eventType}
                            onChange={(e) => updateCondition(condition.id, 'eventType', e.target.value)}
                          >
                            {eventTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={condition.condition}
                            onChange={(e) => updateCondition(condition.id, 'condition', e.target.value)}
                          >
                            {eventConditions.map((cond) => (
                              <MenuItem key={cond.value} value={cond.value}>
                                {cond.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={condition.operator}
                            onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                          >
                            {conditionOperators.map((op) => (
                              <MenuItem key={op.value} value={op.value}>
                                {op.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={condition.value}
                          onChange={(e) => updateCondition(condition.id, 'value', Number(e.target.value))}
                          size="small"
                          sx={{ width: 80 }}
                          disabled={condition.condition === 'occurs'}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeCondition(condition.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addCondition}
            sx={{ mb: 3 }}
          >
            Add Condition
          </Button>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Action
          </Typography>
          
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={currentAction}
              onChange={(e) => setCurrentAction(e.target.value)}
            >
              {strategyActions.map((action) => (
                <FormControlLabel
                  key={action.value}
                  value={action.value}
                  control={<Radio />}
                  label={action.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Position Sizing
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6}>
              <TextField
                label="Position Size"
                type="number"
                value={currentPositionSize}
                onChange={(e) => setCurrentPositionSize(Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel id="position-size-type-label">Type</InputLabel>
                <Select
                  labelId="position-size-type-label"
                  id="position-size-type"
                  value={currentPositionSizeType}
                  label="Type"
                  onChange={(e) => setCurrentPositionSizeType(e.target.value)}
                >
                  {positionSizeTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Risk Management
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useStopLoss}
                    onChange={(e) => setUseStopLoss(e.target.checked)}
                  />
                }
                label="Use Stop Loss"
              />
              {useStopLoss && (
                <TextField
                  label="Stop Loss (%)"
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: '%',
                  }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useTakeProfit}
                    onChange={(e) => setUseTakeProfit(e.target.checked)}
                  />
                }
                label="Use Take Profit"
              />
              {useTakeProfit && (
                <TextField
                  label="Take Profit (%)"
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: '%',
                  }}
                />
              )}
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useHoldingPeriod}
                    onChange={(e) => setUseHoldingPeriod(e.target.checked)}
                  />
                }
                label="Use Max Holding Period"
              />
              {useHoldingPeriod && (
                <TextField
                  label="Max Holding Period (days)"
                  type="number"
                  value={holdingPeriod}
                  onChange={(e) => setHoldingPeriod(Number(e.target.value))}
                  fullWidth
                  margin="normal"
                />
              )}
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(0)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={addRule}
            disabled={!currentRuleName || currentConditions.length === 0}
          >
            Add Rule
          </Button>
        </Box>
      </Box>
    );
  };

  // Render the strategy overview step
  const renderStrategyOverview = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Strategy Overview
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6">
              {strategyName || 'Untitled Strategy'}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {strategyDescription || 'No description provided.'}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Rules
            </Typography>
            
            {rules.length === 0 ? (
              <Alert severity="warning">
                No rules added yet. Go back to the Rule Builder to add rules.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Rule Name</TableCell>
                      <TableCell>Conditions</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Position Size</TableCell>
                      <TableCell>Risk Management</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.name}</TableCell>
                        <TableCell>
                          {rule.conditions.map((condition, index) => (
                            <Box key={condition.id} sx={{ mb: 0.5 }}>
                              <Typography variant="body2">
                                {eventTypes.find(t => t.value === condition.eventType)?.label || condition.eventType}
                                {' '}
                                {eventConditions.find(c => c.value === condition.condition)?.label || condition.condition}
                                {condition.condition !== 'occurs' && (
                                  <>
                                    {' '}
                                    {conditionOperators.find(o => o.value === condition.operator)?.label || condition.operator}
                                    {' '}
                                    {condition.value}
                                  </>
                                )}
                              </Typography>
                              {index < rule.conditions.length - 1 && (
                                <Typography variant="body2" color="text.secondary">
                                  AND
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </TableCell>
                        <TableCell>
                          {strategyActions.find(a => a.value === rule.action)?.label || rule.action}
                        </TableCell>
                        <TableCell>
                          {rule.positionSize}
                          {rule.positionSizeType === 'percent' ? '%' : rule.positionSizeType === 'fixed' ? '$' : ' shares'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {rule.stopLoss !== null ? `Stop Loss: ${rule.stopLoss}%` : 'No Stop Loss'}
                          </Typography>
                          <Typography variant="body2">
                            {rule.takeProfit !== null ? `Take Profit: ${rule.takeProfit}%` : 'No Take Profit'}
                          </Typography>
                          <Typography variant="body2">
                            {rule.holdingPeriod !== null ? `Max Hold: ${rule.holdingPeriod} days` : 'No Max Holding Period'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => removeRule(rule.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setActiveStep(1)}
              sx={{ mr: 1 }}
            >
              Add Another Rule
            </Button>
          </CardContent>
        </Card>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(0)}
          >
            Back to Setup
          </Button>
          <Button
            variant="contained"
            onClick={runBacktest}
            disabled={loading || rules.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
          >
            {loading ? 'Running Backtest...' : 'Run Backtest'}
          </Button>
        </Box>
      </Box>
    );
  };

  // Render the backtest results step
  const renderBacktestResults = () => {
    if (!backtestResult) {
      return (
        <Alert severity="info">
          No backtest results available. Run a backtest to see results.
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Backtest Results
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Return
                    </Typography>
                    <Typography variant="h6" color={backtestResult.performance.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                      {formatPercentage(backtestResult.performance.totalReturn)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Annualized Return
                    </Typography>
                    <Typography variant="h6" color={backtestResult.performance.annualizedReturn >= 0 ? 'success.main' : 'error.main'}>
                      {formatPercentage(backtestResult.performance.annualizedReturn)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="h6">
                      {backtestResult.performance.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Drawdown
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatPercentage(backtestResult.performance.maxDrawdown)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Win Rate
                    </Typography>
                    <Typography variant="h6">
                      {formatPercentage(backtestResult.performance.winRate)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Profit Factor
                    </Typography>
                    <Typography variant="h6">
                      {backtestResult.performance.profitFactor.toFixed(2)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Trades
                    </Typography>
                    <Typography variant="h6">
                      {backtestResult.performance.totalTrades}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Equity Curve
                </Typography>
                
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={backtestResult.equity}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
                        }}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(label) => formatDate(label as string)}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="equity" 
                        name="Strategy" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="benchmark" 
                        name="Benchmark" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => setActiveStep(2)}
          >
            Back to Strategy
          </Button>
          <Button
            variant="contained"
            onClick={saveStrategy}
            startIcon={<SaveIcon />}
            disabled={!strategyName}
          >
            Save Strategy
          </Button>
        </Box>
      </Box>
    );
  };

  // Render saved strategies
  const renderSavedStrategies = () => {
    if (savedStrategies.length === 0) {
      return null;
    }

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Saved Strategies
          </Typography>
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Rules</TableCell>
                  <TableCell>Performance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedStrategies.map((strategy) => (
                  <TableRow key={strategy.id}>
                    <TableCell>{strategy.name}</TableCell>
                    <TableCell>{strategy.description}</TableCell>
                    <TableCell>{strategy.rules.length}</TableCell>
                    <TableCell>
                      {strategy.performance ? (
                        <>
                          <Typography variant="body2">
                            Return: {formatPercentage(strategy.performance.totalReturn)}
                          </Typography>
                          <Typography variant="body2">
                            Sharpe: {strategy.performance.sharpeRatio.toFixed(2)}
                          </Typography>
                        </>
                      ) : (
                        'Not backtested'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => loadStrategy(strategy)}
                      >
                        Load
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Event-Driven Strategy Builder
      </Typography>
      
      <Typography variant="body1" paragraph>
        Build and test complex event-driven trading strategies for {symbol}. Create rules based on different event types
        and conditions, then backtest your strategy against historical data.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {renderSavedStrategies()}
      
      <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 3 }}>
        <Step>
          <StepLabel>Strategy Setup</StepLabel>
        </Step>
        <Step>
          <StepLabel>Rule Builder</StepLabel>
        </Step>
        <Step>
          <StepLabel>Strategy Overview</StepLabel>
        </Step>
        <Step>
          <StepLabel>Backtest Results</StepLabel>
        </Step>
      </Stepper>
      
      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && renderStrategySetup()}
        {activeStep === 1 && renderRuleBuilder()}
        {activeStep === 2 && renderStrategyOverview()}
        {activeStep === 3 && renderBacktestResults()}
      </Paper>
    </Box>
  );
};

export default EventDrivenStrategyBuilder;