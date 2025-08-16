import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import FinancialDataDemoPage from './pages/FinancialDataDemoPage';
import MarketDataDemoPage from './pages/MarketDataDemoPage';
import MarketInsightsPage from './pages/MarketInsightsPage';
import RealTimeMarketDataPage from './pages/RealTimeMarketDataPage';
import RiskManagementPage from './pages/RiskManagementPage';
import PositionSizingPage from './pages/PositionSizingPage';
import AlgorithmicTradingPage from './pages/AlgorithmicTradingPage';
import MarketAnalyticsDashboardPage from './pages/MarketAnalyticsDashboardPage';
import MonitoringDashboardPage from './pages/MonitoringDashboardPage';
import SettingsPage from './pages/SettingsPage';
import { DashboardDemo } from './components/dashboard';
import { initializeErrorTracking } from './services/monitoring/errorTracking';
import { featureFlags } from './services/featureFlags/featureFlags';

// Material UI Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import StreamIcon from '@mui/icons-material/Stream';
import SecurityIcon from '@mui/icons-material/Security';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PsychologyIcon from '@mui/icons-material/Psychology';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import WidgetsIcon from '@mui/icons-material/Widgets';

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Drawer width
const drawerWidth = 240;

const App: React.FC = () => {
  // Initialize error tracking on app startup
  useEffect(() => {
    initializeErrorTracking();
    
    // Load feature flags
    featureFlags.loadRemoteConfig().catch(error => {
      console.error('Failed to load remote feature flags:', error);
    });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          {/* App Bar */}
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Hedge Fund Trading Platform
              </Typography>
              <Button color="inherit" component={Link} to="/settings">
                Settings
              </Button>
            </Toolbar>
          </AppBar>
          
          {/* Sidebar */}
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar /> {/* This creates space for the AppBar */}
            <Box sx={{ overflow: 'auto' }}>
              <List>
                <ListItem button component={Link} to="/">
                  <ListItemIcon>
                    <DashboardIcon />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component={Link} to="/personalized-dashboard">
                  <ListItemIcon>
                    <WidgetsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Personalized Dashboard" />
                </ListItem>
                <ListItem button component={Link} to="/market-insights">
                  <ListItemIcon>
                    <ShowChartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Market Insights" />
                </ListItem>
                <ListItem button component={Link} to="/financial-data">
                  <ListItemIcon>
                    <BarChartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Financial Data" />
                </ListItem>
                <ListItem button component={Link} to="/market-data">
                  <ListItemIcon>
                    <TimelineIcon />
                  </ListItemIcon>
                  <ListItemText primary="Market Data" />
                </ListItem>
                <ListItem button component={Link} to="/real-time-data">
                  <ListItemIcon>
                    <StreamIcon />
                  </ListItemIcon>
                  <ListItemText primary="Real-Time Data" />
                </ListItem>
                <ListItem button component={Link} to="/risk-management">
                  <ListItemIcon>
                    <SecurityIcon />
                  </ListItemIcon>
                  <ListItemText primary="Risk Management" />
                </ListItem>
                <ListItem button component={Link} to="/position-sizing">
                  <ListItemIcon>
                    <AccountBalanceIcon />
                  </ListItemIcon>
                  <ListItemText primary="Position Sizing" />
                </ListItem>
                <ListItem button component={Link} to="/algorithmic-trading">
                  <ListItemIcon>
                    <AutoGraphIcon />
                  </ListItemIcon>
                  <ListItemText primary="Algorithmic Trading" />
                </ListItem>
                <ListItem button component={Link} to="/market-analytics">
                  <ListItemIcon>
                    <PsychologyIcon />
                  </ListItemIcon>
                  <ListItemText primary="Market Analytics" />
                </ListItem>
                <ListItem button component={Link} to="/monitoring">
                  <ListItemIcon>
                    <MonitorHeartIcon />
                  </ListItemIcon>
                  <ListItemText primary="System Monitoring" />
                </ListItem>
              </List>
              <Divider />
              <List>
                {featureFlags.isEnabled('ml-predictions') && (
                  <ListItem button component={Link} to="/ml-dashboard">
                    <ListItemIcon>
                      <BubbleChartIcon />
                    </ListItemIcon>
                    <ListItemText primary="ML Dashboard" />
                  </ListItem>
                )}
                {featureFlags.isEnabled('backtesting') && (
                  <ListItem button component={Link} to="/backtesting">
                    <ListItemIcon>
                      <TrendingUpIcon />
                    </ListItemIcon>
                    <ListItemText primary="Backtesting" />
                  </ListItem>
                )}
                {featureFlags.isEnabled('portfolio-optimization') && (
                  <ListItem button component={Link} to="/portfolio">
                    <ListItemIcon>
                      <AccountBalanceIcon />
                    </ListItemIcon>
                    <ListItemText primary="Portfolio" />
                  </ListItem>
                )}
              </List>
              <Divider />
              <List>
                <ListItem button component={Link} to="/settings">
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItem>
              </List>
            </Box>
          </Drawer>
          
          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
            <Toolbar /> {/* This creates space for the AppBar */}
            <Routes>
              <Route path="/" element={<MarketInsightsPage />} />
              <Route path="/personalized-dashboard" element={<DashboardDemo />} />
              <Route path="/market-insights" element={<MarketInsightsPage />} />
              <Route path="/financial-data" element={<FinancialDataDemoPage />} />
              <Route path="/market-data" element={<MarketDataDemoPage />} />
              <Route path="/real-time-data" element={<RealTimeMarketDataPage />} />
              <Route path="/risk-management" element={<RiskManagementPage />} />
              <Route path="/position-sizing" element={<PositionSizingPage />} />
              <Route path="/algorithmic-trading" element={<AlgorithmicTradingPage />} />
              <Route path="/market-analytics" element={<MarketAnalyticsDashboardPage />} />
              <Route path="/monitoring" element={<MonitoringDashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* Add routes for other pages when they're implemented */}
              {featureFlags.isEnabled('ml-predictions') && (
                <Route path="/ml-dashboard" element={<div>ML Dashboard (Coming Soon)</div>} />
              )}
              {featureFlags.isEnabled('backtesting') && (
                <Route path="/backtesting" element={<div>Backtesting (Coming Soon)</div>} />
              )}
              {featureFlags.isEnabled('portfolio-optimization') && (
                <Route path="/portfolio" element={<div>Portfolio (Coming Soon)</div>} />
              )}
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;