/**
 * Personalized Dashboard Component
 * 
 * This is the main dashboard component that allows users to view and interact
 * with their personalized dashboard with customizable widgets.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Drawer,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import DashboardPreferenceService, { DashboardLayout as DashboardLayoutType, WidgetLayoutItem } from './services/DashboardPreferenceService';
import DashboardStateService, { useDashboardState } from './services/DashboardStateService';
import WidgetRegistry from './WidgetSystem/WidgetRegistry';
import WidgetContainer from './WidgetSystem/WidgetContainer';
import { useComponentPerformance } from '../../utils/withPerformanceTracking.optimized';
import { MarketplacePage, WidgetManagementPanel } from './marketplace';

// Create responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

// Props for the PersonalizedDashboard component
interface PersonalizedDashboardProps {
  dashboardId?: string; // If not provided, will use default dashboard
  readOnly?: boolean; // If true, editing will be disabled
  className?: string;
  style?: React.CSSProperties;
}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({
  dashboardId,
  readOnly = false,
  className,
  style
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { trackOperation } = useComponentPerformance('PersonalizedDashboard');
  
  // Services
  const preferenceService = DashboardPreferenceService.getInstance();
  const stateService = DashboardStateService.getInstance();
  const widgetRegistry = WidgetRegistry.getInstance();
  
  // State
  const [currentDashboardId, setCurrentDashboardId] = useState<string>('');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardLayoutType | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState<boolean>(false);
  const [isWidgetManagementOpen, setIsWidgetManagementOpen] = useState<boolean>(false);
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Get dashboard state from hook
  const dashboardState = useDashboardState(currentDashboardId);
  
  // Initialize dashboard
  useEffect(() => {
    // Determine which dashboard to use
    const prefs = preferenceService.getPreferences();
    const targetDashboardId = dashboardId || prefs.defaultDashboardId;
    const config = preferenceService.getDashboard(targetDashboardId);
    
    if (config) {
      setCurrentDashboardId(targetDashboardId);
      setDashboardConfig(config);
    } else if (prefs.dashboards.length > 0) {
      // Fallback to first available dashboard
      setCurrentDashboardId(prefs.dashboards[0].id);
      setDashboardConfig(prefs.dashboards[0]);
    } else {
      // No dashboards available, create a default one
      const newDashboard = preferenceService.createDashboard('Default Dashboard');
      setCurrentDashboardId(newDashboard.id);
      setDashboardConfig(newDashboard);
    }
  }, [dashboardId]);
  
  // Subscribe to preference changes
  useEffect(() => {
    const unsubscribe = preferenceService.subscribe((prefs) => {
      if (currentDashboardId) {
        const updatedConfig = preferenceService.getDashboard(currentDashboardId);
        if (updatedConfig) {
          setDashboardConfig(updatedConfig);
        }
      }
    });
    
    return unsubscribe;
  }, [currentDashboardId]);
  
  // Convert widget layout items to react-grid-layout format
  const gridLayouts = useMemo(() => {
    if (!dashboardConfig) return { lg: [], md: [], sm: [], xs: [] };
    
    return trackOperation('createGridLayouts', () => {
      const createLayoutForBreakpoint = (columnCount: number, compactType: 'vertical' | 'horizontal') => {
        return dashboardConfig.widgets.map(widget => {
          // For smaller screens, make widgets take full width
          const width = columnCount <= 1 ? 1 : Math.min(widget.width, columnCount);
          
          return {
            i: widget.id,
            x: columnCount <= 1 ? 0 : (widget.column % columnCount),
            y: widget.order,
            w: width,
            h: widget.height,
            minW: 1,
            minH: 1,
            maxW: columnCount,
            maxH: 12
          };
        });
      };
      
      return {
        lg: createLayoutForBreakpoint(dashboardConfig.columns, 'vertical'),
        md: createLayoutForBreakpoint(Math.max(2, dashboardConfig.columns - 1), 'vertical'),
        sm: createLayoutForBreakpoint(2, 'vertical'),
        xs: createLayoutForBreakpoint(1, 'vertical')
      };
    });
  }, [dashboardConfig, trackOperation]);
  
  // Handle layout change
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: any) => {
    if (!dashboardConfig || !isEditing) return;
    
    const updatedWidgets = dashboardConfig.widgets.map(widget => {
      const layoutItem = currentLayout.find(item => item.i === widget.id);
      if (!layoutItem) return widget;
      
      return {
        ...widget,
        column: layoutItem.x,
        order: layoutItem.y,
        width: layoutItem.w,
        height: layoutItem.h
      };
    });
    
    preferenceService.updateDashboard(dashboardConfig.id, {
      widgets: updatedWidgets
    });
  }, [dashboardConfig, isEditing]);
  
  // Handle widget settings change
  const handleWidgetSettingsChange = useCallback((widgetId: string, newSettings: Record<string, any>) => {
    if (!dashboardConfig) return;
    
    const widgetIndex = dashboardConfig.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return;
    
    const updatedWidgets = [...dashboardConfig.widgets];
    updatedWidgets[widgetIndex] = {
      ...updatedWidgets[widgetIndex],
      settings: {
        ...updatedWidgets[widgetIndex].settings,
        ...newSettings
      }
    };
    
    preferenceService.updateDashboard(dashboardConfig.id, {
      widgets: updatedWidgets
    });
    
    // Refresh the widget with new settings
    stateService.refreshWidget(dashboardConfig.id, widgetId);
  }, [dashboardConfig]);
  
  // Handle widget resize
  const handleWidgetResize = useCallback((widgetId: string, width: number, height: number) => {
    if (!dashboardConfig) return;
    
    preferenceService.updateWidget(dashboardConfig.id, widgetId, {
      width,
      height
    });
  }, [dashboardConfig]);
  
  // Handle widget removal
  const handleWidgetRemove = useCallback((widgetId: string) => {
    if (!dashboardConfig) return;
    
    preferenceService.removeWidget(dashboardConfig.id, widgetId);
    setNotification({
      message: 'Widget removed successfully',
      type: 'success'
    });
  }, [dashboardConfig]);
  
  // Handle widget fullscreen toggle
  const handleWidgetFullscreenToggle = useCallback((widgetId: string | null) => {
    setFullscreenWidget(widgetId);
  }, []);
  
  // Handle add widget
  const handleAddWidget = useCallback((widgetType: string) => {
    if (!dashboardConfig) return;
    
    const widgetConfig = widgetRegistry.getWidget(widgetType);
    if (!widgetConfig) return;
    
    const defaultSize = widgetRegistry.getDefaultSize(widgetType);
    const defaultSettings = widgetRegistry.getDefaultSettings(widgetType);
    
    // Find the column with the least widgets
    const columnCounts = Array(dashboardConfig.columns).fill(0);
    dashboardConfig.widgets.forEach(widget => {
      if (widget.column < columnCounts.length) {
        columnCounts[widget.column]++;
      }
    });
    
    const leastPopulatedColumn = columnCounts.indexOf(Math.min(...columnCounts));
    
    // Add the widget
    const widgetId = preferenceService.addWidget(dashboardConfig.id, {
      widgetType,
      column: leastPopulatedColumn,
      order: columnCounts[leastPopulatedColumn],
      width: defaultSize.width,
      height: defaultSize.height,
      settings: defaultSettings
    });
    
    if (widgetId) {
      setIsAddWidgetOpen(false);
      setNotification({
        message: `${widgetConfig.name} widget added successfully`,
        type: 'success'
      });
      
      // Refresh the new widget
      setTimeout(() => {
        stateService.refreshWidget(dashboardConfig.id, widgetId);
      }, 100);
    }
  }, [dashboardConfig]);
  
  // Handle marketplace widget install
  const handleMarketplaceWidgetInstall = useCallback((widgetId: string) => {
    if (!dashboardConfig) return;
    
    // Close marketplace
    setIsMarketplaceOpen(false);
    
    // Add widget to dashboard
    handleAddWidget(widgetId);
  }, [dashboardConfig, handleAddWidget]);
  
  // Handle refresh dashboard
  const handleRefreshDashboard = useCallback(() => {
    if (!dashboardConfig) return;
    
    stateService.refreshDashboard(dashboardConfig.id);
    setNotification({
      message: 'Dashboard refreshed',
      type: 'info'
    });
  }, [dashboardConfig]);
  
  // Handle edit mode toggle
  const handleEditToggle = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);
  
  // Handle notification close
  const handleNotificationClose = useCallback(() => {
    setNotification(null);
  }, []);
  
  // Handle open marketplace
  const handleOpenMarketplace = useCallback(() => {
    setIsMarketplaceOpen(true);
    setIsAddWidgetOpen(false);
  }, []);
  
  // Handle open widget management
  const handleOpenWidgetManagement = useCallback(() => {
    setIsWidgetManagementOpen(true);
    setIsAddWidgetOpen(false);
  }, []);
  
  // If no dashboard is selected or loading
  if (!dashboardConfig || !currentDashboardId) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 3
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  // If a widget is in fullscreen mode
  if (fullscreenWidget) {
    const widget = dashboardConfig.widgets.find(w => w.id === fullscreenWidget);
    if (widget) {
      return (
        <Box
          sx={{
            height: '100%',
            p: 2,
            bgcolor: theme.palette.background.default
          }}
        >
          <WidgetContainer
            dashboardId={dashboardConfig.id}
            widget={widget}
            isEditing={false}
            isFullscreen={true}
            onRemove={() => {}}
            onSettingsChange={(settings) => handleWidgetSettingsChange(widget.id, settings)}
            onResize={(width, height) => handleWidgetResize(widget.id, width, height)}
            onFullscreenToggle={() => handleWidgetFullscreenToggle(null)}
            style={{ height: '100%' }}
          />
        </Box>
      );
    }
  }
  
  return (
    <Box
      className={className}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Dashboard Header */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="h1">
            {dashboardConfig.name}
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Refresh Dashboard">
            <IconButton 
              onClick={handleRefreshDashboard}
              disabled={dashboardState?.isRefreshing}
              sx={{ mr: 1 }}
              aria-label="Refresh Dashboard"
            >
              {dashboardState?.isRefreshing ? (
                <CircularProgress size={24} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
          
          {!readOnly && (
            <>
              <Tooltip title={isEditing ? "Save Layout" : "Edit Dashboard"}>
                <IconButton 
                  onClick={handleEditToggle}
                  color={isEditing ? "primary" : "default"}
                  sx={{ mr: 1 }}
                  aria-label={isEditing ? "Save Layout" : "Edit Dashboard"}
                >
                  {isEditing ? <SaveIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Manage Widgets">
                <IconButton 
                  onClick={handleOpenWidgetManagement}
                  sx={{ mr: 1 }}
                  aria-label="Manage Widgets"
                >
                  <WidgetsIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Dashboard Settings">
                <IconButton 
                  onClick={() => setIsSettingsOpen(true)}
                  sx={{ mr: 1 }}
                  aria-label="Dashboard Settings"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              
              {isEditing && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsAddWidgetOpen(true)}
                >
                  Add Widget
                </Button>
              )}
            </>
          )}
        </Box>
      </Paper>
      
      {/* Dashboard Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 1,
          bgcolor: theme.palette.background.default
        }}
      >
        {dashboardConfig.widgets.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              p: 3
            }}
          >
            <Typography variant="h6" gutterBottom>
              No widgets added yet
            </Typography>
            {!readOnly && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddWidgetOpen(true)}
                sx={{ mt: 2 }}
              >
                Add Widget
              </Button>
            )}
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={gridLayouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
            cols={{ lg: dashboardConfig.columns, md: Math.max(2, dashboardConfig.columns - 1), sm: 2, xs: 1 }}
            rowHeight={100}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            isDraggable={isEditing}
            isResizable={isEditing}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".widget-drag-handle"
            useCSSTransforms={true}
          >
            {dashboardConfig.widgets.map(widget => (
              <div key={widget.id}>
                <WidgetContainer
                  dashboardId={dashboardConfig.id}
                  widget={widget}
                  isEditing={isEditing}
                  isFullscreen={false}
                  onRemove={() => handleWidgetRemove(widget.id)}
                  onSettingsChange={(settings) => handleWidgetSettingsChange(widget.id, settings)}
                  onResize={(width, height) => handleWidgetResize(widget.id, width, height)}
                  onFullscreenToggle={() => handleWidgetFullscreenToggle(widget.id)}
                  style={{ height: '100%' }}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </Box>
      
      {/* Add Widget Drawer */}
      <Drawer
        anchor="right"
        open={isAddWidgetOpen}
        onClose={() => setIsAddWidgetOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Add Widget</Typography>
            <IconButton onClick={() => setIsAddWidgetOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <Button
            variant="contained"
            fullWidth
            onClick={handleOpenMarketplace}
            sx={{ mb: 2 }}
          >
            Browse Widget Marketplace
          </Button>
          
          <Typography variant="subtitle1" gutterBottom>
            Available Widgets
          </Typography>
          
          <Box>
            {widgetRegistry.getCategories().map(category => {
              const categoryWidgets = widgetRegistry.getWidgetsByCategory(category.id);
              if (categoryWidgets.length === 0) return null;
              
              return (
                <Box key={category.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {category.name}
                  </Typography>
                  <Grid container spacing={2}>
                    {categoryWidgets.map(widget => (
                      <Grid item xs={12} sm={6} key={widget.type}>
                        <Paper
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: theme.palette.action.hover
                            }
                          }}
                          onClick={() => handleAddWidget(widget.type)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {/* Use dynamic icon if available */}
                            {React.createElement(
                              // @ts-ignore - Dynamic icon component
                              require(`@mui/icons-material/${widget.icon}`).default,
                              { sx: { mr: 1 } }
                            )}
                            <Typography variant="subtitle2">{widget.name}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {widget.description}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Drawer>
      
      {/* Settings Dialog */}
      <Dialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Dashboard Settings</DialogTitle>
        <DialogContent>
          {/* Dashboard settings content would go here */}
          <Typography variant="body1">
            Dashboard settings functionality will be implemented in the next phase.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => setIsSettingsOpen(false)}>Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Marketplace Dialog */}
      <Dialog
        open={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <MarketplacePage
          onWidgetInstall={handleMarketplaceWidgetInstall}
          onClose={() => setIsMarketplaceOpen(false)}
          dashboardId={dashboardConfig.id}
        />
      </Dialog>
      
      {/* Widget Management Dialog */}
      <Dialog
        open={isWidgetManagementOpen}
        onClose={() => setIsWidgetManagementOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <WidgetManagementPanel
          onAddWidget={handleOpenMarketplace}
          onClose={() => setIsWidgetManagementOpen(false)}
        />
      </Dialog>
      
      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert 
            onClose={handleNotificationClose} 
            severity={notification.type}
            variant="filled"
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default React.memo(PersonalizedDashboard);