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
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

import { BacktestingService, OptimizationService } from '../../services';
import { 
  Strategy, 
  OptimizationConfig, 
  OptimizationResult, 
  OptimizationParameter, 
  OptimizationIteration,
  ObjectiveFunction,
  OptimizationMethod
} from '../../types/backtesting/strategyTypes';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`optimization-tabpanel-${index}`}
      aria-labelledby={`optimization-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface StrategyOptimizationPanelProps {
  strategy: Strategy | null;
  onOptimizationComplete?: (result: OptimizationResult) => void;
}

const StrategyOptimizationPanel: React.FC<StrategyOptimizationPanelProps> = ({
  strategy,
  onOptimizationComplete
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [parameters, setParameters] = useState<OptimizationParameter[]>([]);
  const [objectiveFunction, setObjectiveFunction] = useState<ObjectiveFunction>(ObjectiveFunction.SHARPE_RATIO);
  const [optimizationMethod, setOptimizationMethod] = useState<OptimizationMethod>(OptimizationMethod.GRID_SEARCH);
  const [maxIterations, setMaxIterations] = useState<number>(100);
  const [parallelRuns, setParallelRuns] = useState<number>(4);
  const [isOptimizationRunning, setIsOptimizationRunning] = useState<boolean>(false);
  const [optimizationProgress, setOptimizationProgress] = useState<number>(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [orderBy, setOrderBy] = useState<string>('objectiveValue');
  
  const backtestingService = new BacktestingService();
  const optimizationService = new OptimizationService();
  
  useEffect(() => {
    if (strategy) {
      initializeOptimizationConfig();
    }
  }, [strategy]);
  
  const initializeOptimizationConfig = () => {
    if (!strategy) return;
    
    // Extract parameters from strategy that can be optimized
    const optimizableParams: OptimizationParameter[] = [];
    
    if (strategy.parameters) {
      Object.entries(strategy.parameters).forEach(([name, value]) => {
        if (typeof value === 'number') {
          optimizableParams.push({
            name,
            type: 'number',
            min: value * 0.5,
            max: value * 1.5,
            step: value * 0.05,
            defaultValue: value
          });
        } else if (typeof value === 'boolean') {
          optimizableParams.push({
            name,
            type: 'boolean',
            defaultValue: value
          });
        } else if (typeof value === 'string' && ['buy', 'sell', 'hold', 'long', 'short'].includes(value.toLowerCase())) {
          optimizableParams.push({
            name,
            type: 'select',
            values: ['buy', 'sell', 'hold', 'long', 'short'],
            defaultValue: value
          });
        }
      });
    }
    
    setParameters(optimizableParams);
    
    const config: OptimizationConfig = {
      strategyId: strategy.id || '',
      backtestConfigId: '', // Will be set when running optimization
      parameters: optimizableParams,
      objectiveFunction: ObjectiveFunction.SHARPE_RATIO,
      method: OptimizationMethod.GRID_SEARCH,
      constraints: [],
      maxIterations: 100,
      parallelRuns: 4
    };
    
    setOptimizationConfig(config);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleParameterChange = (index: number, field: string, value: any) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = {
      ...updatedParameters[index],
      [field]: value
    };
    
    setParameters(updatedParameters);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        parameters: updatedParameters
      });
    }
  };
  
  const handleAddParameter = () => {
    const newParam: OptimizationParameter = {
      name: `parameter${parameters.length + 1}`,
      type: 'number',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50
    };
    
    setParameters([...parameters, newParam]);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        parameters: [...optimizationConfig.parameters, newParam]
      });
    }
  };
  
  const handleRemoveParameter = (index: number) => {
    const updatedParameters = [...parameters];
    updatedParameters.splice(index, 1);
    
    setParameters(updatedParameters);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        parameters: updatedParameters
      });
    }
  };
  
  const handleObjectiveFunctionChange = (value: ObjectiveFunction) => {
    setObjectiveFunction(value);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        objectiveFunction: value
      });
    }
  };
  
  const handleOptimizationMethodChange = (value: OptimizationMethod) => {
    setOptimizationMethod(value);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        method: value
      });
    }
  };
  
  const handleMaxIterationsChange = (value: number) => {
    setMaxIterations(value);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        maxIterations: value
      });
    }
  };
  
  const handleParallelRunsChange = (value: number) => {
    setParallelRuns(value);
    
    if (optimizationConfig) {
      setOptimizationConfig({
        ...optimizationConfig,
        parallelRuns: value
      });
    }
  };
  
  const handleRunOptimization = async () => {
    if (!optimizationConfig || !strategy) return;
    
    try {
      setLoading(true);
      setError(null);
      setIsOptimizationRunning(true);
      setOptimizationProgress(0);
      
      // Get the latest backtest config for this strategy
      const backtestConfigs = await backtestingService.getBacktestConfigs({
        strategyId: strategy.id
      });
      
      if (!backtestConfigs || backtestConfigs.length === 0) {
        setError('No backtest configuration found for this strategy. Please run a backtest first.');
        setLoading(false);
        setIsOptimizationRunning(false);
        return;
      }
      
      // Use the most recent backtest config
      const backtestConfigId = backtestConfigs[0].id;
      
      // Update the optimization config with the backtest config ID
      const updatedConfig = {
        ...optimizationConfig,
        backtestConfigId
      };
      
      // Start the optimization
      const optimizationId = await optimizationService.startOptimization(updatedConfig);
      
      // Poll for progress
      const progressInterval = setInterval(async () => {
        try {
          const progress = await optimizationService.getOptimizationProgress(optimizationId);
          setOptimizationProgress(progress);
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Get the final result
            const result = await optimizationService.getOptimizationResult(optimizationId);
            setOptimizationResult(result);
            
            if (onOptimizationComplete) {
              onOptimizationComplete(result);
            }
            
            setIsOptimizationRunning(false);
            setLoading(false);
            setTabValue(1); // Switch to results tab
          }
        } catch (err) {
          console.error('Error checking optimization progress:', err);
          clearInterval(progressInterval);
          setIsOptimizationRunning(false);
          setLoading(false);
          setError('Failed to check optimization progress. Please try again later.');
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error running optimization:', err);
      setError('Failed to run optimization. Please try again later.');
      setIsOptimizationRunning(false);
      setLoading(false);
    }
  };
  
  const handleStopOptimization = async () => {
    if (!optimizationResult) return;
    
    try {
      await optimizationService.cancelOptimization(optimizationResult.id);
      setIsOptimizationRunning(false);
    } catch (err) {
      console.error('Error stopping optimization:', err);
      setError('Failed to stop optimization. Please try again later.');
    }
  };
  
  const handleSaveOptimizationConfig = async () => {
    if (!optimizationConfig) return;
    
    try {
      setLoading(true);
      await optimizationService.saveOptimizationConfig(optimizationConfig);
      setLoading(false);
    } catch (err) {
      console.error('Error saving optimization config:', err);
      setError('Failed to save optimization configuration. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleApplyOptimizedParameters = async () => {
    if (!optimizationResult || !strategy) return;
    
    try {
      setLoading(true);
      
      // Get the best parameters
      const bestParameters = optimizationResult.bestParameters;
      
      // Update the strategy with the optimized parameters
      const updatedStrategy = {
        ...strategy,
        parameters: {
          ...strategy.parameters,
          ...bestParameters
        }
      };
      
      // Save the updated strategy
      await backtestingService.updateStrategy(updatedStrategy);
      
      setLoading(false);
    } catch (err) {
      console.error('Error applying optimized parameters:', err);
      setError('Failed to apply optimized parameters. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toFixed(4);
    }
    return String(value);
  };
  
  const renderParameterEditor = () => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Parameters to Optimize" 
          action={
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddParameter}
              size="small"
            >
              Add Parameter
            </Button>
          }
        />
        <Divider />
        <CardContent>
          {parameters.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No parameters available for optimization. Add parameters to begin.
            </Typography>
          ) : (
            parameters.map((param, index) => (
              <Box key={index} sx={{ mb: 3, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Parameter {index + 1}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => handleRemoveParameter(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Parameter Name"
                      value={param.name}
                      onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Parameter Type</InputLabel>
                      <Select
                        value={param.type}
                        label="Parameter Type"
                        onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                      >
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="boolean">Boolean</MenuItem>
                        <MenuItem value="select">Select</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {param.type === 'number' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Min Value"
                          type="number"
                          value={param.min}
                          onChange={(e) => handleParameterChange(index, 'min', parseFloat(e.target.value))}
                          margin="normal"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Max Value"
                          type="number"
                          value={param.max}
                          onChange={(e) => handleParameterChange(index, 'max', parseFloat(e.target.value))}
                          margin="normal"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Step"
                          type="number"
                          value={param.step}
                          onChange={(e) => handleParameterChange(index, 'step', parseFloat(e.target.value))}
                          margin="normal"
                        />
                      </Grid>
                    </>
                  )}
                  
                  {param.type === 'select' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Values (comma separated)"
                        value={param.values?.join(', ') || ''}
                        onChange={(e) => handleParameterChange(index, 'values', e.target.value.split(',').map(v => v.trim()))}
                        margin="normal"
                        helperText="Enter values separated by commas"
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Default Value"
                      value={param.defaultValue}
                      onChange={(e) => {
                        const value = param.type === 'number' 
                          ? parseFloat(e.target.value) 
                          : param.type === 'boolean'
                            ? e.target.value === 'true'
                            : e.target.value;
                        handleParameterChange(index, 'defaultValue', value);
                      }}
                      margin="normal"
                      select={param.type === 'boolean' || param.type === 'select'}
                      type={param.type === 'number' ? 'number' : 'text'}
                    >
                      {param.type === 'boolean' && (
                        <>
                          <MenuItem value="true">True</MenuItem>
                          <MenuItem value="false">False</MenuItem>
                        </>
                      )}
                      {param.type === 'select' && param.values?.map((value, i) => (
                        <MenuItem key={i} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderOptimizationSettings = () => {
    return (
      <Card>
        <CardHeader title="Optimization Settings" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Objective Function</InputLabel>
                <Select
                  value={objectiveFunction}
                  label="Objective Function"
                  onChange={(e) => handleObjectiveFunctionChange(e.target.value as ObjectiveFunction)}
                >
                  <MenuItem value={ObjectiveFunction.SHARPE_RATIO}>Sharpe Ratio</MenuItem>
                  <MenuItem value={ObjectiveFunction.SORTINO_RATIO}>Sortino Ratio</MenuItem>
                  <MenuItem value={ObjectiveFunction.CALMAR_RATIO}>Calmar Ratio</MenuItem>
                  <MenuItem value={ObjectiveFunction.TOTAL_RETURN}>Total Return</MenuItem>
                  <MenuItem value={ObjectiveFunction.ANNUALIZED_RETURN}>Annualized Return</MenuItem>
                  <MenuItem value={ObjectiveFunction.MAX_DRAWDOWN}>Max Drawdown</MenuItem>
                  <MenuItem value={ObjectiveFunction.PROFIT_FACTOR}>Profit Factor</MenuItem>
                  <MenuItem value={ObjectiveFunction.EXPECTANCY}>Expectancy</MenuItem>
                </Select>
                <FormHelperText>The metric to optimize for</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Optimization Method</InputLabel>
                <Select
                  value={optimizationMethod}
                  label="Optimization Method"
                  onChange={(e) => handleOptimizationMethodChange(e.target.value as OptimizationMethod)}
                >
                  <MenuItem value={OptimizationMethod.GRID_SEARCH}>Grid Search</MenuItem>
                  <MenuItem value={OptimizationMethod.RANDOM_SEARCH}>Random Search</MenuItem>
                  <MenuItem value={OptimizationMethod.BAYESIAN}>Bayesian Optimization</MenuItem>
                  <MenuItem value={OptimizationMethod.GENETIC}>Genetic Algorithm</MenuItem>
                  <MenuItem value={OptimizationMethod.PARTICLE_SWARM}>Particle Swarm</MenuItem>
                </Select>
                <FormHelperText>The algorithm used for optimization</FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Maximum Iterations: {maxIterations}
              </Typography>
              <Slider
                value={maxIterations}
                min={10}
                max={1000}
                step={10}
                onChange={(e, value) => handleMaxIterationsChange(value as number)}
                valueLabelDisplay="auto"
                marks={[
                  { value: 10, label: '10' },
                  { value: 100, label: '100' },
                  { value: 500, label: '500' },
                  { value: 1000, label: '1000' }
                ]}
              />
              <FormHelperText>Maximum number of iterations to run</FormHelperText>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>
                Parallel Runs: {parallelRuns}
              </Typography>
              <Slider
                value={parallelRuns}
                min={1}
                max={16}
                step={1}
                onChange={(e, value) => handleParallelRunsChange(value as number)}
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1' },
                  { value: 4, label: '4' },
                  { value: 8, label: '8' },
                  { value: 16, label: '16' }
                ]}
              />
              <FormHelperText>Number of parallel optimization runs</FormHelperText>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  const renderOptimizationControls = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleSaveOptimizationConfig}
          disabled={loading || isOptimizationRunning || !optimizationConfig}
        >
          Save Configuration
        </Button>
        
        <Box>
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
              disabled={loading || !optimizationConfig || parameters.length === 0}
            >
              Run Optimization
            </Button>
          )}
        </Box>
      </Box>
    );
  };
  
  const renderOptimizationProgress = () => {
    if (!isOptimizationRunning) return null;
    
    return (
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Optimization in Progress
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress variant="determinate" value={optimizationProgress} />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${Math.round(optimizationProgress)}%`}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };
  
  const renderOptimizationResults = () => {
    if (!optimizationResult) return null;
    
    // Sort iterations
    const sortedIterations = [...optimizationResult.iterations].sort((a, b) => {
      const aValue = a[orderBy as keyof OptimizationIteration];
      const bValue = b[orderBy as keyof OptimizationIteration];
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });
    
    const displayedIterations = sortedIterations.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
    
    // Extract parameter names for table headers
    const parameterNames = Object.keys(optimizationResult.bestParameters);
    
    return (
      <Box>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Best {getObjectiveFunctionLabel(optimizationResult.bestObjectiveValue)}
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: getObjectiveColor(optimizationResult.bestObjectiveValue) }}>
                  {formatObjectiveValue(optimizationResult.bestObjectiveValue)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Iterations
                </Typography>
                <Typography variant="h5" component="div">
                  {optimizationResult.iterations.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Execution Time
                </Typography>
                <Typography variant="h5" component="div">
                  {formatExecutionTime(optimizationResult.executionTime)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="Best Parameters" 
            action={
              <Button
                variant="contained"
                onClick={handleApplyOptimizedParameters}
                disabled={loading}
              >
                Apply to Strategy
              </Button>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              {Object.entries(optimizationResult.bestParameters).map(([name, value]) => (
                <Grid item xs={6} md={3} key={name}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {name}
                  </Typography>
                  <Typography variant="body1">
                    {formatValue(value)}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
        
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
                      {getObjectiveFunctionLabel(optimizationResult.bestObjectiveValue)}
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
                  <TableRow key={iteration.id}>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    {parameterNames.map((param) => (
                      <TableCell key={param}>
                        {formatValue(iteration.parameters[param])}
                      </TableCell>
                    ))}
                    <TableCell sx={{ color: getObjectiveColor(iteration.objectiveValue) }}>
                      {formatObjectiveValue(iteration.objectiveValue)}
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
        
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Parameter Sensitivity" />
              <Divider />
              <CardContent sx={{ height: 400 }}>
                {renderParameterSensitivityChart()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  const renderParameterSensitivityChart = () => {
    if (!optimizationResult) return null;
    
    // Get the parameter with the most variation
    const parameterNames = Object.keys(optimizationResult.bestParameters);
    if (parameterNames.length === 0) return null;
    
    // Use the first parameter for demonstration
    const paramName = parameterNames[0];
    
    // Extract data for scatter plot
    const data = {
      datasets: [
        {
          label: `${paramName} vs ${getObjectiveFunctionLabel(optimizationResult.bestObjectiveValue)}`,
          data: optimizationResult.iterations.map(iteration => ({
            x: iteration.parameters[paramName],
            y: iteration.objectiveValue
          })),
          backgroundColor: theme.palette.primary.main,
          borderColor: theme.palette.primary.dark,
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
    
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: paramName
          }
        },
        y: {
          title: {
            display: true,
            text: getObjectiveFunctionLabel(optimizationResult.bestObjectiveValue)
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${paramName}: ${context.parsed.x}, ${getObjectiveFunctionLabel(optimizationResult.bestObjectiveValue)}: ${context.parsed.y.toFixed(4)}`;
            }
          }
        }
      }
    };
    
    return <Scatter data={data} options={options} />;
  };
  
  const getObjectiveFunctionLabel = (value: number): string => {
    switch (objectiveFunction) {
      case ObjectiveFunction.SHARPE_RATIO:
        return 'Sharpe Ratio';
      case ObjectiveFunction.SORTINO_RATIO:
        return 'Sortino Ratio';
      case ObjectiveFunction.CALMAR_RATIO:
        return 'Calmar Ratio';
      case ObjectiveFunction.TOTAL_RETURN:
        return 'Total Return';
      case ObjectiveFunction.ANNUALIZED_RETURN:
        return 'Annualized Return';
      case ObjectiveFunction.MAX_DRAWDOWN:
        return 'Max Drawdown';
      case ObjectiveFunction.PROFIT_FACTOR:
        return 'Profit Factor';
      case ObjectiveFunction.EXPECTANCY:
        return 'Expectancy';
      default:
        return 'Objective Value';
    }
  };
  
  const getObjectiveColor = (value: number): string => {
    // For metrics where higher is better
    if ([
      ObjectiveFunction.SHARPE_RATIO,
      ObjectiveFunction.SORTINO_RATIO,
      ObjectiveFunction.CALMAR_RATIO,
      ObjectiveFunction.TOTAL_RETURN,
      ObjectiveFunction.ANNUALIZED_RETURN,
      ObjectiveFunction.PROFIT_FACTOR,
      ObjectiveFunction.EXPECTANCY
    ].includes(objectiveFunction)) {
      return value > 0 ? theme.palette.success.main : theme.palette.error.main;
    }
    
    // For metrics where lower is better (like max drawdown)
    if ([
      ObjectiveFunction.MAX_DRAWDOWN
    ].includes(objectiveFunction)) {
      return value < 0 ? theme.palette.success.main : theme.palette.error.main;
    }
    
    return theme.palette.text.primary;
  };
  
  const formatObjectiveValue = (value: number): string => {
    if ([
      ObjectiveFunction.TOTAL_RETURN,
      ObjectiveFunction.ANNUALIZED_RETURN,
      ObjectiveFunction.MAX_DRAWDOWN
    ].includes(objectiveFunction)) {
      return `${(value * 100).toFixed(2)}%`;
    }
    
    return value.toFixed(4);
  };
  
  const formatExecutionTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  if (!strategy) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">No strategy selected</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Please select a strategy to optimize.
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
              Strategy Optimization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Optimize parameters for strategy: {strategy.name}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
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
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          {loading && !isOptimizationRunning ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {renderParameterEditor()}
              {renderOptimizationSettings()}
              {renderOptimizationControls()}
              {renderOptimizationProgress()}
            </>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            renderOptimizationResults()
          )}
        </TabPanel>
      </Box>
    </Box>
  );
};

// Add missing LinearProgress component import
import { LinearProgress } from '@mui/material';

export default StrategyOptimizationPanel;