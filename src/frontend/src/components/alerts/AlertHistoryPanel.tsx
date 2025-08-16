import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  History as HistoryIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { alertsService } from '../../services';
import { Alert } from '../../services/alertsService';
import alertsServiceExtensions, { ExecutionResult } from '../../services/alertsServiceExtensions';

const AlertHistoryPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');

  useEffect(() => {
    fetchHistory();
  }, [filterType, filterStatus, timeRange]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be filtered API calls
      const [alertsData, executionsData] = await Promise.all([
        alertsService.getAlerts(),
        alertsServiceExtensions.getExecutionHistory(),
      ]);
      
      // Filter alerts to only show triggered ones
      const triggeredAlerts = alertsData.filter(alert => alert.triggered);
      setAlertHistory(triggeredAlerts);
      
      // Set execution history from the response
      setExecutionHistory(executionsData.executions);
    } catch (error) {
      console.error('Error fetching alert history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterTypeChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
  };

  const handleFilterStatusChange = (event: SelectChangeEvent) => {
    setFilterStatus(event.target.value);
  };

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  const handleRefresh = () => {
    fetchHistory();
  };

  // Define columns for alert history table
  const alertColumns: GridColDef[] = [
    { field: 'symbol', headerName: 'Symbol', width: 100 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'condition', headerName: 'Condition', width: 150 },
    { field: 'value', headerName: 'Value', width: 120 },
    {
      field: 'triggeredAt',
      headerName: 'Triggered At',
      width: 180,
      valueFormatter: (params) => 
        params.value ? format(new Date(params.value as string), 'MMM dd, yyyy HH:mm') : 'N/A',
    },
    {
      field: 'notificationMethod',
      headerName: 'Notification',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'email' ? 'primary' :
            params.value === 'push' ? 'secondary' :
            params.value === 'sms' ? 'success' : 'default'
          }
          size="small"
        />
      ),
    },
    {
      field: 'executionStatus',
      headerName: 'Execution',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        // This would be populated from the linked execution record in a real implementation
        const status = params.value || 'none';
        return (
          <Chip
            label={status === 'none' ? 'No Execution' : status}
            color={
              status === 'executed' ? 'success' :
              status === 'failed' ? 'error' :
              status === 'pending' ? 'warning' : 'default'
            }
            size="small"
          />
        );
      },
    },
  ];

  // Define columns for execution history table
  const executionColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 100 },
    { field: 'strategyId', headerName: 'Strategy', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          color={
            params.value === 'executed' ? 'success' :
            params.value === 'failed' ? 'error' :
            params.value === 'pending' ? 'warning' :
            params.value === 'canceled' ? 'default' : 'primary'
          }
          size="small"
        />
      ),
    },
    {
      field: 'triggeredAt',
      headerName: 'Triggered At',
      width: 180,
      valueFormatter: (params) => format(new Date(params.value as string), 'MMM dd, yyyy HH:mm'),
    },
    {
      field: 'completedAt',
      headerName: 'Completed At',
      width: 180,
      valueFormatter: (params) => 
        params.value ? format(new Date(params.value as string), 'MMM dd, yyyy HH:mm') : 'N/A',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <HistoryIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Alert & Execution History</Typography>
          </Box>
        }
        action={
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        }
      />
      <Divider />
      <CardContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={filterType}
                label="Alert Type"
                onChange={handleFilterTypeChange}
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="news">News</MenuItem>
                <MenuItem value="earnings">Earnings</MenuItem>
                <MenuItem value="volume">Volume</MenuItem>
                <MenuItem value="pattern">Pattern</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={handleFilterStatusChange}
                startAdornment={<FilterIcon fontSize="small" sx={{ mr: 1 }} />}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="executed">Executed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="none">No Execution</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom>
              Triggered Alerts
            </Typography>
            <div style={{ height: 300, width: '100%', marginBottom: theme.spacing(3) }}>
              <DataGrid
                rows={alertHistory}
                columns={alertColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                disableSelectionOnClick
              />
            </div>

            <Typography variant="subtitle1" gutterBottom>
              Execution History
            </Typography>
            <div style={{ height: 300, width: '100%' }}>
              <DataGrid
                rows={executionHistory}
                columns={executionColumns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                disableSelectionOnClick
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertHistoryPanel;