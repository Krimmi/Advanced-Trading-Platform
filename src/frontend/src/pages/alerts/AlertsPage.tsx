import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Timeline,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import DataCard from '../../components/common/DataCard';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import NoData from '../../components/common/NoData';
import AlertItem from '../../components/alerts/AlertItem';
import CreateAlertForm from '../../components/alerts/CreateAlertForm';

// Redux
import { RootState } from '../../store';
import { fetchAlerts, deleteAlert, toggleAlertActive } from '../../store/slices/alertsSlice';

// Types
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
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `alerts-tab-${index}`,
    'aria-controls': `alerts-tabpanel-${index}`,
  };
}

const AlertsPage: React.FC = () => {
  const dispatch = useDispatch();
  const { alerts, loading, error } = useSelector((state: RootState) => state.alerts);
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Fetch alerts on component mount
  useEffect(() => {
    dispatch(fetchAlerts() as any);
  }, [dispatch]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, alertId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlertId(alertId);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlertId(null);
  };
  
  // Handle alert deletion
  const handleDeleteAlert = () => {
    if (selectedAlertId) {
      dispatch(deleteAlert(selectedAlertId) as any);
      setConfirmDeleteOpen(false);
      handleMenuClose();
    }
  };
  
  // Handle alert toggle
  const handleToggleAlert = (alertId: number, isActive: boolean) => {
    dispatch(toggleAlertActive({ alertId, isActive }) as any);
  };
  
  // Filter alerts based on tab and search query
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = searchQuery === '' || 
      alert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (tabValue === 0) {
      return matchesSearch; // All alerts
    } else if (tabValue === 1) {
      return matchesSearch && alert.is_active; // Active alerts
    } else {
      return matchesSearch && !alert.is_active; // Inactive alerts
    }
  });
  
  // Alert statistics
  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(alert => alert.is_active).length;
  const triggeredAlerts = alerts.filter(alert => alert.trigger_count > 0).length;
  
  // Show loading state
  if (loading && alerts.length === 0) {
    return <LoadingIndicator />;
  }
  
  return (
    <Box>
      <PageHeader 
        title="Alerts & Notifications" 
        subtitle="Configure and manage your trading alerts"
        icon={<NotificationsIcon />}
      />
      
      {/* Alert Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <DataCard
            title="Total Alerts"
            value={totalAlerts.toString()}
            icon={<NotificationsIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DataCard
            title="Active Alerts"
            value={activeAlerts.toString()}
            icon={<Visibility />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DataCard
            title="Triggered Alerts"
            value={triggeredAlerts.toString()}
            icon={<Timeline />}
            color="warning"
          />
        </Grid>
      </Grid>
      
      {/* Alerts Management */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="alert tabs"
          >
            <Tab label={`All Alerts (${totalAlerts})`} {...a11yProps(0)} />
            <Tab label={`Active (${activeAlerts})`} {...a11yProps(1)} />
            <Tab label={`Inactive (${totalAlerts - activeAlerts})`} {...a11yProps(2)} />
          </Tabs>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mr: 2 }}
            />
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Create Alert
            </Button>
          </Box>
        </Box>
        
        <Divider />
        
        <TabPanel value={tabValue} index={0}>
          {filteredAlerts.length > 0 ? (
            <Box>
              {filteredAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMenuOpen={(e) => handleMenuOpen(e, alert.id)}
                  onToggle={() => handleToggleAlert(alert.id, !alert.is_active)}
                />
              ))}
            </Box>
          ) : (
            <NoData message={searchQuery ? "No alerts match your search" : "No alerts created yet"} />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {filteredAlerts.length > 0 ? (
            <Box>
              {filteredAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMenuOpen={(e) => handleMenuOpen(e, alert.id)}
                  onToggle={() => handleToggleAlert(alert.id, !alert.is_active)}
                />
              ))}
            </Box>
          ) : (
            <NoData message={searchQuery ? "No active alerts match your search" : "No active alerts"} />
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {filteredAlerts.length > 0 ? (
            <Box>
              {filteredAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMenuOpen={(e) => handleMenuOpen(e, alert.id)}
                  onToggle={() => handleToggleAlert(alert.id, !alert.is_active)}
                />
              ))}
            </Box>
          ) : (
            <NoData message={searchQuery ? "No inactive alerts match your search" : "No inactive alerts"} />
          )}
        </TabPanel>
      </Paper>
      
      {/* Alert Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Alert
        </MenuItem>
        <MenuItem onClick={() => {
          setConfirmDeleteOpen(true);
          handleMenuClose();
        }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Alert
        </MenuItem>
      </Menu>
      
      {/* Create Alert Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Alert</DialogTitle>
        <DialogContent>
          <CreateAlertForm onClose={() => setOpenCreateDialog(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Delete Alert</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this alert? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAlert} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsPage;