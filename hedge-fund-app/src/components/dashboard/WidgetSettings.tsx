import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  FormControlLabel, 
  FormGroup, 
  FormLabel, 
  Switch, 
  Select, 
  MenuItem, 
  InputLabel, 
  Slider, 
  Typography, 
  Box, 
  Divider, 
  Chip,
  Grid,
  Autocomplete
} from '@mui/material';

import WidgetRegistry from '../../services/dashboard/WidgetRegistry';

interface WidgetSettingsProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: Record<string, any>) => void;
  widgetType: string;
  currentSettings: Record<string, any>;
}

const WidgetSettings: React.FC<WidgetSettingsProps> = ({ 
  open, 
  onClose, 
  onSave, 
  widgetType, 
  currentSettings 
}) => {
  const widgetRegistry = WidgetRegistry.getInstance();
  
  // Local state
  const [settings, setSettings] = useState<Record<string, any>>({});
  
  // Get widget definition
  const widgetDefinition = widgetRegistry.getWidgetDefinition(widgetType);
  
  // Initialize settings
  useEffect(() => {
    if (open) {
      // Merge default settings with current settings
      const defaultSettings = widgetDefinition?.defaultSettings || {};
      setSettings({ ...defaultSettings, ...currentSettings });
    }
  }, [open, widgetDefinition, currentSettings]);
  
  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value
    }));
  };
  
  // Handle save
  const handleSave = () => {
    onSave(settings);
  };
  
  // Render settings based on widget type
  const renderSettings = () => {
    switch (widgetType) {
      case 'MarketOverviewWidget':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showIndices || false}
                      onChange={(e) => handleSettingChange('showIndices', e.target.checked)}
                    />
                  }
                  label="Show Market Indices"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showTopMovers || false}
                      onChange={(e) => handleSettingChange('showTopMovers', e.target.checked)}
                    />
                  }
                  label="Show Top Movers"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Refresh Interval (seconds)</Typography>
              <Slider
                value={settings.refreshInterval || 60}
                min={10}
                max={300}
                step={10}
                marks={[
                  { value: 10, label: '10s' },
                  { value: 60, label: '1m' },
                  { value: 300, label: '5m' }
                ]}
                valueLabelDisplay="auto"
                onChange={(_, value) => handleSettingChange('refreshInterval', value)}
              />
            </Grid>
          </Grid>
        );
        
      case 'PortfolioSummaryWidget':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showPerformance || false}
                      onChange={(e) => handleSettingChange('showPerformance', e.target.checked)}
                    />
                  }
                  label="Show Performance Metrics"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showAllocation || false}
                      onChange={(e) => handleSettingChange('showAllocation', e.target.checked)}
                    />
                  }
                  label="Show Asset Allocation"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={settings.period || '1M'}
                  label="Time Period"
                  onChange={(e) => handleSettingChange('period', e.target.value)}
                >
                  <MenuItem value="1D">1 Day</MenuItem>
                  <MenuItem value="1W">1 Week</MenuItem>
                  <MenuItem value="1M">1 Month</MenuItem>
                  <MenuItem value="3M">3 Months</MenuItem>
                  <MenuItem value="6M">6 Months</MenuItem>
                  <MenuItem value="1Y">1 Year</MenuItem>
                  <MenuItem value="YTD">Year to Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 'WatchlistWidget':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Watchlist</InputLabel>
                <Select
                  value={settings.watchlistId || 'default'}
                  label="Watchlist"
                  onChange={(e) => handleSettingChange('watchlistId', e.target.value)}
                >
                  <MenuItem value="default">Default Watchlist</MenuItem>
                  <MenuItem value="tech">Technology Stocks</MenuItem>
                  <MenuItem value="finance">Financial Stocks</MenuItem>
                  <MenuItem value="crypto">Cryptocurrencies</MenuItem>
                  <MenuItem value="custom">Custom Watchlist</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showCharts || false}
                      onChange={(e) => handleSettingChange('showCharts', e.target.checked)}
                    />
                  }
                  label="Show Mini Charts"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>Refresh Interval (seconds)</Typography>
              <Slider
                value={settings.refreshInterval || 30}
                min={5}
                max={300}
                step={5}
                marks={[
                  { value: 5, label: '5s' },
                  { value: 30, label: '30s' },
                  { value: 60, label: '1m' },
                  { value: 300, label: '5m' }
                ]}
                valueLabelDisplay="auto"
                onChange={(_, value) => handleSettingChange('refreshInterval', value)}
              />
            </Grid>
          </Grid>
        );
        
      case 'NewsWidget':
        const availableSources = [
          { label: 'Bloomberg', value: 'bloomberg' },
          { label: 'Reuters', value: 'reuters' },
          { label: 'Wall Street Journal', value: 'wsj' },
          { label: 'Financial Times', value: 'ft' },
          { label: 'CNBC', value: 'cnbc' },
          { label: 'MarketWatch', value: 'marketwatch' },
          { label: 'Yahoo Finance', value: 'yahoo' },
          { label: 'Seeking Alpha', value: 'seekingalpha' }
        ];
        
        const availableCategories = [
          { label: 'Markets', value: 'markets' },
          { label: 'Economy', value: 'economy' },
          { label: 'Companies', value: 'companies' },
          { label: 'Technology', value: 'technology' },
          { label: 'Finance', value: 'finance' },
          { label: 'Commodities', value: 'commodities' },
          { label: 'Currencies', value: 'currencies' },
          { label: 'Bonds', value: 'bonds' }
        ];
        
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={availableSources}
                getOptionLabel={(option) => option.label}
                value={availableSources.filter(source => 
                  (settings.sources || []).includes(source.value)
                )}
                onChange={(_, newValue) => {
                  handleSettingChange('sources', newValue.map(item => item.value));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="News Sources"
                    placeholder="Select sources"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      {...getTagProps({ index })}
                      key={option.value}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={availableCategories}
                getOptionLabel={(option) => option.label}
                value={availableCategories.filter(category => 
                  (settings.categories || []).includes(category.value)
                )}
                onChange={(_, newValue) => {
                  handleSettingChange('categories', newValue.map(item => item.value));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="News Categories"
                    placeholder="Select categories"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      {...getTagProps({ index })}
                      key={option.value}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Articles"
                type="number"
                InputProps={{ inputProps: { min: 1, max: 50 } }}
                value={settings.limit || 10}
                onChange={(e) => handleSettingChange('limit', parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        );
        
      case 'ChartWidget':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Symbol"
                value={settings.symbol || 'SPY'}
                onChange={(e) => handleSettingChange('symbol', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={settings.timeframe || '1D'}
                  label="Timeframe"
                  onChange={(e) => handleSettingChange('timeframe', e.target.value)}
                >
                  <MenuItem value="1D">1 Day</MenuItem>
                  <MenuItem value="5D">5 Days</MenuItem>
                  <MenuItem value="1M">1 Month</MenuItem>
                  <MenuItem value="3M">3 Months</MenuItem>
                  <MenuItem value="6M">6 Months</MenuItem>
                  <MenuItem value="1Y">1 Year</MenuItem>
                  <MenuItem value="5Y">5 Years</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chart Type</InputLabel>
                <Select
                  value={settings.chartType || 'candle'}
                  label="Chart Type"
                  onChange={(e) => handleSettingChange('chartType', e.target.value)}
                >
                  <MenuItem value="candle">Candlestick</MenuItem>
                  <MenuItem value="line">Line</MenuItem>
                  <MenuItem value="area">Area</MenuItem>
                  <MenuItem value="bar">Bar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={[
                  'SMA', 'EMA', 'MACD', 'RSI', 'Bollinger Bands', 'Volume', 'Stochastic'
                ]}
                value={settings.indicators || []}
                onChange={(_, newValue) => {
                  handleSettingChange('indicators', newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Technical Indicators"
                    placeholder="Select indicators"
                  />
                )}
              />
            </Grid>
          </Grid>
        );
        
      default:
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary" align="center">
              No settings available for this widget type
            </Typography>
          </Box>
        );
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="widget-settings-dialog-title"
    >
      <DialogTitle id="widget-settings-dialog-title">
        Widget Settings
      </DialogTitle>
      
      <DialogContent dividers>
        {renderSettings()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WidgetSettings;