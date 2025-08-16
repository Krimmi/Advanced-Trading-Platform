import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { technicalService, technicalServiceExtensions } from '../../services';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Area, ComposedChart, Bar } from 'recharts';

interface TechnicalAnalysisComparisonPanelProps {
  onSaveComparison?: (comparison: any) => void;
}

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
      id={`comparison-tabpanel-${index}`}
      aria-labelledby={`comparison-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `comparison-tab-${index}`,
    'aria-controls': `comparison-tabpanel-${index}`,
  };
}

interface ComparisonItem {
  id: string;
  symbol: string;
  indicator: string;
  parameters: Record<string, any>;
  timeframe: string;
  color: string;
}

const DEFAULT_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
  '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'
];

const TechnicalAnalysisComparisonPanel: React.FC<TechnicalAnalysisComparisonPanelProps> = ({
  onSaveComparison,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [availableIndicators, setAvailableIndicators] = useState<any[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [timeframes, setTimeframes] = useState<string[]>(['1d', '1h', '4h', '1w', '1m']);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [comparisonName, setComparisonName] = useState<string>('');
  const [comparisonDescription, setComparisonDescription] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0], // today
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available indicators and symbols
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // In a real implementation, these would be API calls
        const indicators = await technicalService.getAvailableIndicators();
        const symbols = await technicalService.getWatchlistSymbols();
        
        setAvailableIndicators(indicators);
        setAvailableSymbols(symbols);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load indicators and symbols. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddComparisonItem = () => {
    const newItem: ComparisonItem = {
      id: `item-${Date.now()}`,
      symbol: availableSymbols.length > 0 ? availableSymbols[0] : '',
      indicator: availableIndicators.length > 0 ? availableIndicators[0].id : '',
      parameters: {},
      timeframe: '1d',
      color: DEFAULT_COLORS[comparisonItems.length % DEFAULT_COLORS.length],
    };

    setComparisonItems([...comparisonItems, newItem]);
  };

  const handleRemoveComparisonItem = (id: string) => {
    setComparisonItems(comparisonItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof ComparisonItem, value: any) => {
    setComparisonItems(comparisonItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleParameterChange = (itemId: string, paramName: string, value: any) => {
    setComparisonItems(comparisonItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          parameters: {
            ...item.parameters,
            [paramName]: value,
          },
        };
      }
      return item;
    }));
  };

  const getIndicatorById = (id: string) => {
    return availableIndicators.find(indicator => indicator.id === id);
  };

  const runComparison = async () => {
    if (comparisonItems.length === 0) {
      setError('Please add at least one item to compare');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would be an API call
      const results = await Promise.all(
        comparisonItems.map(item => 
          technicalServiceExtensions.calculateIndicator(
            item.symbol,
            item.indicator,
            item.parameters,
            item.timeframe,
            dateRange.start,
            dateRange.end
          )
        )
      );

      // Process and merge the results
      const mergedData = mergeComparisonData(results, comparisonItems);
      setComparisonData(mergedData);
      
      // Switch to the Results tab
      setTabValue(1);
    } catch (error) {
      console.error('Error running comparison:', error);
      setError('Failed to run comparison. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const mergeComparisonData = (results: any[], items: ComparisonItem[]) => {
    // This is a simplified implementation
    // In a real app, you'd need to align timestamps and handle missing data points
    
    const dateMap: Record<string, any> = {};
    
    // First, collect all dates and create base objects
    results.forEach((result, index) => {
      const item = items[index];
      const indicatorName = getIndicatorById(item.indicator)?.name || item.indicator;
      
      result.forEach((dataPoint: any) => {
        const date = dataPoint.timestamp;
        
        if (!dateMap[date]) {
          dateMap[date] = { date };
        }
        
        // Add the indicator value with a unique key combining symbol and indicator
        const key = `${item.symbol}_${indicatorName}`;
        dateMap[date][key] = dataPoint.value;
      });
    });
    
    // Convert the map to an array and sort by date
    return Object.values(dateMap).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const handleSaveComparison = () => {
    if (!comparisonName) {
      setError('Please enter a name for this comparison');
      return;
    }

    const comparison = {
      name: comparisonName,
      description: comparisonDescription,
      items: comparisonItems,
      dateRange,
    };

    if (onSaveComparison) {
      onSaveComparison(comparison);
    }
  };

  const getChartLines = () => {
    if (!comparisonData.length || !comparisonItems.length) return null;

    return comparisonItems.map(item => {
      const indicatorName = getIndicatorById(item.indicator)?.name || item.indicator;
      const key = `${item.symbol}_${indicatorName}`;
      
      return (
        <Line
          key={item.id}
          type="monotone"
          dataKey={key}
          stroke={item.color}
          name={`${item.symbol} - ${indicatorName}`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      );
    });
  };

  const renderParameterInputs = (item: ComparisonItem) => {
    const indicator = getIndicatorById(item.indicator);
    if (!indicator || !indicator.parameters) return null;

    return indicator.parameters.map((param: any, index: number) => {
      const paramValue = item.parameters[param.name] !== undefined 
        ? item.parameters[param.name] 
        : param.defaultValue;

      switch (param.type) {
        case 'number':
          return (
            <Grid item xs={6} md={4} key={index}>
              <TextField
                fullWidth
                size="small"
                label={param.name}
                type="number"
                value={paramValue}
                onChange={(e) => handleParameterChange(
                  item.id, 
                  param.name, 
                  Number(e.target.value)
                )}
                InputProps={{
                  inputProps: {
                    min: param.min,
                    max: param.max,
                  }
                }}
              />
            </Grid>
          );
        case 'boolean':
          return (
            <Grid item xs={6} md={4} key={index}>
              <FormControl fullWidth size="small">
                <InputLabel>{param.name}</InputLabel>
                <Select
                  value={paramValue ? 'true' : 'false'}
                  label={param.name}
                  onChange={(e) => handleParameterChange(
                    item.id,
                    param.name,
                    e.target.value === 'true'
                  )}
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          );
        case 'select':
          return (
            <Grid item xs={6} md={4} key={index}>
              <FormControl fullWidth size="small">
                <InputLabel>{param.name}</InputLabel>
                <Select
                  value={paramValue || ''}
                  label={param.name}
                  onChange={(e) => handleParameterChange(
                    item.id,
                    param.name,
                    e.target.value
                  )}
                >
                  {param.options?.map((option: string, optionIndex: number) => (
                    <MenuItem key={optionIndex} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          );
        default:
          return null;
      }
    });
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="comparison tabs">
          <Tab label="Configure Comparison" icon={<CompareIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="Comparison Results" icon={<TimelineIcon />} iconPosition="start" {...a11yProps(1)} />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Technical Analysis Comparison
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Comparison Name"
                  value={comparisonName}
                  onChange={(e) => setComparisonName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={comparisonDescription}
                  onChange={(e) => setComparisonDescription(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box mt={3} mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Comparison Items</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddComparisonItem}
              >
                Add Item
              </Button>
            </Box>

            {comparisonItems.length === 0 ? (
              <Alert severity="info">
                Add items to compare different technical indicators across symbols and timeframes.
              </Alert>
            ) : (
              comparisonItems.map((item, index) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Item {index + 1}</Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveComparisonItem(item.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Symbol</InputLabel>
                        <Select
                          value={item.symbol}
                          label="Symbol"
                          onChange={(e) => handleItemChange(item.id, 'symbol', e.target.value)}
                        >
                          {availableSymbols.map((symbol, symbolIndex) => (
                            <MenuItem key={symbolIndex} value={symbol}>
                              {symbol}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Indicator</InputLabel>
                        <Select
                          value={item.indicator}
                          label="Indicator"
                          onChange={(e) => handleItemChange(item.id, 'indicator', e.target.value)}
                        >
                          {availableIndicators.map((indicator, indicatorIndex) => (
                            <MenuItem key={indicatorIndex} value={indicator.id}>
                              {indicator.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Timeframe</InputLabel>
                        <Select
                          value={item.timeframe}
                          label="Timeframe"
                          onChange={(e) => handleItemChange(item.id, 'timeframe', e.target.value)}
                        >
                          {timeframes.map((timeframe, timeframeIndex) => (
                            <MenuItem key={timeframeIndex} value={timeframe}>
                              {timeframe}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Color</InputLabel>
                        <Select
                          value={item.color}
                          label="Color"
                          onChange={(e) => handleItemChange(item.id, 'color', e.target.value)}
                          renderValue={(selected) => (
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  bgcolor: selected,
                                  mr: 1,
                                }}
                              />
                              {selected}
                            </Box>
                          )}
                        >
                          {DEFAULT_COLORS.map((color, colorIndex) => (
                            <MenuItem key={colorIndex} value={color}>
                              <Box display="flex" alignItems="center">
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: color,
                                    mr: 1,
                                  }}
                                />
                                {color}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Parameter inputs */}
                    {renderParameterInputs(item)}
                  </Grid>
                </Paper>
              ))
            )}

            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} /> : <CompareIcon />}
                onClick={runComparison}
                disabled={loading || comparisonItems.length === 0}
              >
                Run Comparison
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {comparisonName || 'Comparison Results'}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setTabValue(0)}
                  sx={{ mr: 1 }}
                >
                  Edit Comparison
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveComparison}
                  disabled={!comparisonData.length}
                >
                  Save Comparison
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {comparisonData.length === 0 ? (
              <Alert severity="info">
                Run a comparison to see results here.
              </Alert>
            ) : (
              <>
                <Paper variant="outlined" sx={{ p: 1, mb: 3 }}>
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={comparisonData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        {getChartLines()}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Box mt={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Comparison Summary
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    {comparisonItems.map((item) => {
                      const indicator = getIndicatorById(item.indicator);
                      return (
                        <Grid item xs={12} md={6} lg={4} key={item.id}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" mb={1}>
                              <Box
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: item.color,
                                  mr: 1,
                                }}
                              />
                              <Typography variant="subtitle2">
                                {item.symbol} - {indicator?.name || item.indicator}
                              </Typography>
                            </Box>
                            <Divider sx={{ mb: 1 }} />
                            <Typography variant="body2" color="textSecondary">
                              Timeframe: {item.timeframe}
                            </Typography>
                            {Object.entries(item.parameters).length > 0 && (
                              <Box mt={1}>
                                <Typography variant="caption" color="textSecondary">
                                  Parameters:
                                </Typography>
                                <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                                  {Object.entries(item.parameters).map(([key, value], idx) => (
                                    <Chip
                                      key={idx}
                                      label={`${key}: ${value}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default TechnicalAnalysisComparisonPanel;