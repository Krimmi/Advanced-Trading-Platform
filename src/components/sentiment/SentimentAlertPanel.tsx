import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Slider,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SentimentAnalyticsService from '../../services/sentimentAnalyticsService';

interface SentimentAlertPanelProps {
  ticker: string;
}

const SentimentAlertPanel: React.FC<SentimentAlertPanelProps> = ({ ticker }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [deleteAlertId, setDeleteAlertId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // New alert form state
  const [newAlert, setNewAlert] = useState({
    ticker: ticker,
    source: 'all',
    triggerType: 'threshold',
    triggerValue: 0.5,
    triggerCondition: 'above',
    severity: 'medium',
    message: `Alert when sentiment for ${ticker} is above threshold`
  });
  
  const sentimentService = new SentimentAnalyticsService();
  
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await sentimentService.getSentimentAlerts();
        // Filter alerts for the current ticker
        const tickerAlerts = data.filter(alert => alert.ticker === ticker);
        setAlerts(tickerAlerts);
      } catch (err) {
        console.error('Error fetching sentiment alerts:', err);
        setError('Failed to load sentiment alerts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlerts();
  }, [ticker]);
  
  const handleCreateAlert = async () => {
    try {
      const createdAlert = await sentimentService.createSentimentAlert(newAlert);
      setAlerts([...alerts, createdAlert]);
      setSnackbar({
        open: true,
        message: 'Alert created successfully',
        severity: 'success'
      });
      resetNewAlert();
    } catch (err) {
      console.error('Error creating alert:', err);
      setSnackbar({
        open: true,
        message: 'Failed to create alert',
        severity: 'error'
      });
    }
  };
  
  const handleDeleteAlert = async () => {
    if (!deleteAlertId) return;
    
    try {
      await sentimentService.deleteSentimentAlert(deleteAlertId);
      setAlerts(alerts.filter(alert => alert.id !== deleteAlertId));
      setSnackbar({
        open: true,
        message: 'Alert deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error deleting alert:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete alert',
        severity: 'error'
      });
    } finally {
      setDeleteAlertId(null);
      setOpenDialog(false);
    }
  };
  
  const confirmDeleteAlert = (alertId: string) => {
    setDeleteAlertId(alertId);
    setOpenDialog(true);
  };
  
  const resetNewAlert = () => {
    setNewAlert({
      ticker: ticker,
      source: 'all',
      triggerType: 'threshold',
      triggerValue: 0.5,
      triggerCondition: 'above',
      severity: 'medium',
      message: `Alert when sentiment for ${ticker} is above threshold`
    });
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewAlert({ ...newAlert, [name]: value });
  };
  
  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    
    // Update message based on selections
    let updatedMessage = `Alert when sentiment for ${ticker}`;
    
    const updatedAlert = { ...newAlert, [name]: value };
    
    if (name === 'source' && value !== 'all') {
      updatedMessage += ` from ${value}`;
    }
    
    if (name === 'triggerType' || name === 'triggerCondition' || updatedAlert.triggerType === 'threshold') {
      if (updatedAlert.triggerType === 'threshold') {
        updatedMessage += ` is ${updatedAlert.triggerCondition} ${updatedAlert.triggerValue}`;
      } else if (updatedAlert.triggerType === 'change') {
        updatedMessage += ` ${updatedAlert.triggerCondition}s by ${updatedAlert.triggerValue}`;
      } else if (updatedAlert.triggerType === 'anomaly') {
        updatedMessage += ` shows anomalous behavior`;
      }
    }
    
    updatedAlert.message = updatedMessage;
    setNewAlert(updatedAlert);
  };
  
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    
    // Update message based on new value
    let updatedMessage = `Alert when sentiment for ${ticker}`;
    
    if (newAlert.source !== 'all') {
      updatedMessage += ` from ${newAlert.source}`;
    }
    
    if (newAlert.triggerType === 'threshold') {
      updatedMessage += ` is ${newAlert.triggerCondition} ${value}`;
    } else if (newAlert.triggerType === 'change') {
      updatedMessage += ` ${newAlert.triggerCondition}s by ${value}`;
    } else if (newAlert.triggerType === 'anomaly') {
      updatedMessage += ` shows anomalous behavior`;
    }
    
    setNewAlert({ ...newAlert, triggerValue: value, message: updatedMessage });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  const getSourceName = (source: string) => {
    switch (source) {
      case 'news':
        return 'News';
      case 'social_media':
        return 'Social Media';
      case 'earnings_call':
        return 'Earnings Calls';
      case 'sec_filing':
        return 'SEC Filings';
      case 'all':
      default:
        return 'All Sources';
    }
  };
  
  const getTriggerTypeLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'threshold':
        return 'Threshold';
      case 'change':
        return 'Change';
      case 'anomaly':
        return 'Anomaly';
      default:
        return triggerType;
    }
  };
  
  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'above':
        return 'Above';
      case 'below':
        return 'Below';
      case 'increase':
        return 'Increases';
      case 'decrease':
        return 'Decreases';
      default:
        return condition;
    }
  };
  
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Paper>
    );
  }
  
  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Sentiment Alerts
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Sentiment Alerts for {ticker}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Create New Alert */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Create New Alert
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="source-label">Sentiment Source</InputLabel>
                    <Select
                      labelId="source-label"
                      id="source"
                      name="source"
                      value={newAlert.source}
                      label="Sentiment Source"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="all">All Sources</MenuItem>
                      <MenuItem value="news">News</MenuItem>
                      <MenuItem value="social_media">Social Media</MenuItem>
                      <MenuItem value="earnings_call">Earnings Calls</MenuItem>
                      <MenuItem value="sec_filing">SEC Filings</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="trigger-type-label">Trigger Type</InputLabel>
                    <Select
                      labelId="trigger-type-label"
                      id="triggerType"
                      name="triggerType"
                      value={newAlert.triggerType}
                      label="Trigger Type"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="threshold">Threshold</MenuItem>
                      <MenuItem value="change">Change</MenuItem>
                      <MenuItem value="anomaly">Anomaly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {newAlert.triggerType !== 'anomaly' && (
                  <>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="trigger-condition-label">Condition</InputLabel>
                        <Select
                          labelId="trigger-condition-label"
                          id="triggerCondition"
                          name="triggerCondition"
                          value={newAlert.triggerCondition}
                          label="Condition"
                          onChange={handleSelectChange}
                        >
                          {newAlert.triggerType === 'threshold' ? (
                            <>
                              <MenuItem value="above">Above</MenuItem>
                              <MenuItem value="below">Below</MenuItem>
                            </>
                          ) : (
                            <>
                              <MenuItem value="increase">Increases</MenuItem>
                              <MenuItem value="decrease">Decreases</MenuItem>
                            </>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography id="trigger-value-slider" gutterBottom>
                        {newAlert.triggerType === 'threshold' ? 'Sentiment Threshold' : 'Change Amount'}
                      </Typography>
                      <Slider
                        aria-labelledby="trigger-value-slider"
                        value={newAlert.triggerValue}
                        onChange={handleSliderChange}
                        step={0.05}
                        marks={[
                          { value: -1, label: '-1' },
                          { value: -0.5, label: '-0.5' },
                          { value: 0, label: '0' },
                          { value: 0.5, label: '0.5' },
                          { value: 1, label: '1' }
                        ]}
                        min={-1}
                        max={1}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="severity-label">Alert Severity</InputLabel>
                    <Select
                      labelId="severity-label"
                      id="severity"
                      name="severity"
                      value={newAlert.severity}
                      label="Alert Severity"
                      onChange={handleSelectChange}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="message"
                    name="message"
                    label="Alert Message"
                    value={newAlert.message}
                    onChange={handleInputChange}
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleCreateAlert}
                    fullWidth
                  >
                    Create Alert
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Existing Alerts */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Active Alerts
              </Typography>
              
              {alerts.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Typography variant="body2" color="text.secondary">
                    No alerts configured for {ticker}
                  </Typography>
                </Box>
              ) : (
                <List>
                  {alerts.map((alert, index) => (
                    <React.Fragment key={alert.id}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {alert.triggered ? 
                                <NotificationsActiveIcon sx={{ mr: 1, color: getSeverityColor(alert.severity) }} /> : 
                                <NotificationsIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                              }
                              <Typography variant="subtitle2">
                                {getSourceName(alert.source)} - {getTriggerTypeLabel(alert.triggerType)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary">
                                {alert.message}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Chip 
                                  label={alert.severity} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: `${getSeverityColor(alert.severity)}20`,
                                    color: getSeverityColor(alert.severity),
                                    textTransform: 'capitalize',
                                    mr: 1
                                  }}
                                />
                                {alert.triggerType !== 'anomaly' && (
                                  <Chip 
                                    label={`${getConditionLabel(alert.triggerCondition)} ${alert.triggerValue}`} 
                                    size="small"
                                    sx={{ mr: 1 }}
                                  />
                                )}
                                {alert.triggered && (
                                  <Chip 
                                    label={`Triggered: ${new Date(alert.triggeredAt).toLocaleString()}`} 
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" aria-label="delete" onClick={() => confirmDeleteAlert(alert.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Alert Information */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                About Sentiment Alerts
              </Typography>
              <Typography variant="body2">
                Sentiment alerts notify you when sentiment data meets specific conditions you define. 
                You can create alerts based on absolute sentiment thresholds, significant changes in sentiment, 
                or anomalous sentiment patterns.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Threshold Alerts
                    </Typography>
                    <Typography variant="body2">
                      Trigger when sentiment crosses above or below a specific value. 
                      Useful for monitoring when sentiment becomes particularly positive or negative.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Change Alerts
                    </Typography>
                    <Typography variant="body2">
                      Trigger when sentiment increases or decreases by a specified amount. 
                      Useful for detecting rapid shifts in market perception.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" gutterBottom>
                      Anomaly Alerts
                    </Typography>
                    <Typography variant="body2">
                      Trigger when sentiment shows unusual patterns compared to historical data. 
                      Useful for detecting unexpected changes that may indicate important events.
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Delete Alert</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this alert? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteAlert} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default SentimentAlertPanel;