/**
 * Widget Management Panel
 * 
 * This component allows users to manage their installed widgets,
 * including viewing, updating, and removing widgets.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondary,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Divider,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Paper,
  Tooltip,
  useTheme
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AddIcon from '@mui/icons-material/Add';

import MarketplaceService from '../services/MarketplaceService';
import { WidgetMetadata, UserWidgetData } from '../models/WidgetMetadata';
import WidgetDetailPanel from './WidgetDetailPanel';

// Material UI icons mapping
const iconMapping: Record<string, React.ElementType> = {
  TrendingUp: require('@mui/icons-material/TrendingUp').default,
  AccountBalanceWallet: require('@mui/icons-material/AccountBalanceWallet').default,
  ListAlt: require('@mui/icons-material/ListAlt').default,
  Article: require('@mui/icons-material/Article').default,
  CalendarToday: require('@mui/icons-material/CalendarToday').default,
  ShowChart: require('@mui/icons-material/ShowChart').default,
  CurrencyBitcoin: require('@mui/icons-material/CurrencyBitcoin').default,
  CallSplit: require('@mui/icons-material/CallSplit').default
};

interface WidgetManagementPanelProps {
  onAddWidget?: () => void;
  onClose?: () => void;
}

const WidgetManagementPanel: React.FC<WidgetManagementPanelProps> = ({
  onAddWidget,
  onClose
}) => {
  const theme = useTheme();
  const marketplaceService = MarketplaceService.getInstance();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [installedWidgets, setInstalledWidgets] = useState<Array<UserWidgetData & { metadata?: WidgetMetadata }>>([]);
  const [selectedWidget, setSelectedWidget] = useState<WidgetMetadata | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [confirmUninstallOpen, setConfirmUninstallOpen] = useState<boolean>(false);
  const [uninstallingWidgetId, setUninstallingWidgetId] = useState<string | null>(null);
  
  // Fetch installed widgets
  useEffect(() => {
    const fetchInstalledWidgets = async () => {
      setLoading(true);
      try {
        // Get user's installed widgets
        const userWidgets = await marketplaceService.getUserWidgets();
        
        // Get metadata for each widget
        const widgetsWithMetadata = await Promise.all(
          userWidgets.map(async (userWidget) => {
            const metadata = await marketplaceService.getWidget(userWidget.widgetId);
            return {
              ...userWidget,
              metadata
            };
          })
        );
        
        setInstalledWidgets(widgetsWithMetadata);
      } catch (error) {
        console.error('Error fetching installed widgets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInstalledWidgets();
  }, []);
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, widgetId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveWidgetId(widgetId);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveWidgetId(null);
  };
  
  // Handle widget info
  const handleWidgetInfo = () => {
    const widget = installedWidgets.find(w => w.widgetId === activeWidgetId)?.metadata;
    if (widget) {
      setSelectedWidget(widget);
    }
    handleMenuClose();
  };
  
  // Handle widget settings
  const handleWidgetSettings = () => {
    // In a real app, this would open widget settings
    console.log('Open settings for widget:', activeWidgetId);
    handleMenuClose();
  };
  
  // Handle widget uninstall
  const handleUninstallClick = () => {
    setConfirmUninstallOpen(true);
    handleMenuClose();
  };
  
  // Handle confirm uninstall
  const handleConfirmUninstall = async () => {
    if (!activeWidgetId) return;
    
    setUninstallingWidgetId(activeWidgetId);
    setConfirmUninstallOpen(false);
    
    try {
      await marketplaceService.uninstallWidget(activeWidgetId);
      
      // Update installed widgets list
      setInstalledWidgets(prev => prev.filter(w => w.widgetId !== activeWidgetId));
    } catch (error) {
      console.error('Error uninstalling widget:', error);
    } finally {
      setUninstallingWidgetId(null);
    }
  };
  
  // Handle cancel uninstall
  const handleCancelUninstall = () => {
    setConfirmUninstallOpen(false);
  };
  
  // Handle back button click
  const handleBackClick = () => {
    setSelectedWidget(null);
  };
  
  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // If a widget is selected, show its details
  if (selectedWidget) {
    return (
      <WidgetDetailPanel
        widget={selectedWidget}
        onBack={handleBackClick}
        onInstall={() => {}}
        isInstalling={false}
        isInstalled={true}
      />
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Installed Widgets
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your installed widgets and their settings.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddWidget}
        >
          Add Widget
        </Button>
      </Box>
      
      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : installedWidgets.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No widgets installed
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You haven't installed any widgets yet. Add widgets from the marketplace to customize your dashboard.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onAddWidget}
            >
              Browse Marketplace
            </Button>
          </Paper>
        ) : (
          <List>
            {installedWidgets.map((widget, index) => {
              const metadata = widget.metadata;
              if (!metadata) return null;
              
              const IconComponent = iconMapping[metadata.icon] || iconMapping.TrendingUp;
              const isUninstalling = uninstallingWidgetId === widget.widgetId;
              
              return (
                <React.Fragment key={widget.widgetId}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuOpen(e, widget.widgetId)}
                        disabled={isUninstalling}
                      >
                        {isUninstalling ? (
                          <CircularProgress size={24} />
                        ) : (
                          <MoreVertIcon />
                        )}
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: theme.palette.primary.light
                        }}
                      >
                        <IconComponent />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="subtitle1" component="span">
                            {metadata.name}
                          </Typography>
                          {metadata.verified && (
                            <Tooltip title="Verified Widget">
                              <CheckCircleIcon color="primary" sx={{ ml: 1, fontSize: 16 }} />
                            </Tooltip>
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Version {widget.version}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={metadata.category.charAt(0).toUpperCase() + metadata.category.slice(1)}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Installed {formatDate(widget.installDate)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
      
      {/* Widget Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleWidgetInfo}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Widget Info</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleWidgetSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleUninstallClick} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Uninstall</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Confirm Uninstall Dialog */}
      <Dialog
        open={confirmUninstallOpen}
        onClose={handleCancelUninstall}
      >
        <DialogTitle>Uninstall Widget</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to uninstall this widget? This will remove it from all dashboards.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelUninstall}>Cancel</Button>
          <Button onClick={handleConfirmUninstall} color="error" autoFocus>
            Uninstall
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Footer */}
      {onClose && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default WidgetManagementPanel;