import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  TextField, 
  InputAdornment, 
  IconButton, 
  Button, 
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Drawer,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery
} from '@mui/material';

// Import strategy components
import StrategyRecommendationPanel from './StrategyRecommendationPanel';
import StrategyBacktestPanel from './StrategyBacktestPanel';
import StrategyExplanationPanel from './StrategyExplanationPanel';
import NLPStrategyInsightsPanel from './NLPStrategyInsightsPanel';

// Import visualization components
import { 
  ThreeDVisualizationComponent,
  NetworkGraphComponent,
  AnimatedTimeSeriesComponent,
  HeatmapVisualizationComponent
} from '../visualization';

// Import services
import { StrategyRecommendationService } from '../../services/strategy/StrategyRecommendationService';
import { StrategyBacktestService } from '../../services/strategy/StrategyBacktestService';
import { StrategyExplanationService } from '../../services/strategy/StrategyExplanationService';
import { StrategyOptimizationService } from '../../services/strategy/StrategyOptimizationService';
import { StrategyRiskAnalysisService } from '../../services/strategy/StrategyRiskAnalysisService';
import { PersonalizedRecommendationService } from '../../services/strategy/PersonalizedRecommendationService';
import { StrategyEvaluationService } from '../../services/strategy/StrategyEvaluationService';

// Import types
import { 
  TradingStrategy, 
  UserPreferences,
  StrategyType,
  Timeframe,
  RiskLevel,
  MarketCondition,
  StrategyBacktestResult,
  StrategyOptimizationResult
} from '../../models/strategy/StrategyTypes';

// Mock icons (replace with actual imports in a real implementation)
const SearchIcon = () => <Box>🔍</Box>;
const MenuIcon = () => <Box>☰</Box>;
const CloseIcon = () => <Box>✖</Box>;
const DashboardIcon = () => <Box>📊</Box>;
const RecommendationIcon = () => <Box>🔮</Box>;
const BacktestIcon = () => <Box>📈</Box>;
const OptimizationIcon = () => <Box>⚙️</Box>;
const ExplanationIcon = () => <Box>📚</Box>;
const RiskIcon = () => <Box>🛡️</Box>;
const HistoryIcon = () => <Box>📜</Box>;
const FavoriteIcon = () => <Box>⭐</Box>;
const SettingsIcon = () => <Box>⚙️</Box>;
const NLPIcon = () => <Box>🧠</Box>;
const VisualizationIcon = () => <Box>👁️</Box>;

// Define tab values
enum TabValue {
  RECOMMENDATIONS = 0,
  BACKTEST = 1,
  OPTIMIZATION = 2,
  EXPLANATION = 3,
  RISK_ANALYSIS = 4,
  NLP_INSIGHTS = 5,
  VISUALIZATIONS = 6
}

interface StrategyDashboardPageProps {
  apiKey: string;
  baseUrl?: string;
  userPreferences?: UserPreferences;
}

