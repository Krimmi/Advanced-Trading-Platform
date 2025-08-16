import React, { useState, useEffect } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  MarkEmailRead as MarkReadIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Insights as InsightsIcon,
  Article as ArticleIcon,
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import aiNotificationService, { AINotification } from '../../services/aiNotificationService';
import NotificationPreferencesPanel from './NotificationPreferencesPanel';
import SmartAlertConfigPanel from './SmartAlertConfigPanel';
import NotificationInsightsPanel from './NotificationInsightsPanel';

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
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `notification-tab-${index}`,
    'aria-controls': `notification-tabpanel-${index}`,
  };
}

const AINotificationsDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [notificationCounts, setNotificationCounts] = useState<Record<string, number>>({
    unread: 0,
    read: 0,
    archived: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<'unread' | 'read' | 'archived' | undefined>('unread');
  const [page, setPage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(20);

  useEffect(() => {
    loadNotifications();
    loadNotificationCounts();
  }, [currentStatus]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await aiNotificationService.getNotifications(
        currentStatus,
        limit,
        page * limit
      );
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCounts = async () => {
    try {
      const counts = await aiNotificationService.getNotificationCounts();
      setNotificationCounts(counts);
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStatusTabChange = (status?: 'unread' | 'read' | 'archived') => {
    setCurrentStatus(status);
    setPage(0);
    setSelectedNotifications(new Set());
  };

  const handleRefresh = () => {
    loadNotifications();
    loadNotificationCounts();
  };

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map(n => n.id)));
    }
  };

  const handleMarkAsRead = async () => {
    if (selectedNotifications.size === 0) return;

    setLoading(true);
    try {
      await aiNotificationService.batchUpdateNotificationStatus(
        Array.from(selectedNotifications),
        'read'
      );
      loadNotifications();
      loadNotificationCounts();
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError('Failed to update notification status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (selectedNotifications.size === 0) return;

    setLoading(true);
    try {
      await aiNotificationService.batchUpdateNotificationStatus(
        Array.from(selectedNotifications),
        'archived'
      );
      loadNotifications();
      loadNotificationCounts();
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Error archiving notifications:', error);
      setError('Failed to archive notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (selectedNotifications.size === 0) return;

    setLoading(true);
    try {
      await aiNotificationService.batchUpdateNotificationStatus(
        Array.from(selectedNotifications),
        'dismissed'
      );
      loadNotifications();
      loadNotificationCounts();
      setSelectedNotifications(new Set());
    } catch (error) {
      console.error('Error dismissing notifications:', error);
      setError('Failed to dismiss notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (notificationId: string, actionId: string) => {
    try {
      await aiNotificationService.executeNotificationAction(notificationId, actionId);
      // Refresh notifications after action execution
      loadNotifications();
    } catch (error) {
      console.error('Error executing notification action:', error);
      setError('Failed to execute action. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
      default:
        return theme.palette.success.main;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <NotificationsIcon />;
      case 'insight':
        return <InsightsIcon />;
      case 'news':
        return <ArticleIcon />;
      case 'earnings':
        return <MonetizationOnIcon />;
      case 'price':
        return <TrendingUpIcon />;
      case 'volume':
        return <BarChartIcon />;
      case 'pattern':
        return <TimelineIcon />;
      case 'custom':
      default:
        return <NotificationsIcon />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI-Powered Notifications
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Intelligent alerts and insights for your investments
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="notification tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <NotificationsIcon sx={{ mr: 1 }} />
                Notifications
                {notificationCounts.unread > 0 && (
                  <Badge 
                    badgeContent={notificationCounts.unread} 
                    color="error" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
            {...a11yProps(0)} 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <SettingsIcon sx={{ mr: 1 }} />
                Preferences
              </Box>
            }
            {...a11yProps(1)} 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <AddIcon sx={{ mr: 1 }} />
                Smart Alerts
              </Box>
            }
            {...a11yProps(2)} 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                <InsightsIcon sx={{ mr: 1 }} />
                Insights
              </Box>
            }
            {...a11yProps(3)} 
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Tabs 
              value={currentStatus === 'unread' ? 0 : currentStatus === 'read' ? 1 : currentStatus === 'archived' ? 2 : 0}
              onChange={(e, value) => {
                const statusMap = [undefined, 'unread', 'read', 'archived'];
                handleStatusTabChange(statusMap[value] as any);
              }}
            >
              <Tab 
                label={`Unread (${notificationCounts.unread})`} 
                onClick={() => handleStatusTabChange('unread')}
              />
              <Tab 
                label={`Read (${notificationCounts.read})`} 
                onClick={() => handleStatusTabChange('read')}
              />
              <Tab 
                label={`Archived (${notificationCounts.archived})`} 
                onClick={() => handleStatusTabChange('archived')}
              />
            </Tabs>

            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Box>

        {selectedNotifications.size > 0 && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">
                {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
              </Typography>
              <Box>
                <Tooltip title="Mark as read">
                  <IconButton onClick={handleMarkAsRead} disabled={currentStatus === 'read'}>
                    <MarkReadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Archive">
                  <IconButton onClick={handleArchive} disabled={currentStatus === 'archived'}>
                    <ArchiveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Dismiss">
                  <IconButton onClick={handleDismiss} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Alert severity="info">
            No {currentStatus} notifications found.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {notifications.map((notification) => (
              <Grid item xs={12} key={notification.id}>
                <Card 
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                    bgcolor: notification.status === 'unread' ? 'action.hover' : 'background.paper',
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={8}>
                        <Box display="flex" alignItems="center">
                          <Checkbox
                            checked={selectedNotifications.has(notification.id)}
                            onChange={() => handleSelectNotification(notification.id)}
                          />
                          <Box>
                            <Typography variant="h6" component="div">
                              {notification.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box display="flex" justifyContent="flex-end" alignItems="center">
                          <Box mr={2}>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {formatDate(notification.createdAt)}
                            </Typography>
                            {notification.relatedSymbols && notification.relatedSymbols.length > 0 && (
                              <Box display="flex" gap={0.5} mt={0.5}>
                                {notification.relatedSymbols.map((symbol) => (
                                  <Chip key={symbol} label={symbol} size="small" />
                                ))}
                              </Box>
                            )}
                          </Box>
                          <Tooltip title={notification.type}>
                            <Avatar sx={{ bgcolor: getPriorityColor(notification.priority) }}>
                              {getTypeIcon(notification.type)}
                            </Avatar>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>

                    {notification.actions && notification.actions.length > 0 && (
                      <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                        {notification.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="small"
                            variant={action.type === 'primary' ? 'contained' : 'outlined'}
                            onClick={() => handleExecuteAction(notification.id, action.id)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
          <Button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Typography variant="body2">
            Page {page + 1}
          </Typography>
          <Button
            disabled={notifications.length < limit}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <NotificationPreferencesPanel />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <SmartAlertConfigPanel />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <NotificationInsightsPanel />
      </TabPanel>
    </Container>
  );
};

export default AINotificationsDashboard;