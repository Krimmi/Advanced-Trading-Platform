/**
 * Dashboard Demo Page
 * 
 * This component demonstrates the personalized dashboard functionality
 * with sample widgets and configuration options.
 */

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonalizedDashboard from './PersonalizedDashboard';
import DashboardPreferenceService from './services/DashboardPreferenceService';
import DashboardStateService from './services/DashboardStateService';
import WidgetRegistry from './WidgetSystem/WidgetRegistry';
import { registerAllWidgets, registerWidgetDataProviders } from './WidgetSystem/registerWidgets';

const DashboardDemo: React.FC = () => {
  const theme = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [dashboards, setDashboards] = useState<any[]>([]);
  
  // Initialize services and register widgets
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Register all widgets
        registerAllWidgets();
        
        // Register widget data providers
        registerWidgetDataProviders();
        
        // Get available dashboards
        const preferenceService = DashboardPreferenceService.getInstance();
        const prefs = preferenceService.getPreferences();
        setDashboards(prefs.dashboards);
        
        // Mark initialization as complete
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing dashboard services:', error);
      }
    };
    
    initializeServices();
    
    // Cleanup on unmount
    return () => {
      // Clean up any resources
      const stateService = DashboardStateService.getInstance();
      stateService.cleanup();
    };
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle create dashboard
  const handleCreateDashboard = () => {
    const preferenceService = DashboardPreferenceService.getInstance();
    const newDashboard = preferenceService.createDashboard(`Dashboard ${dashboards.length + 1}`);
    setDashboards([...dashboards, newDashboard]);
    setActiveTab(dashboards.length); // Switch to the new dashboard
  };
  
  // If not initialized yet, show loading
  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          zIndex: 1100, 
          borderRadius: 0,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 1 }} />
            <Typography variant="h5" component="h1">
              Hedge Fund Trading Platform
            </Typography>
          </Box>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={handleCreateDashboard}
              sx={{ mr: 1 }}
            >
              New Dashboard
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<SettingsIcon />}
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {/* Dashboard Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {dashboards.map((dashboard, index) => (
            <Tab key={dashboard.id} label={dashboard.name} />
          ))}
        </Tabs>
      </Box>
      
      {/* Dashboard Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {dashboards.map((dashboard, index) => (
          <Box
            key={dashboard.id}
            sx={{
              display: activeTab === index ? 'block' : 'none',
              height: '100%'
            }}
          >
            <PersonalizedDashboard
              dashboardId={dashboard.id}
              readOnly={false}
              style={{ height: '100%' }}
            />
          </Box>
        ))}
        
        {dashboards.length === 0 && (
          <Container maxWidth="md" sx={{ py: 8 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Welcome to the Personalized Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  You don't have any dashboards yet. Create your first dashboard to get started.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateDashboard}
                  size="large"
                >
                  Create Dashboard
                </Button>
              </CardContent>
            </Card>
          </Container>
        )}
      </Box>
      
      {/* Demo Information */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mt: 'auto',
          borderRadius: 0,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          This is a demonstration of the personalized dashboard feature. You can add widgets, rearrange them, and customize their settings.
        </Alert>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Available Widgets
            </Typography>
            <Typography variant="body2">
              {WidgetRegistry.getInstance().getAllWidgets().length} widgets available across {WidgetRegistry.getInstance().getCategories().length} categories
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Dashboard Features
            </Typography>
            <Typography variant="body2">
              Drag and drop widgets, resize them, customize settings, and save layouts
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Data Refresh
            </Typography>
            <Typography variant="body2">
              Widget data refreshes automatically based on individual refresh intervals
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default DashboardDemo;