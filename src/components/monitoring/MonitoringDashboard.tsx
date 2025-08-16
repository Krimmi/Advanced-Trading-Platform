import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SpeedIcon from '@mui/icons-material/Speed';
import PeopleIcon from '@mui/icons-material/People';
import MemoryIcon from '@mui/icons-material/Memory';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

import SystemHealthDashboard from './SystemHealthDashboard';
import PerformanceMonitoringDashboard from './PerformanceMonitoringDashboard';
import UserActivityDashboard from './UserActivityDashboard';
import { useComponentPerformance } from '../../utils/withPerformanceTracking.optimized';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={`monitoring-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
});

interface MonitoringDashboardProps {
  defaultTab?: number;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  defaultTab = 0
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { trackOperation } = useComponentPerformance('MonitoringDashboard');
  
  // State
  const [activeTab, setActiveTab] = useState<number>(defaultTab);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [fullscreenTab, setFullscreenTab] = useState<number | null>(null);
  
  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);
  
  // Handle settings open/close
  const handleSettingsOpen = useCallback(() => {
    setSettingsOpen(true);
  }, []);
  
  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
  }, []);
  
  // Handle fullscreen toggle
  const handleFullscreenToggle = useCallback((tabIndex: number | null) => {
    setFullscreenTab(tabIndex);
  }, []);
  
  // Render settings dialog
  const renderSettingsDialog = () => (
    <Dialog
      open={settingsOpen}
      onClose={handleSettingsClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Dashboard Settings
        <IconButton
          aria-label="close"
          onClick={handleSettingsClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Refresh Intervals
                </Typography>
                <Typography variant="body2" paragraph>
                  Configure how often each dashboard automatically refreshes its data.
                </Typography>
                {/* In a real application, these would be actual settings controls */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">System Health Dashboard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently set to refresh every 30 seconds
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Performance Monitoring Dashboard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently set to refresh every 30 seconds
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">User Activity Dashboard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently set to refresh every 60 seconds
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Display Settings
                </Typography>
                <Typography variant="body2" paragraph>
                  Configure how the dashboards are displayed and what metrics are shown.
                </Typography>
                {/* In a real application, these would be actual settings controls */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Default Dashboard</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently set to System Health Dashboard
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Chart Animation</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently enabled
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Data Retention Period</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Currently set to 30 days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alert Settings
                </Typography>
                <Typography variant="body2" paragraph>
                  Configure when and how you receive alerts about system issues.
                </Typography>
                {/* In a real application, these would be actual settings controls */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Alert Thresholds</Typography>
                  <Typography variant="body2" color="text.secondary">
                    CPU Usage: 80%, Memory Usage: 80%, Error Rate: 2%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Notification Methods</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email, In-App Notifications
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSettingsClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSettingsClose}>Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
  
  // If a tab is in fullscreen mode, only show that tab
  if (fullscreenTab !== null) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <Tooltip title="Exit Fullscreen">
            <IconButton 
              onClick={() => handleFullscreenToggle(null)}
              sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
            >
              <FullscreenExitIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {fullscreenTab === 0 && (
          <SystemHealthDashboard 
            refreshInterval={30000}
            onSettingsClick={handleSettingsOpen}
          />
        )}
        
        {fullscreenTab === 1 && (
          <PerformanceMonitoringDashboard 
            refreshInterval={30000}
            onSettingsClick={handleSettingsOpen}
          />
        )}
        
        {fullscreenTab === 2 && (
          <UserActivityDashboard 
            refreshInterval={60000}
            onSettingsClick={handleSettingsOpen}
          />
        )}
        
        {renderSettingsDialog()}
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DashboardIcon sx={{ mr: 1 }} />
              <Typography variant="h5" component="h1">
                Monitoring Dashboard
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Comprehensive system monitoring and analytics
            </Typography>
          </Grid>
          <Grid item>
            <Tooltip title="Dashboard Settings">
              <IconButton onClick={handleSettingsOpen}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SpeedIcon />} iconPosition="start" label="System Health" />
          <Tab icon={<MemoryIcon />} iconPosition="start" label="Performance" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="User Activity" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <Tooltip title="Fullscreen">
            <IconButton 
              onClick={() => handleFullscreenToggle(activeTab)}
              sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
            >
              <FullscreenIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <SystemHealthDashboard 
            refreshInterval={30000}
            onSettingsClick={handleSettingsOpen}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <PerformanceMonitoringDashboard 
            refreshInterval={30000}
            onSettingsClick={handleSettingsOpen}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <UserActivityDashboard 
            refreshInterval={60000}
            onSettingsClick={handleSettingsOpen}
          />
        </TabPanel>
      </Box>
      
      {renderSettingsDialog()}
    </Box>
  );
};

export default React.memo(MonitoringDashboard);