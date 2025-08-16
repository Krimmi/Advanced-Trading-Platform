/**
 * Portfolio Summary Widget
 * 
 * This widget displays a summary of the user's portfolio including
 * total value, performance, asset allocation, and top holdings.
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
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
import { WidgetProps } from '../WidgetRegistry';

// Default settings for the widget
const DEFAULT_SETTINGS = {
  portfolioId: 'default',
  showAssetAllocation: true,
  showTopHoldings: true,
  topHoldingsCount: 5,
  showPerformance: true,
  performancePeriod: '1d' // 1d, 1w, 1m, 3m, 6m, 1y, ytd
};

// Sample portfolio data (in a real app, this would come from an API)
const SAMPLE_PORTFOLIO_DATA = {
  summary: {
    totalValue: 1250750.25,
    cashBalance: 45250.75,
    dayChange: 3250.50,
    dayChangePercent: 0.26,
    totalGain: 250750.25,
    totalGainPercent: 25.07,
    riskScore: 65
  },
  performance: {
    '1d': 0.26,
    '1w': 1.35,
    '1m': -0.87,
    '3m': 4.25,
    '6m': 8.75,
    '1y': 15.32,
    'ytd': 7.45
  },
  assetAllocation: [
    { category: 'US Stocks', percentage: 45, value: 562837.61 },
    { category: 'International Stocks', percentage: 25, value: 312687.56 },
    { category: 'Bonds', percentage: 15, value: 187612.54 },
    { category: 'Real Estate', percentage: 8, value: 100060.02 },
    { category: 'Alternatives', percentage: 4, value: 50030.01 },
    { category: 'Cash', percentage: 3, value: 37522.51 }
  ],
  topHoldings: [
    { symbol: 'AAPL', name: 'Apple Inc.', value: 87552.52, weight: 7.0, dayChange: 1.2 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', value: 75045.02, weight: 6.0, dayChange: 0.8 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', value: 62537.51, weight: 5.0, dayChange: -0.5 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', value: 50030.01, weight: 4.0, dayChange: 0.3 },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', value: 43776.26, weight: 3.5, dayChange: -0.2 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', value: 37522.51, weight: 3.0, dayChange: 0.5 },
    { symbol: 'PG', name: 'Procter & Gamble', value: 31268.76, weight: 2.5, dayChange: 0.1 },
    { symbol: 'V', name: 'Visa Inc.', value: 25015.01, weight: 2.0, dayChange: 0.7 }
  ]
};

const PortfolioSummaryWidget: React.FC<WidgetProps> = ({
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
  const portfolioData = data || SAMPLE_PORTFOLIO_DATA;
  
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
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
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
              <InputLabel>Portfolio</InputLabel>
              <Select
                value={widgetSettings.portfolioId}
                label="Portfolio"
                onChange={(e) => handleSettingChange('portfolioId', e.target.value)}
              >
                <MenuItem value="default">Default Portfolio</MenuItem>
                <MenuItem value="retirement">Retirement</MenuItem>
                <MenuItem value="trading">Trading</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetSettings.showAssetAllocation}
                  onChange={(e) => handleSettingChange('showAssetAllocation', e.target.checked)}
                />
              }
              label="Show Asset Allocation"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetSettings.showTopHoldings}
                  onChange={(e) => handleSettingChange('showTopHoldings', e.target.checked)}
                />
              }
              label="Show Top Holdings"
            />
          </Grid>
          
          {widgetSettings.showTopHoldings && (
            <Grid item xs={12}>
              <TextField
                label="Number of Top Holdings"
                type="number"
                value={widgetSettings.topHoldingsCount}
                onChange={(e) => handleSettingChange('topHoldingsCount', parseInt(e.target.value))}
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 1, max: 20 } }}
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetSettings.showPerformance}
                  onChange={(e) => handleSettingChange('showPerformance', e.target.checked)}
                />
              }
              label="Show Performance"
            />
          </Grid>
          
          {widgetSettings.showPerformance && (
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Default Period</InputLabel>
                <Select
                  value={widgetSettings.performancePeriod}
                  label="Default Period"
                  onChange={(e) => handleSettingChange('performancePeriod', e.target.value)}
                >
                  <MenuItem value="1d">1 Day</MenuItem>
                  <MenuItem value="1w">1 Week</MenuItem>
                  <MenuItem value="1m">1 Month</MenuItem>
                  <MenuItem value="3m">3 Months</MenuItem>
                  <MenuItem value="6m">6 Months</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                  <MenuItem value="ytd">Year to Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
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
          {/* Portfolio Summary */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Portfolio Value
            </Typography>
            <Typography variant="h4" component="div" gutterBottom>
              {formatCurrency(portfolioData.summary.totalValue)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {portfolioData.summary.dayChange > 0 ? (
                <TrendingUpIcon sx={{ color: 'success.main', mr: 0.5 }} fontSize="small" />
              ) : (
                <TrendingDownIcon sx={{ color: 'error.main', mr: 0.5 }} fontSize="small" />
              )}
              <Typography
                variant="body2"
                color={portfolioData.summary.dayChange > 0 ? 'success.main' : 'error.main'}
              >
                {portfolioData.summary.dayChange > 0 ? '+' : ''}
                {formatCurrency(portfolioData.summary.dayChange)} (
                {portfolioData.summary.dayChangePercent > 0 ? '+' : ''}
                {portfolioData.summary.dayChangePercent.toFixed(2)}%) Today
              </Typography>
            </Box>
            
            <Divider sx={{ my: 1.5 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cash Balance
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(portfolioData.summary.cashBalance)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Gain
                </Typography>
                <Typography
                  variant="body1"
                  color={portfolioData.summary.totalGain > 0 ? 'success.main' : 'error.main'}
                >
                  {portfolioData.summary.totalGain > 0 ? '+' : ''}
                  {formatCurrency(portfolioData.summary.totalGain)} (
                  {portfolioData.summary.totalGainPercent > 0 ? '+' : ''}
                  {portfolioData.summary.totalGainPercent.toFixed(2)}%)
                </Typography>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Tabs for different sections */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {widgetSettings.showAssetAllocation && <Tab label="Allocation" />}
            {widgetSettings.showTopHoldings && <Tab label="Top Holdings" />}
            {widgetSettings.showPerformance && <Tab label="Performance" />}
          </Tabs>
          
          {/* Asset Allocation Tab */}
          {widgetSettings.showAssetAllocation && activeTab === 0 && (
            <Box>
              {portfolioData.assetAllocation.map((asset, index) => (
                <Box key={asset.category} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{asset.category}</Typography>
                    <Box sx={{ display: 'flex' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {asset.percentage}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(asset.value)}
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={asset.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: theme.palette.action.hover,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: [
                          theme.palette.primary.main,
                          theme.palette.secondary.main,
                          theme.palette.success.main,
                          theme.palette.info.main,
                          theme.palette.warning.main,
                          theme.palette.error.main
                        ][index % 6]
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
          
          {/* Top Holdings Tab */}
          {widgetSettings.showTopHoldings && activeTab === (widgetSettings.showAssetAllocation ? 1 : 0) && (
            <List disablePadding>
              {portfolioData.topHoldings
                .slice(0, widgetSettings.topHoldingsCount)
                .map((holding, index) => (
                  <React.Fragment key={holding.symbol}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" component="span">
                                {holding.symbol}
                              </Typography>
                              <Typography
                                variant="body2"
                                component="span"
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                {holding.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" component="span">
                              {formatCurrency(holding.value)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="body2" component="span" color="text.secondary">
                              {holding.weight.toFixed(1)}% of portfolio
                            </Typography>
                            <Typography
                              variant="body2"
                              component="span"
                              color={holding.dayChange > 0 ? 'success.main' : 'error.main'}
                            >
                              {holding.dayChange > 0 ? '+' : ''}
                              {holding.dayChange.toFixed(2)}%
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
            </List>
          )}
          
          {/* Performance Tab */}
          {widgetSettings.showPerformance && 
            activeTab === (
              (widgetSettings.showAssetAllocation ? 1 : 0) + 
              (widgetSettings.showTopHoldings ? 1 : 0)
            ) && (
            <Grid container spacing={2}>
              {Object.entries(portfolioData.performance).map(([period, value]) => (
                <Grid item xs={6} sm={4} key={period}>
                  <Paper
                    sx={{
                      p: 1.5,
                      textAlign: 'center',
                      bgcolor: 
                        period === widgetSettings.performancePeriod
                          ? theme.palette.action.selected
                          : theme.palette.background.paper
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {period === '1d'
                        ? '1 Day'
                        : period === '1w'
                        ? '1 Week'
                        : period === '1m'
                        ? '1 Month'
                        : period === '3m'
                        ? '3 Months'
                        : period === '6m'
                        ? '6 Months'
                        : period === '1y'
                        ? '1 Year'
                        : 'YTD'}
                    </Typography>
                    <Typography
                      variant="h6"
                      color={value > 0 ? 'success.main' : value < 0 ? 'error.main' : 'text.primary'}
                    >
                      {value > 0 ? '+' : ''}
                      {value.toFixed(2)}%
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default PortfolioSummaryWidget;