const StrategyDashboardPage: React.FC<StrategyDashboardPageProps> = ({
  apiKey,
  baseUrl,
  userPreferences
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for UI
  const [activeTab, setActiveTab] = useState<TabValue>(TabValue.RECOMMENDATIONS);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(!isMobile);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ticker, setTicker] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for strategy data
  const [selectedStrategy, setSelectedStrategy] = useState<TradingStrategy | null>(null);
  const [recentStrategies, setRecentStrategies] = useState<TradingStrategy[]>([]);
  const [favoriteStrategies, setFavoriteStrategies] = useState<TradingStrategy[]>([]);
  const [backtestResult, setBacktestResult] = useState<StrategyBacktestResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<StrategyOptimizationResult | null>(null);
  const [visualizationTab, setVisualizationTab] = useState<number>(0);
  
  // Services
  const [recommendationService] = useState<StrategyRecommendationService>(
    new StrategyRecommendationService(apiKey, baseUrl)
  );
  const [backtestService] = useState<StrategyBacktestService>(
    new StrategyBacktestService(apiKey, baseUrl)
  );
  const [explanationService] = useState<StrategyExplanationService>(
    new StrategyExplanationService(apiKey, baseUrl)
  );
  const [optimizationService] = useState<StrategyOptimizationService>(
    new StrategyOptimizationService(apiKey, baseUrl)
  );
  const [riskAnalysisService] = useState<StrategyRiskAnalysisService>(
    new StrategyRiskAnalysisService(apiKey, baseUrl)
  );
  const [personalizedRecommendationService] = useState<PersonalizedRecommendationService>(
    new PersonalizedRecommendationService(apiKey, baseUrl)
  );
  const [evaluationService] = useState<StrategyEvaluationService>(
    new StrategyEvaluationService(apiKey, baseUrl)
  );
  
  // Default user preferences if not provided
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferences>(
    userPreferences || {
      riskTolerance: RiskLevel.MODERATE,
      preferredTimeframes: [Timeframe.DAILY],
      preferredStrategyTypes: [],
      excludedStrategyTypes: [],
      preferredMarketConditions: [],
      maxComplexity: 70,
      minSharpeRatio: 1.0,
      maxDrawdown: -0.15,
      minWinRate: 0.5,
      customTags: []
    }
  );

  // Update preferences when props change
  useEffect(() => {
    if (userPreferences) {
      setCurrentPreferences(userPreferences);
    }
  }, [userPreferences]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle search query change
  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle ticker change
  const handleTickerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(event.target.value.toUpperCase());
  };

  // Handle ticker submit
  const handleTickerSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (ticker) {
      // Reset selected strategy and results when ticker changes
      setSelectedStrategy(null);
      setBacktestResult(null);
      setOptimizationResult(null);
      
      // Switch to recommendations tab
      setActiveTab(TabValue.RECOMMENDATIONS);
    }
  };

  // Handle strategy selection
  const handleStrategySelect = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy);
    
    // Add to recent strategies if not already there
    if (!recentStrategies.some(s => s.id === strategy.id)) {
      setRecentStrategies(prev => [strategy, ...prev].slice(0, 5));
    }
  };

  // Handle backtest request
  const handleBacktestRequest = (strategy: TradingStrategy, ticker: string) => {
    setSelectedStrategy(strategy);
    setActiveTab(TabValue.BACKTEST);
  };

  // Handle backtest complete
  const handleBacktestComplete = (result: StrategyBacktestResult) => {
    setBacktestResult(result);
  };

  // Handle optimization request
  const handleOptimizationRequest = (strategy: TradingStrategy, ticker: string) => {
    setSelectedStrategy(strategy);
    setActiveTab(TabValue.OPTIMIZATION);
  };

  // Handle optimization complete
  const handleOptimizationComplete = (result: StrategyOptimizationResult) => {
    setOptimizationResult(result);
  };

  // Handle explanation request
  const handleExplanationRequest = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy);
    setActiveTab(TabValue.EXPLANATION);
  };

  // Handle risk analysis request
  const handleRiskAnalysisRequest = (strategy: TradingStrategy) => {
    setSelectedStrategy(strategy);
    setActiveTab(TabValue.RISK_ANALYSIS);
  };

  // Handle NLP insights request
  const handleNLPInsightsRequest = () => {
    setActiveTab(TabValue.NLP_INSIGHTS);
  };

  // Handle visualization request
  const handleVisualizationRequest = () => {
    setActiveTab(TabValue.VISUALIZATIONS);
  };

  // Handle strategy type selection from NLP insights
  const handleStrategyTypeSelect = (strategyType: StrategyType) => {
    // Update user preferences to include this strategy type
    const updatedPreferences = { ...currentPreferences };
    if (!updatedPreferences.preferredStrategyTypes.includes(strategyType)) {
      updatedPreferences.preferredStrategyTypes = [...updatedPreferences.preferredStrategyTypes, strategyType];
      setCurrentPreferences(updatedPreferences);
    }
    
    // Switch to recommendations tab
    setActiveTab(TabValue.RECOMMENDATIONS);
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (strategy: TradingStrategy) => {
    if (favoriteStrategies.some(s => s.id === strategy.id)) {
      setFavoriteStrategies(favoriteStrategies.filter(s => s.id !== strategy.id));
    } else {
      setFavoriteStrategies([...favoriteStrategies, strategy]);
    }
  };

  // Handle visualization tab change
  const handleVisualizationTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setVisualizationTab(newValue);
  };

  // Render drawer content
  const renderDrawerContent = () => (
    <Box sx={{ width: 250, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Strategy Dashboard
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.RECOMMENDATIONS}
            onClick={() => setActiveTab(TabValue.RECOMMENDATIONS)}
          >
            <ListItemIcon>
              <RecommendationIcon />
            </ListItemIcon>
            <ListItemText primary="Recommendations" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.NLP_INSIGHTS}
            onClick={() => setActiveTab(TabValue.NLP_INSIGHTS)}
            disabled={!ticker}
          >
            <ListItemIcon>
              <NLPIcon />
            </ListItemIcon>
            <ListItemText primary="NLP Insights" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.BACKTEST}
            onClick={() => setActiveTab(TabValue.BACKTEST)}
            disabled={!selectedStrategy}
          >
            <ListItemIcon>
              <BacktestIcon />
            </ListItemIcon>
            <ListItemText primary="Backtest" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.OPTIMIZATION}
            onClick={() => setActiveTab(TabValue.OPTIMIZATION)}
            disabled={!selectedStrategy}
          >
            <ListItemIcon>
              <OptimizationIcon />
            </ListItemIcon>
            <ListItemText primary="Optimization" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.EXPLANATION}
            onClick={() => setActiveTab(TabValue.EXPLANATION)}
            disabled={!selectedStrategy}
          >
            <ListItemIcon>
              <ExplanationIcon />
            </ListItemIcon>
            <ListItemText primary="Explanation" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.RISK_ANALYSIS}
            onClick={() => setActiveTab(TabValue.RISK_ANALYSIS)}
            disabled={!selectedStrategy}
          >
            <ListItemIcon>
              <RiskIcon />
            </ListItemIcon>
            <ListItemText primary="Risk Analysis" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={activeTab === TabValue.VISUALIZATIONS}
            onClick={() => setActiveTab(TabValue.VISUALIZATIONS)}
          >
            <ListItemIcon>
              <VisualizationIcon />
            </ListItemIcon>
            <ListItemText primary="Visualizations" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Recent Strategies
      </Typography>
      
      <List dense>
        {recentStrategies.length > 0 ? (
          recentStrategies.map((strategy) => (
            <ListItem 
              key={strategy.id} 
              disablePadding
              secondaryAction={
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={() => handleFavoriteToggle(strategy)}
                >
                  <FavoriteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => handleStrategySelect(strategy)}>
                <ListItemIcon>
                  <HistoryIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={strategy.name} 
                  secondary={getStrategyTypeLabel(strategy.type)}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText 
              primary="No recent strategies" 
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
        )}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle2" gutterBottom>
        Favorite Strategies
      </Typography>
      
      <List dense>
        {favoriteStrategies.length > 0 ? (
          favoriteStrategies.map((strategy) => (
            <ListItem 
              key={strategy.id} 
              disablePadding
              secondaryAction={
                <IconButton 
                  edge="end" 
                  size="small"
                  onClick={() => handleFavoriteToggle(strategy)}
                >
                  <FavoriteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => handleStrategySelect(strategy)}>
                <ListItemIcon>
                  <FavoriteIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={strategy.name} 
                  secondary={getStrategyTypeLabel(strategy.type)}
                  primaryTypographyProps={{ noWrap: true }}
                  secondaryTypographyProps={{ noWrap: true }}
                />
              </ListItemButton>
            </ListItem>
          ))
        ) : (
          <ListItem>
            <ListItemText 
              primary="No favorite strategies" 
              primaryTypographyProps={{ color: 'text.secondary', variant: 'body2' }}
            />
          </ListItem>
        )}
      </List>
    </Box>
  );

  // Get strategy type label
  const getStrategyTypeLabel = (type: StrategyType): string => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          {renderDrawerContent()}
        </Drawer>
      ) : (
        <Drawer
          variant="persistent"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? 250 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 250,
              boxSizing: 'border-box',
            },
          }}
        >
          {renderDrawerContent()}
        </Drawer>
      )}
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 250 : 0}px)` },
          ml: { sm: drawerOpen ? `${250}px` : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* App Bar */}
        <AppBar 
          position="static" 
          color="default" 
          elevation={1}
          sx={{ mb: 2 }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {selectedStrategy ? selectedStrategy.name : 'Strategy Dashboard'}
            </Typography>
            
            <Box component="form" onSubmit={handleTickerSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Enter ticker..."
                value={ticker}
                onChange={handleTickerChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 1 }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                disabled={!ticker}
              >
                Search
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* Error message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {/* Strategy info card */}
        {selectedStrategy && (
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">
                    {selectedStrategy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedStrategy.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={getStrategyTypeLabel(selectedStrategy.type)} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label={`Risk: ${selectedStrategy.riskLevel.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`} 
                      color={
                        selectedStrategy.riskLevel === RiskLevel.VERY_HIGH || selectedStrategy.riskLevel === RiskLevel.HIGH ? 'error' :
                        selectedStrategy.riskLevel === RiskLevel.MODERATE ? 'warning' : 'success'
                      }
                      size="small" 
                    />
                    {selectedStrategy.timeframes.slice(0, 3).map((timeframe, index) => (
                      <Chip 
                        key={index}
                        label={timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} 
                        variant="outlined"
                        size="small" 
                      />
                    ))}
                    {selectedStrategy.tags.slice(0, 3).map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag} 
                        variant="outlined"
                        size="small" 
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="Recommendations" 
              value={TabValue.RECOMMENDATIONS}
              icon={<RecommendationIcon />}
              iconPosition="start"
            />
            <Tab 
              label="NLP Insights" 
              value={TabValue.NLP_INSIGHTS}
              icon={<NLPIcon />}
              iconPosition="start"
              disabled={!ticker}
            />
            <Tab 
              label="Backtest" 
              value={TabValue.BACKTEST}
              icon={<BacktestIcon />}
              iconPosition="start"
              disabled={!selectedStrategy}
            />
            <Tab 
              label="Optimization" 
              value={TabValue.OPTIMIZATION}
              icon={<OptimizationIcon />}
              iconPosition="start"
              disabled={!selectedStrategy}
            />
            <Tab 
              label="Explanation" 
              value={TabValue.EXPLANATION}
              icon={<ExplanationIcon />}
              iconPosition="start"
              disabled={!selectedStrategy}
            />
            <Tab 
              label="Risk Analysis" 
              value={TabValue.RISK_ANALYSIS}
              icon={<RiskIcon />}
              iconPosition="start"
              disabled={!selectedStrategy}
            />
            <Tab 
              label="Visualizations" 
              value={TabValue.VISUALIZATIONS}
              icon={<VisualizationIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* Tab panels */}
        <Box sx={{ mt: 2 }}>
          {/* Recommendations tab */}
          {activeTab === TabValue.RECOMMENDATIONS && (
            <StrategyRecommendationPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              ticker={ticker}
              userPreferences={currentPreferences}
              onStrategySelect={handleStrategySelect}
              onBacktestRequest={handleBacktestRequest}
              onOptimizeRequest={handleOptimizationRequest}
            />
          )}
          
          {/* NLP Insights tab */}
          {activeTab === TabValue.NLP_INSIGHTS && ticker && (
            <NLPStrategyInsightsPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              ticker={ticker}
              onStrategyTypeSelect={handleStrategyTypeSelect}
            />
          )}
          
          {/* Backtest tab */}
          {activeTab === TabValue.BACKTEST && selectedStrategy && (
            <StrategyBacktestPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              strategy={selectedStrategy}
              ticker={ticker}
              onOptimizeRequest={handleOptimizationRequest}
            />
          )}
          
          {/* Optimization tab */}
          {activeTab === TabValue.OPTIMIZATION && selectedStrategy && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Strategy Optimization
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The optimization panel will be implemented in the next phase.
              </Typography>
            </Box>
          )}
          
          {/* Explanation tab */}
          {activeTab === TabValue.EXPLANATION && selectedStrategy && (
            <StrategyExplanationPanel
              apiKey={apiKey}
              baseUrl={baseUrl}
              strategy={selectedStrategy}
              onParameterExplanationRequest={(parameterId) => {
                // Handle parameter explanation request
              }}
              onMarketConditionAnalysisRequest={(condition) => {
                // Handle market condition analysis request
              }}
              onCompareStrategyRequest={(strategyId) => {
                // Handle compare strategy request
              }}
            />
          )}
          
          {/* Risk Analysis tab */}
          {activeTab === TabValue.RISK_ANALYSIS && selectedStrategy && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Risk Analysis
              </Typography>
              <Typography variant="body1" color="text.secondary">
                The risk analysis panel will be implemented in the next phase.
              </Typography>
            </Box>
          )}
          
          {/* Visualizations tab */}
          {activeTab === TabValue.VISUALIZATIONS && (
            <Box>
              <Tabs
                value={visualizationTab}
                onChange={handleVisualizationTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2 }}
              >
                <Tab label="3D Visualization" />
                <Tab label="Network Graph" />
                <Tab label="Time Series" />
                <Tab label="Correlation Heatmap" />
              </Tabs>

              {visualizationTab === 0 && (
                <Box sx={{ height: 600 }}>
                  <ThreeDVisualizationComponent
                    data={Array(100).fill(0).map((_, i) => ({
                      id: `point-${i}`,
                      x: Math.random() * 100 - 50,
                      y: Math.random() * 100 - 50,
                      z: Math.random() * 100 - 50,
                      value: Math.random() * 10,
                      category: ['Category A', 'Category B', 'Category C'][Math.floor(Math.random() * 3)],
                      label: `Point ${i}`
                    }))}
                    width={800}
                    height={600}
                    title="Strategy Performance in 3D Space"
                    xLabel="Return"
                    yLabel="Risk"
                    zLabel="Sharpe Ratio"
                    categories={['Category A', 'Category B', 'Category C']}
                    showLabels={true}
                    showAxes={true}
                    showGrid={true}
                    showLegend={true}
                  />
                </Box>
              )}

              {visualizationTab === 1 && (
                <Box sx={{ height: 600 }}>
                  <NetworkGraphComponent
                    nodes={Array(20).fill(0).map((_, i) => ({
                      id: `node-${i}`,
                      label: `Node ${i}`,
                      value: Math.random() * 10 + 1,
                      category: ['Asset', 'Strategy', 'Factor'][Math.floor(Math.random() * 3)]
                    }))}
                    links={Array(30).fill(0).map((_, i) => ({
                      source: `node-${Math.floor(Math.random() * 20)}`,
                      target: `node-${Math.floor(Math.random() * 20)}`,
                      value: Math.random() * 2 - 1
                    }))}
                    width={800}
                    height={600}
                    title="Strategy Correlation Network"
                    categories={['Asset', 'Strategy', 'Factor']}
                    showLabels={true}
                    showLegend={true}
                    directed={true}
                  />
                </Box>
              )}

              {visualizationTab === 2 && (
                <Box sx={{ height: 600 }}>
                  <AnimatedTimeSeriesComponent
                    series={[
                      {
                        id: 'series-1',
                        name: 'Strategy A',
                        color: '#1f77b4',
                        category: 'Momentum',
                        data: Array(100).fill(0).map((_, i) => ({
                          date: new Date(2023, 0, i + 1),
                          value: 100 + Math.random() * 50 * Math.sin(i / 10) + i / 5,
                          category: 'Momentum'
                        }))
                      },
                      {
                        id: 'series-2',
                        name: 'Strategy B',
                        color: '#ff7f0e',
                        category: 'Mean Reversion',
                        data: Array(100).fill(0).map((_, i) => ({
                          date: new Date(2023, 0, i + 1),
                          value: 100 + Math.random() * 30 * Math.cos(i / 10) + i / 8,
                          category: 'Mean Reversion'
                        }))
                      },
                      {
                        id: 'series-3',
                        name: 'Benchmark',
                        color: '#2ca02c',
                        category: 'Benchmark',
                        data: Array(100).fill(0).map((_, i) => ({
                          date: new Date(2023, 0, i + 1),
                          value: 100 + i / 10 + Math.random() * 5,
                          category: 'Benchmark'
                        }))
                      }
                    ]}
                    width={800}
                    height={500}
                    title="Strategy Performance Over Time"
                    xLabel="Date"
                    yLabel="Value"
                    categories={['Momentum', 'Mean Reversion', 'Benchmark']}
                    showLegend={true}
                    showControls={true}
                    showGrid={true}
                    showTooltip={true}
                  />
                </Box>
              )}

              {visualizationTab === 3 && (
                <Box sx={{ height: 600 }}>
                  <HeatmapVisualizationComponent
                    data={[
                      [1.0, 0.7, 0.3, -0.2, -0.5],
                      [0.7, 1.0, 0.6, 0.1, -0.3],
                      [0.3, 0.6, 1.0, 0.5, 0.2],
                      [-0.2, 0.1, 0.5, 1.0, 0.8],
                      [-0.5, -0.3, 0.2, 0.8, 1.0]
                    ]}
                    rowLabels={['SPY', 'QQQ', 'IWM', 'GLD', 'TLT']}
                    colLabels={['SPY', 'QQQ', 'IWM', 'GLD', 'TLT']}
                    width={800}
                    height={500}
                    title="Asset Correlation Matrix"
                    showValues={true}
                    showLegend={true}
                    minValue={-1}
                    maxValue={1}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default StrategyDashboardPage;