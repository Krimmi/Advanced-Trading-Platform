import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Divider,
  Alert,
  LinearProgress,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-dashboard-tabpanel-${index}`}
      aria-labelledby={`ml-dashboard-tab-${index}`}
      {...other}
      style={{ height: 'calc(100% - 48px)', overflow: 'auto' }}
    >
      {value === index && <Box sx={{ height: '100%', p: 0 }}>{children}</Box>}
    </div>
  );
};

const MLDashboardPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle model selection
  const handleModelSelect = (model: MLModel) => {
    setSelectedModel(model);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4">Machine Learning Platform</Typography>
          <Box>
            <IconButton>
              <RefreshIcon />
            </IconButton>
            <IconButton>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>
        
        {selectedModel && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => setSelectedModel(null)}
              >
                Clear Selection
              </Button>
            }
          >
            Currently working with model: <strong>{selectedModel.name}</strong> ({selectedModel.type})
          </Alert>
        )}
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<ModelTrainingIcon />} iconPosition="start" label="Model Management" />
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Predictions" />
          <Tab icon={<BubbleChartIcon />} iconPosition="start" label="Feature Importance" />
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Performance" />
          <Tab icon={<AutoGraphIcon />} iconPosition="start" label="AutoML" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden', px: 3, py: 2 }}>
        <TabPanel value={activeTab} index={0}>
          <MLModelManagementPanel 
            onModelSelect={handleModelSelect}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <PredictionDashboard 
            selectedModel={selectedModel}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <FeatureImportancePanel 
            selectedModel={selectedModel}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <ModelPerformancePanel 
            selectedModel={selectedModel}
            onModelSelect={handleModelSelect}
          />
        </TabPanel>
        
        <TabPanel value={activeTab} index={4}>
          <AutoMLConfigPanel />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default MLDashboardPage;