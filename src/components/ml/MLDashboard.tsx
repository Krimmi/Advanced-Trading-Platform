import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';

// Import ML components
import MLModelManagementPanel from './MLModelManagementPanel';
import ModelTrainingForm from './ModelTrainingForm';
import PredictionDashboard from './PredictionDashboard';
import FeatureImportancePanel from './FeatureImportancePanel';
import ModelPerformancePanel from './ModelPerformancePanel';

// Import service and types
import { MLService } from '../../services';
import { MLModel, ModelTrainingConfig, PredictionConfig, PredictionResult } from '../../types/ml';

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
      id={`ml-tabpanel-${index}`}
      aria-labelledby={`ml-tab-${index}`}
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
    id: `ml-tab-${index}`,
    'aria-controls': `ml-tabpanel-${index}`,
  };
}

const MLDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [isCreatingModel, setIsCreatingModel] = useState<boolean>(false);
  const [isTrainingModel, setIsTrainingModel] = useState<boolean>(false);
  
  const mlService = new MLService();
  
  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);
  
  // Fetch models from the API
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedModels = await mlService.getModels();
      setModels(fetchedModels);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle model selection
  const handleModelSelect = (model: MLModel) => {
    setSelectedModel(model);
    setIsCreatingModel(false);
    setIsTrainingModel(false);
  };
  
  // Handle model creation
  const handleModelCreate = (model: MLModel) => {
    setModels([...models, model]);
    setSelectedModel(model);
    setIsCreatingModel(false);
    setSuccess('Model created successfully!');
    
    // Switch to training tab
    setTabValue(1);
    setIsTrainingModel(true);
  };
  
  // Handle model training start
  const handleTrainingStart = (model: MLModel, config: ModelTrainingConfig) => {
    setSuccess(`Training started for model: ${model.name}`);
  };
  
  // Handle model training complete
  const handleTrainingComplete = (model: MLModel) => {
    // Update the model in the list
    setModels(models.map(m => m.id === model.id ? model : m));
    setSelectedModel(model);
    setIsTrainingModel(false);
    setSuccess('Model training completed successfully!');
    
    // Switch to prediction tab
    setTabValue(2);
  };
  
  // Handle prediction complete
  const handlePredictionComplete = (result: PredictionResult) => {
    setSuccess('Prediction completed successfully!');
  };
  
  // Handle create new model
  const handleCreateNewModel = () => {
    setSelectedModel(null);
    setIsCreatingModel(true);
    setTabValue(0);
  };
  
  // Handle train model
  const handleTrainModel = () => {
    if (!selectedModel) return;
    
    setIsTrainingModel(true);
    setTabValue(1);
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Machine Learning Dashboard
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<TuneIcon />}
            onClick={handleCreateNewModel}
            sx={{ mr: 1 }}
          >
            New Model
          </Button>
          
          {selectedModel && (
            <Button
              variant="outlined"
              startIcon={<ModelTrainingIcon />}
              onClick={handleTrainModel}
              sx={{ mr: 1 }}
              disabled={isTrainingModel}
            >
              Train Model
            </Button>
          )}
          
          <IconButton onClick={fetchModels}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="ml tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<TuneIcon />} 
            iconPosition="start" 
            label="Models" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<ModelTrainingIcon />} 
            iconPosition="start" 
            label="Training" 
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<PlayArrowIcon />} 
            iconPosition="start" 
            label="Predictions" 
            {...a11yProps(2)} 
          />
          <Tab 
            icon={<AssessmentIcon />} 
            iconPosition="start" 
            label="Performance" 
            {...a11yProps(3)} 
          />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <MLModelManagementPanel 
            onModelSelect={handleModelSelect}
            onModelCreate={handleModelCreate}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ModelTrainingForm 
            selectedModel={isTrainingModel ? selectedModel : undefined}
            onTrainingStart={handleTrainingStart}
            onTrainingComplete={handleTrainingComplete}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <PredictionDashboard 
            selectedModel={selectedModel}
            onPredictionComplete={handlePredictionComplete}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
            <Paper sx={{ p: 2, flexGrow: 1 }}>
              <ModelPerformancePanel model={selectedModel} />
            </Paper>
            
            <Paper sx={{ p: 2, flexGrow: 1 }}>
              <FeatureImportancePanel model={selectedModel} />
            </Paper>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default MLDashboard;