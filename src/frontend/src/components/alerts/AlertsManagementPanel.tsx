import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Notifications as NotificationsIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  History as HistoryIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { alertsService } from '../../services';
import alertsServiceExtensions, { ExecutionStrategy } from '../../services/alertsServiceExtensions';
import { Alert } from '../../services/alertsService';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `alerts-tab-${index}`,
    'aria-controls': `alerts-tabpanel-${index}`,
  };
}

const AlertsManagementPanel: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [strategies, setStrategies] = useState<ExecutionStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Fetch alerts and strategies on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [alertsData, strategiesData] = await Promise.all([
          alertsService.getAlerts(),
          alertsServiceExtensions.getExecutionStrategies(),
        ]);
        setAlerts(alertsData);
        setStrategies(strategiesData);
      } catch (error) {
        console.error('Error fetching alerts data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAlertMenuOpen = (event: React.MouseEvent<HTMLElement>, alertId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlertId(alertId);
  };

  const handleStrategyMenuOpen = (event: React.MouseEvent<HTMLElement>, strategyId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedStrategyId(strategyId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAlertId(null);
    setSelectedStrategyId(null);
  };

  const handleDeleteAlert = async () => {
    if (selectedAlertId) {
      try {
        await alertsService.deleteAlert(selectedAlertId);
        setAlerts(alerts.filter((alert) => alert.id !== selectedAlertId));
      } catch (error) {
        console.error('Error deleting alert:', error);
      }
    }
    handleMenuClose();
  };

  const handleDeleteStrategy = async () => {
    if (selectedStrategyId) {
      try {
        await alertsServiceExtensions.deleteExecutionStrategy(selectedStrategyId);
        setStrategies(strategies.filter((strategy) => strategy.id !== selectedStrategyId));
      } catch (error) {
        console.error('Error deleting strategy:', error);
      }
    }
    handleMenuClose();
  };

  const handleToggleStrategy = async (strategyId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await alertsServiceExtensions.deactivateExecutionStrategy(strategyId);
      } else {
        await alertsServiceExtensions.activateExecutionStrategy(strategyId);
      }
      
      // Update the strategies list
      setStrategies(
        strategies.map((strategy) =>
          strategy.id === strategyId ? { ...strategy, isActive: !isActive } : strategy
        )
      );
    } catch (error) {
      console.error('Error toggling strategy:', error);
    }
  };

  // Define columns for alerts table
  const alertColumns: GridColDef[] = [
    { field: 'symbol', headerName: 'Symbol', width: 100 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'condition', headerName: 'Condition', width: 150 },
    { field: 'value', headerName: 'Value', width: 120 },
    {
      field: 'triggered',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Triggered' : 'Active'}
          color={params.value ? 'success' : 'primary'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => format(new Date(params.value as string), 'MMM dd, yyyy HH:mm'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleAlertMenuOpen(e, params.row.id)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  // Define columns for strategies table
  const strategyColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 250 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => 
        params.value ? format(new Date(params.value as string), 'MMM dd, yyyy HH:mm') : 'N/A',
    },
    {
      field: 'toggle',
      headerName: 'Toggle',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={() => handleToggleStrategy(params.row.id, params.row.isActive)}
          color={params.row.isActive ? 'error' : 'success'}
        >
          {params.row.isActive ? <StopIcon /> : <PlayArrowIcon />}
        </IconButton>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleStrategyMenuOpen(e, params.row.id)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <NotificationsIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Alerts & Execution Management</Typography>
          </Box>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            size="small"
          >
            New Alert
          </Button>
        }
      />
      <Divider />
      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="alerts management tabs">
            <Tab label="Alerts" icon={<NotificationsIcon />} iconPosition="start" {...a11yProps(0)} />
            <Tab label="Execution Strategies" icon={<PlayArrowIcon />} iconPosition="start" {...a11yProps(1)} />
            <Tab label="Execution History" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(2)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={alerts}
                columns={alertColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                checkboxSelection
                disableSelectionOnClick
              />
            </div>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <div style={{ height: 400, width: '100%' }}>
              <Box mb={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  New Strategy
                </Button>
              </Box>
              <DataGrid
                rows={strategies}
                columns={strategyColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                disableSelectionOnClick
              />
            </div>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1">Execution history will be implemented here.</Typography>
        </TabPanel>
      </CardContent>

      {/* Alert Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && Boolean(selectedAlertId)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <LinkIcon fontSize="small" sx={{ mr: 1 }} /> Link to Strategy
        </MenuItem>
        <MenuItem onClick={handleDeleteAlert}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      {/* Strategy Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && Boolean(selectedStrategyId)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> View History
        </MenuItem>
        <MenuItem onClick={handleDeleteStrategy}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default AlertsManagementPanel;