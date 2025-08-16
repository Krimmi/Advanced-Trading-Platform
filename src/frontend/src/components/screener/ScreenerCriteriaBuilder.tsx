import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import screenerService, { ScreenerFilter } from '../../services/screenerService';

interface ScreenerCriteriaBuilderProps {
  filters: ScreenerFilter[];
  onFiltersChange: (filters: ScreenerFilter[]) => void;
  availableMetrics: any[];
  screenName: string;
  onScreenNameChange: (name: string) => void;
  screenDescription: string;
  onScreenDescriptionChange: (description: string) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onRunScreener: () => void;
  onSaveScreen: () => void;
  loading: boolean;
}

const ScreenerCriteriaBuilder: React.FC<ScreenerCriteriaBuilderProps> = ({
  filters,
  onFiltersChange,
  availableMetrics,
  screenName,
  onScreenNameChange,
  screenDescription,
  onScreenDescriptionChange,
  sortBy,
  sortDirection,
  onSortChange,
  onRunScreener,
  onSaveScreen,
  loading,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [filterValue, setFilterValue] = useState<any>('');
  const [filterValue2, setFilterValue2] = useState<any>(''); // For 'between' operator
  const [availableOperators, setAvailableOperators] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get all unique categories from available metrics
  const categories = Array.from(
    new Set(availableMetrics.map(metricGroup => metricGroup.category))
  );

  // Get metrics for the selected category
  const metricsForCategory = selectedCategory
    ? availableMetrics.find(group => group.category === selectedCategory)?.metrics || []
    : [];

  // Get the selected metric object
  const selectedMetricObject = selectedMetric
    ? metricsForCategory.find((m: any) => m.id === selectedMetric)
    : null;

  // Update available operators when metric changes
  useEffect(() => {
    if (selectedMetricObject) {
      // Determine the field type based on the metric ID or other properties
      // This is a simplified example - in a real app, you'd have the type information
      const fieldType = getFieldTypeForMetric(selectedMetricObject.id);
      const operators = screenerService.getOperatorsForFieldType(fieldType);
      setAvailableOperators(operators);
      setSelectedOperator(''); // Reset operator when metric changes
    } else {
      setAvailableOperators([]);
      setSelectedOperator('');
    }
  }, [selectedMetric, selectedMetricObject]);

  // Reset values when operator changes
  useEffect(() => {
    setFilterValue('');
    setFilterValue2('');
  }, [selectedOperator]);

  const getFieldTypeForMetric = (metricId: string): string => {
    // This is a simplified mapping - in a real app, you'd have this information from the API
    if (
      metricId.includes('price') ||
      metricId.includes('volume') ||
      metricId.includes('marketCap') ||
      metricId.includes('pe') ||
      metricId.includes('eps') ||
      metricId.includes('dividend') ||
      metricId.includes('yield') ||
      metricId.includes('growth') ||
      metricId.includes('ratio') ||
      metricId.includes('margin') ||
      metricId.includes('return') ||
      metricId.includes('beta')
    ) {
      return 'number';
    } else if (
      metricId.includes('date') ||
      metricId.includes('Date')
    ) {
      return 'date';
    } else if (
      metricId.includes('is') ||
      metricId.includes('has')
    ) {
      return 'boolean';
    } else {
      return 'string';
    }
  };

  const handleAddFilter = () => {
    if (!selectedMetric || !selectedOperator) {
      setError('Please select both a metric and an operator');
      return;
    }

    if (selectedOperator === 'between' && (filterValue === '' || filterValue2 === '')) {
      setError('Please enter both values for the between operator');
      return;
    } else if (selectedOperator !== 'between' && filterValue === '') {
      setError('Please enter a value for the filter');
      return;
    }

    const newFilter: ScreenerFilter = {
      metric: selectedMetric,
      operator: selectedOperator as any,
      value: filterValue,
    };

    if (selectedOperator === 'between') {
      newFilter.value2 = filterValue2;
    }

    // Add category for organization
    if (selectedCategory) {
      newFilter.category = selectedCategory;
    }

    onFiltersChange([...filters, newFilter]);
    
    // Reset form
    setError(null);
    setFilterValue('');
    setFilterValue2('');
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    onFiltersChange(newFilters);
  };

  const handleClearAllFilters = () => {
    onFiltersChange([]);
  };

  const handleSortByChange = (event: SelectChangeEvent) => {
    onSortChange(event.target.value, sortDirection);
  };

  const handleSortDirectionChange = (event: SelectChangeEvent) => {
    onSortChange(sortBy, event.target.value as 'asc' | 'desc');
  };

  const getMetricNameById = (metricId: string): string => {
    for (const category of availableMetrics) {
      const metric = category.metrics.find((m: any) => m.id === metricId);
      if (metric) {
        return metric.name;
      }
    }
    return metricId;
  };

  const getOperatorDisplayText = (operator: string): string => {
    return screenerService.getOperatorDisplayText(operator);
  };

  const handleLoadPredefinedFilters = (strategyName: string) => {
    const predefinedFilters = screenerService.getPredefinedFilters(strategyName);
    onFiltersChange(predefinedFilters);
    onScreenNameChange(`${strategyName.charAt(0).toUpperCase() + strategyName.slice(1)} Strategy`);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Screen Configuration" 
              subheader="Define your screening criteria"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Screen Name"
                    value={screenName}
                    onChange={(e) => onScreenNameChange(e.target.value)}
                    placeholder="Enter a name for your screen"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description (Optional)"
                    value={screenDescription}
                    onChange={(e) => onScreenDescriptionChange(e.target.value)}
                    placeholder="Add a description for your screen"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Predefined Strategies" 
              subheader="Quick start with common investment strategies"
            />
            <Divider />
            <CardContent>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button 
                  variant="outlined" 
                  onClick={() => handleLoadPredefinedFilters('value')}
                  startIcon={<FilterIcon />}
                >
                  Value Investing
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => handleLoadPredefinedFilters('growth')}
                  startIcon={<FilterIcon />}
                >
                  Growth Investing
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => handleLoadPredefinedFilters('momentum')}
                  startIcon={<FilterIcon />}
                >
                  Momentum Strategy
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Filter Criteria" 
              subheader="Add filters to narrow down your results"
              action={
                filters.length > 0 ? (
                  <Button
                    startIcon={<ClearIcon />}
                    color="error"
                    onClick={handleClearAllFilters}
                  >
                    Clear All
                  </Button>
                ) : undefined
              }
            />
            <Divider />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={selectedCategory}
                      label="Category"
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedMetric('');
                      }}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth disabled={!selectedCategory}>
                    <InputLabel>Metric</InputLabel>
                    <Select
                      value={selectedMetric}
                      label="Metric"
                      onChange={(e) => setSelectedMetric(e.target.value)}
                    >
                      {metricsForCategory.map((metric: any) => (
                        <MenuItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth disabled={!selectedMetric}>
                    <InputLabel>Operator</InputLabel>
                    <Select
                      value={selectedOperator}
                      label="Operator"
                      onChange={(e) => setSelectedOperator(e.target.value)}
                    >
                      {availableOperators.map((operator) => (
                        <MenuItem key={operator} value={operator}>
                          {getOperatorDisplayText(operator)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {selectedOperator && (
                  <>
                    <Grid item xs={12} sm={6} md={selectedOperator === 'between' ? 1.5 : 3}>
                      <TextField
                        fullWidth
                        label={selectedOperator === 'between' ? 'Min Value' : 'Value'}
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        type={getFieldTypeForMetric(selectedMetric) === 'number' ? 'number' : 'text'}
                      />
                    </Grid>

                    {selectedOperator === 'between' && (
                      <Grid item xs={12} sm={6} md={1.5}>
                        <TextField
                          fullWidth
                          label="Max Value"
                          value={filterValue2}
                          onChange={(e) => setFilterValue2(e.target.value)}
                          type={getFieldTypeForMetric(selectedMetric) === 'number' ? 'number' : 'text'}
                        />
                      </Grid>
                    )}
                  </>
                )}

                <Grid item xs={12} sm={6} md={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddFilter}
                    disabled={!selectedMetric || !selectedOperator}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              <Box mt={4}>
                {filters.length === 0 ? (
                  <Alert severity="info">
                    No filters added yet. Add filters to define your screening criteria.
                  </Alert>
                ) : (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      Applied Filters ({filters.length})
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      {filters.map((filter, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            borderBottom: index < filters.length - 1 ? '1px solid #eee' : 'none',
                          }}
                        >
                          <Box>
                            <Typography variant="body1">
                              {getMetricNameById(filter.metric)}{' '}
                              <strong>{getOperatorDisplayText(filter.operator)}</strong>{' '}
                              {filter.operator === 'between'
                                ? `${filter.value} and ${filter.value2}`
                                : filter.value}
                            </Typography>
                            {filter.category && (
                              <Chip
                                label={filter.category}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveFilter(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Paper>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Sort Results" 
              subheader="Choose how to order your screening results"
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={handleSortByChange}
                    >
                      <MenuItem value="marketCap">Market Cap</MenuItem>
                      <MenuItem value="price">Price</MenuItem>
                      <MenuItem value="change">Price Change</MenuItem>
                      <MenuItem value="changePercent">Price Change %</MenuItem>
                      <MenuItem value="volume">Volume</MenuItem>
                      <MenuItem value="pe">P/E Ratio</MenuItem>
                      <MenuItem value="eps">EPS</MenuItem>
                      <MenuItem value="dividendYield">Dividend Yield</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Direction</InputLabel>
                    <Select
                      value={sortDirection}
                      label="Direction"
                      onChange={handleSortDirectionChange}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={onSaveScreen}
              disabled={loading || filters.length === 0 || !screenName}
            >
              Save Screen
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} /> : <RunIcon />}
              onClick={onRunScreener}
              disabled={loading || filters.length === 0}
            >
              Run Screen
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ScreenerCriteriaBuilder;