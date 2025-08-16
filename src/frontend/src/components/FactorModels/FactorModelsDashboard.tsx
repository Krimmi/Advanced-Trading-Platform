import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  CircularProgress, 
  Tabs, 
  Tab, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  PlayArrow as TrainIcon,
  Compare as CompareIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import factorModelsService, { FactorModel } from '../../api/factorModelsService';
import FactorExposuresChart from './FactorExposuresChart';
import RiskDecompositionChart from './RiskDecompositionChart';
import FactorContributionChart from './FactorContributionChart';
import ModelComparisonChart from './ModelComparisonChart';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`factor-models-tabpanel-${index}`}
      aria-labelledby={`factor-models-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Factor Models Dashboard component
const FactorModelsDashboard: React.FC = () => {
  // State variables
  const [models, setModels] = useState<FactorModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'FB']);
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [factorExposures, setFactorExposures] = useState<any>(null);
  const [riskDecomposition, setRiskDecomposition] = useState<any>(null);
  const [factorContributions, setFactorContributions] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newModelType, setNewModelType] = useState<string>('fama_french');
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelSubtype, setNewModelSubtype] = useState<string>('three_factor');
  const [numFactors, setNumFactors] = useState<number>(5);
  const [compareDialogOpen, setCompareDialogOpen] = useState<boolean>(false);
  const [modelsToCompare, setModelsToCompare] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Load models on component mount
  useEffect(() => {
    loadModels();
  }, []);

  // Load factor exposures when a model is selected
  useEffect(() => {
    if (selectedModel) {
      loadFactorExposures();
    }
  }, [selectedModel]);

  // Load models from API
  const loadModels = async () => {
    setLoading(true);
    try {
      const modelsList = await factorModelsService.getModels();
      setModels(modelsList);
      if (modelsList.length > 0 && !selectedModel) {
        setSelectedModel(modelsList[0].model_name);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading models:', error);
      showSnackbar('Error loading models', 'error');
      setLoading(false);
    }
  };

  // Load factor exposures for selected model
  const loadFactorExposures = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const exposures = await factorModelsService.getFactorExposures(selectedModel);
      setFactorExposures(exposures);
      setLoading(false);
    } catch (error) {
      console.error('Error loading factor exposures:', error);
      showSnackbar('Error loading factor exposures', 'error');
      setLoading(false);
    }
  };

  // Load risk decomposition for selected model
  const loadRiskDecomposition = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const decomposition = await factorModelsService.analyzeRiskDecomposition(selectedModel, symbols);
      setRiskDecomposition(decomposition);
      setLoading(false);
    } catch (error) {
      console.error('Error loading risk decomposition:', error);
      showSnackbar('Error loading risk decomposition', 'error');
      setLoading(false);
    }
  };

  // Load factor contributions for selected model
  const loadFactorContributions = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const contributions = await factorModelsService.analyzeFactorContribution(selectedModel, symbols, 30);
      setFactorContributions(contributions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading factor contributions:', error);
      showSnackbar('Error loading factor contributions', 'error');
      setLoading(false);
    }
  };

  // Load predictions for selected model
  const loadPredictions = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      const modelPredictions = await factorModelsService.predictReturns(selectedModel, symbols, 30);
      setPredictions(modelPredictions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading predictions:', error);
      showSnackbar('Error loading predictions', 'error');
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Load data based on selected tab
    switch (newValue) {
      case 0: // Factor Exposures
        loadFactorExposures();
        break;
      case 1: // Risk Decomposition
        loadRiskDecomposition();
        break;
      case 2: // Factor Contributions
        loadFactorContributions();
        break;
      case 3: // Predictions
        loadPredictions();
        break;
      default:
        break;
    }
  };

  // Handle model selection change
  const handleModelChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedModel(event.target.value as string);
  };

  // Add a symbol to the list
  const addSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol)) {
      setSymbols([...symbols, newSymbol]);
      setNewSymbol('');
    }
  };

  // Remove a symbol from the list
  const removeSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };

  // Create a new model
  const createModel = async () => {
    setLoading(true);
    try {
      await factorModelsService.createModel(
        newModelType,
        newModelName,
        newModelType === 'fama_french' ? newModelSubtype : undefined,
        newModelType === 'apt' ? numFactors : undefined
      );
      
      setCreateDialogOpen(false);
      showSnackbar('Model created successfully', 'success');
      await loadModels();
      
      // Reset form
      setNewModelName('');
      
      setLoading(false);
    } catch (error) {
      console.error('Error creating model:', error);
      showSnackbar('Error creating model', 'error');
      setLoading(false);
    }
  };

  // Delete the selected model
  const deleteModel = async () => {
    if (!selectedModel) return;
    
    if (window.confirm(`Are you sure you want to delete the model "${selectedModel}"?`)) {
      setLoading(true);
      try {
        await factorModelsService.deleteModel(selectedModel);
        showSnackbar('Model deleted successfully', 'success');
        await loadModels();
        setSelectedModel('');
        setLoading(false);
      } catch (error) {
        console.error('Error deleting model:', error);
        showSnackbar('Error deleting model', 'error');
        setLoading(false);
      }
    }
  };

  // Train the selected model
  const trainModel = async () => {
    if (!selectedModel) return;
    
    setLoading(true);
    try {
      await factorModelsService.trainModel(selectedModel, symbols);
      showSnackbar('Model trained successfully', 'success');
      await loadModels();
      loadFactorExposures();
      setLoading(false);
    } catch (error) {
      console.error('Error training model:', error);
      showSnackbar('Error training model', 'error');
      setLoading(false);
    }
  };

  // Compare selected models
  const compareModels = async () => {
    if (modelsToCompare.length < 2) {
      showSnackbar('Please select at least 2 models to compare', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const results = await factorModelsService.compareModels(modelsToCompare, symbols, 90);
      setComparisonResults(results);
      setCompareDialogOpen(false);
      showSnackbar('Models compared successfully', 'success');
      setLoading(false);
    } catch (error) {
      console.error('Error comparing models:', error);
      showSnackbar('Error comparing models', 'error');
      setLoading(false);
    }
  };

  // Toggle model selection for comparison
  const toggleModelForComparison = (modelName: string) => {
    if (modelsToCompare.includes(modelName)) {
      setModelsToCompare(modelsToCompare.filter(name => name !== modelName));
    } else {
      setModelsToCompare([...modelsToCompare, modelName]);
    }
  };

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Factor Models Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Model Selection and Controls */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="model-select-label">Select Model</InputLabel>
                  <Select
                    labelId="model-select-label"
                    value={selectedModel}
                    onChange={handleModelChange}
                    label="Select Model"
                    disabled={loading || models.length === 0}
                  >
                    {models.map((model) => (
                      <MenuItem key={model.model_name} value={model.model_name}>
                        {model.model_name} ({model.model_type})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={loading}
                  >
                    Create Model
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<TrainIcon />}
                    onClick={trainModel}
                    disabled={loading || !selectedModel}
                  >
                    Train Model
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<CompareIcon />}
                    onClick={() => setCompareDialogOpen(true)}
                    disabled={loading || models.length < 2}
                  >
                    Compare Models
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={deleteModel}
                    disabled={loading || !selectedModel}
                  >
                    Delete Model
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Symbols Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Stock Symbols
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Add Symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                size="small"
                sx={{ mr: 2 }}
              />
              
              <Button
                variant="contained"
                onClick={addSymbol}
                disabled={!newSymbol}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {symbols.map((symbol) => (
                <Chip
                  key={symbol}
                  label={symbol}
                  onDelete={() => removeSymbol(symbol)}
                  color="primary"
                />
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* Model Information and Analysis */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Factor Exposures" />
              <Tab label="Risk Decomposition" />
              <Tab label="Factor Contributions" />
              <Tab label="Predictions" />
              {comparisonResults && <Tab label="Model Comparison" />}
            </Tabs>
            
            <Divider />
            
            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
            
            {/* Factor Exposures Tab */}
            <TabPanel value={tabValue} index={0}>
              {!loading && factorExposures && (
                <FactorExposuresChart data={factorExposures} />
              )}
              {!loading && !factorExposures && selectedModel && (
                <Alert severity="info">
                  No factor exposure data available. Please train the model first.
                </Alert>
              )}
            </TabPanel>
            
            {/* Risk Decomposition Tab */}
            <TabPanel value={tabValue} index={1}>
              {!loading && riskDecomposition && (
                <RiskDecompositionChart data={riskDecomposition} />
              )}
              {!loading && !riskDecomposition && selectedModel && (
                <Alert severity="info">
                  No risk decomposition data available. Click the button below to analyze.
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={loadRiskDecomposition}
                      startIcon={<AssessmentIcon />}
                    >
                      Analyze Risk Decomposition
                    </Button>
                  </Box>
                </Alert>
              )}
            </TabPanel>
            
            {/* Factor Contributions Tab */}
            <TabPanel value={tabValue} index={2}>
              {!loading && factorContributions && (
                <FactorContributionChart data={factorContributions} />
              )}
              {!loading && !factorContributions && selectedModel && (
                <Alert severity="info">
                  No factor contribution data available. Click the button below to analyze.
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={loadFactorContributions}
                      startIcon={<AssessmentIcon />}
                    >
                      Analyze Factor Contributions
                    </Button>
                  </Box>
                </Alert>
              )}
            </TabPanel>
            
            {/* Predictions Tab */}
            <TabPanel value={tabValue} index={3}>
              {!loading && predictions && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Return Predictions (30 Days)
                  </Typography>
                  {/* Predictions visualization would go here */}
                  <pre>{JSON.stringify(predictions, null, 2)}</pre>
                </Box>
              )}
              {!loading && !predictions && selectedModel && (
                <Alert severity="info">
                  No predictions available. Click the button below to generate predictions.
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={loadPredictions}
                      startIcon={<AssessmentIcon />}
                    >
                      Generate Predictions
                    </Button>
                  </Box>
                </Alert>
              )}
            </TabPanel>
            
            {/* Model Comparison Tab */}
            <TabPanel value={tabValue} index={4}>
              {!loading && comparisonResults && (
                <ModelComparisonChart data={comparisonResults} />
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Create Model Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Factor Model</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Model Name"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Model Type</InputLabel>
              <Select
                value={newModelType}
                onChange={(e) => setNewModelType(e.target.value)}
                label="Model Type"
              >
                <MenuItem value="fama_french">Fama-French</MenuItem>
                <MenuItem value="apt">Arbitrage Pricing Theory (APT)</MenuItem>
                <MenuItem value="custom">Custom Factor Model</MenuItem>
              </Select>
            </FormControl>
            
            {newModelType === 'fama_french' && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Model Subtype</InputLabel>
                <Select
                  value={newModelSubtype}
                  onChange={(e) => setNewModelSubtype(e.target.value)}
                  label="Model Subtype"
                >
                  <MenuItem value="three_factor">Three-Factor Model</MenuItem>
                  <MenuItem value="five_factor">Five-Factor Model</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {newModelType === 'apt' && (
              <TextField
                label="Number of Factors"
                type="number"
                value={numFactors}
                onChange={(e) => setNumFactors(parseInt(e.target.value))}
                fullWidth
                margin="normal"
                InputProps={{ inputProps: { min: 1, max: 20 } }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={createModel} 
            variant="contained" 
            color="primary"
            disabled={!newModelName}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Compare Models Dialog */}
      <Dialog open={compareDialogOpen} onClose={() => setCompareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compare Factor Models</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Select models to compare:
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {models.map((model) => (
              <Box key={model.model_name} sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={model.model_name}
                  color={modelsToCompare.includes(model.model_name) ? "primary" : "default"}
                  onClick={() => toggleModelForComparison(model.model_name)}
                  sx={{ mr: 1 }}
                />
                <Typography variant="body2" color="textSecondary">
                  ({model.model_type})
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={compareModels} 
            variant="contained" 
            color="primary"
            disabled={modelsToCompare.length < 2}
          >
            Compare
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FactorModelsDashboard;