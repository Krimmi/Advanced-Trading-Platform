import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileCopy as FileCopyIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import portfolioOptimizationService, { OptimizationConstraint } from '../../frontend/src/services/portfolioOptimizationService';

// Define types for constraint templates
interface ConstraintTemplate {
  name: string;
  description: string;
  constraint: OptimizationConstraint;
}

interface OptimizationConstraintBuilderProps {
  symbols: string[];
  initialConstraints?: OptimizationConstraint[];
  onConstraintsChange?: (constraints: OptimizationConstraint[]) => void;
  sectorData?: Record<string, string[]>; // Map of sectors to symbols
  assetClassData?: Record<string, string[]>; // Map of asset classes to symbols
}

const OptimizationConstraintBuilder: React.FC<OptimizationConstraintBuilderProps> = ({ 
  symbols, 
  initialConstraints = [],
  onConstraintsChange,
  sectorData = {},
  assetClassData = {}
}) => {
  // State variables
  const [constraints, setConstraints] = useState<OptimizationConstraint[]>(initialConstraints);
  const [constraintType, setConstraintType] = useState<string>('min_weight');
  const [minWeight, setMinWeight] = useState<number>(0.01);
  const [maxWeight, setMaxWeight] = useState<number>(0.3);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('');
  const [sectorMinWeight, setSectorMinWeight] = useState<number>(0.1);
  const [sectorMaxWeight, setSectorMaxWeight] = useState<number>(0.4);
  const [assetClassMinWeight, setAssetClassMinWeight] = useState<number>(0.1);
  const [assetClassMaxWeight, setAssetClassMaxWeight] = useState<number>(0.6);
  const [factorName, setFactorName] = useState<string>('');
  const [minExposure, setMinExposure] = useState<number | null>(null);
  const [maxExposure, setMaxExposure] = useState<number | null>(null);
  const [customConstraintJson, setCustomConstraintJson] = useState<string>('{\n  "type": "custom",\n  "parameters": {}\n}');
  const [constraintTemplates, setConstraintTemplates] = useState<ConstraintTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [templateName, setTemplateName] = useState<string>('');
  const [templateDescription, setTemplateDescription] = useState<string>('');
  const [selectedConstraintIndex, setSelectedConstraintIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Available constraint types
  const constraintTypes = [
    { value: 'min_weight', label: 'Minimum Weight' },
    { value: 'max_weight', label: 'Maximum Weight' },
    { value: 'symbol_weight', label: 'Symbol Weight' },
    { value: 'sector_weight', label: 'Sector Weight' },
    { value: 'asset_class_weight', label: 'Asset Class Weight' },
    { value: 'factor_exposure', label: 'Factor Exposure' },
    { value: 'custom', label: 'Custom Constraint' }
  ];

  // Available sectors from sectorData
  const sectors = Object.keys(sectorData);

  // Available asset classes from assetClassData
  const assetClasses = Object.keys(assetClassData);

  // Available factors
  const factors = [
    'market',
    'size',
    'value',
    'momentum',
    'quality',
    'volatility',
    'yield',
    'growth',
    'liquidity',
    'profitability'
  ];

  // Load constraint templates on component mount
  useEffect(() => {
    loadConstraintTemplates();
  }, []);

  // Notify parent component when constraints change
  useEffect(() => {
    if (onConstraintsChange) {
      onConstraintsChange(constraints);
    }
  }, [constraints, onConstraintsChange]);

  // Load constraint templates
  const loadConstraintTemplates = async () => {
    try {
      // In a real implementation, this would call the portfolio optimization service
      // For now, we'll use some predefined templates
      const templates: ConstraintTemplate[] = [
        {
          name: 'No Short Selling',
          description: 'Ensures all weights are non-negative',
          constraint: { type: 'min_weight', parameters: { min_weight: 0 } }
        },
        {
          name: 'Maximum Single Stock Exposure',
          description: 'Limits exposure to any single stock',
          constraint: { type: 'max_weight', parameters: { max_weight: 0.2 } }
        },
        {
          name: 'Minimum Diversification',
          description: 'Ensures portfolio has at least 10 stocks',
          constraint: { type: 'min_weight', parameters: { min_weight: 0.01 } }
        },
        {
          name: 'Technology Sector Limit',
          description: 'Limits exposure to technology sector',
          constraint: { type: 'sector_weight', parameters: { sector: 'Technology', max_weight: 0.3 } }
        },
        {
          name: 'Minimum Value Exposure',
          description: 'Ensures portfolio has positive exposure to value factor',
          constraint: { type: 'factor_exposure', parameters: { factor: 'value', min_exposure: 0.1 } }
        }
      ];
      
      setConstraintTemplates(templates);
    } catch (error) {
      console.error('Error loading constraint templates:', error);
    }
  };

  // Add a constraint
  const addConstraint = () => {
    let newConstraint: OptimizationConstraint;
    
    try {
      switch (constraintType) {
        case 'min_weight':
          newConstraint = {
            type: 'min_weight',
            parameters: { min_weight: minWeight }
          };
          break;
          
        case 'max_weight':
          newConstraint = {
            type: 'max_weight',
            parameters: { max_weight: maxWeight }
          };
          break;
          
        case 'symbol_weight':
          if (!selectedSymbol) {
            setErrorMessage('Please select a symbol');
            return;
          }
          newConstraint = {
            type: 'symbol_weight',
            parameters: {
              symbol: selectedSymbol,
              min_weight: minWeight,
              max_weight: maxWeight
            }
          };
          break;
          
        case 'sector_weight':
          if (!selectedSector) {
            setErrorMessage('Please select a sector');
            return;
          }
          newConstraint = {
            type: 'sector_weight',
            parameters: {
              sector: selectedSector,
              min_weight: sectorMinWeight,
              max_weight: sectorMaxWeight
            }
          };
          break;
          
        case 'asset_class_weight':
          if (!selectedAssetClass) {
            setErrorMessage('Please select an asset class');
            return;
          }
          newConstraint = {
            type: 'asset_class_weight',
            parameters: {
              asset_class: selectedAssetClass,
              min_weight: assetClassMinWeight,
              max_weight: assetClassMaxWeight
            }
          };
          break;
          
        case 'factor_exposure':
          if (!factorName) {
            setErrorMessage('Please select a factor');
            return;
          }
          newConstraint = {
            type: 'factor_exposure',
            parameters: {
              factor: factorName,
              ...(minExposure !== null && { min_exposure: minExposure }),
              ...(maxExposure !== null && { max_exposure: maxExposure })
            }
          };
          break;
          
        case 'custom':
          try {
            const customConstraint = JSON.parse(customConstraintJson);
            if (!customConstraint.type || !customConstraint.parameters) {
              setErrorMessage('Custom constraint must have type and parameters properties');
              return;
            }
            newConstraint = customConstraint;
          } catch (error) {
            setErrorMessage('Invalid JSON format');
            return;
          }
          break;
          
        default:
          setErrorMessage('Please select a constraint type');
          return;
      }
      
      if (selectedConstraintIndex !== null) {
        // Update existing constraint
        const updatedConstraints = [...constraints];
        updatedConstraints[selectedConstraintIndex] = newConstraint;
        setConstraints(updatedConstraints);
        setSelectedConstraintIndex(null);
      } else {
        // Add new constraint
        setConstraints([...constraints, newConstraint]);
      }
      
      // Reset form
      resetForm();
      setErrorMessage('');
    } catch (error) {
      console.error('Error adding constraint:', error);
      setErrorMessage('Error adding constraint');
    }
  };

  // Remove a constraint
  const removeConstraint = (index: number) => {
    const updatedConstraints = [...constraints];
    updatedConstraints.splice(index, 1);
    setConstraints(updatedConstraints);
    
    if (selectedConstraintIndex === index) {
      setSelectedConstraintIndex(null);
      resetForm();
    }
  };

  // Edit a constraint
  const editConstraint = (index: number) => {
    const constraint = constraints[index];
    setSelectedConstraintIndex(index);
    
    setConstraintType(constraint.type);
    
    switch (constraint.type) {
      case 'min_weight':
        setMinWeight(constraint.parameters.min_weight);
        break;
        
      case 'max_weight':
        setMaxWeight(constraint.parameters.max_weight);
        break;
        
      case 'symbol_weight':
        setSelectedSymbol(constraint.parameters.symbol);
        setMinWeight(constraint.parameters.min_weight || 0);
        setMaxWeight(constraint.parameters.max_weight || 1);
        break;
        
      case 'sector_weight':
        setSelectedSector(constraint.parameters.sector);
        setSectorMinWeight(constraint.parameters.min_weight || 0);
        setSectorMaxWeight(constraint.parameters.max_weight || 1);
        break;
        
      case 'asset_class_weight':
        setSelectedAssetClass(constraint.parameters.asset_class);
        setAssetClassMinWeight(constraint.parameters.min_weight || 0);
        setAssetClassMaxWeight(constraint.parameters.max_weight || 1);
        break;
        
      case 'factor_exposure':
        setFactorName(constraint.parameters.factor);
        setMinExposure(constraint.parameters.min_exposure !== undefined ? constraint.parameters.min_exposure : null);
        setMaxExposure(constraint.parameters.max_exposure !== undefined ? constraint.parameters.max_exposure : null);
        break;
        
      case 'custom':
        setCustomConstraintJson(JSON.stringify(constraint, null, 2));
        break;
    }
  };

  // Duplicate a constraint
  const duplicateConstraint = (index: number) => {
    const constraint = constraints[index];
    setConstraints([...constraints, { ...constraint }]);
  };

  // Reset form
  const resetForm = () => {
    setConstraintType('min_weight');
    setMinWeight(0.01);
    setMaxWeight(0.3);
    setSelectedSymbol('');
    setSelectedSector('');
    setSelectedAssetClass('');
    setSectorMinWeight(0.1);
    setSectorMaxWeight(0.4);
    setAssetClassMinWeight(0.1);
    setAssetClassMaxWeight(0.6);
    setFactorName('');
    setMinExposure(null);
    setMaxExposure(null);
    setCustomConstraintJson('{\n  "type": "custom",\n  "parameters": {}\n}');
    setSelectedConstraintIndex(null);
  };

  // Open save template dialog
  const openSaveTemplateDialog = () => {
    if (selectedConstraintIndex === null) {
      setErrorMessage('Please select a constraint to save as template');
      return;
    }
    
    setTemplateName('');
    setTemplateDescription('');
    setDialogOpen(true);
  };

  // Save constraint as template
  const saveAsTemplate = () => {
    if (selectedConstraintIndex === null || !templateName) {
      return;
    }
    
    const constraint = constraints[selectedConstraintIndex];
    const newTemplate: ConstraintTemplate = {
      name: templateName,
      description: templateDescription,
      constraint: { ...constraint }
    };
    
    setConstraintTemplates([...constraintTemplates, newTemplate]);
    setDialogOpen(false);
  };

  // Apply a template
  const applyTemplate = (template: ConstraintTemplate) => {
    setConstraints([...constraints, { ...template.constraint }]);
  };

  // Format constraint for display
  const formatConstraint = (constraint: OptimizationConstraint): string => {
    switch (constraint.type) {
      case 'min_weight':
        return `Minimum Weight: ${constraint.parameters.min_weight}`;
        
      case 'max_weight':
        return `Maximum Weight: ${constraint.parameters.max_weight}`;
        
      case 'symbol_weight':
        return `Symbol ${constraint.parameters.symbol}: Min=${constraint.parameters.min_weight || 0}, Max=${constraint.parameters.max_weight || 1}`;
        
      case 'sector_weight':
        return `Sector ${constraint.parameters.sector}: Min=${constraint.parameters.min_weight || 0}, Max=${constraint.parameters.max_weight || 1}`;
        
      case 'asset_class_weight':
        return `Asset Class ${constraint.parameters.asset_class}: Min=${constraint.parameters.min_weight || 0}, Max=${constraint.parameters.max_weight || 1}`;
        
      case 'factor_exposure':
        let text = `Factor ${constraint.parameters.factor}:`;
        if (constraint.parameters.min_exposure !== undefined) {
          text += ` Min=${constraint.parameters.min_exposure}`;
        }
        if (constraint.parameters.max_exposure !== undefined) {
          text += ` Max=${constraint.parameters.max_exposure}`;
        }
        return text;
        
      case 'custom':
        return `Custom: ${JSON.stringify(constraint.parameters)}`;
        
      default:
        return JSON.stringify(constraint);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Portfolio Optimization Constraints
      </Typography>
      
      <Grid container spacing={3}>
        {/* Constraint Builder */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Build Constraint
            </Typography>
            
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {/* Constraint Type */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="constraint-type-label">Constraint Type</InputLabel>
                  <Select
                    labelId="constraint-type-label"
                    value={constraintType}
                    onChange={(e) => setConstraintType(e.target.value)}
                    label="Constraint Type"
                  >
                    {constraintTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Constraint Parameters - changes based on selected type */}
              {constraintType === 'min_weight' && (
                <Grid item xs={12}>
                  <TextField
                    label="Minimum Weight"
                    type="number"
                    value={minWeight}
                    onChange={(e) => setMinWeight(Number(e.target.value))}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    fullWidth
                    helperText="Minimum weight for any asset (0-1)"
                  />
                </Grid>
              )}
              
              {constraintType === 'max_weight' && (
                <Grid item xs={12}>
                  <TextField
                    label="Maximum Weight"
                    type="number"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(Number(e.target.value))}
                    inputProps={{ step: 0.01, min: 0, max: 1 }}
                    fullWidth
                    helperText="Maximum weight for any asset (0-1)"
                  />
                </Grid>
              )}
              
              {constraintType === 'symbol_weight' && (
                <>
                  <Grid item xs={12}>
                    <Autocomplete
                      value={selectedSymbol}
                      onChange={(event, newValue) => {
                        setSelectedSymbol(newValue || '');
                      }}
                      options={symbols}
                      renderInput={(params) => <TextField {...params} label="Symbol" />}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Minimum Weight"
                      type="number"
                      value={minWeight}
                      onChange={(e) => setMinWeight(Number(e.target.value))}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      fullWidth
                      helperText="Minimum weight (0-1)"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Maximum Weight"
                      type="number"
                      value={maxWeight}
                      onChange={(e) => setMaxWeight(Number(e.target.value))}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      fullWidth
                      helperText="Maximum weight (0-1)"
                    />
                  </Grid>
                </>
              )}
              
              {constraintType === 'sector_weight' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="sector-select-label">Sector</InputLabel>
                      <Select
                        labelId="sector-select-label"
                        value={selectedSector}
                        onChange={(e) => setSelectedSector(e.target.value)}
                        label="Sector"
                      >
                        {sectors.map((sector) => (
                          <MenuItem key={sector} value={sector}>
                            {sector}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Minimum Weight"
                      type="number"
                      value={sectorMinWeight}
                      onChange={(e) => setSectorMinWeight(Number(e.target.value))}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      fullWidth
                      helperText="Minimum sector weight (0-1)"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Maximum Weight"
                      type="number"
                      value={sectorMaxWeight}
                      onChange={(e) => setSectorMaxWeight(Number(e.target.value))}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      fullWidth
                      helperText="Maximum sector weight (0-1)"
                    />
                  </Grid>
                </>
              )}
              
              {constraintType === 'asset_class_weight' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="asset-class-select-label">Asset Class</InputLabel>
                      <Select
                        labelId="asset-class-select-label"
                        value={selectedAssetClass}
                        onChange={(e) => setSelectedAssetClass(e.target.value)}
                        label="Asset Class"
                      >
                        {assetClasses.map((assetClass) => (
                          <MenuItem key={assetClass} value={assetClass}>
                            {assetClass}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Minimum Weight"
                      type="number"
                      value={assetClassMinWeight}
                      onChange={(e) => setAssetClassMinWeight(Number(e.target.value))}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      fullWidth
                      helperText="Minimum asset class weight (0-1)"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Maximum Weight"
                      type="number"
                      value={assetClassMaxWeight}
                      onChange={(e) => setAssetClassMaxWeight(Number(e.target.value))}
                      inputProps={{ step: 0.01, min: 0, max: 1 }}
                      fullWidth
                      helperText="Maximum asset class weight (0-1)"
                    />
                  </Grid>
                </>
              )}
              
              {constraintType === 'factor_exposure' && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="factor-select-label">Factor</InputLabel>
                      <Select
                        labelId="factor-select-label"
                        value={factorName}
                        onChange={(e) => setFactorName(e.target.value)}
                        label="Factor"
                      >
                        {factors.map((factor) => (
                          <MenuItem key={factor} value={factor}>
                            {factor}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Minimum Exposure"
                      type="number"
                      value={minExposure === null ? '' : minExposure}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        setMinExposure(value);
                      }}
                      inputProps={{ step: 0.1, min: -2, max: 2 }}
                      fullWidth
                      helperText="Minimum factor exposure (leave blank for none)"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Maximum Exposure"
                      type="number"
                      value={maxExposure === null ? '' : maxExposure}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : Number(e.target.value);
                        setMaxExposure(value);
                      }}
                      inputProps={{ step: 0.1, min: -2, max: 2 }}
                      fullWidth
                      helperText="Maximum factor exposure (leave blank for none)"
                    />
                  </Grid>
                </>
              )}
              
              {constraintType === 'custom' && (
                <Grid item xs={12}>
                  <TextField
                    label="Custom Constraint JSON"
                    multiline
                    rows={6}
                    value={customConstraintJson}
                    onChange={(e) => setCustomConstraintJson(e.target.value)}
                    fullWidth
                    helperText="Enter custom constraint in JSON format"
                  />
                </Grid>
              )}
              
              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    startIcon={<RefreshIcon />}
                  >
                    Reset
                  </Button>
                  
                  <Button
                    variant="contained"
                    onClick={addConstraint}
                    startIcon={selectedConstraintIndex !== null ? <EditIcon /> : <AddIcon />}
                    color="primary"
                  >
                    {selectedConstraintIndex !== null ? 'Update' : 'Add'} Constraint
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Current Constraints */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current Constraints
            </Typography>
            
            {constraints.length === 0 ? (
              <Alert severity="info">
                No constraints added yet. Use the form to add constraints.
              </Alert>
            ) : (
              <List dense>
                {constraints.map((constraint, index) => (
                  <ListItem
                    key={index}
                    selected={selectedConstraintIndex === index}
                    onClick={() => editConstraint(index)}
                    sx={{ 
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid #eee',
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        color: 'primary.contrastText'
                      }
                    }}
                  >
                    <ListItemText
                      primary={formatConstraint(constraint)}
                      secondary={`Type: ${constraint.type}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="Duplicate">
                        <IconButton edge="end" onClick={() => duplicateConstraint(index)}>
                          <FileCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton edge="end" onClick={() => removeConstraint(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
            
            {constraints.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={openSaveTemplateDialog}
                  startIcon={<SaveIcon />}
                  disabled={selectedConstraintIndex === null}
                >
                  Save as Template
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Constraint Templates */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Constraint Templates
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {constraintTemplates.map((template, index) => (
                <Chip
                  key={index}
                  label={template.name}
                  onClick={() => applyTemplate(template)}
                  onDelete={() => {
                    const updatedTemplates = [...constraintTemplates];
                    updatedTemplates.splice(index, 1);
                    setConstraintTemplates(updatedTemplates);
                  }}
                  color="secondary"
                  variant="outlined"
                  sx={{ m: 0.5 }}
                  icon={<HelpIcon />}
                  title={template.description}
                />
              ))}
              
              {constraintTemplates.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No templates available. Save constraints as templates to reuse them.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Save Template Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Save Constraint Template</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Template Name"
            fullWidth
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveAsTemplate} disabled={!templateName} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OptimizationConstraintBuilder;