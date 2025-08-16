import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  Tooltip,
  Badge,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import BarChartIcon from '@mui/icons-material/BarChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';

// Import ML components
import {
  MLModelManagementPanel,
  PredictionDashboard,
  FeatureImportancePanel,
  ModelPerformancePanel,
  AutoMLConfigPanel
} from '../../../components/ml';

// Import services and types
import { MLService } from '../../services';
import { MLModel } from '../../../types/ml';

// Define user preferences interface
interface UserPreferences {
  darkMode: boolean;
  compactView: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  defaultTab: string;
  sidebarOpen: boolean;
}

const UnifiedDashboardPage: React.FC = () => {
  // Theme and responsive states
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [currentSection, setCurrentSection] = useState<string>('dashboard');
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    darkMode: false,
    compactView: false,
    autoRefresh: false,
    refreshInterval: 60,
    defaultTab: 'dashboard',
    sidebarOpen: true
  });
  
  // Create responsive theme
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });
  
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  // Effect to handle responsive drawer
  useEffect(() => {
    if (isSmallScreen) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(userPreferences.sidebarOpen);
    }
  }, [isSmallScreen, userPreferences.sidebarOpen]);
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
    if (!isSmallScreen) {
      setUserPreferences(prev => ({
        ...prev,
        sidebarOpen: !drawerOpen
      }));
    }
  };
  
  // Handle section change
  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    if (isSmallScreen) {
      setDrawerOpen(false);
    }
  };
  
  // Handle theme toggle
  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
    setUserPreferences(prev => ({
      ...prev,
      darkMode: !darkMode
    }));
  };
  
  // Handle user menu
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Handle notification menu
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchor(event.currentTarget);
  };
  
  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };
  
  // Handle settings toggle
  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };
  
  // Handle preference change
  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Apply changes immediately for some preferences
    if (key === 'darkMode') {
      setDarkMode(value);
    }
  };
  
  // Handle model selection
  const handleModelSelect = (model: MLModel) => {
    setSelectedModel(model);
  };
  
  // Render the sidebar
  const renderSidebar = () => {
    const drawerWidth = 240;
    
    return (
      <Drawer
        variant={isSmallScreen ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            ML Platform
          </Typography>
          {isSmallScreen && (
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Divider />
        <List>
          <ListItem 
            button 
            selected={currentSection === 'dashboard'} 
            onClick={() => handleSectionChange('dashboard')}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem 
            button 
            selected={currentSection === 'models'} 
            onClick={() => handleSectionChange('models')}
          >
            <ListItemIcon>
              <ModelTrainingIcon />
            </ListItemIcon>
            <ListItemText primary="Models" />
          </ListItem>
          <ListItem 
            button 
            selected={currentSection === 'predictions'} 
            onClick={() => handleSectionChange('predictions')}
          >
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="Predictions" />
          </ListItem>
          <ListItem 
            button 
            selected={currentSection === 'features'} 
            onClick={() => handleSectionChange('features')}
          >
            <ListItemIcon>
              <BubbleChartIcon />
            </ListItemIcon>
            <ListItemText primary="Feature Importance" />
          </ListItem>
          <ListItem 
            button 
            selected={currentSection === 'performance'} 
            onClick={() => handleSectionChange('performance')}
          >
            <ListItemIcon>
              <TimelineIcon />
            </ListItemIcon>
            <ListItemText primary="Performance" />
          </ListItem>
          <ListItem 
            button 
            selected={currentSection === 'automl'} 
            onClick={() => handleSectionChange('automl')}
          >
            <ListItemIcon>
              <AutoGraphIcon />
            </ListItemIcon>
            <ListItemText primary="AutoML" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={handleSettingsToggle}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Help" />
          </ListItem>
        </List>
      </Drawer>
    );
  };
  
  // Render the settings drawer
  const renderSettingsDrawer = () => {
    return (
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={handleSettingsToggle}
        sx={{ width: 300 }}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Settings</Typography>
            <IconButton onClick={handleSettingsToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Appearance
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={userPreferences.darkMode}
                onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
              />
            }
            label="Dark Mode"
          />
          <FormControlLabel
            control={
              <Switch
                checked={userPreferences.compactView}
                onChange={(e) => handlePreferenceChange('compactView', e.target.checked)}
              />
            }
            label="Compact View"
          />
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Data Refresh
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={userPreferences.autoRefresh}
                onChange={(e) => handlePreferenceChange('autoRefresh', e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          {userPreferences.autoRefresh && (
            <Box sx={{ ml: 3, mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                Refresh Interval (seconds)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={userPreferences.refreshInterval}
                    min={10}
                    max={300}
                    step={10}
                    onChange={(_, value) => handlePreferenceChange('refreshInterval', value)}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item>
                  <Typography variant="body2">
                    {userPreferences.refreshInterval}s
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Default View
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              variant={userPreferences.defaultTab === 'dashboard' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePreferenceChange('defaultTab', 'dashboard')}
              sx={{ mr: 1, mb: 1 }}
            >
              Dashboard
            </Button>
            <Button
              variant={userPreferences.defaultTab === 'models' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePreferenceChange('defaultTab', 'models')}
              sx={{ mr: 1, mb: 1 }}
            >
              Models
            </Button>
            <Button
              variant={userPreferences.defaultTab === 'predictions' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePreferenceChange('defaultTab', 'predictions')}
              sx={{ mr: 1, mb: 1 }}
            >
              Predictions
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={handleSettingsToggle}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSettingsToggle}>
              Save
            </Button>
          </Box>
        </Box>
      </Drawer>
    );
  };
  
  // Render the main content based on current section
  const renderMainContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return renderDashboard();
      case 'models':
        return (
          <MLModelManagementPanel 
            onModelSelect={handleModelSelect}
          />
        );
      case 'predictions':
        return (
          <PredictionDashboard 
            selectedModel={selectedModel}
          />
        );
      case 'features':
        return (
          <FeatureImportancePanel 
            selectedModel={selectedModel}
          />
        );
      case 'performance':
        return (
          <ModelPerformancePanel 
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
          />
        );
      case 'automl':
        return (
          <AutoMLConfigPanel />
        );
      default:
        return renderDashboard();
    }
  };
  
  // Render the dashboard overview
  const renderDashboard = () => {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          ML Platform Dashboard
        </Typography>
        
        {selectedModel && (
          <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1">
                Selected Model: <strong>{selectedModel.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type: {selectedModel.type} | Status: {selectedModel.status}
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => setSelectedModel(null)}
            >
              Clear Selection
            </Button>
          </Paper>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader title="Models" />
              <Divider />
              <CardContent>
                <Typography variant="h3" align="center">
                  12
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Total Models
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                  <Chip label="8 Deployed" color="success" size="small" />
                  <Chip label="3 Training" color="warning" size="small" />
                  <Chip label="1 Failed" color="error" size="small" />
                </Box>
              </CardContent>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button 
                  fullWidth 
                  size="small"
                  onClick={() => handleSectionChange('models')}
                >
                  View All Models
                </Button>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader title="Predictions" />
              <Divider />
              <CardContent>
                <Typography variant="h3" align="center">
                  1,458
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Predictions This Week
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                  <Chip label="87% Accuracy" color="primary" size="small" />
                </Box>
              </CardContent>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button 
                  fullWidth 
                  size="small"
                  onClick={() => handleSectionChange('predictions')}
                >
                  Make Predictions
                </Button>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader title="Performance" />
              <Divider />
              <CardContent>
                <Typography variant="h3" align="center">
                  89%
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Average Model Accuracy
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                  <Chip label="+2.5% This Month" color="success" size="small" />
                </Box>
              </CardContent>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button 
                  fullWidth 
                  size="small"
                  onClick={() => handleSectionChange('performance')}
                >
                  View Performance
                </Button>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={3}>
            <Card>
              <CardHeader title="AutoML" />
              <Divider />
              <CardContent>
                <Typography variant="h3" align="center">
                  3
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  AutoML Runs This Month
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
                  <Chip label="1 Running" color="warning" size="small" />
                  <Chip label="2 Completed" color="success" size="small" />
                </Box>
              </CardContent>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button 
                  fullWidth 
                  size="small"
                  onClick={() => handleSectionChange('automl')}
                >
                  Start AutoML
                </Button>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader 
                title="Recent Model Performance" 
                action={
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent sx={{ height: 300 }}>
                {/* Placeholder for chart */}
                <Box 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Performance Chart
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader 
                title="Top Features" 
                action={
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent sx={{ height: 300 }}>
                {/* Placeholder for feature importance */}
                <Box 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Feature Importance Chart
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Recent Activity" 
                action={
                  <IconButton>
                    <RefreshIcon />
                  </IconButton>
                }
              />
              <Divider />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Activity</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>2023-08-12 14:32</TableCell>
                        <TableCell>Model Deployed</TableCell>
                        <TableCell>Stock Predictor v2</TableCell>
                        <TableCell>
                          <Chip label="Success" color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2023-08-12 13:15</TableCell>
                        <TableCell>Training Completed</TableCell>
                        <TableCell>Portfolio Optimizer</TableCell>
                        <TableCell>
                          <Chip label="Success" color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2023-08-12 11:47</TableCell>
                        <TableCell>AutoML Started</TableCell>
                        <TableCell>Risk Model</TableCell>
                        <TableCell>
                          <Chip label="In Progress" color="warning" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small">View</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>2023-08-12 10:23</TableCell>
                        <TableCell>Prediction Batch</TableCell>
                        <TableCell>Market Sentiment</TableCell>
                        <TableCell>
                          <Chip label="Success" color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small">View</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        {renderSidebar()}
        
        {/* Main content */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* App bar */}
          <AppBar 
            position="static" 
            color="default" 
            elevation={0}
            sx={{ 
              borderBottom: '1px solid',
              borderColor: 'divider',
              zIndex: theme.zIndex.drawer + 1
            }}
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
              
              <Box sx={{ flexGrow: 1 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                  <Link color="inherit" href="#" onClick={() => handleSectionChange('dashboard')}>
                    ML Platform
                  </Link>
                  <Typography color="text.primary">
                    {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
                  </Typography>
                </Breadcrumbs>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Toggle dark mode">
                  <IconButton onClick={handleThemeToggle} color="inherit">
                    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Notifications">
                  <IconButton 
                    color="inherit"
                    onClick={handleNotificationMenuOpen}
                  >
                    <Badge badgeContent={4} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Account">
                  <IconButton 
                    color="inherit"
                    onClick={handleUserMenuOpen}
                    sx={{ ml: 1 }}
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>JD</Avatar>
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>
          
          {/* Main content area */}
          <Box sx={{ 
            flexGrow: 1, 
            p: 3,
            overflow: 'auto'
          }}>
            {renderMainContent()}
          </Box>
        </Box>
        
        {/* Settings drawer */}
        {renderSettingsDrawer()}
        
        {/* User menu */}
        <Menu
          anchorEl={userMenuAnchor}
          open={Boolean(userMenuAnchor)}
          onClose={handleUserMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleUserMenuClose}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSettingsToggle}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleUserMenuClose}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
        
        {/* Notification menu */}
        <Menu
          anchorEl={notificationMenuAnchor}
          open={Boolean(notificationMenuAnchor)}
          onClose={handleNotificationMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            style: {
              maxHeight: 300,
              width: 320,
            },
          }}
        >
          <MenuItem>
            <ListItemText 
              primary="Model training completed" 
              secondary="Portfolio Optimizer - 10 minutes ago" 
            />
          </MenuItem>
          <MenuItem>
            <ListItemText 
              primary="New prediction results available" 
              secondary="Stock Predictor - 25 minutes ago" 
            />
          </MenuItem>
          <MenuItem>
            <ListItemText 
              primary="AutoML process started" 
              secondary="Risk Model - 45 minutes ago" 
            />
          </MenuItem>
          <MenuItem>
            <ListItemText 
              primary="System update available" 
              secondary="ML Platform v2.3 - 2 hours ago" 
            />
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleNotificationMenuClose}>
            <Typography variant="body2" color="primary" align="center" sx={{ width: '100%' }}>
              View all notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Box>
    </ThemeProvider>
  );
};

export default UnifiedDashboardPage;