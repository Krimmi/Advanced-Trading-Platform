import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  Button, 
  CircularProgress,
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import TuneIcon from '@mui/icons-material/Tune';
import TimelineIcon from '@mui/icons-material/Timeline';
import BarChartIcon from '@mui/icons-material/BarChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssessmentIcon from '@mui/icons-material/Assessment';

import BacktestConfigPanel from './BacktestConfigPanel';
import StrategyBuilder from './StrategyBuilder';
import BacktestRunner from './BacktestRunner';
import BacktestResultsViewer from './BacktestResultsViewer';
import PerformanceResultsPanel from './PerformanceResultsPanel';
import SimulationControlPanel from './SimulationControlPanel';
import BacktestHistoryPanel from './BacktestHistoryPanel';
import BacktestComparisonPanel from './BacktestComparisonPanel';
import StrategyOptimizationPanel from './StrategyOptimizationPanel';
import TradeListComponent from './TradeListComponent';

// Import the new unified backtesting service
import { 
  unifiedBacktestingService, 
  UnifiedBacktestingService 
} from '../../services/backtesting';
import { StrategyRegistry } from '../../services/algorithmic-trading/registry/StrategyRegistry';
import { StrategyFactory } from '../../services/algorithmic-trading/registry/StrategyFactory';

import { BacktestResult, BacktestConfig } from '../../types/backtesting/backtestingTypes';
import { Strategy } from '../../types/backtesting/strategyTypes';

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
      id={`backtesting-tabpanel-${index}`}
      aria-labelledby={`backtesting-tab-${index}`}
      style={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `backtesting-tab-${index}`,
    'aria-controls': `backtesting-tabpanel-${index}`,
  };
}

const BacktestingDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [backtestResults, setBacktestResults] = useState<BacktestResult[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedBacktestResult, setSelectedBacktestResult] = useState<BacktestResult | null>(null);
  const [selectedBacktestResults, setSelectedBacktestResults] = useState<BacktestResult[]>([]);
  const [isCreatingStrategy, setIsCreatingStrategy] = useState<boolean>(false);
  const [isCreatingBacktest, setIsCreatingBacktest] = useState<boolean>(false);

  // Use the strategy registry and factory
  const strategyRegistry = new StrategyRegistry();
  const strategyFactory = new StrategyFactory(strategyRegistry);

  useEffect(() => {
    // Initialize the unified backtesting service
    unifiedBacktestingService.initialize().then(() => {
      fetchStrategies();
      fetchBacktestResults();
    }).catch(error => {
      console.error('Error initializing backtesting service:', error);
      setError('Failed to initialize backtesting service. Please try again later.');
    });
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      // Get strategies from the strategy registry
      const registeredStrategies = strategyRegistry.getAllStrategies();
      setStrategies(registeredStrategies);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching strategies:', err);
      setError('Failed to load strategies. Please try again later.');
      setLoading(false);
    }
  };

  const fetchBacktestResults = async () => {
    try {
      setLoading(true);
      // Get backtest results from the unified backtesting service
      const results = unifiedBacktestingService.getAllBacktestResults();
      setBacktestResults(results);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching backtest results:', err);
      setError('Failed to load backtest results. Please try again later.');
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStrategySelect = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setIsCreatingStrategy(false);
  };

  const handleBacktestResultSelect = (result: BacktestResult) => {
    setSelectedBacktestResult(result);
    setIsCreatingBacktest(false);
    // Switch to results viewer tab
    setTabValue(3);
  };

  const handleBacktestResultsSelect = (results: BacktestResult[]) => {
    setSelectedBacktestResults(results);
  };

  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    setIsCreatingStrategy(true);
    setTabValue(0);
  };

  const handleCreateBacktest = () => {
    setSelectedBacktestResult(null);
    setIsCreatingBacktest(true);
    setTabValue(1);
  };

  const handleStrategyCreated = (strategy: Strategy) => {
    // Register the strategy with the strategy registry
    strategyRegistry.registerStrategy(strategy);
    setStrategies([...strategies, strategy]);
    setSelectedStrategy(strategy);
    setIsCreatingStrategy(false);
    // Switch to backtest runner tab
    setTabValue(1);
  };

  const handleBacktestStart = async (config: BacktestConfig) => {
    try {
      setLoading(true);
      // Create the backtest configuration
      const createdConfig = await unifiedBacktestingService.createBacktestConfig(config);
      
      // Execute the backtest
      const result = await unifiedBacktestingService.executeBacktest(createdConfig);
      
      // Handle the backtest completion
      handleBacktestComplete(result);
      setLoading(false);
    } catch (error) {
      console.error('Error executing backtest:', error);
      setError('Failed to execute backtest. Please try again later.');
      setLoading(false);
    }
  };

  const handleBacktestComplete = (result: BacktestResult) => {
    setBacktestResults([...backtestResults, result]);
    setSelectedBacktestResult(result);
    setIsCreatingBacktest(false);
    // Switch to results viewer tab
    setTabValue(3);
  };

  const handleRefresh = () => {
    fetchStrategies();
    fetchBacktestResults();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="backtesting tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<TuneIcon />} 
            iconPosition="start" 
            label="Strategy Builder" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<PlayArrowIcon />} 
            iconPosition="start" 
            label="Run Backtest" 
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<HistoryIcon />} 
            iconPosition="start" 
            label="History" 
            {...a11yProps(2)} 
          />
          <Tab 
            icon={<AssessmentIcon />} 
            iconPosition="start" 
            label="Results Viewer" 
            {...a11yProps(3)} 
          />
          <Tab 
            icon={<TimelineIcon />} 
            iconPosition="start" 
            label="Performance" 
            {...a11yProps(4)} 
          />
          <Tab 
            icon={<CompareArrowsIcon />} 
            iconPosition="start" 
            label="Compare" 
            {...a11yProps(5)} 
          />
        </Tabs>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <StrategyBuilder 
            strategy={isCreatingStrategy ? null : selectedStrategy}
            isCreating={isCreatingStrategy}
            onStrategyCreated={handleStrategyCreated}
            onStrategySelected={handleStrategySelect}
            strategies={strategies}
            onCreateNew={handleCreateStrategy}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <BacktestRunner 
            strategy={selectedStrategy}
            onBacktestComplete={handleBacktestComplete}
            onBacktestStart={handleBacktestStart}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <BacktestHistoryPanel 
            backtestResults={backtestResults}
            onBacktestSelected={handleBacktestResultSelect}
            onRefresh={handleRefresh}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <BacktestResultsViewer 
            backtestResult={selectedBacktestResult}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <PerformanceResultsPanel 
            backtestResult={selectedBacktestResult}
            onBacktestSelected={handleBacktestResultSelect}
            backtestResults={backtestResults}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <BacktestComparisonPanel 
            selectedResults={selectedBacktestResults}
            onResultsSelected={handleBacktestResultsSelect}
            backtestResults={backtestResults}
          />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default BacktestingDashboard;