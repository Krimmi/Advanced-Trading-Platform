import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Switch,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TuneIcon from '@mui/icons-material/Tune';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StrategyExecutionService from '../../services/backtesting/strategyExecutionService';
import {
  Strategy,
  StrategyType,
  StrategyRule,
  Condition,
  ConditionType,
  ConditionOperator,
  Action,
  ActionType,
  RiskManagementRule,
  RiskManagementType,
  PositionSizingRule,
  PositionSizingType,
  LogicOperator
} from '../../types/backtesting/strategyTypes';

interface StrategyBuilderProps {
  strategy: Strategy | null;
  isCreating: boolean;
  strategies: Strategy[];
  onStrategyCreated: (strategy: Strategy) => void;
  onStrategySelected: (strategy: Strategy) => void;
  onCreateNew: () => void;
}

const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  strategy,
  isCreating,
  strategies,
  onStrategyCreated,
  onStrategySelected,
  onCreateNew
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(isCreating);
  
  const [currentStrategy, setCurrentStrategy] = useState<Strategy>({
    name: '',
    description: '',
    type: StrategyType.TECHNICAL,
    rules: [],
    parameters: {},
    riskManagement: [],
    positionSizing: {
      type: PositionSizingType.FIXED,
      parameters: { size: 100 }
    },
    isPublic: false,
    version: '1.0.0'
  });
  
  const [availableIndicators, setAvailableIndicators] = useState<any[]>([]);
  const [availableFundamentalMetrics, setAvailableFundamentalMetrics] = useState<any[]>([]);
  const [availableSentimentMetrics, setAvailableSentimentMetrics] = useState<any[]>([]);
  
  const [openRuleDialog, setOpenRuleDialog] = useState<boolean>(false);
  const [currentRule, setCurrentRule] = useState<StrategyRule | null>(null);
  const [currentRuleIndex, setCurrentRuleIndex] = useState<number>(-1);
  
  const [openTemplateDialog, setOpenTemplateDialog] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [validationResults, setValidationResults] = useState<{
    valid: boolean;
    errors: { type: string; message: string; ruleId?: string }[];
    warnings: { type: string; message: string; ruleId?: string }[];
  } | null>(null);
  
  const strategyService = new StrategyExecutionService();
  
  useEffect(() => {
    if (strategy) {
      setCurrentStrategy(strategy);
      setEditMode(false);
    } else if (isCreating) {
      resetStrategy();
      setEditMode(true);
    }
  }, [strategy, isCreating]);
  
  useEffect(() => {
    fetchAvailableIndicators();
    fetchAvailableFundamentalMetrics();
    fetchAvailableSentimentMetrics();
    fetchTemplates();
  }, []);
  
  const fetchAvailableIndicators = async () => {
    try {
      const indicators = await strategyService.getAvailableIndicators();
      setAvailableIndicators(indicators);
    } catch (err) {
      console.error('Error fetching available indicators:', err);
      setError('Failed to load technical indicators. Please try again later.');
    }
  };
  
  const fetchAvailableFundamentalMetrics = async () => {
    try {
      const metrics = await strategyService.getAvailableFundamentalMetrics();
      setAvailableFundamentalMetrics(metrics);
    } catch (err) {
      console.error('Error fetching available fundamental metrics:', err);
      setError('Failed to load fundamental metrics. Please try again later.');
    }
  };
  
  const fetchAvailableSentimentMetrics = async () => {
    try {
      const metrics = await strategyService.getAvailableSentimentMetrics();
      setAvailableSentimentMetrics(metrics);
    } catch (err) {
      console.error('Error fetching available sentiment metrics:', err);
      setError('Failed to load sentiment metrics. Please try again later.');
    }
  };
  
  const fetchTemplates = async () => {
    try {
      const templates = await strategyService.getStrategyTemplates();
      setTemplates(templates);
    } catch (err) {
      console.error('Error fetching strategy templates:', err);
      setError('Failed to load strategy templates. Please try again later.');
    }
  };
  
  const resetStrategy = () => {
    setCurrentStrategy({
      name: '',
      description: '',
      type: StrategyType.TECHNICAL,
      rules: [],
      parameters: {},
      riskManagement: [],
      positionSizing: {
        type: PositionSizingType.FIXED,
        parameters: { size: 100 }
      },
      isPublic: false,
      version: '1.0.0'
    });
  };
  
  const handleStrategyChange = (field: keyof Strategy, value: any) => {
    setCurrentStrategy({
      ...currentStrategy,
      [field]: value
    });
  };
  
  const handleSaveStrategy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate strategy before saving
      const validationResult = await strategyService.validateStrategy(currentStrategy);
      setValidationResults(validationResult);
      
      if (!validationResult.valid) {
        setError('Strategy validation failed. Please fix the errors before saving.');
        setLoading(false);
        return;
      }
      
      let savedStrategy;
      if (currentStrategy.id) {
        // Update existing strategy
        savedStrategy = await strategyService.updateStrategy(currentStrategy.id, currentStrategy);
        setSuccess('Strategy updated successfully!');
      } else {
        // Create new strategy
        savedStrategy = await strategyService.createStrategy(currentStrategy);
        setSuccess('Strategy created successfully!');
      }
      
      setCurrentStrategy(savedStrategy);
      setEditMode(false);
      onStrategyCreated(savedStrategy);
      setLoading(false);
    } catch (err) {
      console.error('Error saving strategy:', err);
      setError('Failed to save strategy. Please try again later.');
      setLoading(false);
    }
  };
  
  const handleAddRule = () => {
    setCurrentRule({
      name: '',
      description: '',
      conditions: [],
      actions: [],
      logicOperator: LogicOperator.AND,
      enabled: true,
      priority: currentStrategy.rules.length + 1
    });
    setCurrentRuleIndex(-1);
    setOpenRuleDialog(true);
  };
  
  const handleEditRule = (index: number) => {
    setCurrentRule({ ...currentStrategy.rules[index] });
    setCurrentRuleIndex(index);
    setOpenRuleDialog(true);
  };
  
  const handleDeleteRule = (index: number) => {
    const updatedRules = [...currentStrategy.rules];
    updatedRules.splice(index, 1);
    
    // Update priorities
    const reorderedRules = updatedRules.map((rule, idx) => ({
      ...rule,
      priority: idx + 1
    }));
    
    setCurrentStrategy({
      ...currentStrategy,
      rules: reorderedRules
    });
  };
  
  const handleSaveRule = () => {
    if (!currentRule) return;
    
    const updatedRules = [...currentStrategy.rules];
    
    if (currentRuleIndex >= 0) {
      // Edit existing rule
      updatedRules[currentRuleIndex] = currentRule;
    } else {
      // Add new rule
      updatedRules.push(currentRule);
    }
    
    setCurrentStrategy({
      ...currentStrategy,
      rules: updatedRules
    });
    
    setOpenRuleDialog(false);
    setCurrentRule(null);
    setCurrentRuleIndex(-1);
  };
  
  const handleAddCondition = () => {
    if (!currentRule) return;
    
    const newCondition: Condition = {
      type: ConditionType.PRICE,
      parameters: {},
      operator: ConditionOperator.GREATER_THAN,
      value: 0
    };
    
    setCurrentRule({
      ...currentRule,
      conditions: [...currentRule.conditions, newCondition]
    });
  };
  
  const handleUpdateCondition = (index: number, field: keyof Condition, value: any) => {
    if (!currentRule) return;
    
    const updatedConditions = [...currentRule.conditions];
    updatedConditions[index] = {
      ...updatedConditions[index],
      [field]: value
    };
    
    setCurrentRule({
      ...currentRule,
      conditions: updatedConditions
    });
  };
  
  const handleDeleteCondition = (index: number) => {
    if (!currentRule) return;
    
    const updatedConditions = [...currentRule.conditions];
    updatedConditions.splice(index, 1);
    
    setCurrentRule({
      ...currentRule,
      conditions: updatedConditions
    });
  };
  
  const handleAddAction = () => {
    if (!currentRule) return;
    
    const newAction: Action = {
      type: ActionType.ENTER_LONG,
      parameters: {}
    };
    
    setCurrentRule({
      ...currentRule,
      actions: [...currentRule.actions, newAction]
    });
  };
  
  const handleUpdateAction = (index: number, field: keyof Action, value: any) => {
    if (!currentRule) return;
    
    const updatedActions = [...currentRule.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value
    };
    
    setCurrentRule({
      ...currentRule,
      actions: updatedActions
    });
  };
  
  const handleDeleteAction = (index: number) => {
    if (!currentRule) return;
    
    const updatedActions = [...currentRule.actions];
    updatedActions.splice(index, 1);
    
    setCurrentRule({
      ...currentRule,
      actions: updatedActions
    });
  };
  
  const handleAddRiskManagementRule = () => {
    const newRule: RiskManagementRule = {
      type: RiskManagementType.STOP_LOSS,
      parameters: { percentage: 5 },
      enabled: true
    };
    
    setCurrentStrategy({
      ...currentStrategy,
      riskManagement: [...currentStrategy.riskManagement, newRule]
    });
  };
  
  const handleUpdateRiskManagementRule = (index: number, field: keyof RiskManagementRule, value: any) => {
    const updatedRules = [...currentStrategy.riskManagement];
    updatedRules[index] = {
      ...updatedRules[index],
      [field]: value
    };
    
    setCurrentStrategy({
      ...currentStrategy,
      riskManagement: updatedRules
    });
  };
  
  const handleDeleteRiskManagementRule = (index: number) => {
    const updatedRules = [...currentStrategy.riskManagement];
    updatedRules.splice(index, 1);
    
    setCurrentStrategy({
      ...currentStrategy,
      riskManagement: updatedRules
    });
  };
  
  const handleUpdatePositionSizing = (field: keyof PositionSizingRule, value: any) => {
    setCurrentStrategy({
      ...currentStrategy,
      positionSizing: {
        ...currentStrategy.positionSizing,
        [field]: value
      }
    });
  };
  
  const handleCreateFromTemplate = (templateId: string) => {
    setLoading(true);
    setError(null);
    
    strategyService
      .createStrategyFromTemplate(templateId, `New Strategy from Template`)
      .then((strategy) => {
        setCurrentStrategy(strategy);
        setEditMode(true);
        setSuccess('Strategy created from template successfully!');
        setOpenTemplateDialog(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error creating strategy from template:', err);
        setError('Failed to create strategy from template. Please try again later.');
        setLoading(false);
      });
  };
  
  const handleCloneStrategy = () => {
    if (!currentStrategy.id) return;
    
    setLoading(true);
    setError(null);
    
    strategyService
      .cloneStrategy(currentStrategy.id, `${currentStrategy.name} (Copy)`)
      .then((strategy) => {
        setCurrentStrategy(strategy);
        setEditMode(true);
        setSuccess('Strategy cloned successfully!');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error cloning strategy:', err);
        setError('Failed to clone strategy. Please try again later.');
        setLoading(false);
      });
  };
  
  const handleTogglePublic = () => {
    if (!currentStrategy.id) return;
    
    setLoading(true);
    setError(null);
    
    strategyService
      .shareStrategy(currentStrategy.id, !currentStrategy.isPublic)
      .then((strategy) => {
        setCurrentStrategy(strategy);
        setSuccess(
          strategy.isPublic ? 'Strategy is now public!' : 'Strategy is now private!'
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error toggling strategy visibility:', err);
        setError('Failed to update strategy visibility. Please try again later.');
        setLoading(false);
      });
  };
  
  const handleValidateStrategy = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const validationResult = await strategyService.validateStrategy(currentStrategy);
      setValidationResults(validationResult);
      
      if (validationResult.valid) {
        setSuccess('Strategy validation successful!');
      } else {
        setError('Strategy validation failed. Please fix the errors.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error validating strategy:', err);
      setError('Failed to validate strategy. Please try again later.');
      setLoading(false);
    }
  };
  
  const renderConditionForm = (condition: Condition, index: number) => {
    return (
      <Card key={index} variant="outlined" sx={{ mb: 2, p: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Condition Type</InputLabel>
                <Select
                  value={condition.type}
                  label="Condition Type"
                  onChange={(e) => handleUpdateCondition(index, 'type', e.target.value)}
                >
                  <MenuItem value={ConditionType.PRICE}>Price</MenuItem>
                  <MenuItem value={ConditionType.INDICATOR}>Technical Indicator</MenuItem>
                  <MenuItem value={ConditionType.PATTERN}>Chart Pattern</MenuItem>
                  <MenuItem value={ConditionType.VOLUME}>Volume</MenuItem>
                  <MenuItem value={ConditionType.SENTIMENT}>Sentiment</MenuItem>
                  <MenuItem value={ConditionType.FUNDAMENTAL}>Fundamental</MenuItem>
                  <MenuItem value={ConditionType.TIME}>Time</MenuItem>
                  <MenuItem value={ConditionType.PORTFOLIO}>Portfolio</MenuItem>
                  <MenuItem value={ConditionType.MARKET}>Market</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {condition.type === ConditionType.INDICATOR && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Indicator</InputLabel>
                  <Select
                    value={condition.indicator || ''}
                    label="Indicator"
                    onChange={(e) => handleUpdateCondition(index, 'indicator', e.target.value)}
                  >
                    {availableIndicators.map((indicator) => (
                      <MenuItem key={indicator.name} value={indicator.name}>
                        {indicator.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {condition.type === ConditionType.FUNDAMENTAL && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Metric</InputLabel>
                  <Select
                    value={condition.indicator || ''}
                    label="Metric"
                    onChange={(e) => handleUpdateCondition(index, 'indicator', e.target.value)}
                  >
                    {availableFundamentalMetrics.map((metric) => (
                      <MenuItem key={metric.name} value={metric.name}>
                        {metric.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {condition.type === ConditionType.SENTIMENT && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Metric</InputLabel>
                  <Select
                    value={condition.indicator || ''}
                    label="Metric"
                    onChange={(e) => handleUpdateCondition(index, 'indicator', e.target.value)}
                  >
                    {availableSentimentMetrics.map((metric) => (
                      <MenuItem key={metric.name} value={metric.name}>
                        {metric.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Operator</InputLabel>
                <Select
                  value={condition.operator}
                  label="Operator"
                  onChange={(e) => handleUpdateCondition(index, 'operator', e.target.value)}
                >
                  <MenuItem value={ConditionOperator.GREATER_THAN}>Greater Than</MenuItem>
                  <MenuItem value={ConditionOperator.LESS_THAN}>Less Than</MenuItem>
                  <MenuItem value={ConditionOperator.EQUAL}>Equal</MenuItem>
                  <MenuItem value={ConditionOperator.NOT_EQUAL}>Not Equal</MenuItem>
                  <MenuItem value={ConditionOperator.GREATER_THAN_OR_EQUAL}>Greater Than or Equal</MenuItem>
                  <MenuItem value={ConditionOperator.LESS_THAN_OR_EQUAL}>Less Than or Equal</MenuItem>
                  <MenuItem value={ConditionOperator.CROSSES_ABOVE}>Crosses Above</MenuItem>
                  <MenuItem value={ConditionOperator.CROSSES_BELOW}>Crosses Below</MenuItem>
                  <MenuItem value={ConditionOperator.BETWEEN}>Between</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                size="small"
                value={condition.value}
                onChange={(e) => handleUpdateCondition(index, 'value', parseFloat(e.target.value))}
              />
            </Grid>
            
            {condition.operator === ConditionOperator.BETWEEN && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Upper Value"
                  type="number"
                  size="small"
                  value={Array.isArray(condition.value) ? condition.value[1] : 0}
                  onChange={(e) => {
                    const lowerValue = Array.isArray(condition.value) ? condition.value[0] : condition.value;
                    handleUpdateCondition(index, 'value', [lowerValue, parseFloat(e.target.value)]);
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Lookback (periods)"
                type="number"
                size="small"
                value={condition.lookback || 0}
                onChange={(e) => handleUpdateCondition(index, 'lookback', parseInt(e.target.value))}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteCondition(index)}
          >
            Remove
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  const renderActionForm = (action: Action, index: number) => {
    return (
      <Card key={index} variant="outlined" sx={{ mb: 2, p: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={action.type}
                  label="Action Type"
                  onChange={(e) => handleUpdateAction(index, 'type', e.target.value)}
                >
                  <MenuItem value={ActionType.ENTER_LONG}>Enter Long Position</MenuItem>
                  <MenuItem value={ActionType.EXIT_LONG}>Exit Long Position</MenuItem>
                  <MenuItem value={ActionType.ENTER_SHORT}>Enter Short Position</MenuItem>
                  <MenuItem value={ActionType.EXIT_SHORT}>Exit Short Position</MenuItem>
                  <MenuItem value={ActionType.CLOSE_ALL}>Close All Positions</MenuItem>
                  <MenuItem value={ActionType.ADJUST_POSITION}>Adjust Position</MenuItem>
                  <MenuItem value={ActionType.SET_STOP_LOSS}>Set Stop Loss</MenuItem>
                  <MenuItem value={ActionType.SET_TAKE_PROFIT}>Set Take Profit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {(action.type === ActionType.ENTER_LONG || 
              action.type === ActionType.ENTER_SHORT || 
              action.type === ActionType.ADJUST_POSITION) && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Size"
                  type="number"
                  size="small"
                  value={action.parameters?.size || 100}
                  onChange={(e) => {
                    const updatedParams = {
                      ...action.parameters,
                      size: parseInt(e.target.value)
                    };
                    handleUpdateAction(index, 'parameters', updatedParams);
                  }}
                  helperText="Position size (shares or percentage)"
                />
              </Grid>
            )}
            
            {(action.type === ActionType.SET_STOP_LOSS || 
              action.type === ActionType.SET_TAKE_PROFIT) && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Percentage"
                  type="number"
                  size="small"
                  value={action.parameters?.percentage || 5}
                  onChange={(e) => {
                    const updatedParams = {
                      ...action.parameters,
                      percentage: parseFloat(e.target.value)
                    };
                    handleUpdateAction(index, 'parameters', updatedParams);
                  }}
                  helperText="Percentage from entry price"
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteAction(index)}
          >
            Remove
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  const renderRiskManagementRule = (rule: RiskManagementRule, index: number) => {
    return (
      <Card key={index} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={rule.type}
                  label="Rule Type"
                  onChange={(e) => handleUpdateRiskManagementRule(index, 'type', e.target.value)}
                >
                  <MenuItem value={RiskManagementType.STOP_LOSS}>Stop Loss</MenuItem>
                  <MenuItem value={RiskManagementType.TAKE_PROFIT}>Take Profit</MenuItem>
                  <MenuItem value={RiskManagementType.TRAILING_STOP}>Trailing Stop</MenuItem>
                  <MenuItem value={RiskManagementType.MAX_DRAWDOWN}>Max Drawdown</MenuItem>
                  <MenuItem value={RiskManagementType.MAX_POSITION_SIZE}>Max Position Size</MenuItem>
                  <MenuItem value={RiskManagementType.MAX_CONCENTRATION}>Max Concentration</MenuItem>
                  <MenuItem value={RiskManagementType.MAX_OPEN_TRADES}>Max Open Trades</MenuItem>
                  <MenuItem value={RiskManagementType.TIME_STOP}>Time Stop</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {(rule.type === RiskManagementType.STOP_LOSS || 
              rule.type === RiskManagementType.TAKE_PROFIT || 
              rule.type === RiskManagementType.TRAILING_STOP) && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Percentage"
                  type="number"
                  size="small"
                  value={rule.parameters?.percentage || 0}
                  onChange={(e) => {
                    const updatedParams = {
                      ...rule.parameters,
                      percentage: parseFloat(e.target.value)
                    };
                    handleUpdateRiskManagementRule(index, 'parameters', updatedParams);
                  }}
                />
              </Grid>
            )}
            
            {rule.type === RiskManagementType.MAX_DRAWDOWN && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Drawdown %"
                  type="number"
                  size="small"
                  value={rule.parameters?.percentage || 0}
                  onChange={(e) => {
                    const updatedParams = {
                      ...rule.parameters,
                      percentage: parseFloat(e.target.value)
                    };
                    handleUpdateRiskManagementRule(index, 'parameters', updatedParams);
                  }}
                />
              </Grid>
            )}
            
            {rule.type === RiskManagementType.MAX_POSITION_SIZE && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Size"
                  type="number"
                  size="small"
                  value={rule.parameters?.size || 0}
                  onChange={(e) => {
                    const updatedParams = {
                      ...rule.parameters,
                      size: parseInt(e.target.value)
                    };
                    handleUpdateRiskManagementRule(index, 'parameters', updatedParams);
                  }}
                />
              </Grid>
            )}
            
            {rule.type === RiskManagementType.MAX_CONCENTRATION && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Concentration %"
                  type="number"
                  size="small"
                  value={rule.parameters?.percentage || 0}
                  onChange={(e) => {
                    const updatedParams = {
                      ...rule.parameters,
                      percentage: parseFloat(e.target.value)
                    };
                    handleUpdateRiskManagementRule(index, 'parameters', updatedParams);
                  }}
                />
              </Grid>
            )}
            
            {rule.type === RiskManagementType.MAX_OPEN_TRADES && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Max Trades"
                  type="number"
                  size="small"
                  value={rule.parameters?.count || 0}
                  onChange={(e) => {
                    const updatedParams = {
                      ...rule.parameters,
                      count: parseInt(e.target.value)
                    };
                    handleUpdateRiskManagementRule(index, 'parameters', updatedParams);
                  }}
                />
              </Grid>
            )}
            
            {rule.type === RiskManagementType.TIME_STOP && (
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Days"
                  type="number"
                  size="small"
                  value={rule.parameters?.days || 0}
                  onChange={(e) => {
                    const updatedParams = {
                      ...rule.parameters,
                      days: parseInt(e.target.value)
                    };
                    handleUpdateRiskManagementRule(index, 'parameters', updatedParams);
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={rule.enabled}
                    onChange={(e) => handleUpdateRiskManagementRule(index, 'enabled', e.target.checked)}
                  />
                }
                label="Enabled"
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDeleteRiskManagementRule(index)}
          >
            Remove
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          {isCreating ? 'Create New Strategy' : editMode ? 'Edit Strategy' : 'Strategy Details'}
        </Typography>
        
        <Box>
          {!isCreating && !editMode && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<ContentCopyIcon />}
                onClick={handleCloneStrategy}
                sx={{ mr: 1 }}
              >
                Clone
              </Button>
              <Button
                variant="outlined"
                color="info"
                startIcon={currentStrategy.isPublic ? <VisibilityOffIcon /> : <VisibilityIcon />}
                onClick={handleTogglePublic}
              >
                {currentStrategy.isPublic ? 'Make Private' : 'Make Public'}
              </Button>
            </>
          )}
          
          {(isCreating || editMode) && (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleValidateStrategy}
                sx={{ mr: 1 }}
              >
                Validate
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveStrategy}
                disabled={loading}
              >
                Save
              </Button>
            </>
          )}
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
      
      {validationResults && !validationResults.valid && (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2">Validation Issues:</Typography>
          <ul>
            {validationResults.errors.map((error, index) => (
              <li key={`error-${index}`}>{error.message}</li>
            ))}
            {validationResults.warnings.map((warning, index) => (
              <li key={`warning-${index}`}>{warning.message}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      {validationResults && validationResults.valid && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }} onClose={() => setValidationResults(null)}>
          Strategy validation successful!
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Strategy Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Strategy Name"
                  value={currentStrategy.name}
                  onChange={(e) => handleStrategyChange('name', e.target.value)}
                  disabled={!editMode && !isCreating}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={currentStrategy.description || ''}
                  onChange={(e) => handleStrategyChange('description', e.target.value)}
                  disabled={!editMode && !isCreating}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Strategy Type</InputLabel>
                  <Select
                    value={currentStrategy.type}
                    label="Strategy Type"
                    onChange={(e) => handleStrategyChange('type', e.target.value)}
                    disabled={!editMode && !isCreating}
                  >
                    <MenuItem value={StrategyType.TECHNICAL}>Technical</MenuItem>
                    <MenuItem value={StrategyType.FUNDAMENTAL}>Fundamental</MenuItem>
                    <MenuItem value={StrategyType.SENTIMENT}>Sentiment</MenuItem>
                    <MenuItem value={StrategyType.STATISTICAL}>Statistical</MenuItem>
                    <MenuItem value={StrategyType.MACHINE_LEARNING}>Machine Learning</MenuItem>
                    <MenuItem value={StrategyType.MULTI_FACTOR}>Multi-Factor</MenuItem>
                    <MenuItem value={StrategyType.EVENT_DRIVEN}>Event-Driven</MenuItem>
                    <MenuItem value={StrategyType.CUSTOM}>Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {currentStrategy.tags?.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={
                        editMode || isCreating
                          ? () => {
                              const updatedTags = [...(currentStrategy.tags || [])];
                              updatedTags.splice(index, 1);
                              handleStrategyChange('tags', updatedTags);
                            }
                          : undefined
                      }
                    />
                  ))}
                  
                  {(editMode || isCreating) && (
                    <Chip
                      icon={<AddIcon />}
                      label="Add Tag"
                      onClick={() => {
                        const tag = prompt('Enter tag name:');
                        if (tag) {
                          const updatedTags = [...(currentStrategy.tags || []), tag];
                          handleStrategyChange('tags', updatedTags);
                        }
                      }}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Position Sizing</Typography>
              {(editMode || isCreating) && (
                <Tooltip title="Position sizing determines how much capital to allocate to each trade">
                  <IconButton size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode && !isCreating}>
                  <InputLabel>Position Sizing Method</InputLabel>
                  <Select
                    value={currentStrategy.positionSizing.type}
                    label="Position Sizing Method"
                    onChange={(e) => handleUpdatePositionSizing('type', e.target.value)}
                  >
                    <MenuItem value={PositionSizingType.FIXED}>Fixed Size</MenuItem>
                    <MenuItem value={PositionSizingType.PERCENTAGE_OF_EQUITY}>Percentage of Equity</MenuItem>
                    <MenuItem value={PositionSizingType.RISK_BASED}>Risk-Based</MenuItem>
                    <MenuItem value={PositionSizingType.VOLATILITY_BASED}>Volatility-Based</MenuItem>
                    <MenuItem value={PositionSizingType.KELLY_CRITERION}>Kelly Criterion</MenuItem>
                    <MenuItem value={PositionSizingType.OPTIMAL_F}>Optimal F</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {currentStrategy.positionSizing.type === PositionSizingType.FIXED && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fixed Size"
                    type="number"
                    value={currentStrategy.positionSizing.parameters?.size || 100}
                    onChange={(e) => {
                      const updatedParams = {
                        ...currentStrategy.positionSizing.parameters,
                        size: parseInt(e.target.value)
                      };
                      handleUpdatePositionSizing('parameters', updatedParams);
                    }}
                    disabled={!editMode && !isCreating}
                    helperText="Number of shares/contracts per trade"
                  />
                </Grid>
              )}
              
              {currentStrategy.positionSizing.type === PositionSizingType.PERCENTAGE_OF_EQUITY && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Percentage"
                    type="number"
                    value={currentStrategy.positionSizing.parameters?.percentage || 5}
                    onChange={(e) => {
                      const updatedParams = {
                        ...currentStrategy.positionSizing.parameters,
                        percentage: parseFloat(e.target.value)
                      };
                      handleUpdatePositionSizing('parameters', updatedParams);
                    }}
                    disabled={!editMode && !isCreating}
                    helperText="Percentage of equity to allocate per trade"
                  />
                </Grid>
              )}
              
              {currentStrategy.positionSizing.type === PositionSizingType.RISK_BASED && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Risk Percentage"
                    type="number"
                    value={currentStrategy.positionSizing.parameters?.riskPercentage || 1}
                    onChange={(e) => {
                      const updatedParams = {
                        ...currentStrategy.positionSizing.parameters,
                        riskPercentage: parseFloat(e.target.value)
                      };
                      handleUpdatePositionSizing('parameters', updatedParams);
                    }}
                    disabled={!editMode && !isCreating}
                    helperText="Percentage of equity to risk per trade"
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Strategy Rules</Typography>
              {(editMode || isCreating) && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddRule}
                  size="small"
                >
                  Add Rule
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {currentStrategy.rules.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No rules defined. {(editMode || isCreating) && 'Click "Add Rule" to create a new rule.'}
                </Typography>
              </Box>
            ) : (
              <List>
                {currentStrategy.rules.map((rule, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        (editMode || isCreating) && (
                          <>
                            <IconButton edge="end" onClick={() => handleEditRule(index)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteRule(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">{rule.name}</Typography>
                            {!rule.enabled && (
                              <Chip
                                label="Disabled"
                                size="small"
                                sx={{ ml: 1 }}
                                color="default"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {rule.description || 'No description'}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              <Chip
                                size="small"
                                label={`${rule.conditions.length} condition${
                                  rule.conditions.length !== 1 ? 's' : ''
                                }`}
                                color="primary"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`${rule.actions.length} action${rule.actions.length !== 1 ? 's' : ''}`}
                                color="secondary"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`Logic: ${rule.logicOperator}`}
                                color="info"
                                variant="outlined"
                              />
                              <Chip
                                size="small"
                                label={`Priority: ${rule.priority}`}
                                color="default"
                                variant="outlined"
                              />
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
          
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Risk Management</Typography>
              {(editMode || isCreating) && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddRiskManagementRule}
                  size="small"
                >
                  Add Rule
                </Button>
              )}
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {currentStrategy.riskManagement.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No risk management rules defined.{' '}
                  {(editMode || isCreating) && 'Click "Add Rule" to create a new risk management rule.'}
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {currentStrategy.riskManagement.map((rule, index) => (
                  <Grid item xs={12} key={index}>
                    {renderRiskManagementRule(rule, index)}
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Rule Dialog */}
      <Dialog open={openRuleDialog} onClose={() => setOpenRuleDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentRuleIndex >= 0 ? 'Edit Rule' : 'Create New Rule'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={currentRule?.name || ''}
                onChange={(e) => setCurrentRule({ ...currentRule!, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={currentRule?.description || ''}
                onChange={(e) => setCurrentRule({ ...currentRule!, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Logic Operator</InputLabel>
                <Select
                  value={currentRule?.logicOperator || LogicOperator.AND}
                  label="Logic Operator"
                  onChange={(e) => setCurrentRule({ ...currentRule!, logicOperator: e.target.value as LogicOperator })}
                >
                  <MenuItem value={LogicOperator.AND}>AND (All conditions must be true)</MenuItem>
                  <MenuItem value={LogicOperator.OR}>OR (Any condition can be true)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Priority"
                type="number"
                value={currentRule?.priority || 1}
                onChange={(e) => setCurrentRule({ ...currentRule!, priority: parseInt(e.target.value) })}
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentRule?.enabled ?? true}
                    onChange={(e) => setCurrentRule({ ...currentRule!, enabled: e.target.checked })}
                  />
                }
                label="Enabled"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Conditions</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddCondition}
                  size="small"
                >
                  Add Condition
                </Button>
              </Box>
              
              {currentRule?.conditions.map((condition, index) => renderConditionForm(condition, index))}
              
              {currentRule?.conditions.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No conditions defined. Click "Add Condition" to create a new condition.
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Actions</Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddAction}
                  size="small"
                >
                  Add Action
                </Button>
              </Box>
              
              {currentRule?.actions.map((action, index) => renderActionForm(action, index))}
              
              {currentRule?.actions.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No actions defined. Click "Add Action" to create a new action.
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRuleDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveRule}
            variant="contained"
            color="primary"
            disabled={
              !currentRule?.name ||
              currentRule.conditions.length === 0 ||
              currentRule.actions.length === 0
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Template Dialog */}
      <Dialog open={openTemplateDialog} onClose={() => setOpenTemplateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Choose a Strategy Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        size="small"
                        label={template.category}
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        size="small"
                        label={template.complexity}
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplateDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StrategyBuilder;