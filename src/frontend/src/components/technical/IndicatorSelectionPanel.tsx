import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Slider,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { technicalService, technicalServiceExtensions } from '../../services';
import { TechnicalIndicator } from '../../services/technicalService';

interface IndicatorSelectionPanelProps {
  symbol: string;
  availableIndicators: any[];
  customIndicators: any[];
}

interface SelectedIndicator {
  id: string;
  name: string;
  category: string;
  parameters: Record<string, any>;
  isCustom: boolean;
  data?: TechnicalIndicator[];
  loading: boolean;
  error?: string;
}

const IndicatorSelectionPanel: React.FC<IndicatorSelectionPanelProps> = ({
  symbol,
  availableIndicators,
  customIndicators,
}) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('daily');
  const [selectedIndicators, setSelectedIndicators] = useState<SelectedIndicator[]>([]);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Organize indicators by category
  const indicatorsByCategory = availableIndicators.reduce((acc, category) => {
    acc[category.category] = category.indicators;
    return acc;
  }, {} as Record<string, any[]>);

  // Add custom indicators category
  if (customIndicators.length > 0) {
    indicatorsByCategory['Custom'] = customIndicators.map(indicator => ({
      id: indicator.id,
      name: indicator.name,
      description: indicator.description,
      parameters: indicator.parameters,
      isCustom: true,
    }));
  }

  // Get all categories
  const categories = Object.keys(indicatorsByCategory);

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  useEffect(() => {
    // Reset selected indicator when category changes
    setSelectedIndicatorId('');
    setParameters({});
  }, [selectedCategory]);

  useEffect(() => {
    // Set default parameters when indicator changes
    if (selectedIndicatorId && selectedCategory) {
      const indicators = indicatorsByCategory[selectedCategory] || [];
      const indicator = indicators.find(ind => ind.id === selectedIndicatorId);
      
      if (indicator) {
        const defaultParams = indicator.parameters.reduce((acc: Record<string, any>, param: any) => {
          acc[param.name] = param.defaultValue;
          return acc;
        }, {});
        
        setParameters(defaultParams);
      }
    }
  }, [selectedIndicatorId, selectedCategory]);

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const handleIndicatorChange = (event: SelectChangeEvent) => {
    setSelectedIndicatorId(event.target.value);
  };

  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddIndicator = async () => {
    if (!selectedIndicatorId || !selectedCategory) return;

    const indicators = indicatorsByCategory[selectedCategory] || [];
    const indicator = indicators.find(ind => ind.id === selectedIndicatorId);
    
    if (!indicator) return;

    const isCustom = selectedCategory === 'Custom';
    
    const newIndicator: SelectedIndicator = {
      id: indicator.id,
      name: indicator.name,
      category: selectedCategory,
      parameters: { ...parameters },
      isCustom,
      loading: true,
      data: [],
    };

    setSelectedIndicators(prev => [...prev, newIndicator]);

    try {
      let data;
      if (isCustom) {
        data = await technicalServiceExtensions.calculateCustomIndicator(
          indicator.id,
          symbol,
          timeframe as any,
          parameters
        );
      } else {
        // Use the appropriate service method based on indicator type
        switch (indicator.id) {
          case 'sma':
            data = await technicalService.getSMA(symbol, parameters.period, timeframe as any);
            break;
          case 'ema':
            data = await technicalService.getEMA(symbol, parameters.period, timeframe as any);
            break;
          case 'rsi':
            data = await technicalService.getRSI(symbol, parameters.period, timeframe as any);
            break;
          case 'macd':
            data = await technicalService.getMACD(
              symbol, 
              parameters.fastPeriod, 
              parameters.slowPeriod, 
              parameters.signalPeriod, 
              timeframe as any
            );
            break;
          case 'bollinger':
            data = await technicalService.getBollingerBands(
              symbol,
              parameters.period,
              parameters.stdDev,
              timeframe as any
            );
            break;
          case 'stochastic':
            data = await technicalService.getStochastic(
              symbol,
              parameters.kPeriod,
              parameters.dPeriod,
              timeframe as any
            );
            break;
          case 'adx':
            data = await technicalService.getADX(symbol, parameters.period, timeframe as any);
            break;
          case 'obv':
            data = await technicalService.getOBV(symbol, timeframe as any);
            break;
          default:
            // For other indicators, use a generic method or handle specially
            console.warn(`No specific method for indicator: ${indicator.id}`);
            break;
        }
      }

      // Update the indicator with the fetched data
      setSelectedIndicators(prev =>
        prev.map(ind =>
          ind.id === indicator.id && ind.category === selectedCategory
            ? { ...ind, data, loading: false }
            : ind
        )
      );
    } catch (error) {
      console.error(`Error fetching indicator data: ${error}`);
      setSelectedIndicators(prev =>
        prev.map(ind =>
          ind.id === indicator.id && ind.category === selectedCategory
            ? { ...ind, loading: false, error: `Failed to load: ${error}` }
            : ind
        )
      );
    }
  };

  const handleRemoveIndicator = (index: number) => {
    setSelectedIndicators(prev => prev.filter((_, i) => i !== index));
  };

  const handleRefreshIndicator = async (index: number) => {
    const indicator = selectedIndicators[index];
    if (!indicator) return;

    // Set loading state
    setSelectedIndicators(prev =>
      prev.map((ind, i) => (i === index ? { ...ind, loading: true, error: undefined } : ind))
    );

    try {
      let data;
      if (indicator.isCustom) {
        data = await technicalServiceExtensions.calculateCustomIndicator(
          indicator.id,
          symbol,
          timeframe as any,
          indicator.parameters
        );
      } else {
        // Use the appropriate service method based on indicator type
        switch (indicator.id) {
          case 'sma':
            data = await technicalService.getSMA(symbol, indicator.parameters.period, timeframe as any);
            break;
          case 'ema':
            data = await technicalService.getEMA(symbol, indicator.parameters.period, timeframe as any);
            break;
          case 'rsi':
            data = await technicalService.getRSI(symbol, indicator.parameters.period, timeframe as any);
            break;
          case 'macd':
            data = await technicalService.getMACD(
              symbol, 
              indicator.parameters.fastPeriod, 
              indicator.parameters.slowPeriod, 
              indicator.parameters.signalPeriod, 
              timeframe as any
            );
            break;
          case 'bollinger':
            data = await technicalService.getBollingerBands(
              symbol,
              indicator.parameters.period,
              indicator.parameters.stdDev,
              timeframe as any
            );
            break;
          case 'stochastic':
            data = await technicalService.getStochastic(
              symbol,
              indicator.parameters.kPeriod,
              indicator.parameters.dPeriod,
              timeframe as any
            );
            break;
          case 'adx':
            data = await technicalService.getADX(symbol, indicator.parameters.period, timeframe as any);
            break;
          case 'obv':
            data = await technicalService.getOBV(symbol, timeframe as any);
            break;
          default:
            // For other indicators, use a generic method or handle specially
            console.warn(`No specific method for indicator: ${indicator.id}`);
            break;
        }
      }

      // Update the indicator with the fetched data
      setSelectedIndicators(prev =>
        prev.map((ind, i) => (i === index ? { ...ind, data, loading: false } : ind))
      );
    } catch (error) {
      console.error(`Error refreshing indicator data: ${error}`);
      setSelectedIndicators(prev =>
        prev.map((ind, i) =>
          i === index ? { ...ind, loading: false, error: `Failed to refresh: ${error}` } : ind
        )
      );
    }
  };

  const renderParameterInput = (param: any) => {
    const { name, type, defaultValue, min, max, options } = param;
    const value = parameters[name] !== undefined ? parameters[name] : defaultValue;

    switch (type) {
      case 'number':
        return (
          <Grid item xs={12} sm={6} key={name}>
            <TextField
              fullWidth
              label={name}
              type="number"
              value={value}
              onChange={(e) => handleParameterChange(name, Number(e.target.value))}
              InputProps={{
                inputProps: {
                  min: min !== undefined ? min : 1,
                  max: max !== undefined ? max : 200,
                },
              }}
              size="small"
            />
          </Grid>
        );
      case 'boolean':
        return (
          <Grid item xs={12} sm={6} key={name}>
            <FormControl fullWidth size="small">
              <InputLabel>{name}</InputLabel>
              <Select
                value={value ? 'true' : 'false'}
                label={name}
                onChange={(e) => handleParameterChange(name, e.target.value === 'true')}
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        );
      case 'select':
        return (
          <Grid item xs={12} sm={6} key={name}>
            <FormControl fullWidth size="small">
              <InputLabel>{name}</InputLabel>
              <Select
                value={value}
                label={name}
                onChange={(e) => handleParameterChange(name, e.target.value)}
              >
                {options?.map((option: string) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        );
      default:
        return (
          <Grid item xs={12} sm={6} key={name}>
            <TextField
              fullWidth
              label={name}
              value={value}
              onChange={(e) => handleParameterChange(name, e.target.value)}
              size="small"
            />
          </Grid>
        );
    }
  };

  const renderIndicatorCard = (indicator: SelectedIndicator, index: number) => {
    return (
      <Grid item xs={12} md={6} lg={4} key={`${indicator.id}-${index}`}>
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6">
                {indicator.name}
                <Chip
                  label={indicator.category}
                  size="small"
                  color={indicator.isCustom ? 'secondary' : 'primary'}
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Box>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => handleRefreshIndicator(index)}
                  disabled={indicator.loading}
                >
                  Refresh
                </Button>
                <Button
                  size="small"
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => handleRemoveIndicator(index)}
                  disabled={indicator.loading}
                >
                  Remove
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Parameters:
            </Typography>
            <Box mb={2}>
              {Object.entries(indicator.parameters).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
            
            {indicator.loading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : indicator.error ? (
              <Typography color="error" variant="body2">
                {indicator.error}
              </Typography>
            ) : indicator.data && indicator.data.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Latest Values:
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '4px' }}>Date</th>
                        <th style={{ textAlign: 'right', padding: '4px' }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {indicator.data.slice(0, 10).map((item, i) => (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent' }}>
                          <td style={{ padding: '4px' }}>{new Date(item.date).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right', padding: '4px' }}>{item.value.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No data available
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Add Technical Indicator
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={selectedCategory} label="Category" onChange={handleCategoryChange}>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Indicator</InputLabel>
              <Select
                value={selectedIndicatorId}
                label="Indicator"
                onChange={handleIndicatorChange}
                disabled={!selectedCategory}
              >
                {(indicatorsByCategory[selectedCategory] || []).map((indicator) => (
                  <MenuItem key={indicator.id} value={indicator.id}>
                    {indicator.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Timeframe</InputLabel>
              <Select value={timeframe} label="Timeframe" onChange={handleTimeframeChange}>
                <MenuItem value="minute">1 Minute</MenuItem>
                <MenuItem value="5min">5 Minutes</MenuItem>
                <MenuItem value="15min">15 Minutes</MenuItem>
                <MenuItem value="30min">30 Minutes</MenuItem>
                <MenuItem value="hourly">1 Hour</MenuItem>
                <MenuItem value="4hour">4 Hours</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddIndicator}
              disabled={!selectedIndicatorId}
              fullWidth
            >
              Add Indicator
            </Button>
          </Grid>
        </Grid>

        {selectedIndicatorId && selectedCategory && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Parameters:
            </Typography>
            <Grid container spacing={2}>
              {(indicatorsByCategory[selectedCategory] || [])
                .find((ind) => ind.id === selectedIndicatorId)
                ?.parameters.map(renderParameterInput)}
            </Grid>
          </Box>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Selected Indicators
      </Typography>
      
      {selectedIndicators.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No indicators selected. Add indicators above to analyze {symbol}.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {selectedIndicators.map(renderIndicatorCard)}
        </Grid>
      )}
    </Box>
  );
};

export default IndicatorSelectionPanel;