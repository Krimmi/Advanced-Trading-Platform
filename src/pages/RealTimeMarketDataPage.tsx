import React, { useState } from 'react';
import { Container, Grid, Paper, Typography, Box, Tabs, Tab, Button, Drawer, IconButton, Divider, TextField, Autocomplete, FormControlLabel, Switch, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RealTimeMarketDataPanel from '../components/RealTimeMarketDataPanel';
import { NotificationService, Notification, NotificationCategory, NotificationPriority } from '../services/notifications/NotificationService';
import { MarketDataType } from '../services/websocket/MarketDataWebSocketService';
import { AnalyticsType } from '../services/analytics/RealTimeAnalyticsService';

// Styled components
const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const NotificationItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));

const NotificationTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
}));

const NotificationTime = styled(Typography)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
}));

const NotificationChip = styled(Chip)<{ category: NotificationCategory }>(({ theme, category }) => {
  let color;
  switch (category) {
    case NotificationCategory.PRICE_ALERT:
      color = theme.palette.primary.main;
      break;
    case NotificationCategory.VOLUME_ALERT:
      color = theme.palette.secondary.main;
      break;
    case NotificationCategory.TECHNICAL_INDICATOR:
      color = theme.palette.info.main;
      break;
    case NotificationCategory.RISK_ALERT:
      color = theme.palette.error.main;
      break;
    case NotificationCategory.ANALYTICS_INSIGHT:
      color = theme.palette.success.main;
      break;
    default:
      color = theme.palette.grey[500];
  }
  
  return {
    backgroundColor: `${color}20`,
    color: color,
    marginRight: theme.spacing(1),
  };
});

const DrawerContent = styled(Box)(({ theme }) => ({
  width: 350,
  padding: theme.spacing(3),
}));

const SettingsSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

// Interface for page props
interface RealTimeMarketDataPageProps {
  defaultSymbols?: string[];
}

/**
 * RealTimeMarketDataPage displays real-time market data and analytics
 */
