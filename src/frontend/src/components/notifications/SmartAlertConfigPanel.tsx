import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  FormGroup,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  PlayArrow as TestIcon,
  ContentCopy as DuplicateIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import aiNotificationService, { 
  SmartAlertConfig, 
  SmartAlertCondition, 
  SmartAlertAction 
} from '../../services/aiNotificationService';

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
      id={`alert-tabpanel-${index}`}
      aria-labelledby={`alert-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `alert-tab-${index}`,
    'aria-controls': `alert-tabpanel-${index}`,
  };
}

const SmartAlertConfigPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [alertConfigs, setAlertConfigs] = useState<SmartAlertConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<SmartAlertConfig | null>(null);
  const [conditionTypes, setConditionTypes] = useState<any[]>([]);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // New alert config form state
  const [formConfig, setFormConfig] = useState<Partial<SmartAlertConfig>>({
    name: '',
    description: '',
    enabled: true,
    conditions: [],
    actions: [],
  });

  useEffect(() => {
    loadAlertConfigs();
    loadConditionAndActionTypes();
  }, []);

  const loadAlertConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const configs = await aiNotificationService.getSmartAlertConfigs();
      setAlertConfigs(configs);
    } catch (error) {
      console.error('Error loading smart alert configs:', error);
      setError('Failed to load smart alert configurations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadConditionAndActionTypes = async () => {
    try {
      const [condTypes, actTypes] = await Promise.all([
        aiNotificationService.getAvailableConditionTypes(),
        aiNotificationService.getAvailableActionTypes(),
      ]);
      setConditionTypes(condTypes);
      setActionTypes(actTypes);
    } catch (error) {
      console.error('Error loading condition and action types:', error);
      setError('Failed to load condition and action types. Some features may be limited.');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateConfig = async () => {
    if (!formConfig.name) {
      setError('Please provide a name for the alert configuration');
      return;
    }

    if (formConfig.conditions?.length === 0) {
      setError('Please add at least one condition');
      return;
    }

    if (formConfig.actions?.length === 0) {
      setError('Please add at least one action');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const newConfig = await aiNotificationService.createSmartAlertConfig(formConfig as any);
      setAlertConfigs([...alertConfigs, newConfig]);
      setSuccess('Smart alert configuration created successfully');
      
      // Reset form
      setFormConfig({
        name: '',
        description: '',
        enabled: true,
        conditions: [],
        actions: [],
      });
      
      // Switch to My Alerts tab
      setTabValue(1);
    } catch (error) {
      console.error('Error creating smart alert config:', error);
      setError('Failed to create smart alert configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!selectedConfig) return;

    if (!formConfig.name) {
      setError('Please provide a name for the alert configuration');
      return;
    }

    if (formConfig.conditions?.length === 0) {
      setError('Please add at least one condition');
      return;
    }

    if (formConfig.actions?.length === 0) {
      setError('Please add at least one action');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updatedConfig = await aiNotificationService.updateSmartAlertConfig(
        selectedConfig.id,
        formConfig as any
      );
      setAlertConfigs(alertConfigs.map(config => 
        config.id === updatedConfig.id ? updatedConfig : config
      ));
      setSuccess('Smart alert configuration updated successfully');
      
      // Reset selection and form
      setSelectedConfig(null);
      setFormConfig({
        name: '',
        description: '',
        enabled: true,
        conditions: [],
        actions: [],
      });
      
      // Switch to My Alerts tab
      setTabValue(1);
    } catch (error) {
      console.error('Error updating smart alert config:', error);
      setError('Failed to update smart alert configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!configToDelete) return;

    setLoading(true);
    try {
      await aiNotificationService.deleteSmartAlertConfig(configToDelete);
      setAlertConfigs(alertConfigs.filter(config => config.id !== configToDelete));
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
      setSuccess('Smart alert configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting smart alert config:', error);
      setError('Failed to delete smart alert configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfig = (config: SmartAlertConfig) => {
    setSelectedConfig(config);
    setFormConfig({
      name: config.name,
      description: config.description || '',
      enabled: config.enabled,
      conditions: [...config.conditions],
      actions: [...config.actions],
      schedule: config.schedule ? { ...config.schedule } : undefined,
    });
    setTabValue(0);
  };

  const handleDuplicateConfig = async (config: SmartAlertConfig) => {
    const duplicateConfig = {
      name: `${config.name} (Copy)`,
      description: config.description,
      enabled: config.enabled,
      conditions: config.conditions,
      actions: config.actions,
      schedule: config.schedule,
    };

    setSaving(true);
    try {
      const newConfig = await aiNotificationService.createSmartAlertConfig(duplicateConfig as any);
      setAlertConfigs([...alertConfigs, newConfig]);
      setSuccess('Smart alert configuration duplicated successfully');
    } catch (error) {
      console.error('Error duplicating smart alert config:', error);
      setError('Failed to duplicate smart alert configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConfig = async () => {
    if (formConfig.conditions?.length === 0) {
      setError('Please add at least one condition to test');
      return;
    }

    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const result = await aiNotificationService.testSmartAlertConfig(formConfig as any);
      setTestResult(result);
    } catch (error) {
      console.error('Error testing smart alert config:', error);
      setError('Failed to test smart alert configuration. Please try again.');
    } finally {
      setTesting(false);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const updatedConfig = await aiNotificationService.updateSmartAlertConfig(id, { enabled });
      setAlertConfigs(alertConfigs.map(config => 
        config.id === id ? { ...config, enabled: updatedConfig.enabled } : config
      ));
      setSuccess(`Alert ${enabled ? 'enabled' : 'disabled'} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error toggling alert enabled state:', error);
      setError('Failed to update alert state. Please try again.');
    }
  };

  const handleAddCondition = () => {
    if (conditionTypes.length === 0) {
      setError('No condition types available. Please try refreshing the page.');
      return;
    }

    const newCondition: SmartAlertCondition = {
      id: `temp-${Date.now()}`,
      type: conditionTypes[0].type,
      parameters: {},
    };

    setFormConfig({
      ...formConfig,
      conditions: [...(formConfig.conditions || []), newCondition],
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = [...(formConfig.conditions || [])];
    newConditions.splice(index, 1);
    setFormConfig({
      ...formConfig,
      conditions: newConditions,
    });
  };

  const handleConditionChange = (index: number, field: string, value: any) => {
    const newConditions = [...(formConfig.conditions || [])];
    if (field === 'type') {
      // Reset parameters when type changes
      newConditions[index] = {
        ...newConditions[index],
        type: value,
        parameters: {},
      };
    } else if (field.startsWith('param.')) {
      const paramName = field.substring(6);
      newConditions[index] = {
        ...newConditions[index],
        parameters: {
          ...newConditions[index].parameters,
          [paramName]: value,
        },
      };
    } else {
      (newConditions[index] as any)[field] = value;
    }
    
    setFormConfig({
      ...formConfig,
      conditions: newConditions,
    });
  };

  const handleAddAction = () => {
    if (actionTypes.length === 0) {
      setError('No action types available. Please try refreshing the page.');
      return;
    }

    const newAction: SmartAlertAction = {
      id: `temp-${Date.now()}`,
      type: actionTypes[0].type,
      parameters: {},
    };

    setFormConfig({
      ...formConfig,
      actions: [...(formConfig.actions || []), newAction],
    });
  };

  const handleRemoveAction = (index: number) => {
    const newActions = [...(formConfig.actions || [])];
    newActions.splice(index, 1);
    setFormConfig({
      ...formConfig,
      actions: newActions,
    });
  };

  const handleActionChange = (index: number, field: string, value: any) => {
    const newActions = [...(formConfig.actions || [])];
    if (field === 'type') {
      // Reset parameters when type changes
      newActions[index] = {
        ...newActions[index],
        type: value,
        parameters: {},
      };
    } else if (field.startsWith('param.')) {
      const paramName = field.substring(6);
      newActions[index] = {
        ...newActions[index],
        parameters: {
          ...newActions[index].parameters,
          [paramName]: value,
        },
      };
    } else {
      (newActions[index] as any)[field] = value;
    }
    
    setFormConfig({
      ...formConfig,
      actions: newActions,
    });
  };

  const getConditionTypeLabel = (type: string) => {
    const conditionType = conditionTypes.find(ct => ct.type === type);
    return conditionType ? conditionType.name : type;
  };

  const getActionTypeLabel = (type: string) => {
    const actionType = actionTypes.find(at => at.type === type);
    return actionType ? actionType.name : type;
  };

  const getConditionParameters = (type: string) => {
    const conditionType = conditionTypes.find(ct => ct.type === type);
    return conditionType ? conditionType.parameters : [];
  };

  const getActionParameters = (type: string) => {
    const actionType = actionTypes.find(at => at.type === type);
    return actionType ? actionType.parameters : [];
  };

  const renderConditionParameters = (condition: SmartAlertCondition, index: number) => {
    const parameters = getConditionParameters(condition.type);
    
    if (parameters.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No parameters required for this condition type.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {parameters.map((param: any) => (
          <Grid item xs={12} sm={6} key={param.name}>
            {param.type === 'string' && (
              <TextField
                fullWidth
                size="small"
                label={param.label || param.name}
                value={condition.parameters[param.name] || ''}
                onChange={(e) => handleConditionChange(index, `param.${param.name}`, e.target.value)}
                helperText={param.description}
              />
            )}
            {param.type === 'number' && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label={param.label || param.name}
                value={condition.parameters[param.name] || ''}
                onChange={(e) => handleConditionChange(index, `param.${param.name}`, Number(e.target.value))}
                helperText={param.description}
              />
            )}
            {param.type === 'boolean' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={!!condition.parameters[param.name]}
                    onChange={(e) => handleConditionChange(index, `param.${param.name}`, e.target.checked)}
                  />
                }
                label={param.label || param.name}
              />
            )}
            {param.type === 'select' && (
              <FormControl fullWidth size="small">
                <InputLabel>{param.label || param.name}</InputLabel>
                <Select
                  value={condition.parameters[param.name] || ''}
                  label={param.label || param.name}
                  onChange={(e) => handleConditionChange(index, `param.${param.name}`, e.target.value)}
                >
                  {param.options.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderActionParameters = (action: SmartAlertAction, index: number) => {
    const parameters = getActionParameters(action.type);
    
    if (parameters.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No parameters required for this action type.
        </Typography>
      );
    }

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {parameters.map((param: any) => (
          <Grid item xs={12} sm={6} key={param.name}>
            {param.type === 'string' && (
              <TextField
                fullWidth
                size="small"
                label={param.label || param.name}
                value={action.parameters[param.name] || ''}
                onChange={(e) => handleActionChange(index, `param.${param.name}`, e.target.value)}
                helperText={param.description}
                multiline={param.multiline}
                rows={param.multiline ? 3 : 1}
              />
            )}
            {param.type === 'number' && (
              <TextField
                fullWidth
                size="small"
                type="number"
                label={param.label || param.name}
                value={action.parameters[param.name] || ''}
                onChange={(e) => handleActionChange(index, `param.${param.name}`, Number(e.target.value))}
                helperText={param.description}
              />
            )}
            {param.type === 'boolean' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={!!action.parameters[param.name]}
                    onChange={(e) => handleActionChange(index, `param.${param.name}`, e.target.checked)}
                  />
                }
                label={param.label || param.name}
              />
            )}
            {param.type === 'select' && (
              <FormControl fullWidth size="small">
                <InputLabel>{param.label || param.name}</InputLabel>
                <Select
                  value={action.parameters[param.name] || ''}
                  label={param.label || param.name}
                  onChange={(e) => handleActionChange(index, `param.${param.name}`, e.target.value)}
                >
                  {param.options.map((option: any) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
        ))}
      </Grid>
    );
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <NotificationsIcon />;
      case 'email':
        return <EmailIcon />;
      case 'sms':
        return <SmsIcon />;
      case 'webhook':
        return <CodeIcon />;
      default:
        return <SettingsIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="smart alert tabs">
          <Tab label="Create Alert" {...a11yProps(0)} />
          <Tab label="My Alerts" {...a11yProps(1)} />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader 
            title={selectedConfig ? 'Edit Smart Alert' : 'Create Smart Alert'} 
            subheader="Configure conditions and actions for your alert"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Alert Name"
                  value={formConfig.name}
                  onChange={(e) => setFormConfig({ ...formConfig, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formConfig.enabled}
                      onChange={(e) => setFormConfig({ ...formConfig, enabled: e.target.checked })}
                    />
                  }
                  label="Enabled"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={formConfig.description}
                  onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Conditions</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddCondition}
                  >
                    Add Condition
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {formConfig.conditions?.length === 0 ? (
                  <Alert severity="info">
                    No conditions added yet. Add at least one condition to define when this alert should trigger.
                  </Alert>
                ) : (
                  formConfig.conditions?.map((condition, index) => (
                    <Paper key={condition.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1">
                          Condition {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveCondition(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Condition Type</InputLabel>
                            <Select
                              value={condition.type}
                              label="Condition Type"
                              onChange={(e) => handleConditionChange(index, 'type', e.target.value)}
                            >
                              {conditionTypes.map((type) => (
                                <MenuItem key={type.type} value={type.type}>
                                  {type.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Operator</InputLabel>
                            <Select
                              value={condition.operator || 'and'}
                              label="Operator"
                              onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                            >
                              <MenuItem value="and">AND</MenuItem>
                              <MenuItem value="or">OR</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {renderConditionParameters(condition, index)}
                    </Paper>
                  ))
                )}
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Actions</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddAction}
                  >
                    Add Action
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {formConfig.actions?.length === 0 ? (
                  <Alert severity="info">
                    No actions added yet. Add at least one action to define what happens when the alert triggers.
                  </Alert>
                ) : (
                  formConfig.actions?.map((action, index) => (
                    <Paper key={action.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1">
                          Action {index + 1}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveAction(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Action Type</InputLabel>
                            <Select
                              value={action.type}
                              label="Action Type"
                              onChange={(e) => handleActionChange(index, 'type', e.target.value)}
                            >
                              {actionTypes.map((type) => (
                                <MenuItem key={type.type} value={type.type}>
                                  {type.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {renderActionParameters(action, index)}
                    </Paper>
                  ))
                )}
              </Grid>
            </Grid>

            {testResult && (
              <Box mt={3}>
                <Alert 
                  severity={testResult.valid ? "success" : "error"}
                  onClose={() => setTestResult(null)}
                >
                  {testResult.message}
                </Alert>
                {testResult.valid && testResult.sampleNotification && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Sample Notification
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Title:</strong> {testResult.sampleNotification.title}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Message:</strong> {testResult.sampleNotification.message}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                startIcon={<TestIcon />}
                onClick={handleTestConfig}
                disabled={testing || formConfig.conditions?.length === 0}
              >
                {testing ? <CircularProgress size={24} /> : 'Test Alert'}
              </Button>
              <Box>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedConfig(null);
                    setFormConfig({
                      name: '',
                      description: '',
                      enabled: true,
                      conditions: [],
                      actions: [],
                    });
                    setTestResult(null);
                  }}
                  sx={{ mr: 1 }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={selectedConfig ? handleUpdateConfig : handleCreateConfig}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : selectedConfig ? 'Update Alert' : 'Create Alert'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6">
            My Smart Alerts
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAlertConfigs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : alertConfigs.length === 0 ? (
          <Alert severity="info">
            You don't have any smart alerts yet. Create a new alert to get started.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {alertConfigs.map((config) => (
              <Grid item xs={12} md={6} lg={4} key={config.id}>
                <Card variant="outlined">
                  <CardHeader
                    title={
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                          {config.name}
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.enabled}
                              onChange={(e) => handleToggleEnabled(config.id, e.target.checked)}
                              size="small"
                            />
                          }
                          label=""
                        />
                      </Box>
                    }
                    subheader={
                      <Box display="flex" alignItems="center" mt={1}>
                        <Chip 
                          label={config.enabled ? "Enabled" : "Disabled"} 
                          color={config.enabled ? "success" : "default"}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          Created: {new Date(config.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {config.description && (
                      <Typography variant="body2" color="textSecondary" paragraph>
                        {config.description}
                      </Typography>
                    )}
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Conditions ({config.conditions.length})
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        {config.conditions.map((condition, index) => (
                          <Box key={condition.id} sx={{ mb: index < config.conditions.length - 1 ? 1 : 0 }}>
                            <Typography variant="body2">
                              {getConditionTypeLabel(condition.type)}
                              {index < config.conditions.length - 1 && (
                                <Chip 
                                  label={condition.operator === 'or' ? 'OR' : 'AND'} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Actions ({config.actions.length})
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {config.actions.map((action) => (
                          <Chip
                            key={action.id}
                            label={getActionTypeLabel(action.type)}
                            icon={getActionIcon(action.type) as any}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    {config.schedule && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Schedule
                        </Typography>
                        <Typography variant="body2">
                          {config.schedule.type === 'once' ? 'One-time' : 'Recurring'} alert
                          {config.schedule.type === 'recurring' && config.schedule.frequency && (
                            <> ({config.schedule.frequency})</>
                          )}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  <Divider />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEditConfig(config)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton onClick={() => handleDuplicateConfig(config)}>
                        <DuplicateIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        color="error"
                        onClick={() => {
                          setConfigToDelete(config.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Smart Alert</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this smart alert configuration? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfig} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmartAlertConfigPanel;