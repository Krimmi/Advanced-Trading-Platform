import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  useTheme,
  alpha
} from '@mui/material';
import { 
  MoreVert as MoreVertIcon, 
  Settings as SettingsIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Fullscreen as FullscreenIcon
} from '@mui/icons-material';

import DashboardStateService from '../../services/dashboard/DashboardStateService';
import WidgetRegistry from '../../services/dashboard/WidgetRegistry';
import MarketOverviewWidget from './widgets/MarketOverviewWidget';
import PortfolioSummaryWidget from './widgets/PortfolioSummaryWidget';
import WatchlistWidget from './widgets/WatchlistWidget';
import NewsWidget from './widgets/NewsWidget';
import ChartWidget from './widgets/ChartWidget';
import WidgetSettings from './WidgetSettings';

interface WidgetContainerProps {
  widgetId: string;
  widgetType: string;
  settings: Record<string, any>;
  title: string;
  editMode: boolean;
  onRemove: () => void;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({ 
  widgetId, 
  widgetType, 
  settings, 
  title, 
  editMode, 
  onRemove 
}) => {
  const theme = useTheme();
  const dashboardStateService = DashboardStateService.getInstance();
  const widgetRegistry = WidgetRegistry.getInstance();
  
  // Local state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get widget definition
  const widgetDefinition = widgetRegistry.getWidgetDefinition(widgetType);
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Open settings dialog
  const handleOpenSettings = () => {
    setSettingsOpen(true);
    handleMenuClose();
  };
  
  // Close settings dialog
  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };
  
  // Save settings
  const handleSaveSettings = async (newSettings: Record<string, any>) => {
    try {
      await dashboardStateService.updateWidgetSettings(widgetId, newSettings);
      setSettingsOpen(false);
    } catch (error) {
      console.error('Error updating widget settings:', error);
      setError('Failed to update widget settings');
    }
  };
  
  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    setFullscreenOpen(!fullscreenOpen);
    handleMenuClose();
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    handleMenuClose();
  };
  
  // Handle remove
  const handleRemove = () => {
    onRemove();
    handleMenuClose();
  };
  
  // Render widget content based on type
  const renderWidgetContent = () => {
    switch (widgetType) {
      case 'MarketOverviewWidget':
        return <MarketOverviewWidget settings={settings} />;
      case 'PortfolioSummaryWidget':
        return <PortfolioSummaryWidget settings={settings} />;
      case 'WatchlistWidget':
        return <WatchlistWidget settings={settings} />;
      case 'NewsWidget':
        return <NewsWidget settings={settings} />;
      case 'ChartWidget':
        return <ChartWidget settings={settings} />;
      default:
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            p: 2
          }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Widget type "{widgetType}" not implemented
            </Typography>
          </Box>
        );
    }
  };
  
  return (
    <Paper
      elevation={1}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        border: editMode ? `2px solid ${alpha(theme.palette.primary.main, 0.5)}` : `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: editMode ? theme.shadows[4] : 'none',
        }
      }}
    >
      {/* Widget header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: editMode ? alpha(theme.palette.primary.light, 0.1) : 'background.paper'
      }}>
        <Typography variant="subtitle1" fontWeight="medium" noWrap>
          {title}
        </Typography>
        
        <Box>
          {isLoading && (
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Refreshing...
            </Typography>
          )}
          
          <IconButton
            size="small"
            aria-label="widget options"
            aria-controls={`widget-menu-${widgetId}`}
            aria-haspopup="true"
            onClick={handleMenuOpen}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          
          <Menu
            id={`widget-menu-${widgetId}`}
            anchorEl={menuAnchorEl}
            keepMounted
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleRefresh}>
              <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
              Refresh
            </MenuItem>
            <MenuItem onClick={handleToggleFullscreen}>
              <FullscreenIcon fontSize="small" sx={{ mr: 1 }} />
              Fullscreen
            </MenuItem>
            <MenuItem onClick={handleOpenSettings}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            {editMode && (
              <MenuItem onClick={handleRemove}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Remove
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>
      
      {/* Widget content */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        position: 'relative'
      }}>
        {error ? (
          <Box sx={{ 
            p: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%'
          }}>
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              size="small"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          </Box>
        ) : (
          renderWidgetContent()
        )}
      </Box>
      
      {/* Settings dialog */}
      <WidgetSettings
        open={settingsOpen}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        widgetType={widgetType}
        currentSettings={settings}
      />
      
      {/* Fullscreen dialog */}
      <Dialog
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {title}
          <IconButton onClick={() => setFullscreenOpen(false)} size="small">
            <FullscreenIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ height: '70vh' }}>
          {renderWidgetContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFullscreenOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WidgetContainer;