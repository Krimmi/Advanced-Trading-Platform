import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Chip,
  Alert,
  AlertTitle,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Tooltip
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuIcon from '@mui/icons-material/Menu';
import FavoriteIcon from '@mui/icons-material/Favorite';
import HistoryIcon from '@mui/icons-material/History';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import StrategyRecommendationPanel from './StrategyRecommendationPanel';
import StrategyBacktestPanel from './StrategyBacktestPanel';
import StrategyExplanationPanel from './StrategyExplanationPanel';
import StrategyOptimizationPanel from './StrategyOptimizationPanel';
import StrategyRiskAnalysisPanel from './StrategyRiskAnalysisPanel';

import {
  StrategyType,
  StrategyRecommendation,
  BacktestResult,
  RiskAnalysisResult
} from '../../services/strategy';

interface StrategyDashboardPageProps {
  // Props can be added as needed
}

const StrategyDashboardPage: React.FC<StrategyDashboardPageProps> = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // State for selected strategy
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecommendation | null>(null);
  
  // State for backtest results
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  
  // State for risk analysis results
  const [riskAnalysisResult, setRiskAnalysisResult] = useState<RiskAnalysisResult | null>(null);
  
  // State for optimized parameters
  const [optimizedParameters, setOptimizedParameters] = useState<Record<string, any> | null>(null);
  
  // State for mobile drawer
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle strategy selection
  const handleStrategySelect = (strategy: StrategyRecommendation) => {
    setSelectedStrategy(strategy);
    // Switch to backtest tab when a strategy is selected
    setActiveTab(1);
  };

  // Handle backtest completion
  const handleBacktestComplete = (result: BacktestResult) => {
    setBacktestResult(result);
  };

  // Handle risk analysis completion
  const handleRiskAnalysisComplete = (result: RiskAnalysisResult) => {
    setRiskAnalysisResult(result);
  };

  // Handle parameter optimization
  const handleOptimizationComplete = (parameters: Record<string, any>) => {
    setOptimizedParameters(parameters);
    
    // Update selected strategy with optimized parameters
    if (selectedStrategy) {
      setSelectedStrategy({
        ...selectedStrategy,
        parameters: parameters
      });
    }
  };

  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Render the sidebar/drawer content
  const renderSidebar = () => (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        <ListItem>
          <Typography variant="h6">Strategy Tools</Typography>
        </ListItem>
        <Divider />
        
        {[
          { text: 'Dashboard', icon: <DashboardIcon />, index: 0 },
          { text: 'Recommendations', icon: <TuneIcon />, index: 0 },
          { text: 'Backtest', icon: <ShowChartIcon />, index: 1 },
          { text: 'Explanation', icon: <HelpOutlineIcon />, index: 2 },
          { text: 'Optimization', icon: <SettingsIcon />, index: 3 },
          { text: 'Risk Analysis', icon: <SecurityIcon />, index: 4 }
        ].map((item) => (
          <ListItemButton
            key={item.text}
            selected={activeTab === item.index}
            onClick={() => {
              setActiveTab(item.index);
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
        
        <Divider sx={{ my: 2 }} />
        
        <ListItem>
          <Typography variant="subtitle2">Saved Strategies</Typography>
        </ListItem>
        
        {[
          { text: 'Momentum ETF Strategy', icon: <TrendingUpIcon />, type: StrategyType.MOMENTUM },
          { text: 'Mean Reversion Pairs', icon: <TimelineIcon />, type: StrategyType.MEAN_REVERSION },
          { text: 'Trend Following System', icon: <ShowChartIcon />, type: StrategyType.TREND_FOLLOWING }
        ].map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => {
              // This would load a saved strategy in a real app
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              secondary={item.type.replace('_', ' ')}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  // Render the strategy summary card
  const renderStrategySummary = () => {
    if (!selectedStrategy) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>No Strategy Selected</AlertTitle>
          Please select a strategy from the recommendations tab to begin analysis.
        </Alert>
      );
    }
    
    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" gutterBottom>
                {selectedStrategy.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip 
                  label={selectedStrategy.type.replace('_', ' ')}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={`Risk: ${selectedStrategy.riskLevel}`}
                  color={
                    selectedStrategy.riskLevel === 'conservative' ? 'success' :
                    selectedStrategy.riskLevel === 'moderate' ? 'warning' :
                    'error'
                  }
                  size="small"
                />
                <Chip 
                  label={`Time: ${selectedStrategy.timeHorizon.replace('_', ' ')}`}
                  color="default"
                  size="small"
                />
              </Box>
            </Box>
            <Box>
              <Tooltip title="Save Strategy">
                <IconButton color="primary">
                  <FavoriteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Strategy History">
                <IconButton>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Compare Strategies">
                <IconButton>
                  <CompareArrowsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="text.secondary">
                {selectedStrategy.description}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Return
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    {(selectedStrategy.expectedPerformance.expectedReturn * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Risk
                  </Typography>
                  <Typography variant="body1" color="error.main">
                    {(selectedStrategy.expectedPerformance.expectedRisk * 100).toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="body1">
                    {selectedStrategy.expectedPerformance.sharpeRatio.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Success Probability
                  </Typography>
                  <Typography variant="body1">
                    {(selectedStrategy.expectedPerformance.successProbability * 100).toFixed(0)}%
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          
          {optimizedParameters && (
            <Box mt={2}>
              <Alert severity="success">
                <AlertTitle>Optimized Parameters Applied</AlertTitle>
                This strategy is using optimized parameters that may improve performance.
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
        <Button 
          variant="outlined" 
          startIcon={<MenuIcon />}
          onClick={toggleDrawer}
          fullWidth
        >
          Strategy Tools
        </Button>
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {renderSidebar()}
        </Drawer>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3} lg={2} sx={{ display: { xs: 'none', md: 'block' } }}>
          <Paper sx={{ position: 'sticky', top: 16 }}>
            {renderSidebar()}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9} lg={10}>
          {renderStrategySummary()}
          
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="strategy dashboard tabs"
            >
              <Tab icon={<TuneIcon />} label="Recommendations" />
              <Tab icon={<ShowChartIcon />} label="Backtest" />
              <Tab icon={<HelpOutlineIcon />} label="Explanation" />
              <Tab icon={<SettingsIcon />} label="Optimization" />
              <Tab icon={<SecurityIcon />} label="Risk Analysis" />
            </Tabs>
          </Paper>
          
          <Box sx={{ mt: 3 }}>
            {activeTab === 0 && (
              <StrategyRecommendationPanel 
                onSelectStrategy={handleStrategySelect}
                onViewBacktest={(strategy) => {
                  setSelectedStrategy(strategy);
                  setActiveTab(1);
                }}
                onViewExplanation={(strategy) => {
                  setSelectedStrategy(strategy);
                  setActiveTab(2);
                }}
              />
            )}
            
            {activeTab === 1 && (
              <StrategyBacktestPanel 
                initialStrategy={selectedStrategy}
                onBacktestComplete={handleBacktestComplete}
              />
            )}
            
            {activeTab === 2 && (
              <StrategyExplanationPanel 
                strategyId={selectedStrategy?.id}
                strategyName={selectedStrategy?.name}
                strategyType={selectedStrategy?.type || StrategyType.MOMENTUM}
                strategyParameters={selectedStrategy?.parameters || {}}
              />
            )}
            
            {activeTab === 3 && (
              <StrategyOptimizationPanel 
                strategyType={selectedStrategy?.type || StrategyType.MOMENTUM}
                initialParameters={selectedStrategy?.parameters}
                onOptimizationComplete={handleOptimizationComplete}
              />
            )}
            
            {activeTab === 4 && (
              <StrategyRiskAnalysisPanel 
                strategyType={selectedStrategy?.type || StrategyType.MOMENTUM}
                strategyParameters={selectedStrategy?.parameters || {}}
                onRiskAnalysisComplete={handleRiskAnalysisComplete}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StrategyDashboardPage;