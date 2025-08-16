import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Chip,
  CircularProgress,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import InfoIcon from '@mui/icons-material/Info';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BacktestingService from '../../services/backtesting/backtestingService';
import DataProviderService from '../../services/backtesting/dataProviderService';
import { BacktestConfig, Strategy, DataFrequency, CommissionType, SlippageModel, DataSource } from '../../types/backtesting';

interface BacktestConfigPanelProps {
  strategy?: Strategy | null;
  config?: BacktestConfig | null;
  strategies?: Strategy[];
  onConfigChange?: (config: BacktestConfig) => void;
  onRunBacktest?: () => void;
  onSaveConfig?: (config: BacktestConfig) => void;
  isRunning?: boolean;
}

const BacktestConfigPanel: React.FC<BacktestConfigPanelProps> = ({
  strategy,
  config,
  strategies = [],
  onConfigChange,
  onRunBacktest,
  onSaveConfig,
  isRunning = false
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [availableFrequencies, setAvailableFrequencies] = useState<{ value: DataFrequency; label: string }[]>([]);
  const [dataAvailability, setDataAvailability] = useState<Record<string, { available: boolean; coverage: number }>>({});
  
  const [localConfig, setLocalConfig] = useState<BacktestConfig>({
    name: '',
    description: '',
    strategyId: '',
    symbols: [],
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
    endDate: new Date().toISOString().split('T')[0], // today
    initialCapital: 100000,
    timeFrame: 'day',
    commissionType: 'percentage',
    commissionValue: 0.001, // 0.1%
    slippageModel: 'percentage',
    slippageValue: 0.001, // 0.1%
    dataSource: 'financial_modeling_prep',
    includeDividends: true,
    includeCorporateActions: true,
    executionDelay: 0
  });
  
  const [validation, setValidation] = useState<{
    name: boolean;
    strategyId: boolean;
    symbols: boolean;
    dateRange: boolean;
    initialCapital: boolean;
  }>({
    name: true,
    strategyId: true,
    symbols: true,
    dateRange: true,
    initialCapital: true
  });
  
  const backtestingService = new BacktestingService();
  const dataProviderService = new DataProviderService();
  
  useEffect(() => {
    fetchAvailableFrequencies();
    fetchAvailableTickers();
  }, []);
  
  useEffect(() => {
    if (strategy) {
      setLocalConfig(prevConfig => ({
        ...prevConfig,
        strategyId: strategy.id || '',
        name: `${strategy.name} Backtest`
      }));
    }
  }, [strategy]);
  
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);
  
  useEffect(() => {
    if (localConfig.symbols.length > 0 && localConfig.startDate && localConfig.endDate) {
      checkDataAvailability();
    }
  }, [localConfig.symbols, localConfig.startDate, localConfig.endDate, localConfig.timeFrame]);
  
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(localConfig);
    }
  }, [localConfig, onConfigChange]);
  
  const fetchAvailableFrequencies = async () => {
    try {
      const frequencies = await dataProviderService.getAvailableDataFrequencies();
      setAvailableFrequencies(frequencies);
    } catch (err) {
      console.error('Error fetching available frequencies:', err);
      setError('Failed to load available data frequencies.');
    }
  };
  
  const fetchAvailableTickers = async () => {
    try {
      setLoading(true);
      const tickers = await dataProviderService.getAvailableTickers();
      setAvailableTickers(tickers.map(t => t.symbol));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching available tickers:', err);
      setError('Failed to load available tickers.');
      setLoading(false);
    }
  };
  
  const checkDataAvailability = async () => {
    try {
      const availability = await dataProviderService.checkDataAvailability(
        localConfig.symbols,
        localConfig.startDate,
        localConfig.endDate,
        localConfig.timeFrame as DataFrequency
      );
      setDataAvailability(availability);
    } catch (err) {
      console.error('Error checking data availability:', err);
    }
  };
  
  const handleInputChange = (field: keyof BacktestConfig, value: any) => {
    setLocalConfig({
      ...localConfig,
      [field]: value
    });
    
    // Validate the field
    if (field === 'name') {
      setValidation({
        ...validation,
        name: value.trim() !== ''
      });
    } else if (field === 'strategyId') {
      setValidation({
        ...validation,
        strategyId: value !== ''
      });
    } else if (field === 'symbols') {
      setValidation({
        ...validation,
        symbols: value.length > 0
      });
    } else if (field === 'startDate' || field === 'endDate') {
      const startDate = field === 'startDate' ? new Date(value) : new Date(localConfig.startDate);
      const endDate = field === 'endDate' ? new Date(value) : new Date(localConfig.endDate);
      setValidation({
        ...validation,
        dateRange: startDate < endDate
      });
    } else if (field === 'initialCapital') {
      setValidation({
        ...validation,
        initialCapital: value > 0
      });
    }
  };
  
  const handleSaveConfig = () => {
    if (validateForm() && onSaveConfig) {
      onSaveConfig(localConfig);
    }
  };
  
  const handleRunBacktest = () => {
    if (validateForm() && onRunBacktest) {
      onRunBacktest();
    }
  };
  
  const validateForm = (): boolean => {
    const newValidation = {
      name: localConfig.name.trim() !== '',
      strategyId: localConfig.strategyId !== '',
      symbols: localConfig.symbols.length > 0,
      dateRange: new Date(localConfig.startDate) < new Date(localConfig.endDate),
      initialCapital: localConfig.initialCapital > 0
    };
    
    setValidation(newValidation);
    
    return Object.values(newValidation).every(valid => valid);
  };
  
  const getDataAvailabilityStatus = () => {
    if (Object.keys(dataAvailability).length === 0) {
      return null;
    }
    
    const allAvailable = Object.values(dataAvailability).every(status => status.available);
    const partialAvailable = Object.values(dataAvailability).some(status => status.available);
    
    if (allAvailable) {
      return { severity: 'success', message: 'Data is available for all selected symbols.' };
    } else if (partialAvailable) {
      return { severity: 'warning', message: 'Data is partially available for the selected symbols and date range.' };
    } else {
      return { severity: 'error', message: 'Data is not available for the selected symbols and date range.' };
    }
  };
  
  const dataAvailabilityStatus = getDataAvailabilityStatus();
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                title="Basic Configuration" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Backtest Name"
                      fullWidth
                      value={localConfig.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!validation.name}
                      helperText={!validation.name ? 'Name is required' : ''}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={2}
                      value={localConfig.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!validation.strategyId} required>
                      <InputLabel>Strategy</InputLabel>
                      <Select
                        value={localConfig.strategyId}
                        label="Strategy"
                        onChange={(e) => handleInputChange('strategyId', e.target.value)}
                      >
                        {strategies.map((strategy) => (
                          <MenuItem key={strategy.id} value={strategy.id}>
                            {strategy.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {!validation.strategyId && (
                        <FormHelperText>Strategy is required</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Autocomplete
                      multiple
                      options={availableTickers}
                      value={localConfig.symbols}
                      onChange={(e, newValue) => handleInputChange('symbols', newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Symbols"
                          error={!validation.symbols}
                          helperText={!validation.symbols ? 'At least one symbol is required' : ''}
                          required
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            label={option}
                            {...getTagProps({ index })}
                            color={dataAvailability[option]?.available ? 'primary' : 'error'}
                          />
                        ))
                      }
                      loading={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Start Date"
                      value={new Date(localConfig.startDate)}
                      onChange={(date) => handleInputChange('startDate', date?.toISOString().split('T')[0] || '')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !validation.dateRange,
                          helperText: !validation.dateRange ? 'Start date must be before end date' : '',
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="End Date"
                      value={new Date(localConfig.endDate)}
                      onChange={(date) => handleInputChange('endDate', date?.toISOString().split('T')[0] || '')}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !validation.dateRange,
                          helperText: !validation.dateRange ? 'End date must be after start date' : '',
                          required: true
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Initial Capital"
                      type="number"
                      fullWidth
                      value={localConfig.initialCapital}
                      onChange={(e) => handleInputChange('initialCapital', parseFloat(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      error={!validation.initialCapital}
                      helperText={!validation.initialCapital ? 'Initial capital must be greater than 0' : ''}
                      required
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardHeader 
                title="Advanced Configuration" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Data Frequency</InputLabel>
                      <Select
                        value={localConfig.timeFrame}
                        label="Data Frequency"
                        onChange={(e) => handleInputChange('timeFrame', e.target.value)}
                      >
                        {availableFrequencies.map((freq) => (
                          <MenuItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Data Source</InputLabel>
                      <Select
                        value={localConfig.dataSource}
                        label="Data Source"
                        onChange={(e) => handleInputChange('dataSource', e.target.value)}
                      >
                        <MenuItem value="financial_modeling_prep">Financial Modeling Prep</MenuItem>
                        <MenuItem value="alpha_vantage">Alpha Vantage</MenuItem>
                        <MenuItem value="yahoo_finance">Yahoo Finance</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Commission Type</InputLabel>
                      <Select
                        value={localConfig.commissionType}
                        label="Commission Type"
                        onChange={(e) => handleInputChange('commissionType', e.target.value)}
                      >
                        <MenuItem value="fixed">Fixed</MenuItem>
                        <MenuItem value="percentage">Percentage</MenuItem>
                        <MenuItem value="per_share">Per Share</MenuItem>
                        <MenuItem value="tiered">Tiered</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Commission Value"
                      type="number"
                      fullWidth
                      value={localConfig.commissionValue}
                      onChange={(e) => handleInputChange('commissionValue', parseFloat(e.target.value))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {localConfig.commissionType === 'percentage' ? '%' : '$'}
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Slippage Model</InputLabel>
                      <Select
                        value={localConfig.slippageModel}
                        label="Slippage Model"
                        onChange={(e) => handleInputChange('slippageModel', e.target.value)}
                      >
                        <MenuItem value="none">None</MenuItem>
                        <MenuItem value="fixed">Fixed</MenuItem>
                        <MenuItem value="percentage">Percentage</MenuItem>
                        <MenuItem value="market_impact">Market Impact</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Slippage Value"
                      type="number"
                      fullWidth
                      value={localConfig.slippageValue}
                      onChange={(e) => handleInputChange('slippageValue', parseFloat(e.target.value))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            {localConfig.slippageModel === 'percentage' ? '%' : '$'}
                          </InputAdornment>
                        ),
                      }}
                      disabled={localConfig.slippageModel === 'none'}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localConfig.includeDividends}
                          onChange={(e) => handleInputChange('includeDividends', e.target.checked)}
                        />
                      }
                      label="Include Dividends"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={localConfig.includeCorporateActions}
                          onChange={(e) => handleInputChange('includeCorporateActions', e.target.checked)}
                        />
                      }
                      label="Include Corporate Actions"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Execution Delay (ms)"
                      type="number"
                      fullWidth
                      value={localConfig.executionDelay}
                      onChange={(e) => handleInputChange('executionDelay', parseInt(e.target.value))}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Simulates execution delay in milliseconds">
                              <IconButton size="small">
                                <HelpOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            {dataAvailabilityStatus && (
              <Alert severity={dataAvailabilityStatus.severity as any} sx={{ mb: 2 }}>
                {dataAvailabilityStatus.message}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveConfig}
                sx={{ mr: 2 }}
                disabled={isRunning}
              >
                Save Configuration
              </Button>
              <Button
                variant="contained"
                startIcon={isRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={handleRunBacktest}
                disabled={isRunning || !Object.values(validation).every(v => v)}
              >
                {isRunning ? 'Running...' : 'Run Backtest'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default BacktestConfigPanel;