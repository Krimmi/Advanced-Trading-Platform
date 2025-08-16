/**
 * Widget Container Component
 * 
 * This component serves as a container for individual widgets,
 * providing common functionality like headers, resize, settings, etc.
 */

import React, { useState, useCallback } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import WidgetRegistry from './WidgetRegistry';
import { WidgetLayoutItem } from '../services/DashboardPreferenceService';
import DashboardStateService from '../services/DashboardStateService';

interface WidgetContainerProps {
  dashboardId: string;
  widget: WidgetLayoutItem;
  isEditing: boolean;
  isFullscreen: boolean;
  onRemove: () => void;
  onSettingsChange: (settings: Record<string, any>) => void;
  onResize: (width: number, height: number) => void;
  onFullscreenToggle: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  dashboardId,
  widget,
  isEditing,
  isFullscreen,
  onRemove,
  onSettingsChange,
  onResize,
  onFullscreenToggle,
  className,
  style
}) => {
  const theme = useTheme();
  const widgetRegistry = WidgetRegistry.getInstance();
  const stateService = DashboardStateService.getInstance();
  
  // Get widget configuration and state
  const widgetConfig = widgetRegistry.getWidget(widget.widgetType);
  const widgetState = stateService.getWidgetState(dashboardId, widget.id);
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  // Handle menu open/close
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  }, []);
  
  const handleMenuClose = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    stateService.refreshWidget(dashboardId, widget.id);
    handleMenuClose();
  }, [dashboardId, widget.id]);
  
  // Handle settings toggle
  const handleSettingsToggle = useCallback(() => {
    setShowSettings(prev => !prev);
    handleMenuClose();
  }, []);
  
  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: Record<string, any>) => {
    onSettingsChange(newSettings);
  }, [onSettingsChange]);
  
  // Handle widget removal
  const handleRemove = useCallback(() => {
    onRemove();
    handleMenuClose();
  }, [onRemove]);
  
  // If widget type is not registered
  if (!widgetConfig) {
    return (
      <Paper 
        className={className}
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'error.main'
          }}
        >
          <ErrorOutlineIcon sx={{ mr: 1 }} />
          <Typography variant="body1">
            Widget type '{widget.widgetType}' not found
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper 
      className={className}
      style={{
        ...style,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}
      elevation={isFullscreen ? 4 : 1}
    >
      {/* Widget Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          pl: 1.5,
          pr: 0.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default
        }}
      >
        {isEditing && (
          <DragIndicatorIcon 
            sx={{ 
              mr: 1, 
              cursor: 'move',
              color: theme.palette.text.secondary
            }} 
            className="widget-drag-handle"
          />
        )}
        
        <Typography 
          variant="subtitle2" 
          component="h3" 
          sx={{ 
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {widgetConfig.name}
        </Typography>
        
        {widgetState?.loading && (
          <CircularProgress size={16} sx={{ mr: 1 }} />
        )}
        
        <IconButton 
          size="small" 
          onClick={onFullscreenToggle}
          sx={{ ml: 0.5 }}
        >
          {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
        </IconButton>
        
        <IconButton 
          size="small" 
          onClick={handleMenuOpen}
          sx={{ ml: 0.5 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleRefresh}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
            Refresh
          </MenuItem>
          <MenuItem onClick={handleSettingsToggle}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Settings
          </MenuItem>
          {isEditing && (
            <>
              <Divider />
              <MenuItem onClick={handleRemove} sx={{ color: 'error.main' }}>
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Remove
              </MenuItem>
            </>
          )}
        </Menu>
      </Box>
      
      {/* Widget Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          position: 'relative',
          p: 1
        }}
      >
        {widgetState?.error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 2,
              color: 'error.main'
            }}
          >
            <ErrorOutlineIcon sx={{ mb: 1 }} />
            <Typography variant="body2" align="center">
              {widgetState.error}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Tooltip title="Retry">
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          widgetRegistry.createWidgetComponent(widget, {
            id: widget.id,
            isEditing: showSettings,
            onSettingsChange: handleSettingsChange,
            loading: widgetState?.loading,
            error: widgetState?.error,
            data: widgetState?.data,
            onResize: (width, height) => onResize(width, height)
          })
        )}
      </Box>
      
      {/* Widget Footer - Last updated timestamp */}
      {widgetState?.lastUpdated && !isEditing && !showSettings && (
        <Box
          sx={{
            p: 0.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Updated: {new Date(widgetState.lastUpdated).toLocaleTimeString()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default React.memo(WidgetContainer);