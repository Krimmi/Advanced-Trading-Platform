import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
  Code as CodeIcon,
  Help as HelpIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { technicalService, technicalServiceExtensions } from '../../services';
import { CustomIndicator } from '../../services/technicalServiceExtensions';

interface CustomIndicatorBuilderProps {
  onIndicatorCreated: (indicator: CustomIndicator) => void;
  onIndicatorUpdated: (indicator: CustomIndicator) => void;
  onIndicatorDeleted: (indicatorId: string) => void;
  customIndicators: CustomIndicator[];
}

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
      id={`indicator-tabpanel-${index}`}
      aria-labelledby={`indicator-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `indicator-tab-${index}`,
    'aria-controls': `indicator-tabpanel-${index}`,
  };
}

const CustomIndicatorBuilder: React.FC<CustomIndicatorBuilderProps> = ({
  onIndicatorCreated,
  onIndicatorUpdated,
  onIndicatorDeleted,
  customIndicators,
}) => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [formula, setFormula] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [parameters, setParameters] = useState<any[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<CustomIndicator | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testSymbol, setTestSymbol] = useState<string>('AAPL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [indicatorToDelete, setIndicatorToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      {
        name: '',
        type: 'number',
        defaultValue: 0,
        min: undefined,
        max: undefined,
        options: [],
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    const newParameters = [...parameters];
    newParameters.splice(index, 1);
    setParameters(newParameters);
  };

  const handleParameterChange = (index: number, field: string, value: any) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setParameters(newParameters);
  };

  const handleAddOption = (paramIndex: number) => {
    const newParameters = [...parameters];
    if (!newParameters[paramIndex].options) {
      newParameters[paramIndex].options = [];
    }
    newParameters[paramIndex].options.push('');
    setParameters(newParameters);
  };

  const handleOptionChange = (paramIndex: number, optionIndex: number, value: string) => {
    const newParameters = [...parameters];
    newParameters[paramIndex].options[optionIndex] = value;
    setParameters(newParameters);
  };

  const handleRemoveOption = (paramIndex: number, optionIndex: number) => {
    const newParameters = [...parameters];
    newParameters[paramIndex].options.splice(optionIndex, 1);
    setParameters(newParameters);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formula.trim()) {
      newErrors.formula = 'Formula is required';
    }

    // Validate parameters
    parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        newErrors[`param_${index}_name`] = 'Parameter name is required';
      }
      
      if (param.type === 'number') {
        if (param.min !== undefined && param.max !== undefined && param.min > param.max) {
          newErrors[`param_${index}_range`] = 'Min value must be less than max value';
        }
      }
      
      if (param.type === 'select' && (!param.options || param.options.length === 0)) {
        newErrors[`param_${index}_options`] = 'Select type requires at least one option';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateIndicator = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const newIndicator: Omit<CustomIndicator, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name,
        description,
        formula,
        parameters,
        isPublic,
      };

      const createdIndicator = await technicalServiceExtensions.createCustomIndicator(newIndicator);
      onIndicatorCreated(createdIndicator);
      
      // Reset form
      setName('');
      setDescription('');
      setFormula('');
      setIsPublic(false);
      setParameters([]);
      setTestResult(null);
      
      // Switch to My Indicators tab
      setTabValue(1);
    } catch (error) {
      console.error('Error creating custom indicator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIndicator = async () => {
    if (!selectedIndicator || !validateForm()) return;

    setLoading(true);
    try {
      const updatedIndicator: Partial<CustomIndicator> = {
        name,
        description,
        formula,
        parameters,
        isPublic,
      };

      const result = await technicalServiceExtensions.updateCustomIndicator(selectedIndicator.id, updatedIndicator);
      onIndicatorUpdated(result);
      
      // Reset form and selection
      setSelectedIndicator(null);
      setName('');
      setDescription('');
      setFormula('');
      setIsPublic(false);
      setParameters([]);
      setTestResult(null);
      
      // Switch to My Indicators tab
      setTabValue(1);
    } catch (error) {
      console.error('Error updating custom indicator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIndicator = async () => {
    if (!indicatorToDelete) return;

    setLoading(true);
    try {
      await technicalServiceExtensions.deleteCustomIndicator(indicatorToDelete);
      onIndicatorDeleted(indicatorToDelete);
      setDeleteDialogOpen(false);
      setIndicatorToDelete(null);
    } catch (error) {
      console.error('Error deleting custom indicator:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditIndicator = (indicator: CustomIndicator) => {
    setSelectedIndicator(indicator);
    setName(indicator.name);
    setDescription(indicator.description || '');
    setFormula(indicator.formula);
    setIsPublic(indicator.isPublic);
    setParameters(indicator.parameters || []);
    setTestResult(null);
    
    // Switch to Create/Edit tab
    setTabValue(0);
  };

  const handleConfirmDelete = (indicatorId: string) => {
    setIndicatorToDelete(indicatorId);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setIndicatorToDelete(null);
  };

  const handleTestIndicator = async () => {
    if (!validateForm()) return;

    setTestLoading(true);
    try {
      // In a real implementation, this would call an API to test the formula
      // For now, we'll simulate a test result
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTestResult({
        valid: true,
        message: 'Formula is valid',
        sampleData: [
          { date: '2023-01-01', value: 42.5 },
          { date: '2023-01-02', value: 43.2 },
          { date: '2023-01-03', value: 41.8 },
          { date: '2023-01-04', value: 44.1 },
          { date: '2023-01-05', value: 45.3 },
        ],
      });
    } catch (error) {
      console.error('Error testing indicator:', error);
      setTestResult({
        valid: false,
        message: 'Error testing formula: ' + error,
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedIndicator(null);
    setName('');
    setDescription('');
    setFormula('');
    setIsPublic(false);
    setParameters([]);
    setTestResult(null);
    setErrors({});
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="indicator builder tabs">
          <Tab label="Create/Edit Indicator" icon={<CodeIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="My Indicators" icon={<InfoIcon />} iconPosition="start" {...a11yProps(1)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {selectedIndicator ? 'Edit Indicator' : 'Create New Indicator'}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Indicator Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                  }
                  label="Make Public"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Formula"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  multiline
                  rows={4}
                  error={!!errors.formula}
                  helperText={errors.formula || 'Use JavaScript syntax. Available variables: open, high, low, close, volume, time'}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">Parameters</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddParameter}
                    size="small"
                  >
                    Add Parameter
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {parameters.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No parameters defined. Add parameters to make your indicator configurable.
                  </Typography>
                ) : (
                  parameters.map((param, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2">Parameter {index + 1}</Typography>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveParameter(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={param.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            error={!!errors[`param_${index}_name`]}
                            helperText={errors[`param_${index}_name`]}
                            required
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={param.type}
                              label="Type"
                              onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                            >
                              <MenuItem value="number">Number</MenuItem>
                              <MenuItem value="boolean">Boolean</MenuItem>
                              <MenuItem value="select">Select</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        {param.type === 'number' && (
                          <>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Default Value"
                                type="number"
                                value={param.defaultValue}
                                onChange={(e) => handleParameterChange(index, 'defaultValue', Number(e.target.value))}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Min Value"
                                type="number"
                                value={param.min}
                                onChange={(e) => handleParameterChange(index, 'min', e.target.value ? Number(e.target.value) : undefined)}
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="Max Value"
                                type="number"
                                value={param.max}
                                onChange={(e) => handleParameterChange(index, 'max', e.target.value ? Number(e.target.value) : undefined)}
                                error={!!errors[`param_${index}_range`]}
                                helperText={errors[`param_${index}_range`]}
                              />
                            </Grid>
                          </>
                        )}

                        {param.type === 'boolean' && (
                          <Grid item xs={12}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={param.defaultValue}
                                  onChange={(e) => handleParameterChange(index, 'defaultValue', e.target.checked)}
                                />
                              }
                              label="Default Value"
                            />
                          </Grid>
                        )}

                        {param.type === 'select' && (
                          <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2">Options</Typography>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleAddOption(index)}
                              >
                                Add Option
                              </Button>
                            </Box>
                            {errors[`param_${index}_options`] && (
                              <Typography color="error" variant="caption">
                                {errors[`param_${index}_options`]}
                              </Typography>
                            )}
                            {param.options?.map((option: string, optionIndex: number) => (
                              <Box key={optionIndex} display="flex" alignItems="center" mb={1}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  label={`Option ${optionIndex + 1}`}
                                  value={option}
                                  onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                />
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveOption(index, optionIndex)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            ))}
                            <FormControl fullWidth sx={{ mt: 1 }}>
                              <InputLabel>Default Value</InputLabel>
                              <Select
                                value={param.defaultValue || ''}
                                label="Default Value"
                                onChange={(e) => handleParameterChange(index, 'defaultValue', e.target.value)}
                              >
                                {param.options?.map((option: string, optionIndex: number) => (
                                  <MenuItem key={optionIndex} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  ))
                )}
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between">
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<TestIcon />}
                      onClick={handleTestIndicator}
                      disabled={testLoading}
                      sx={{ mr: 1 }}
                    >
                      {testLoading ? <CircularProgress size={24} /> : 'Test Formula'}
                    </Button>
                    <TextField
                      size="small"
                      label="Test Symbol"
                      value={testSymbol}
                      onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                      sx={{ width: 100, ml: 1 }}
                    />
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      onClick={handleReset}
                      sx={{ mr: 1 }}
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={selectedIndicator ? handleUpdateIndicator : handleCreateIndicator}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : selectedIndicator ? 'Update' : 'Create'}
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {testResult && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Test Results
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {testResult.valid ? (
                      <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          {testResult.message}
                        </Alert>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Sample Data for {testSymbol}:
                        </Typography>
                        
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {testResult.sampleData.map((row: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{row.date}</TableCell>
                                  <TableCell align="right">{row.value.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </>
                    ) : (
                      <Alert severity="error">
                        {testResult.message}
                      </Alert>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">My Custom Indicators</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              handleReset();
              setTabValue(0);
            }}
          >
            Create New Indicator
          </Button>
        </Box>

        {customIndicators.length === 0 ? (
          <Alert severity="info">
            You haven't created any custom indicators yet. Go to the Create/Edit tab to create your first indicator.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {customIndicators.map((indicator) => (
              <Grid item xs={12} md={6} lg={4} key={indicator.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6">{indicator.name}</Typography>
                      <Box>
                        {indicator.isPublic && (
                          <Tooltip title="Public Indicator">
                            <Chip label="Public" size="small" color="primary" sx={{ mr: 1 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      {indicator.description || 'No description provided'}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Formula:
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        mb: 2,
                        bgcolor: 'background.default',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        maxHeight: 100,
                        overflow: 'auto',
                      }}
                    >
                      {indicator.formula}
                    </Paper>
                    
                    {indicator.parameters && indicator.parameters.length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Parameters:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {indicator.parameters.map((param, index) => (
                            <Chip
                              key={index}
                              label={`${param.name}: ${param.type}`}
                              size="small"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
                    
                    <Box display="flex" justifyContent="flex-end">
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => handleEditIndicator(indicator)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleConfirmDelete(indicator.id)}
                        size="small"
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this custom indicator? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleDeleteIndicator} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomIndicatorBuilder;