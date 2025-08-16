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
  Slider,
  Switch,
  FormControlLabel,
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
  TablePagination,
  TableSortLabel,
  useTheme,
  LinearProgress
} from '@mui/material';

import { 
  TradingStrategy, 
  StrategyOptimizationResult,
  Timeframe
} from '../../models/strategy/StrategyTypes';
import { StrategyOptimizationService } from '../../services/strategy/StrategyOptimizationService';

// Mock icons (replace with actual imports in a real implementation)
const AddIcon = () => <Box>+</Box>;
const DeleteIcon = () => <Box>✖</Box>;
const PlayArrowIcon = () => <Box>▶</Box>;
const StopIcon = () => <Box>■</Box>;
const SaveIcon = () => <Box>💾</Box>;
const SettingsIcon = () => <Box>⚙️</Box>;
const BarChartIcon = () => <Box>📊</Box>;

interface StrategyOptimizationPanelProps {
  apiKey: string;
  baseUrl?: string;
  strategy: TradingStrategy;
  ticker: string;
  onOptimizationComplete?: (result: StrategyOptimizationResult) => void;
}

const StrategyOptimizationPanel: React.FC<StrategyOptimizationPanelProps> = ({
  apiKey,
  baseUrl,
  strategy,
  ticker,
  onOptimizationComplete
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<StrategyOptimizationResult | null>(null);
  const [parameterRanges, setParameterRanges] = useState<Record<string, { min: number; max: number; step: number }>>(
    strategy.parameters
      .filter(param => typeof param.defaultValue === 'number' && param.minValue !== undefined && param.maxValue !== undefined)
      .reduce((ranges, param) => {
        ranges[param.id] = {
          min: param.minValue!,
          max: param.maxValue!,
          step: param.step || ((param.maxValue! - param.minValue!) / 10)
        };
        return ranges;
      }, {} as Record<string, { min: number; max: number; step: number }>)
  );
  const [optimizationTarget, setOptimizationTarget] = useState<'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor'>('sharpe_ratio');
  const [timeframe, setTimeframe] = useState<Timeframe>(Timeframe.DAILY);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // 1 year ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [optimizationMethod, setOptimizationMethod] = useState<'grid_search' | 'genetic' | 'bayesian'>('grid_search');
  const [isOptimizationRunning, setIsOptimizationRunning] = useState<boolean>(false);
  const [optimizationProgress, setOptimizationProgress] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<string>('objectiveValue');
  const [optimizationService] = useState<StrategyOptimizationService>(
    new StrategyOptimizationService(apiKey, baseUrl)
  );

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle parameter range change
  const handleParameterRangeChange = (parameterId: string, field: 'min' | 'max' | 'step', value: number) => {
    setParameterRanges(prev => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        [field]: value
      }
    }));
  };

  // Handle optimization target change
  const handleOptimizationTargetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setOptimizationTarget(event.target.value as 'sharpe_ratio' | 'return' | 'drawdown' | 'win_rate' | 'profit_factor');
  };

  // Handle timeframe change
  const handleTimeframeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTimeframe(event.target.value as Timeframe);
  };

  // Handle date change
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(new Date(event.target.value));
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(new Date(event.target.value));
  };

  // Handle optimization method change
  const handleOptimizationMethodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setOptimizationMethod(event.target.value as 'grid_search' | 'genetic' | 'bayesian');
  };

  // Handle run optimization
  const handleRunOptimization = async () => {
    setLoading(true);
    setError(null);
    setIsOptimizationRunning(true);
    setOptimizationProgress(0);

    try {
      let result: StrategyOptimizationResult;

      // Run the appropriate optimization method
      switch (optimizationMethod) {
        case 'grid_search':
          result = await optimizationService.runGridSearch(
            strategy.id,
            ticker,
            timeframe,
            optimizationTarget,
            parameterRanges,
            startDate,
            endDate
          );
          break;
        case 'genetic':
          result = await optimizationService.runGeneticAlgorithm(
            strategy.id,
            ticker,
            timeframe,
            optimizationTarget,
            parameterRanges,
            startDate,
            endDate
          );
          break;
        case 'bayesian':
          result = await optimizationService.runBayesianOptimization(
            strategy.id,
            ticker,
            timeframe,
            optimizationTarget,
            parameterRanges,
            startDate,
            endDate
          );
          break;
        default:
          result = await optimizationService.optimizeStrategy(
            strategy.id,
            ticker,
            timeframe,
            optimizationTarget,
            parameterRanges,
            startDate,
            endDate
          );
      }

      setOptimizationResult(result);
      setIsOptimizationRunning(false);
      setOptimizationProgress(100);

      // Call the onOptimizationComplete callback if provided
      if (onOptimizationComplete) {
        onOptimizationComplete(result);
      }

      // Switch to results tab
      setTabValue(1);
    } catch (err) {
      console.error('Error running optimization:', err);
      setError('Failed to run optimization. Please try again.');
      setIsOptimizationRunning(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle stop optimization
  const handleStopOptimization = async () => {
    if (!optimizationResult) return;

    try {
      await optimizationService.cancelOptimization(optimizationResult.id);
      setIsOptimizationRunning(false);
    } catch (err) {
      console.error('Error stopping optimization:', err);
      setError('Failed to stop optimization. Please try again.');
    }
  };

  // Handle apply optimized parameters
  const handleApplyOptimizedParameters = () => {
    if (!optimizationResult) return;

    // Call the onOptimizationComplete callback with the result
    if (onOptimizationComplete) {
      onOptimizationComplete(optimizationResult);
    }
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort request
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Format value
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  };

  // Render configuration tab
  const renderConfigurationTab = () => {
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Parameter Ranges */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Parameter Ranges" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  {strategy.parameters
                    .filter(param => typeof param.defaultValue === 'number' && param.minValue !== undefined && param.maxValue !== undefined)
                    .map((param) => (
                      <Grid item xs={12} key={param.id}>
                        <Typography variant="subtitle2" gutterBottom>
                          {param.name}
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Min"
                              type="number"
                              value={parameterRanges[param.id]?.min || param.minValue}
                              onChange={(e) => handleParameterRangeChange(param.id, 'min', Number(e.target.value))}
                              fullWidth
                              margin="dense"
                              InputProps={{
                                inputProps: {
                                  min: param.minValue,
                                  max: param.maxValue,
                                  step: param.step || 1
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Max"
                              type="number"
                              value={parameterRanges[param.id]?.max || param.maxValue}
                              onChange={(e) => handleParameterRangeChange(param.id, 'max', Number(e.target.value))}
                              fullWidth
                              margin="dense"
                              InputProps={{
                                inputProps: {
                                  min: param.minValue,
                                  max: param.maxValue,
                                  step: param.step || 1
                                }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField
                              label="Step"
                              type="number"
                              value={parameterRanges[param.id]?.step || param.step || ((param.maxValue! - param.minValue!) / 10)}
                              onChange={(e) => handleParameterRangeChange(param.id, 'step', Number(e.target.value))}
                              fullWidth
                              margin="dense"
                              InputProps={{
                                inputProps: {
                                  min: 0.0001,
                                  max: param.maxValue! - param.minValue!,
                                  step: 0.0001
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                        <Typography variant="body2" color="text.secondary">
                          {param.description}
                        </Typography>
                      </Grid>
                    ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Optimization Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Optimization Settings" />
              <Divider />
              <CardContent>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Optimization Target</InputLabel>
                  <Select
                    value={optimizationTarget}
                    label="Optimization Target"
                    onChange={handleOptimizationTargetChange}
                  >
                    <MenuItem value="sharpe_ratio">Sharpe Ratio</MenuItem>
                    <MenuItem value="return">Total Return</MenuItem>
                    <MenuItem value="drawdown">Max Drawdown</MenuItem>
                    <MenuItem value="win_rate">Win Rate</MenuItem>
                    <MenuItem value="profit_factor">Profit Factor</MenuItem>
                  </Select>
                  <FormHelperText>The metric to optimize for</FormHelperText>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Optimization Method</InputLabel>
                  <Select
                    value={optimizationMethod}
                    label="Optimization Method"
                    onChange={handleOptimizationMethodChange}
                  >
                    <MenuItem value="grid_search">Grid Search</MenuItem>
                    <MenuItem value="genetic">Genetic Algorithm</MenuItem>
                    <MenuItem value="bayesian">Bayesian Optimization</MenuItem>
                  </Select>
                  <FormHelperText>The algorithm used for optimization</FormHelperText>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    value={timeframe}
                    label="Timeframe"
                    onChange={handleTimeframeChange}
                  >
                    <MenuItem value={Timeframe.INTRADAY}>Intraday</MenuItem>
                    <MenuItem value={Timeframe.DAILY}>Daily</MenuItem>
                    <MenuItem value={Timeframe.WEEKLY}>Weekly</MenuItem>
                    <MenuItem value={Timeframe.MONTHLY}>Monthly</MenuItem>
                  </Select>
                  <FormHelperText>The timeframe for optimization</FormHelperText>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Date Range */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Date Range" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Run Optimization Button */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          {isOptimizationRunning ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStopOptimization}
              disabled={loading}
            >
              Stop Optimization
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleRunOptimization}
              disabled={loading || Object.keys(parameterRanges).length === 0}
            >
              Run Optimization
            </Button>
          )}
        </Box>

        {/* Optimization Progress */}
        {isOptimizationRunning && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Optimization Progress
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={optimizationProgress} 
              sx={{ height: 10, borderRadius: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {optimizationProgress === 0 ? 'Starting...' : 'Optimizing...'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {`${Math.round(optimizationProgress)}%`}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Render results tab
  const renderResultsTab = () => {
    if (!optimizationResult) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No optimization results available. Run an optimization first.
          </Typography>
        </Box>
      );
    }

    // Get parameter names
    const parameterNames = Object.keys(optimizationResult.optimalParameters);

    // Sort iterations
    const sortedIterations = [...optimizationResult.iterations].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });

    // Get displayed iterations
    const displayedIterations = sortedIterations.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return (
      <Box>
        {/* Optimization Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Optimization Target
                </Typography>
                <Typography variant="h6">
                  {optimizationTarget === 'sharpe_ratio' ? 'Sharpe Ratio' :
                   optimizationTarget === 'return' ? 'Total Return' :
                   optimizationTarget === 'drawdown' ? 'Max Drawdown' :
                   optimizationTarget === 'win_rate' ? 'Win Rate' : 'Profit Factor'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Best Value
                </Typography>
                <Typography variant="h6" color={
                  optimizationTarget === 'drawdown' ? 
                    (optimizationResult.bestObjectiveValue < 0 ? 'success.main' : 'error.main') :
                    (optimizationResult.bestObjectiveValue > 0 ? 'success.main' : 'error.main')
                }>
                  {optimizationTarget === 'return' || optimizationTarget === 'drawdown' || optimizationTarget === 'win_rate' ? 
                    `${(optimizationResult.bestObjectiveValue * 100).toFixed(2)}%` : 
                    optimizationResult.bestObjectiveValue.toFixed(4)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Iterations
                </Typography>
                <Typography variant="h6">
                  {optimizationResult.iterations.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Optimal Parameters */}
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Optimal Parameters" 
            action={
              <Button
                variant="contained"
                onClick={handleApplyOptimizedParameters}
                disabled={!optimizationResult}
              >
                Apply Parameters
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              {parameterNames.map((name) => (
                <Grid item xs={6} md={3} key={name}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {name}
                  </Typography>
                  <Typography variant="body1">
                    {formatValue(optimizationResult.optimalParameters[name])}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Iterations Table */}
        <Card>
          <CardHeader title="Optimization Iterations" />
          <Divider />
          <TableContainer sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Iteration</TableCell>
                  {parameterNames.map((param) => (
                    <TableCell key={param}>{param}</TableCell>
                  ))}
                  <TableCell 
                    sortDirection={orderBy === 'objectiveValue' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'objectiveValue'}
                      direction={orderBy === 'objectiveValue' ? order : 'asc'}
                      onClick={() => handleRequestSort('objectiveValue')}
                    >
                      {optimizationTarget === 'sharpe_ratio' ? 'Sharpe Ratio' :
                       optimizationTarget === 'return' ? 'Total Return' :
                       optimizationTarget === 'drawdown' ? 'Max Drawdown' :
                       optimizationTarget === 'win_rate' ? 'Win Rate' : 'Profit Factor'}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell 
                    sortDirection={orderBy === 'rank' ? order : false}
                  >
                    <TableSortLabel
                      active={orderBy === 'rank'}
                      direction={orderBy === 'rank' ? order : 'asc'}
                      onClick={() => handleRequestSort('rank')}
                    >
                      Rank
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedIterations.map((iteration, index) => (
                  <TableRow key={index}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    {parameterNames.map((param) => (
                      <TableCell key={param}>
                        {formatValue(iteration.parameters[param])}
                      </TableCell>
                    ))}
                    <TableCell sx={{ 
                      color: optimizationTarget === 'drawdown' ? 
                        (iteration.objectiveValue < 0 ? 'success.main' : 'error.main') :
                        (iteration.objectiveValue > 0 ? 'success.main' : 'error.main')
                    }}>
                      {optimizationTarget === 'return' || optimizationTarget === 'drawdown' || optimizationTarget === 'win_rate' ? 
                        `${(iteration.objectiveValue * 100).toFixed(2)}%` : 
                        iteration.objectiveValue.toFixed(4)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={iteration.rank} 
                        color={iteration.rank === 1 ? 'success' : undefined}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={optimizationResult.iterations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Box>
    );
  };

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Strategy Optimization: {strategy.name} on {ticker}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="optimization tabs">
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Configuration" />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Results" 
            disabled={!optimizationResult}
          />
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        {loading && !isOptimizationRunning ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {tabValue === 0 && renderConfigurationTab()}
            {tabValue === 1 && renderResultsTab()}
          </>
        )}
      </Box>
    </Paper>
  );
};

export default StrategyOptimizationPanel;