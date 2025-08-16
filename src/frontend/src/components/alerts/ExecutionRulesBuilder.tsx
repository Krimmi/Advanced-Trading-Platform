import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
} from '@mui/icons-material';
import alertsServiceExtensions, {
  ExecutionStrategy,
  ExecutionCondition,
  ExecutionAction,
} from '../../services/alertsServiceExtensions';

interface ExecutionRulesBuilderProps {
  strategy?: ExecutionStrategy;
  onSave: (strategy: ExecutionStrategy) => void;
  onCancel: () => void;
}

const ExecutionRulesBuilder: React.FC<ExecutionRulesBuilderProps> = ({
  strategy,
  onSave,
  onCancel,
}) => {
  const theme = useTheme();
  const [name, setName] = useState<string>(strategy?.name || '');
  const [description, setDescription] = useState<string>(strategy?.description || '');
  const [conditions, setConditions] = useState<ExecutionCondition[]>(
    strategy?.conditions || [
      {
        type: 'price',
        symbol: '',
        operator: 'greater_than',
        value: 0,
      },
    ]
  );
  const [actions, setActions] = useState<ExecutionAction[]>(
    strategy?.actions || [
      {
        type: 'market_order',
        symbol: '',
        side: 'buy',
        quantity: 0,
      },
    ]
  );
  const [conditionTypes, setConditionTypes] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [errors, setErrors] = useState<{
    name?: string;
    conditions?: string[];
    actions?: string[];
  }>({});

  // Fetch condition and action types on component mount
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const [conditionTypesData, actionTypesData] = await Promise.all([
          alertsServiceExtensions.getExecutionConditionTypes(),
          alertsServiceExtensions.getExecutionActionTypes(),
        ]);
        setConditionTypes(conditionTypesData);
        setActionTypes(actionTypesData);
      } catch (error) {
        console.error('Error fetching execution types:', error);
      }
    };

    fetchTypes();
  }, []);

  const validateStrategy = (): boolean => {
    const newErrors: {
      name?: string;
      conditions?: string[];
      actions?: string[];
    } = {};

    if (!name.trim()) {
      newErrors.name = 'Strategy name is required';
    }

    const conditionErrors: string[] = [];
    conditions.forEach((condition, index) => {
      if (!condition.symbol.trim()) {
        conditionErrors[index] = 'Symbol is required';
      }
      // Add more condition validations as needed
    });

    if (conditionErrors.length > 0) {
      newErrors.conditions = conditionErrors;
    }

    const actionErrors: string[] = [];
    actions.forEach((action, index) => {
      if (!action.symbol.trim()) {
        actionErrors[index] = 'Symbol is required';
      }
      // Add more action validations as needed
    });

    if (actionErrors.length > 0) {
      newErrors.actions = actionErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateStrategy()) {
      const newStrategy: ExecutionStrategy = {
        id: strategy?.id,
        name,
        description,
        conditions,
        actions,
        isActive: strategy?.isActive || false,
        createdAt: strategy?.createdAt,
        updatedAt: strategy?.updatedAt,
      };
      onSave(newStrategy);
    }
  };

  const handleTestStrategy = async () => {
    if (validateStrategy()) {
      try {
        const testStrategy: ExecutionStrategy = {
          name,
          description,
          conditions,
          actions,
          isActive: false,
        };
        
        const result = await alertsServiceExtensions.testExecutionStrategy(testStrategy);
        console.log('Test result:', result);
        // Here you would typically show the test results in a dialog or notification
      } catch (error) {
        console.error('Error testing strategy:', error);
      }
    }
  };

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        type: 'price',
        symbol: '',
        operator: 'greater_than',
        value: 0,
      },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...conditions];
    newConditions.splice(index, 1);
    setConditions(newConditions);
  };

  const handleConditionChange = (index: number, field: keyof ExecutionCondition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
  };

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        type: 'market_order',
        symbol: '',
        side: 'buy',
        quantity: 0,
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = [...actions];
    newActions.splice(index, 1);
    setActions(newActions);
  };

  const handleActionChange = (index: number, field: keyof ExecutionAction, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  return (
    <Card>
      <CardHeader
        title={
          <Typography variant="h6">
            {strategy?.id ? 'Edit Execution Strategy' : 'Create Execution Strategy'}
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Strategy Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
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
            <Typography variant="subtitle1" gutterBottom>
              Conditions
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              {conditions.map((condition, index) => (
                <Box key={index} mb={2}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Condition {index + 1}</Typography>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={condition.type}
                          label="Type"
                          onChange={(e) =>
                            handleConditionChange(index, 'type', e.target.value)
                          }
                        >
                          <MenuItem value="price">Price</MenuItem>
                          <MenuItem value="technical">Technical</MenuItem>
                          <MenuItem value="volume">Volume</MenuItem>
                          <MenuItem value="time">Time</MenuItem>
                          <MenuItem value="news">News</MenuItem>
                          <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Symbol"
                        value={condition.symbol}
                        onChange={(e) =>
                          handleConditionChange(index, 'symbol', e.target.value)
                        }
                        error={!!errors.conditions?.[index]}
                        helperText={errors.conditions?.[index]}
                      />
                    </Grid>
                    {condition.type === 'technical' && (
                      <Grid item xs={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Indicator</InputLabel>
                          <Select
                            value={condition.indicator || ''}
                            label="Indicator"
                            onChange={(e) =>
                              handleConditionChange(index, 'indicator', e.target.value)
                            }
                          >
                            <MenuItem value="rsi">RSI</MenuItem>
                            <MenuItem value="macd">MACD</MenuItem>
                            <MenuItem value="sma">SMA</MenuItem>
                            <MenuItem value="ema">EMA</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={condition.type === 'technical' ? 3 : 3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={condition.operator}
                          label="Operator"
                          onChange={(e) =>
                            handleConditionChange(index, 'operator', e.target.value)
                          }
                        >
                          <MenuItem value="equals">Equals</MenuItem>
                          <MenuItem value="greater_than">Greater Than</MenuItem>
                          <MenuItem value="less_than">Less Than</MenuItem>
                          <MenuItem value="between">Between</MenuItem>
                          <MenuItem value="crosses_above">Crosses Above</MenuItem>
                          <MenuItem value="crosses_below">Crosses Below</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={condition.operator === 'between' ? 2 : 3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Value"
                        type="number"
                        value={condition.value}
                        onChange={(e) =>
                          handleConditionChange(
                            index,
                            'value',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </Grid>
                    {condition.operator === 'between' && (
                      <Grid item xs={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Value 2"
                          type="number"
                          value={condition.value2 || 0}
                          onChange={(e) =>
                            handleConditionChange(
                              index,
                              'value2',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </Grid>
                    )}
                    <Grid item xs={condition.operator === 'between' ? 1 : 2}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveCondition(index)}
                        disabled={conditions.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCondition}
                fullWidth
              >
                Add Condition
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Actions
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              {actions.map((action, index) => (
                <Box key={index} mb={2}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                      <Typography variant="subtitle2">Action {index + 1}</Typography>
                      <Divider sx={{ my: 1 }} />
                    </Grid>
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={action.type}
                          label="Type"
                          onChange={(e) =>
                            handleActionChange(index, 'type', e.target.value)
                          }
                        >
                          <MenuItem value="market_order">Market Order</MenuItem>
                          <MenuItem value="limit_order">Limit Order</MenuItem>
                          <MenuItem value="stop_order">Stop Order</MenuItem>
                          <MenuItem value="stop_limit_order">Stop Limit Order</MenuItem>
                          <MenuItem value="notification">Notification</MenuItem>
                          <MenuItem value="custom">Custom</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Symbol"
                        value={action.symbol}
                        onChange={(e) =>
                          handleActionChange(index, 'symbol', e.target.value)
                        }
                        error={!!errors.actions?.[index]}
                        helperText={errors.actions?.[index]}
                      />
                    </Grid>
                    {action.type.includes('order') && (
                      <>
                        <Grid item xs={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Side</InputLabel>
                            <Select
                              value={action.side}
                              label="Side"
                              onChange={(e) =>
                                handleActionChange(index, 'side', e.target.value)
                              }
                            >
                              <MenuItem value="buy">Buy</MenuItem>
                              <MenuItem value="sell">Sell</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={2}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Quantity"
                            type="number"
                            value={action.quantity}
                            onChange={(e) =>
                              handleActionChange(
                                index,
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </Grid>
                      </>
                    )}
                    {(action.type === 'limit_order' || action.type === 'stop_limit_order') && (
                      <Grid item xs={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Price"
                          type="number"
                          value={action.price || 0}
                          onChange={(e) =>
                            handleActionChange(
                              index,
                              'price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </Grid>
                    )}
                    {(action.type === 'stop_order' || action.type === 'stop_limit_order') && (
                      <Grid item xs={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Stop Price"
                          type="number"
                          value={action.stopPrice || 0}
                          onChange={(e) =>
                            handleActionChange(
                              index,
                              'stopPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </Grid>
                    )}
                    {action.type === 'notification' && (
                      <>
                        <Grid item xs={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                              value={action.notificationType || 'in-app'}
                              label="Type"
                              onChange={(e) =>
                                handleActionChange(index, 'notificationType', e.target.value)
                              }
                            >
                              <MenuItem value="email">Email</MenuItem>
                              <MenuItem value="push">Push</MenuItem>
                              <MenuItem value="sms">SMS</MenuItem>
                              <MenuItem value="in-app">In-App</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Message"
                            value={action.notificationMessage || ''}
                            onChange={(e) =>
                              handleActionChange(index, 'notificationMessage', e.target.value)
                            }
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveAction(index)}
                        disabled={actions.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddAction}
                fullWidth
              >
                Add Action
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="outlined"
                startIcon={<TestIcon />}
                onClick={handleTestStrategy}
              >
                Test Strategy
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                color="primary"
              >
                Save Strategy
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ExecutionRulesBuilder;