const RealTimeMarketDataPage: React.FC<RealTimeMarketDataPageProps> = ({
  defaultSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA']
}) => {
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [symbols, setSymbols] = useState<string[]>(defaultSymbols);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);
  const [symbolInput, setSymbolInput] = useState<string>('');
  const [availableSymbols] = useState<string[]>([
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX', 'NVDA', 'PYPL', 'INTC',
    'AMD', 'CSCO', 'CMCSA', 'PEP', 'ADBE', 'AVGO', 'TXN', 'COST', 'TMUS', 'QCOM',
    'CHTR', 'SBUX', 'MDLZ', 'INTU', 'ISRG', 'VRTX', 'REGN', 'ILMN', 'ATVI', 'CSX'
  ]);
  
  // Fetch notifications
  React.useEffect(() => {
    const notificationService = NotificationService.getInstance();
    
    const fetchNotifications = async () => {
      await notificationService.initialize();
      const fetchedNotifications = notificationService.getNotifications(20);
      setNotifications(fetchedNotifications);
    };
    
    fetchNotifications();
    
    // Set up notification listener
    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20));
    };
    
    notificationService.on('notification', handleNewNotification);
    
    return () => {
      notificationService.removeAllListeners('notification');
    };
  }, []);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle notification drawer open
  const handleNotificationsOpen = () => {
    setNotificationsOpen(true);
    
    // Mark all as read
    const notificationService = NotificationService.getInstance();
    notificationService.markAllAsRead();
    
    // Update local state
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };
  
  // Handle notification drawer close
  const handleNotificationsClose = () => {
    setNotificationsOpen(false);
  };
  
  // Handle settings drawer open
  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };
  
  // Handle settings drawer close
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };
  
  // Handle adding a symbol
  const handleAddSymbol = () => {
    if (symbolInput && !symbols.includes(symbolInput)) {
      setSymbols([...symbols, symbolInput]);
      setSymbolInput('');
    }
  };
  
  // Handle removing a symbol
  const handleRemoveSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };
  
  // Handle analytics toggle
  const handleAnalyticsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowAnalytics(event.target.checked);
  };
  
  // Format notification time
  const formatNotificationTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };
  
  // Get category label
  const getCategoryLabel = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.PRICE_ALERT:
        return 'Price Alert';
      case NotificationCategory.VOLUME_ALERT:
        return 'Volume Alert';
      case NotificationCategory.TECHNICAL_INDICATOR:
        return 'Technical';
      case NotificationCategory.NEWS:
        return 'News';
      case NotificationCategory.EARNINGS:
        return 'Earnings';
      case NotificationCategory.MARKET_STATUS:
        return 'Market Status';
      case NotificationCategory.SYSTEM:
        return 'System';
      case NotificationCategory.TRADE_EXECUTION:
        return 'Trade';
      case NotificationCategory.RISK_ALERT:
        return 'Risk Alert';
      case NotificationCategory.ANALYTICS_INSIGHT:
        return 'Analytics';
      default:
        return 'Other';
    }
  };
  
  return (
    <PageContainer maxWidth="xl">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <SectionTitle variant="h4">Real-Time Market Data</SectionTitle>
            <Box>
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={handleNotificationsOpen}
                sx={{ mr: 1 }}
              >
                Notifications
              </Button>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={handleSettingsOpen}
              >
                Settings
              </Button>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Paper>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Market Data" />
              <Tab label="Analytics" />
              <Tab label="Alerts" />
            </Tabs>
            
            <TabPanel hidden={activeTab !== 0}>
              <RealTimeMarketDataPanel
                symbols={symbols}
                showAnalytics={showAnalytics}
                onNotificationClick={handleNotificationsOpen}
                onSettingsClick={handleSettingsOpen}
              />
            </TabPanel>
            
            <TabPanel hidden={activeTab !== 1}>
              <Typography variant="h6" gutterBottom>Market Analytics</Typography>
              <Typography>
                Advanced analytics features will be displayed here, including technical indicators,
                correlation analysis, and predictive models.
              </Typography>
            </TabPanel>
            
            <TabPanel hidden={activeTab !== 2}>
              <Typography variant="h6" gutterBottom>Alert Configuration</Typography>
              <Typography>
                Configure price alerts, volume thresholds, and technical indicator notifications.
                Set up custom alert rules and notification preferences.
              </Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Notifications Drawer */}
      <Drawer
        anchor="right"
        open={notificationsOpen}
        onClose={handleNotificationsClose}
      >
        <DrawerContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Notifications</Typography>
            <IconButton onClick={handleNotificationsClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          {notifications.length === 0 ? (
            <Typography color="textSecondary" align="center" sx={{ mt: 4 }}>
              No notifications yet
            </Typography>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} elevation={1}>
                <NotificationTitle variant="subtitle1">
                  {notification.title}
                </NotificationTitle>
                <Box mb={1}>
                  <NotificationChip
                    label={getCategoryLabel(notification.category)}
                    size="small"
                    category={notification.category}
                  />
                  {notification.priority === NotificationPriority.HIGH && (
                    <Chip
                      label="High Priority"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body2">{notification.message}</Typography>
                <NotificationTime variant="caption" color="textSecondary">
                  {formatNotificationTime(notification.timestamp)}
                </NotificationTime>
              </NotificationItem>
            ))
          )}
        </DrawerContent>
      </Drawer>
      
      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={handleSettingsClose}
      >
        <DrawerContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Settings</Typography>
            <IconButton onClick={handleSettingsClose}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <SettingsSection>
            <Typography variant="subtitle1" gutterBottom>Symbols</Typography>
            <Box mb={2}>
              <Grid container spacing={1}>
                {symbols.map((symbol) => (
                  <Grid item key={symbol}>
                    <Chip
                      label={symbol}
                      onDelete={() => handleRemoveSymbol(symbol)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box display="flex" alignItems="center">
              <Autocomplete
                freeSolo
                options={availableSymbols.filter(s => !symbols.includes(s))}
                value={symbolInput}
                onChange={(event, newValue) => {
                  setSymbolInput(newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  setSymbolInput(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Symbol"
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddSymbol}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
          </SettingsSection>
          
          <SettingsSection>
            <Typography variant="subtitle1" gutterBottom>Display Options</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showAnalytics}
                  onChange={handleAnalyticsToggle}
                  color="primary"
                />
              }
              label="Show Analytics"
            />
          </SettingsSection>
          
          <SettingsSection>
            <Typography variant="subtitle1" gutterBottom>Data Providers</Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Configure which data providers to use for different data types.
            </Typography>
            
            <Box mb={1}>
              <Typography variant="body2">Quote Data: <strong>Alpaca</strong></Typography>
            </Box>
            <Box mb={1}>
              <Typography variant="body2">Trade Data: <strong>Alpaca</strong></Typography>
            </Box>
            <Box mb={1}>
              <Typography variant="body2">Bar Data: <strong>Polygon</strong></Typography>
            </Box>
            <Box mb={1}>
              <Typography variant="body2">News Data: <strong>Finnhub</strong></Typography>
            </Box>
          </SettingsSection>
          
          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSettingsClose}
            >
              Apply Settings
            </Button>
          </Box>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
};

export default RealTimeMarketDataPage;