import React, { useState, useEffect } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as AlertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
  BarChart as BarChartIcon,
  Article as NewsIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { alertsService } from '../../services';
import { Notification } from '../../services/alertsService';

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
      id={`notifications-tabpanel-${index}`}
      aria-labelledby={`notifications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `notifications-tab-${index}`,
    'aria-controls': `notifications-tabpanel-${index}`,
  };
}

const AlertsNotificationCenter: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await alertsService.getNotifications(50, 0);
      setNotifications(response.notifications);
      setUnreadCount(response.notifications.filter(notification => !notification.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notificationId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotificationId(null);
  };

  const handleMarkAsRead = async () => {
    if (selectedNotificationId) {
      try {
        await alertsService.markNotificationAsRead(selectedNotificationId);
        setNotifications(
          notifications.map(notification =>
            notification.id === selectedNotificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    handleMenuClose();
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertsService.markAllNotificationsAsRead();
      setNotifications(
        notifications.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async () => {
    if (selectedNotificationId) {
      try {
        await alertsService.deleteNotification(selectedNotificationId);
        setNotifications(
          notifications.filter(notification => notification.id !== selectedNotificationId)
        );
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
    handleMenuClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert':
        return <MoneyIcon />;
      case 'technical_alert':
        return <ChartIcon />;
      case 'volume_alert':
        return <BarChartIcon />;
      case 'news_alert':
        return <NewsIcon />;
      case 'price_up':
        return <TrendingUpIcon color="success" />;
      case 'price_down':
        return <TrendingDownIcon color="error" />;
      default:
        return <AlertIcon />;
    }
  };

  const getFilteredNotifications = () => {
    switch (tabValue) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(notification => !notification.read);
      case 2: // Price
        return notifications.filter(notification => 
          notification.type === 'price_alert' || 
          notification.type === 'price_up' || 
          notification.type === 'price_down'
        );
      case 3: // Technical
        return notifications.filter(notification => notification.type === 'technical_alert');
      default:
        return notifications;
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }}>
              <NotificationsIcon />
            </Badge>
            <Typography variant="h6">Notifications</Typography>
          </Box>
        }
        action={
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchNotifications}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="notification tabs">
          <Tab label="All" {...a11yProps(0)} />
          <Tab 
            label={
              <Box display="flex" alignItems="center">
                Unread
                {unreadCount > 0 && (
                  <Chip 
                    label={unreadCount} 
                    color="error" 
                    size="small" 
                    sx={{ ml: 1, height: 20, minWidth: 20 }} 
                  />
                )}
              </Box>
            } 
            {...a11yProps(1)} 
          />
          <Tab label="Price" {...a11yProps(2)} />
          <Tab label="Technical" {...a11yProps(3)} />
        </Tabs>
      </Box>
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box display="flex" justifyContent="flex-end" p={1}>
              <Button size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                Mark all as read
              </Button>
            </Box>
            <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
              {getFilteredNotifications().length === 0 ? (
                <Box p={3} textAlign="center">
                  <Typography variant="body2" color="textSecondary">
                    No notifications found
                  </Typography>
                </Box>
              ) : (
                getFilteredNotifications().map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={(e) => handleMenuOpen(e, notification.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                      sx={{
                        bgcolor: notification.read ? 'inherit' : alpha(theme.palette.primary.light, 0.1),
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: notification.read ? 'grey.400' : 'primary.main' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            color="textPrimary"
                            sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="textPrimary"
                            >
                              {notification.message}
                            </Typography>
                            <Typography
                              component="div"
                              variant="caption"
                              color="textSecondary"
                              sx={{ mt: 0.5 }}
                            >
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </>
        )}
      </CardContent>

      {/* Notification Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkAsRead}>
          <CheckIcon fontSize="small" sx={{ mr: 1 }} /> Mark as read
        </MenuItem>
        <MenuItem onClick={handleDeleteNotification}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

// Helper function to get alpha color
function alpha(color: string, value: number): string {
  return color + Math.round(value * 255).toString(16).padStart(2, '0');
}

export default AlertsNotificationCenter;