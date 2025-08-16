import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  PhoneAndroid as MobileIcon,
  AccessTime as TimeIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import aiNotificationService, { AINotificationPreference } from '../../services/aiNotificationService';

const NotificationPreferencesPanel: React.FC = () => {
  const [preferences, setPreferences] = useState<AINotificationPreference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPreference, setEditingPreference] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const prefs = await aiNotificationService.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      setError('Failed to load notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const updatedPreference = await aiNotificationService.updateNotificationPreference(id, { enabled });
      setPreferences(preferences.map(pref => 
        pref.id === id ? { ...pref, enabled: updatedPreference.enabled } : pref
      ));
      setSuccess('Preference updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating preference:', error);
      setError('Failed to update preference. Please try again.');
    }
  };

  const handleChangePriority = async (id: string, priority: 'low' | 'medium' | 'high' | 'urgent') => {
    try {
      const updatedPreference = await aiNotificationService.updateNotificationPreference(id, { priority });
      setPreferences(preferences.map(pref => 
        pref.id === id ? { ...pref, priority: updatedPreference.priority } : pref
      ));
      setSuccess('Priority updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating priority:', error);
      setError('Failed to update priority. Please try again.');
    }
  };

  const handleChangeFrequency = async (id: string, frequency: 'immediate' | 'hourly' | 'daily' | 'weekly') => {
    try {
      const updatedPreference = await aiNotificationService.updateNotificationPreference(id, { frequency });
      setPreferences(preferences.map(pref => 
        pref.id === id ? { ...pref, frequency: updatedPreference.frequency } : pref
      ));
      setSuccess('Frequency updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating frequency:', error);
      setError('Failed to update frequency. Please try again.');
    }
  };

  const handleToggleDeliveryChannel = async (id: string, channel: 'app' | 'email' | 'sms' | 'push') => {
    const preference = preferences.find(pref => pref.id === id);
    if (!preference) return;

    const updatedChannels = preference.deliveryChannels.includes(channel)
      ? preference.deliveryChannels.filter(c => c !== channel)
      : [...preference.deliveryChannels, channel];

    try {
      const updatedPreference = await aiNotificationService.updateNotificationPreference(id, { 
        deliveryChannels: updatedChannels 
      });
      setPreferences(preferences.map(pref => 
        pref.id === id ? { ...pref, deliveryChannels: updatedPreference.deliveryChannels } : pref
      ));
      setSuccess('Delivery channels updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating delivery channels:', error);
      setError('Failed to update delivery channels. Please try again.');
    }
  };

  const handleToggleQuietHours = async (id: string, enabled: boolean) => {
    const preference = preferences.find(pref => pref.id === id);
    if (!preference) return;

    const quietHours = preference.quietHours || {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    try {
      const updatedPreference = await aiNotificationService.updateNotificationPreference(id, { 
        quietHours: { ...quietHours, enabled } 
      });
      setPreferences(preferences.map(pref => 
        pref.id === id ? { ...pref, quietHours: updatedPreference.quietHours } : pref
      ));
      setSuccess('Quiet hours updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      setError('Failed to update quiet hours. Please try again.');
    }
  };

  const handleChangeQuietHoursTime = async (id: string, field: 'start' | 'end', time: string) => {
    const preference = preferences.find(pref => pref.id === id);
    if (!preference) return;

    const quietHours = preference.quietHours || {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    try {
      const updatedPreference = await aiNotificationService.updateNotificationPreference(id, { 
        quietHours: { ...quietHours, [field]: time } 
      });
      setPreferences(preferences.map(pref => 
        pref.id === id ? { ...pref, quietHours: updatedPreference.quietHours } : pref
      ));
      setSuccess('Quiet hours updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error updating quiet hours:', error);
      setError('Failed to update quiet hours. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      default:
        return 'success';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'immediate':
        return 'Immediate';
      case 'hourly':
        return 'Hourly Digest';
      case 'daily':
        return 'Daily Digest';
      case 'weekly':
        return 'Weekly Digest';
      default:
        return frequency;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'app':
        return <NotificationsIcon fontSize="small" />;
      case 'email':
        return <EmailIcon fontSize="small" />;
      case 'sms':
        return <SmsIcon fontSize="small" />;
      case 'push':
        return <MobileIcon fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Notification Preferences
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPreferences}
          disabled={loading}
        >
          Refresh
        </Button>
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : preferences.length === 0 ? (
        <Alert severity="info">
          No notification preferences found. Default settings will be used.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {preferences.map((preference) => (
            <Grid item xs={12} key={preference.id}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">
                        {preference.type}
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preference.enabled}
                            onChange={(e) => handleToggleEnabled(preference.id, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={preference.enabled ? "Enabled" : "Disabled"}
                      />
                    </Box>
                  }
                  subheader={
                    <Box display="flex" alignItems="center" mt={1}>
                      <Chip 
                        label={preference.priority} 
                        color={getPriorityColor(preference.priority) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={getFrequencyLabel(preference.frequency)} 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
                        <InputLabel>Priority</InputLabel>
                        <Select
                          value={preference.priority}
                          onChange={(e) => handleChangePriority(preference.id, e.target.value as any)}
                          label="Priority"
                          disabled={!preference.enabled}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                          <MenuItem value="urgent">Urgent</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth variant="outlined" size="small">
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={preference.frequency}
                          onChange={(e) => handleChangeFrequency(preference.id, e.target.value as any)}
                          label="Frequency"
                          disabled={!preference.enabled}
                        >
                          <MenuItem value="immediate">Immediate</MenuItem>
                          <MenuItem value="hourly">Hourly Digest</MenuItem>
                          <MenuItem value="daily">Daily Digest</MenuItem>
                          <MenuItem value="weekly">Weekly Digest</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Delivery Channels
                      </Typography>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preference.deliveryChannels.includes('app')}
                              onChange={() => handleToggleDeliveryChannel(preference.id, 'app')}
                              disabled={!preference.enabled}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              <NotificationsIcon fontSize="small" sx={{ mr: 0.5 }} />
                              App
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preference.deliveryChannels.includes('email')}
                              onChange={() => handleToggleDeliveryChannel(preference.id, 'email')}
                              disabled={!preference.enabled}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Email
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preference.deliveryChannels.includes('sms')}
                              onChange={() => handleToggleDeliveryChannel(preference.id, 'sms')}
                              disabled={!preference.enabled}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              <SmsIcon fontSize="small" sx={{ mr: 0.5 }} />
                              SMS
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preference.deliveryChannels.includes('push')}
                              onChange={() => handleToggleDeliveryChannel(preference.id, 'push')}
                              disabled={!preference.enabled}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center">
                              <MobileIcon fontSize="small" sx={{ mr: 0.5 }} />
                              Push
                            </Box>
                          }
                        />
                      </FormGroup>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2">
                          Quiet Hours
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preference.quietHours?.enabled || false}
                              onChange={(e) => handleToggleQuietHours(preference.id, e.target.checked)}
                              disabled={!preference.enabled}
                            />
                          }
                          label={preference.quietHours?.enabled ? "Enabled" : "Disabled"}
                        />
                      </Box>

                      {preference.quietHours?.enabled && (
                        <Box mt={2}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                  label="Start Time"
                                  value={new Date(`2022-01-01T${preference.quietHours.start}`)}
                                  onChange={(newValue) => {
                                    if (newValue) {
                                      const hours = newValue.getHours().toString().padStart(2, '0');
                                      const minutes = newValue.getMinutes().toString().padStart(2, '0');
                                      handleChangeQuietHoursTime(preference.id, 'start', `${hours}:${minutes}`);
                                    }
                                  }}
                                  disabled={!preference.enabled}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                              </LocalizationProvider>
                            </Grid>
                            <Grid item xs={6}>
                              <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <TimePicker
                                  label="End Time"
                                  value={new Date(`2022-01-01T${preference.quietHours.end}`)}
                                  onChange={(newValue) => {
                                    if (newValue) {
                                      const hours = newValue.getHours().toString().padStart(2, '0');
                                      const minutes = newValue.getMinutes().toString().padStart(2, '0');
                                      handleChangeQuietHoursTime(preference.id, 'end', `${hours}:${minutes}`);
                                    }
                                  }}
                                  disabled={!preference.enabled}
                                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                              </LocalizationProvider>
                            </Grid>
                          </Grid>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                            Timezone: {preference.quietHours.timezone}
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default NotificationPreferencesPanel;