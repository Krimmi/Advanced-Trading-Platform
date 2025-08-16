/**
 * Market Overview Widget
 * 
 * This widget displays an overview of market performance including
 * major indices, market breadth, and sector performance.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { WidgetProps } from '../WidgetRegistry';

// Default settings for the widget
const DEFAULT_SETTINGS = {
  indices: ['SPY', 'QQQ', 'DIA', 'IWM', 'VIX'],
  showSectors: true,
  showMarketBreadth: true,
  refreshInterval: 60, // seconds
  chartType: 'line'
};

// Sample market data (in a real app, this would come from an API)
const SAMPLE_MARKET_DATA = {
  indices: [
    { symbol: 'SPY', name: 'S&P 500', price: 478.25, change: 1.25, percentChange: 0.26 },
    { symbol: 'QQQ', name: 'Nasdaq 100', price: 421.75, change: 2.35, percentChange: 0.56 },
    { symbol: 'DIA', name: 'Dow Jones', price: 389.12, change: -0.45, percentChange: -0.12 },
    { symbol: 'IWM', name: 'Russell 2000', price: 201.87, change: -1.23, percentChange: -0.61 },
    { symbol: 'VIX', name: 'Volatility Index', price: 14.32, change: -0.87, percentChange: -5.73 }
  ],
  sectors: [
    { name: 'Technology', performance: 0.85 },
    { name: 'Healthcare', performance: 0.32 },
    { name: 'Financials', performance: -0.41 },
    { name: 'Consumer Discretionary', performance: 0.12 },
    { name: 'Industrials', performance: -0.23 },
    { name: 'Energy', performance: 1.45 },
    { name: 'Materials', performance: 0.05 },
    { name: 'Utilities', performance: -0.67 },
    { name: 'Real Estate', performance: -0.38 },
    { name: 'Communication Services', performance: 0.74 }
  ],
  marketBreadth: {
    advancers: 285,
    decliners: 215,
    unchanged: 12,
    newHighs: 45,
    newLows: 23,
    advanceVolume: 0.58,
    declineVolume: 0.42
  }
};

const MarketOverviewWidget: React.FC<WidgetProps> = ({
  id,
  settings,
  isEditing,
  onSettingsChange,
  loading,
  data
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  
  // Merge default settings with user settings
  const widgetSettings = { ...DEFAULT_SETTINGS, ...settings };
  
  // Use provided data or sample data
  const marketData = data || SAMPLE_MARKET_DATA;
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle settings change
  const handleSettingChange = (key: string, value: any) => {
    if (onSettingsChange) {
      onSettingsChange({
        ...widgetSettings,
        [key]: value
      });
    }
  };
  
  // If in editing mode, show settings
  if (isEditing) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Widget Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={widgetSettings.chartType}
                label="Chart Type"
                onChange={(e) => handleSettingChange('chartType', e.target.value)}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="candlestick">Candlestick</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Indices (comma separated)"
              value={widgetSettings.indices.join(', ')}
              onChange={(e) => handleSettingChange('indices', e.target.value.split(',').map(s => s.trim()))}
              fullWidth
              size="small"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetSettings.showSectors}
                  onChange={(e) => handleSettingChange('showSectors', e.target.checked)}
                />
              }
              label="Show Sectors"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetSettings.showMarketBreadth}
                  onChange={(e) => handleSettingChange('showMarketBreadth', e.target.checked)}
                />
              }
              label="Show Market Breadth"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Refresh Interval (seconds)"
              type="number"
              value={widgetSettings.refreshInterval}
              onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
              fullWidth
              size="small"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            <Tab label="Indices" />
            {widgetSettings.showSectors && <Tab label="Sectors" />}
            {widgetSettings.showMarketBreadth && <Tab label="Market Breadth" />}
          </Tabs>
          
          {/* Indices Tab */}
          {activeTab === 0 && (
            <Grid container spacing={2}>
              {marketData.indices
                .filter(index => widgetSettings.indices.includes(index.symbol))
                .map(index => (
                  <Grid item xs={12} sm={6} key={index.symbol}>
                    <Paper
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: theme.palette.background.paper
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2">{index.name}</Typography>
                        <Chip
                          size="small"
                          label={index.symbol}
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">{index.price.toFixed(2)}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {index.percentChange > 0 ? (
                            <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} />
                          ) : index.percentChange < 0 ? (
                            <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} />
                          ) : (
                            <TrendingFlatIcon sx={{ color: 'text.secondary', mr: 0.5 }} />
                          )}
                          <Typography
                            variant="body2"
                            color={
                              index.percentChange > 0
                                ? 'success.main'
                                : index.percentChange < 0
                                ? 'error.main'
                                : 'text.secondary'
                            }
                          >
                            {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.percentChange > 0 ? '+' : ''}{index.percentChange.toFixed(2)}%)
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
            </Grid>
          )}
          
          {/* Sectors Tab */}
          {activeTab === 1 && widgetSettings.showSectors && (
            <Box>
              {marketData.sectors.map(sector => (
                <Box key={sector.name} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{sector.name}</Typography>
                    <Typography
                      variant="body2"
                      color={
                        sector.performance > 0
                          ? 'success.main'
                          : sector.performance < 0
                          ? 'error.main'
                          : 'text.secondary'
                      }
                    >
                      {sector.performance > 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={50 + sector.performance * 10} // Scale for visualization
                    color={sector.performance > 0 ? 'success' : 'error'}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Box>
          )}
          
          {/* Market Breadth Tab */}
          {activeTab === 2 && widgetSettings.showMarketBreadth && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Advancing vs Declining
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Advancers</Typography>
                      <Typography variant="body2">{marketData.marketBreadth.advancers}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Decliners</Typography>
                      <Typography variant="body2">{marketData.marketBreadth.decliners}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Unchanged</Typography>
                      <Typography variant="body2">{marketData.marketBreadth.unchanged}</Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', height: 20 }}>
                      <Box
                        sx={{
                          width: `${marketData.marketBreadth.advanceVolume * 100}%`,
                          bgcolor: 'success.main',
                          borderTopLeftRadius: 4,
                          borderBottomLeftRadius: 4
                        }}
                      />
                      <Box
                        sx={{
                          width: `${marketData.marketBreadth.declineVolume * 100}%`,
                          bgcolor: 'error.main',
                          borderTopRightRadius: 4,
                          borderBottomRightRadius: 4
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption">
                        {(marketData.marketBreadth.advanceVolume * 100).toFixed(0)}% Volume
                      </Typography>
                      <Typography variant="caption">
                        {(marketData.marketBreadth.declineVolume * 100).toFixed(0)}% Volume
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      New Highs vs Lows
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">New Highs</Typography>
                      <Typography variant="body2" color="success.main">
                        {marketData.marketBreadth.newHighs}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">New Lows</Typography>
                      <Typography variant="body2" color="error.main">
                        {marketData.marketBreadth.newLows}
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Market Sentiment
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={
                            (marketData.marketBreadth.advancers /
                              (marketData.marketBreadth.advancers +
                                marketData.marketBreadth.decliners)) *
                            100
                          }
                          color="primary"
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {(
                          (marketData.marketBreadth.advancers /
                            (marketData.marketBreadth.advancers +
                              marketData.marketBreadth.decliners)) *
                          100
                        ).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default MarketOverviewWidget;