import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Divider,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  ShowChart as ShowChartIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';

// Redux
import { RootState } from '../../store';
import { setTheme } from '../../store/slices/uiSlice';
import { 
  fetchUserProfile, 
  updateUserProfile, 
  fetchUserPreferences, 
  updateUserPreferences,
  updateTheme,
  updateNotificationSettings,
  updateChartPreferences,
  changePassword,
  resetSettingsState
} from '../../store/slices/settingsSlice';

// Types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
};

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification preferences state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newsAlerts, setNewsAlerts] = useState(true);
  const [earningsAlerts, setEarningsAlerts] = useState(true);
  
  // Appearance preferences state
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  
  // Chart preferences state
  const [defaultTimeframe, setDefaultTimeframe] = useState('1d');
  const [defaultIndicators, setDefaultIndicators] = useState<string[]>(['sma_20', 'sma_50', 'volume']);
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme: currentTheme } = useSelector((state: RootState) => state.ui);
  const { 
    userProfile, 
    userPreferences, 
    loading, 
    error 
  } = useSelector((state: RootState) => state.settings);
  
  // Effects
  useEffect(() => {
    // Load user profile and preferences
    dispatch(fetchUserProfile() as any);
    dispatch(fetchUserPreferences() as any);
    
    // Reset success message when component unmounts
    return () => {
      dispatch(resetSettingsState());
    };
  }, [dispatch]);
  
  useEffect(() => {
    // Set local state from Redux state
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
    }
    
    // Set theme mode from Redux state
    setThemeMode(currentTheme);
  }, [user, currentTheme]);
  
  useEffect(() => {
    // Set notification preferences from Redux state
    if (userPreferences) {
      setEmailAlerts(userPreferences.notification_settings.email_alerts);
      setPriceAlerts(userPreferences.notification_settings.price_alerts);
      setNewsAlerts(userPreferences.notification_settings.news_alerts);
      setEarningsAlerts(userPreferences.notification_settings.earnings_alerts);
      
      // Set chart preferences from Redux state
      setDefaultTimeframe(userPreferences.chart_preferences.default_timeframe);
      setDefaultIndicators(userPreferences.chart_preferences.default_indicators);
      
      // Set theme from Redux state
      setThemeMode(userPreferences.theme);
    }
  }, [userPreferences]);
  
  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    dispatch(updateUserProfile({
      first_name: firstName,
      last_name: lastName,
      email: email,
    }) as any).then(() => {
      setSuccess('Profile updated successfully');
    });
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      return;
    }
    
    dispatch(changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    }) as any).then(() => {
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    });
  };
  
  const handleNotificationPreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    dispatch(updateNotificationSettings({
      email_alerts: emailAlerts,
      price_alerts: priceAlerts,
      news_alerts: newsAlerts,
      earnings_alerts: earningsAlerts,
    }) as any).then(() => {
      setSuccess('Notification preferences updated successfully');
    });
  };
  
  const handleAppearancePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    dispatch(updateTheme(themeMode) as any);
    dispatch(setTheme(themeMode));
    setSuccess('Appearance preferences updated successfully');
  };
  
  const handleChartPreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    dispatch(updateChartPreferences({
      default_timeframe: defaultTimeframe,
      default_indicators: defaultIndicators,
    }) as any).then(() => {
      setSuccess('Chart preferences updated successfully');
    });
  };
  
  return (
    <Box>
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account settings and preferences"
        icon={<SettingsIcon />}
      />
      
      <Paper sx={{ mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} label="Profile" {...a11yProps(0)} />
            <Tab icon={<SecurityIcon />} label="Security" {...a11yProps(1)} />
            <Tab icon={<NotificationsIcon />} label="Notifications" {...a11yProps(2)} />
            <Tab icon={<PaletteIcon />} label="Appearance" {...a11yProps(3)} />
            <Tab icon={<ShowChartIcon />} label="Chart Preferences" {...a11yProps(4)} />
          </Tabs>
        </Box>
        
        {/* Profile Settings */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Profile Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleProfileSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
                <Box position="relative">
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      fontSize: 40,
                      bgcolor: theme.palette.primary.main,
                    }}
                  >
                    {firstName ? firstName[0] : 'U'}
                  </Avatar>
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <input hidden accept="image/*" type="file" />
                    <PhotoCameraIcon />
                  </IconButton>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
        
        {/* Security Settings */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Typography variant="subtitle1" gutterBottom>
            Change Password
          </Typography>
          
          <form onSubmit={handlePasswordSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Current Password"
                  fullWidth
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="New Password"
                  fullWidth
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  helperText="Password must be at least 8 characters long"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirm New Password"
                  fullWidth
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  error={newPassword !== confirmPassword && confirmPassword !== ''}
                  helperText={
                    newPassword !== confirmPassword && confirmPassword !== ''
                      ? 'Passwords do not match'
                      : ''
                  }
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
        
        {/* Notification Settings */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleNotificationPreferencesSubmit}>
            <Typography variant="subtitle1" gutterBottom>
              Email Notifications
            </Typography>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                }
                label="Receive email alerts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={priceAlerts}
                    onChange={(e) => setPriceAlerts(e.target.checked)}
                  />
                }
                label="Price alerts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={newsAlerts}
                    onChange={(e) => setNewsAlerts(e.target.checked)}
                  />
                }
                label="News alerts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={earningsAlerts}
                    onChange={(e) => setEarningsAlerts(e.target.checked)}
                  />
                }
                label="Earnings alerts"
              />
            </FormGroup>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={loading}
              >
                Save Preferences
              </Button>
            </Box>
          </form>
        </TabPanel>
        
        {/* Appearance Settings */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Appearance Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleAppearancePreferencesSubmit}>
            <Typography variant="subtitle1" gutterBottom>
              Theme
            </Typography>
            
            <FormControl component="fieldset">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={themeMode === 'dark'}
                      onChange={(e) => setThemeMode(e.target.checked ? 'dark' : 'light')}
                    />
                  }
                  label="Dark Mode"
                />
              </FormGroup>
            </FormControl>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={loading}
              >
                Save Preferences
              </Button>
            </Box>
          </form>
        </TabPanel>
        
        {/* Chart Preferences */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Chart Preferences
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleChartPreferencesSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="default-timeframe-label">Default Timeframe</InputLabel>
                  <Select
                    labelId="default-timeframe-label"
                    value={defaultTimeframe}
                    label="Default Timeframe"
                    onChange={(e) => setDefaultTimeframe(e.target.value)}
                  >
                    <MenuItem value="1d">1 Day</MenuItem>
                    <MenuItem value="5d">5 Days</MenuItem>
                    <MenuItem value="1m">1 Month</MenuItem>
                    <MenuItem value="3m">3 Months</MenuItem>
                    <MenuItem value="6m">6 Months</MenuItem>
                    <MenuItem value="1y">1 Year</MenuItem>
                    <MenuItem value="5y">5 Years</MenuItem>
                    <MenuItem value="max">Max</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Default Indicators
                </Typography>
                
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('sma_20')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'sma_20']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'sma_20'));
                          }
                        }}
                      />
                    }
                    label="SMA 20"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('sma_50')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'sma_50']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'sma_50'));
                          }
                        }}
                      />
                    }
                    label="SMA 50"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('sma_200')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'sma_200']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'sma_200'));
                          }
                        }}
                      />
                    }
                    label="SMA 200"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('ema_20')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'ema_20']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'ema_20'));
                          }
                        }}
                      />
                    }
                    label="EMA 20"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('volume')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'volume']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'volume'));
                          }
                        }}
                      />
                    }
                    label="Volume"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('rsi')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'rsi']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'rsi'));
                          }
                        }}
                      />
                    }
                    label="RSI"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={defaultIndicators.includes('macd')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDefaultIndicators([...defaultIndicators, 'macd']);
                          } else {
                            setDefaultIndicators(defaultIndicators.filter(i => i !== 'macd'));
                          }
                        }}
                      />
                    }
                    label="MACD"
                  />
                </FormGroup>
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={loading}
                >
                  Save Preferences
                </Button>
              </Grid>
            </Grid>
          </form>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default SettingsPage;