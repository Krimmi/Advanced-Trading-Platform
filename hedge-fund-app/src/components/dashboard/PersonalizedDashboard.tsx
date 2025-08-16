import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Delete as DeleteIcon, 
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { RootState } from '../../store';
import DashboardStateService from '../../services/dashboard/DashboardStateService';
import { DashboardPreference, WidgetLayout } from '../../services/dashboard/DashboardPreferenceService';
import WidgetRegistry from '../../services/dashboard/WidgetRegistry';
import WidgetContainer from './WidgetContainer';
import WidgetSelector from './WidgetSelector';

// Make the grid layout responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

interface PersonalizedDashboardProps {
  userId: string;
}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({ userId }) => {
  const theme = useTheme();
  const dashboardStateService = DashboardStateService.getInstance();
  const widgetRegistry = WidgetRegistry.getInstance();
  
  // Local state
  const [dashboards, setDashboards] = useState<DashboardPreference[]>([]);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [newDashboardDialogOpen, setNewDashboardDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [widgetSelectorOpen, setWidgetSelectorOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Load user dashboards
  useEffect(() => {
    const loadDashboards = async () => {
      try {
        setIsLoading(true);
        await dashboardStateService.loadUserDashboards(userId);
        
        const state = dashboardStateService.getCurrentState();
        setDashboards(state.dashboards);
        setActiveDashboardId(state.activeDashboardId);
        setEditMode(state.editMode);
        setError(state.error);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboards:', error);
        setError(error instanceof Error ? error.message : 'Failed to load dashboards');
        setIsLoading(false);
      }
    };
    
    loadDashboards();
    
    // Subscribe to dashboard state changes
    const subscription = dashboardStateService.getState().subscribe(state => {
      setDashboards(state.dashboards);
      setActiveDashboardId(state.activeDashboardId);
      setEditMode(state.editMode);
      setError(state.error);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, dashboardStateService]);
  
  // Get active dashboard
  const activeDashboard = dashboards.find(d => d.id === activeDashboardId) || null;
  
  // Handle dashboard tab change
  const handleDashboardChange = (dashboardId: string) => {
    dashboardStateService.setActiveDashboard(dashboardId);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Toggle edit mode
  const handleToggleEditMode = () => {
    setEditMode(!editMode);
    dashboardStateService.toggleEditMode();
    handleMenuClose();
  };
  
  // Open new dashboard dialog
  const handleOpenNewDashboardDialog = () => {
    setNewDashboardDialogOpen(true);
    handleMenuClose();
  };
  
  // Close new dashboard dialog
  const handleCloseNewDashboardDialog = () => {
    setNewDashboardDialogOpen(false);
    setNewDashboardName('');
  };
  
  // Create new dashboard
  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) {
      return;
    }
    
    try {
      await dashboardStateService.createDashboard(newDashboardName, userId);
      
      setSnackbarMessage(`Dashboard "${newDashboardName}" created successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      handleCloseNewDashboardDialog();
    } catch (error) {
      console.error('Error creating dashboard:', error);
      
      setSnackbarMessage('Failed to create dashboard');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Delete dashboard
  const handleDeleteDashboard = async () => {
    if (!activeDashboardId) return;
    
    if (window.confirm(`Are you sure you want to delete the dashboard "${activeDashboard?.name}"?`)) {
      try {
        await dashboardStateService.deleteDashboard(activeDashboardId);
        
        setSnackbarMessage('Dashboard deleted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error deleting dashboard:', error);
        
        setSnackbarMessage('Failed to delete dashboard');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    
    handleMenuClose();
  };
  
  // Open widget selector
  const handleOpenWidgetSelector = () => {
    setWidgetSelectorOpen(true);
  };
  
  // Close widget selector
  const handleCloseWidgetSelector = () => {
    setWidgetSelectorOpen(false);
  };
  
  // Add widget
  const handleAddWidget = async (widgetType: string) => {
    try {
      await dashboardStateService.addWidget(widgetType);
      
      setSnackbarMessage(`Widget added successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      handleCloseWidgetSelector();
    } catch (error) {
      console.error('Error adding widget:', error);
      
      setSnackbarMessage('Failed to add widget');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Remove widget
  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await dashboardStateService.removeWidget(widgetId);
      
      setSnackbarMessage('Widget removed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error removing widget:', error);
      
      setSnackbarMessage('Failed to remove widget');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Update widget layout
  const handleLayoutChange = async (layout: any[]) => {
    if (!activeDashboardId || !editMode) return;
    
    // Convert the react-grid-layout format to our widget layout format
    const updatedLayout: WidgetLayout[] = activeDashboard!.layout.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h
          }
        };
      }
      
      return widget;
    });
    
    try {
      await dashboardStateService.updateWidgetLayout(activeDashboardId, updatedLayout);
    } catch (error) {
      console.error('Error updating widget layout:', error);
      
      setSnackbarMessage('Failed to update widget layout');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // If loading
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Typography>Loading dashboards...</Typography>
      </Box>
    );
  }
  
  // If error
  if (error) {
    return (
      <Box sx={{ p: 3, border: `1px solid ${theme.palette.error.main}`, borderRadius: 1 }}>
        <Typography color="error">Error: {error}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => dashboardStateService.loadUserDashboards(userId)}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  // If no dashboards
  if (dashboards.length === 0) {
    return (
      <Box sx={{ 
        p: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: 2
      }}>
        <DashboardIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>No Dashboards Found</Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Create your first dashboard to get started with personalized insights
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenNewDashboardDialog}
        >
          Create Dashboard
        </Button>
      </Box>
    );
  }
  
  // If no active dashboard
  if (!activeDashboard) {
    return (
      <Box sx={{ p: 3, border: `1px solid ${theme.palette.warning.main}`, borderRadius: 1 }}>
        <Typography color="warning.main">No active dashboard selected</Typography>
        <Box sx={{ mt: 2 }}>
          {dashboards.map(dashboard => (
            <Button 
              key={dashboard.id}
              variant="outlined" 
              sx={{ mr: 1, mb: 1 }}
              onClick={() => handleDashboardChange(dashboard.id)}
            >
              {dashboard.name}
            </Button>
          ))}
        </Box>
      </Box>
    );
  }
  
  // Convert widget layout to react-grid-layout format
  const gridLayout = activeDashboard.layout.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 2,
    minH: 2,
    isResizable: editMode,
    isDraggable: editMode
  }));
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Dashboard header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tabs 
            value={activeDashboardId} 
            onChange={(_, value) => handleDashboardChange(value)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="dashboard tabs"
          >
            {dashboards.map(dashboard => (
              <Tab 
                key={dashboard.id} 
                label={dashboard.name} 
                value={dashboard.id}
                icon={dashboard.isDefault ? <DashboardIcon fontSize="small" /> : undefined}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>
        
        <Box>
          {editMode && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenWidgetSelector}
              sx={{ mr: 1 }}
            >
              Add Widget
            </Button>
          )}
          
          <Button
            variant={editMode ? "contained" : "outlined"}
            color={editMode ? "success" : "primary"}
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={handleToggleEditMode}
            sx={{ mr: 1 }}
          >
            {editMode ? 'Save Layout' : 'Edit Layout'}
          </Button>
          
          <IconButton
            aria-label="dashboard options"
            aria-controls="dashboard-menu"
            aria-haspopup="true"
            onClick={handleMenuOpen}
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            id="dashboard-menu"
            anchorEl={menuAnchorEl}
            keepMounted
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleOpenNewDashboardDialog}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              New Dashboard
            </MenuItem>
            <MenuItem onClick={handleToggleEditMode}>
              {editMode ? (
                <>
                  <SaveIcon fontSize="small" sx={{ mr: 1 }} />
                  Save Layout
                </>
              ) : (
                <>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit Layout
                </>
              )}
            </MenuItem>
            <MenuItem onClick={handleDeleteDashboard} disabled={dashboards.length <= 1}>
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete Dashboard
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      {/* Dashboard grid */}
      <Box sx={{ 
        border: editMode ? `2px dashed ${theme.palette.primary.main}` : 'none',
        borderRadius: 1,
        p: editMode ? 1 : 0,
        backgroundColor: editMode ? alpha(theme.palette.primary.light, 0.05) : 'transparent',
        minHeight: '600px'
      }}>
        {activeDashboard.layout.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '400px',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1
          }}>
            <Typography variant="h6" gutterBottom>This dashboard is empty</Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Add widgets to customize your dashboard
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenWidgetSelector}
            >
              Add Widget
            </Button>
          </Box>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: gridLayout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            margin={[16, 16]}
            containerPadding={[0, 0]}
            onLayoutChange={handleLayoutChange}
            isDraggable={editMode}
            isResizable={editMode}
          >
            {activeDashboard.layout.map(widget => {
              const widgetDef = widgetRegistry.getWidgetDefinition(widget.widgetType);
              
              return (
                <Box key={widget.id} sx={{ overflow: 'hidden' }}>
                  <WidgetContainer
                    widgetId={widget.id}
                    widgetType={widget.widgetType}
                    settings={widget.settings}
                    title={widgetDef?.name || widget.widgetType}
                    editMode={editMode}
                    onRemove={() => handleRemoveWidget(widget.id)}
                  />
                </Box>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </Box>
      
      {/* New Dashboard Dialog */}
      <Dialog open={newDashboardDialogOpen} onClose={handleCloseNewDashboardDialog}>
        <DialogTitle>Create New Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Dashboard Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewDashboardDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateDashboard} 
            variant="contained" 
            color="primary"
            disabled={!newDashboardName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Widget Selector Dialog */}
      <WidgetSelector
        open={widgetSelectorOpen}
        onClose={handleCloseWidgetSelector}
        onSelectWidget={handleAddWidget}
      />
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonalizedDashboard;