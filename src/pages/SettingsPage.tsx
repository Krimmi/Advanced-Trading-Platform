import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Divider
} from '@mui/material';
import ApiConfigurationPanel from '../components/settings/ApiConfigurationPanel';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 0, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 120px)' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      <Paper sx={{ height: 'calc(100% - 80px)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="API Configuration" {...a11yProps(0)} />
            <Tab label="User Preferences" {...a11yProps(1)} />
            <Tab label="Notifications" {...a11yProps(2)} />
            <Tab label="Appearance" {...a11yProps(3)} />
            <Tab label="Advanced" {...a11yProps(4)} />
          </Tabs>
        </Box>
        
        <Box sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
          <TabPanel value={tabValue} index={0}>
            <ApiConfigurationPanel />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5">User Preferences</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                User preference settings will be implemented here.
              </Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5">Notification Settings</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Notification settings will be implemented here.
              </Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5">Appearance Settings</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Appearance settings will be implemented here.
              </Typography>
            </Box>
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5">Advanced Settings</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Advanced settings will be implemented here.
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;