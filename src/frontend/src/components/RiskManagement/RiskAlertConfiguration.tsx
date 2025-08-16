import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  Slider,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import riskAlertsService, {
  RiskAlert,
  RiskAlertCreate,
  RiskAlertUpdate,
  AlertSeverity,
  AlertStatus,
  AlertType,
  AlertOperator,
  NotificationMethod
} from '../../api/riskAlertsService';

interface RiskAlertConfigurationProps {
  symbols: string[];
  userId: string;
  portfolioId?: string;
  onSaveConfiguration?: (alerts: RiskAlert[]) => void;
}

const RiskAlertConfiguration: React.FC<RiskAlertConfigurationProps> = ({
  symbols,
  userId,
  portfolioId,
  onSaveConfiguration
}) => {
  const theme = useTheme();

  // State variables
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [editingAlert, setEditingAlert] = useState<RiskAlertCreate | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(true);
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [smsNotifications, setSmsNotifications] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Risk threshold types
  const thresholdTypes = [
    { value: AlertType.VAR, label: 'Value at Risk (VaR)' },
    { value: AlertType.VOLATILITY, label: 'Volatility' },
    { value: AlertType.DRAWDOWN, label: 'Maximum Drawdown' },
    { value: AlertType.RETURN, label: 'Return' },
    { value: AlertType.EXPOSURE, label: 'Sector Exposure' },
    { value: AlertType.CORRELATION, label: 'Correlation' },
    { value: AlertType.PRICE, label: 'Price' },
    { value: AlertType.VOLUME, label: 'Volume' }
  ];

  // Operators
  const operators = [
    { value: AlertOperator.GREATER_THAN, label: '>' },
    { value: AlertOperator.LESS_THAN, label: '<' },
    { value: AlertOperator.GREATER_THAN_OR_EQUAL, label: '>=' },
    { value: AlertOperator.LESS_THAN_OR_EQUAL, label: '<=' },
    { value: AlertOperator.EQUAL, label: '=' }
  ];

  // Notification methods
  const notificationMethods = [
    { value: NotificationMethod.EMAIL, label: 'Email' },
    { value: NotificationMethod.PUSH, label: 'Push Notification' },
    { value: NotificationMethod.SMS, label: 'SMS' },
    { value: NotificationMethod.ALL, label: 'All Methods' }
  ];

  // Severity levels
  const severityLevels = [
    { value: AlertSeverity.LOW, label: 'Low', color: theme.palette.info.main },
    { value: AlertSeverity.MEDIUM, label: 'Medium', color: theme.palette.warning.main },
    { value: AlertSeverity.HIGH, label: 'High', color: theme.palette.error.main },
    { value: AlertSeverity.CRITICAL, label: 'Critical', color: theme.palette.error.dark }
  ];

  // Fetch alerts on component mount
  useEffect(() => {
    fetchAlerts();
  }, [userId, portfolioId]);

  // Fetch alerts from API
  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let fetchedAlerts: RiskAlert[];
      
      if (portfolioId) {
        // Fetch alerts for specific portfolio
        fetchedAlerts = await riskAlertsService.getPortfolioAlerts(portfolioId);
      } else {
        // Fetch all user alerts
        fetchedAlerts = await riskAlertsService.getUserAlerts(userId);
      }
      
      setAlerts(fetchedAlerts);
      
      // Start alert evaluation if there are alerts
      if (fetchedAlerts.length > 0) {
        await riskAlertsService.startAlertEvaluation();
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setError('Failed to fetch alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new alert
  const addAlert = () => {
    const newAlert: RiskAlertCreate = {
      portfolio_id: portfolioId,
      type: AlertType.VAR,
      operator: AlertOperator.GREATER_THAN,
      value: 5,
      enabled: true,
      notification_method: NotificationMethod.EMAIL,
      severity: AlertSeverity.MEDIUM
    };
    
    setEditingAlert(newAlert);
    setIsEditing(true);
  };

  // Edit alert
  const editAlert = (alert: RiskAlert) => {
    const alertToEdit: RiskAlertCreate = {
      portfolio_id: alert.portfolio_id,
      type: alert.type,
      symbol: alert.symbol,
      operator: alert.operator,
      value: alert.value,
      enabled: alert.enabled,
      notification_method: alert.notification_method,
      severity: alert.severity
    };
    
    setEditingAlert(alertToEdit);
    setIsEditing(true);
  };

  // Delete alert
  const deleteAlert = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await riskAlertsService.deleteAlert(id);
      
      if (success) {
        setAlerts(alerts.filter(a => a.id !== id));
        setSuccess('Alert deleted successfully.');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to delete alert.');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      setError('Failed to delete alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save alert
  const saveAlert = async () => {
    if (!editingAlert) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const savedAlert = await riskAlertsService.createAlert(userId, editingAlert);
      
      setAlerts([...alerts, savedAlert]);
      setEditingAlert(null);
      setIsEditing(false);
      setSuccess('Alert created successfully.');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
      // Start alert evaluation if not already running
      await riskAlertsService.startAlertEvaluation();
    } catch (error) {
      console.error('Error saving alert:', error);
      setError('Failed to save alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingAlert(null);
    setIsEditing(false);
  };

  // Update alert field
  const updateAlertField = (field: keyof RiskAlertCreate, value: any) => {
    if (editingAlert) {
      setEditingAlert({
        ...editingAlert,
        [field]: value
      });
    }
  };

  // Toggle alert enabled state
  const toggleAlertEnabled = async (alert: RiskAlert) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedAlert = await riskAlertsService.updateAlert(alert.id, {
        enabled: !alert.enabled
      });
      
      setAlerts(alerts.map(a => a.id === alert.id ? updatedAlert : a));
    } catch (error) {
      console.error('Error toggling alert:', error);
      setError('Failed to update alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save configuration
  const saveConfiguration = () => {
    if (onSaveConfiguration) {
      onSaveConfiguration(alerts);
    }
    
    setSuccess('Configuration saved successfully.');
    
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  // Get severity color
  const getSeverityColor = (severity: AlertSeverity): string => {
    const severityItem = severityLevels.find(s => s.value === severity);
    return severityItem ? severityItem.color : theme.palette.grey[500];
  };

  // Get threshold description
  const getThresholdDescription = (alert: RiskAlert): string => {
    const typeLabel = thresholdTypes.find(t => t.value === alert.type)?.label || alert.type;
    const operatorLabel = operators.find(o => o.value === alert.operator)?.label || alert.operator;
    
    let description = `${typeLabel} ${operatorLabel} ${alert.value}%`;
    
    if (alert.symbol) {
      description = `${alert.symbol}: ${description}`;
    }
    
    return description;
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" align="center" gutterBottom>
        Risk Alert Configuration
      </Typography>

      <Grid container spacing={3}>
        {/* Success Message */}
        {success && (
          <Grid item xs={12}>
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Grid>
        )}

        {/* Error Message */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Global Alert Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Global Alert Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Enable Risk Alerts"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  {alertsEnabled ? (
                    <NotificationsActiveIcon color="primary" sx={{ mr: 1 }} />
                  ) : (
                    <NotificationsIcon color="disabled" sx={{ mr: 1 }} />
                  )}
                  <Typography>
                    Alert Status: {alertsEnabled ? 'Active' : 'Disabled'}
                  </Typography>
                  <IconButton 
                    color="primary" 
                    onClick={fetchAlerts} 
                    disabled={loading}
                    sx={{ ml: 2 }}
                  >
                    {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Notification Methods
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Email Notifications"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Push Notifications"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="SMS Notifications"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Risk Thresholds */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Risk Thresholds
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={addAlert}
                disabled={isEditing || loading}
              >
                Add Threshold
              </Button>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {!loading && alerts.length === 0 && !isEditing ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No risk thresholds configured. Click "Add Threshold" to create one.
              </Alert>
            ) : (
              <List>
                {alerts.map((alert) => (
                  <React.Fragment key={alert.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={alert.severity}
                              size="small"
                              sx={{
                                backgroundColor: getSeverityColor(alert.severity),
                                color: 'white',
                                mr: 1
                              }}
                            />
                            {getThresholdDescription(alert)}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="textSecondary">
                            Notification: {notificationMethods.find(m => m.value === alert.notification_method)?.label || alert.notification_method}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={alert.enabled}
                              onChange={() => toggleAlertEnabled(alert)}
                              color="primary"
                              size="small"
                              disabled={loading}
                            />
                          }
                          label=""
                        />
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => editAlert(alert)}
                          disabled={isEditing || loading}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteAlert(alert.id)}
                          disabled={isEditing || loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Threshold Editor */}
        {isEditing && editingAlert && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {editingAlert ? 'Add New Threshold' : 'Edit Threshold'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="threshold-type-label">Threshold Type</InputLabel>
                    <Select
                      labelId="threshold-type-label"
                      value={editingAlert.type}
                      onChange={(e) => updateAlertField('type', e.target.value)}
                      label="Threshold Type"
                    >
                      {thresholdTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {(editingAlert.type === AlertType.EXPOSURE || 
                  editingAlert.type === AlertType.RETURN ||
                  editingAlert.type === AlertType.PRICE ||
                  editingAlert.type === AlertType.VOLUME) && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="symbol-label">Symbol</InputLabel>
                      <Select
                        labelId="symbol-label"
                        value={editingAlert.symbol || ''}
                        onChange={(e) => updateAlertField('symbol', e.target.value)}
                        label="Symbol"
                      >
                        <MenuItem value="">Portfolio (All Symbols)</MenuItem>
                        {symbols.map((symbol) => (
                          <MenuItem key={symbol} value={symbol}>
                            {symbol}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12} md={editingAlert.type === AlertType.EXPOSURE || 
                                      editingAlert.type === AlertType.RETURN ||
                                      editingAlert.type === AlertType.PRICE ||
                                      editingAlert.type === AlertType.VOLUME ? 4 : 6}>
                  <FormControl fullWidth>
                    <InputLabel id="operator-label">Operator</InputLabel>
                    <Select
                      labelId="operator-label"
                      value={editingAlert.operator}
                      onChange={(e) => updateAlertField('operator', e.target.value)}
                      label="Operator"
                    >
                      {operators.map((op) => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={editingAlert.type === AlertType.EXPOSURE || 
                                      editingAlert.type === AlertType.RETURN ||
                                      editingAlert.type === AlertType.PRICE ||
                                      editingAlert.type === AlertType.VOLUME ? 4 : 6}>
                  <TextField
                    label="Value (%)"
                    type="number"
                    value={editingAlert.value}
                    onChange={(e) => updateAlertField('value', Number(e.target.value))}
                    inputProps={{ step: 0.1, min: 0 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="severity-label">Severity</InputLabel>
                    <Select
                      labelId="severity-label"
                      value={editingAlert.severity}
                      onChange={(e) => updateAlertField('severity', e.target.value)}
                      label="Severity"
                    >
                      {severityLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: level.color,
                                mr: 1
                              }}
                            />
                            {level.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="notification-method-label">Notification Method</InputLabel>
                    <Select
                      labelId="notification-method-label"
                      value={editingAlert.notification_method}
                      onChange={(e) => updateAlertField('notification_method', e.target.value)}
                      label="Notification Method"
                    >
                      {notificationMethods.map((method) => (
                        <MenuItem key={method.value} value={method.value}>
                          {method.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingAlert.enabled}
                        onChange={(e) => updateAlertField('enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Enabled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={cancelEditing}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                      onClick={saveAlert}
                      disabled={loading}
                    >
                      Save Threshold
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Save Configuration */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={saveConfiguration}
              disabled={isEditing || loading}
            >
              Save Configuration
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiskAlertConfiguration;