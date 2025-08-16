import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  PlayCircleOutline as ResumeIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import dataInfrastructureService, {
  DataSource,
  DataPipeline,
  DataJob,
  ScheduledJob,
  UpdateLog
} from '../../services/dataInfrastructureService';

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
      id={`data-management-tabpanel-${index}`}
      aria-labelledby={`data-management-tab-${index}`}
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
    id: `data-management-tab-${index}`,
    'aria-controls': `data-management-tabpanel-${index}`,
  };
}

const DataManagementDashboard: React.FC = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Data sources state
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [isDataSourceDialogOpen, setIsDataSourceDialogOpen] = useState(false);
  const [isDataSourceLoading, setIsDataSourceLoading] = useState(false);

  // Data pipelines state
  const [dataPipelines, setDataPipelines] = useState<DataPipeline[]>([]);
  const [selectedDataPipeline, setSelectedDataPipeline] = useState<DataPipeline | null>(null);
  const [isDataPipelineDialogOpen, setIsDataPipelineDialogOpen] = useState(false);
  const [isDataPipelineLoading, setIsDataPipelineLoading] = useState(false);

  // Data jobs state
  const [dataJobs, setDataJobs] = useState<DataJob[]>([]);
  const [isDataJobsLoading, setIsDataJobsLoading] = useState(false);
  const [dataJobsPage, setDataJobsPage] = useState(0);
  const [dataJobsRowsPerPage, setDataJobsRowsPerPage] = useState(10);

  // Scheduled jobs state
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>([]);
  const [selectedScheduledJob, setSelectedScheduledJob] = useState<ScheduledJob | null>(null);
  const [isScheduledJobDialogOpen, setIsScheduledJobDialogOpen] = useState(false);
  const [isScheduledJobLoading, setIsScheduledJobLoading] = useState(false);

  // Update logs state
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [isUpdateLogsLoading, setIsUpdateLogsLoading] = useState(false);
  const [updateLogsPage, setUpdateLogsPage] = useState(0);
  const [updateLogsRowsPerPage, setUpdateLogsRowsPerPage] = useState(10);

  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Form states
  const [dataSourceForm, setDataSourceForm] = useState({
    name: '',
    type: '',
    description: '',
    config: '{}',
    rate_limit: '',
    enabled: true
  });

  const [dataPipelineForm, setDataPipelineForm] = useState({
    name: '',
    description: '',
    source_id: '',
    steps: '[]',
    schedule: '',
    schedule_params: '{}',
    enabled: true
  });

  const [scheduledJobForm, setScheduledJobForm] = useState({
    data_type: '',
    source: '',
    schedule_type: 'daily',
    schedule_params: '{}',
    symbols: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadDataSources();
    loadDataPipelines();
    loadDataJobs();
    loadScheduledJobs();
    loadUpdateLogs();
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Data sources functions
  const loadDataSources = async () => {
    try {
      setIsDataSourceLoading(true);
      const sources = await dataInfrastructureService.getDataSources();
      setDataSources(sources);
      setIsDataSourceLoading(false);
    } catch (error) {
      console.error('Error loading data sources:', error);
      setNotification({
        open: true,
        message: 'Failed to load data sources',
        severity: 'error'
      });
      setIsDataSourceLoading(false);
    }
  };

  const handleDataSourceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDataSourceForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDataSourceSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setDataSourceForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDataSourceSubmit = async () => {
    try {
      const formData = {
        ...dataSourceForm,
        config: JSON.parse(dataSourceForm.config),
        rate_limit: dataSourceForm.rate_limit ? parseInt(dataSourceForm.rate_limit) : undefined
      };

      if (selectedDataSource) {
        // Update existing data source
        await dataInfrastructureService.updateDataSource(selectedDataSource.id, formData);
        setNotification({
          open: true,
          message: 'Data source updated successfully',
          severity: 'success'
        });
      } else {
        // Create new data source
        await dataInfrastructureService.createDataSource(formData);
        setNotification({
          open: true,
          message: 'Data source created successfully',
          severity: 'success'
        });
      }

      setIsDataSourceDialogOpen(false);
      loadDataSources();
    } catch (error) {
      console.error('Error submitting data source:', error);
      setNotification({
        open: true,
        message: 'Failed to save data source',
        severity: 'error'
      });
    }
  };

  const handleEditDataSource = (source: DataSource) => {
    setSelectedDataSource(source);
    setDataSourceForm({
      name: source.name,
      type: source.type,
      description: source.description || '',
      config: JSON.stringify(source.config, null, 2),
      rate_limit: source.rate_limit?.toString() || '',
      enabled: source.enabled
    });
    setIsDataSourceDialogOpen(true);
  };

  const handleDeleteDataSource = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      try {
        await dataInfrastructureService.deleteDataSource(id);
        setNotification({
          open: true,
          message: 'Data source deleted successfully',
          severity: 'success'
        });
        loadDataSources();
      } catch (error) {
        console.error('Error deleting data source:', error);
        setNotification({
          open: true,
          message: 'Failed to delete data source',
          severity: 'error'
        });
      }
    }
  };

  // Data pipelines functions
  const loadDataPipelines = async () => {
    try {
      setIsDataPipelineLoading(true);
      const pipelines = await dataInfrastructureService.getDataPipelines();
      setDataPipelines(pipelines);
      setIsDataPipelineLoading(false);
    } catch (error) {
      console.error('Error loading data pipelines:', error);
      setNotification({
        open: true,
        message: 'Failed to load data pipelines',
        severity: 'error'
      });
      setIsDataPipelineLoading(false);
    }
  };

  const handleDataPipelineFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDataPipelineForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDataPipelineSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setDataPipelineForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDataPipelineSubmit = async () => {
    try {
      const formData = {
        ...dataPipelineForm,
        source_id: dataPipelineForm.source_id ? parseInt(dataPipelineForm.source_id) : undefined,
        steps: JSON.parse(dataPipelineForm.steps),
        schedule_params: JSON.parse(dataPipelineForm.schedule_params)
      };

      if (selectedDataPipeline) {
        // Update existing data pipeline
        await dataInfrastructureService.updateDataPipeline(selectedDataPipeline.id, formData);
        setNotification({
          open: true,
          message: 'Data pipeline updated successfully',
          severity: 'success'
        });
      } else {
        // Create new data pipeline
        await dataInfrastructureService.createDataPipeline(formData);
        setNotification({
          open: true,
          message: 'Data pipeline created successfully',
          severity: 'success'
        });
      }

      setIsDataPipelineDialogOpen(false);
      loadDataPipelines();
    } catch (error) {
      console.error('Error submitting data pipeline:', error);
      setNotification({
        open: true,
        message: 'Failed to save data pipeline',
        severity: 'error'
      });
    }
  };

  const handleEditDataPipeline = (pipeline: DataPipeline) => {
    setSelectedDataPipeline(pipeline);
    setDataPipelineForm({
      name: pipeline.name,
      description: pipeline.description || '',
      source_id: pipeline.source_id?.toString() || '',
      steps: JSON.stringify(pipeline.steps, null, 2),
      schedule: pipeline.schedule || '',
      schedule_params: JSON.stringify(pipeline.schedule_params, null, 2),
      enabled: pipeline.enabled
    });
    setIsDataPipelineDialogOpen(true);
  };

  const handleDeleteDataPipeline = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this data pipeline?')) {
      try {
        await dataInfrastructureService.deleteDataPipeline(id);
        setNotification({
          open: true,
          message: 'Data pipeline deleted successfully',
          severity: 'success'
        });
        loadDataPipelines();
      } catch (error) {
        console.error('Error deleting data pipeline:', error);
        setNotification({
          open: true,
          message: 'Failed to delete data pipeline',
          severity: 'error'
        });
      }
    }
  };

  const handleRunDataPipeline = async (name: string) => {
    try {
      const result = await dataInfrastructureService.runDataPipeline(name);
      setNotification({
        open: true,
        message: `Pipeline started with job ID: ${result.job_id}`,
        severity: 'success'
      });
      loadDataJobs();
    } catch (error) {
      console.error('Error running data pipeline:', error);
      setNotification({
        open: true,
        message: 'Failed to run data pipeline',
        severity: 'error'
      });
    }
  };

  // Data jobs functions
  const loadDataJobs = async () => {
    try {
      setIsDataJobsLoading(true);
      const jobs = await dataInfrastructureService.getDataJobs();
      setDataJobs(jobs);
      setIsDataJobsLoading(false);
    } catch (error) {
      console.error('Error loading data jobs:', error);
      setNotification({
        open: true,
        message: 'Failed to load data jobs',
        severity: 'error'
      });
      setIsDataJobsLoading(false);
    }
  };

  const handleCancelDataJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to cancel this job?')) {
      try {
        await dataInfrastructureService.cancelDataJob(jobId);
        setNotification({
          open: true,
          message: 'Job cancelled successfully',
          severity: 'success'
        });
        loadDataJobs();
      } catch (error) {
        console.error('Error cancelling job:', error);
        setNotification({
          open: true,
          message: 'Failed to cancel job',
          severity: 'error'
        });
      }
    }
  };

  const handleDataJobsPageChange = (event: unknown, newPage: number) => {
    setDataJobsPage(newPage);
  };

  const handleDataJobsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDataJobsRowsPerPage(parseInt(event.target.value, 10));
    setDataJobsPage(0);
  };

  // Scheduled jobs functions
  const loadScheduledJobs = async () => {
    try {
      setIsScheduledJobLoading(true);
      const jobs = await dataInfrastructureService.getScheduledJobs();
      setScheduledJobs(jobs);
      setIsScheduledJobLoading(false);
    } catch (error) {
      console.error('Error loading scheduled jobs:', error);
      setNotification({
        open: true,
        message: 'Failed to load scheduled jobs',
        severity: 'error'
      });
      setIsScheduledJobLoading(false);
    }
  };

  const handleScheduledJobFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScheduledJobForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduledJobSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setScheduledJobForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleScheduledJobSubmit = async () => {
    try {
      const symbols = scheduledJobForm.symbols
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const formData = {
        data_type: scheduledJobForm.data_type,
        source: scheduledJobForm.source,
        schedule_type: scheduledJobForm.schedule_type,
        schedule_params: JSON.parse(scheduledJobForm.schedule_params),
        symbols: symbols.length > 0 ? symbols : undefined
      };

      await dataInfrastructureService.createScheduledJob(formData);
      setNotification({
        open: true,
        message: 'Scheduled job created successfully',
        severity: 'success'
      });

      setIsScheduledJobDialogOpen(false);
      loadScheduledJobs();
    } catch (error) {
      console.error('Error submitting scheduled job:', error);
      setNotification({
        open: true,
        message: 'Failed to save scheduled job',
        severity: 'error'
      });
    }
  };

  const handlePauseScheduledJob = async (jobId: string) => {
    try {
      await dataInfrastructureService.pauseScheduledJob(jobId);
      setNotification({
        open: true,
        message: 'Job paused successfully',
        severity: 'success'
      });
      loadScheduledJobs();
    } catch (error) {
      console.error('Error pausing job:', error);
      setNotification({
        open: true,
        message: 'Failed to pause job',
        severity: 'error'
      });
    }
  };

  const handleResumeScheduledJob = async (jobId: string) => {
    try {
      await dataInfrastructureService.resumeScheduledJob(jobId);
      setNotification({
        open: true,
        message: 'Job resumed successfully',
        severity: 'success'
      });
      loadScheduledJobs();
    } catch (error) {
      console.error('Error resuming job:', error);
      setNotification({
        open: true,
        message: 'Failed to resume job',
        severity: 'error'
      });
    }
  };

  const handleDeleteScheduledJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled job?')) {
      try {
        await dataInfrastructureService.deleteScheduledJob(jobId);
        setNotification({
          open: true,
          message: 'Scheduled job deleted successfully',
          severity: 'success'
        });
        loadScheduledJobs();
      } catch (error) {
        console.error('Error deleting scheduled job:', error);
        setNotification({
          open: true,
          message: 'Failed to delete scheduled job',
          severity: 'error'
        });
      }
    }
  };

  // Update logs functions
  const loadUpdateLogs = async () => {
    try {
      setIsUpdateLogsLoading(true);
      const logs = await dataInfrastructureService.getUpdateLogs();
      setUpdateLogs(logs);
      setIsUpdateLogsLoading(false);
    } catch (error) {
      console.error('Error loading update logs:', error);
      setNotification({
        open: true,
        message: 'Failed to load update logs',
        severity: 'error'
      });
      setIsUpdateLogsLoading(false);
    }
  };

  const handleUpdateLogsPageChange = (event: unknown, newPage: number) => {
    setUpdateLogsPage(newPage);
  };

  const handleUpdateLogsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUpdateLogsRowsPerPage(parseInt(event.target.value, 10));
    setUpdateLogsPage(0);
  };

  // Notification functions
  const handleCloseNotification = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  // Reset form functions
  const resetDataSourceForm = () => {
    setSelectedDataSource(null);
    setDataSourceForm({
      name: '',
      type: '',
      description: '',
      config: '{}',
      rate_limit: '',
      enabled: true
    });
  };

  const resetDataPipelineForm = () => {
    setSelectedDataPipeline(null);
    setDataPipelineForm({
      name: '',
      description: '',
      source_id: '',
      steps: '[]',
      schedule: '',
      schedule_params: '{}',
      enabled: true
    });
  };

  const resetScheduledJobForm = () => {
    setSelectedScheduledJob(null);
    setScheduledJobForm({
      data_type: '',
      source: '',
      schedule_type: 'daily',
      schedule_params: '{}',
      symbols: ''
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Data Management Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="data management tabs">
          <Tab label="Data Sources" {...a11yProps(0)} />
          <Tab label="Data Pipelines" {...a11yProps(1)} />
          <Tab label="Data Jobs" {...a11yProps(2)} />
          <Tab label="Scheduled Updates" {...a11yProps(3)} />
          <Tab label="Update Logs" {...a11yProps(4)} />
        </Tabs>
      </Box>

      {/* Data Sources Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Data Sources</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDataSources}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetDataSourceForm();
                setIsDataSourceDialogOpen(true);
              }}
            >
              Add Data Source
            </Button>
          </Box>
        </Box>

        {isDataSourceLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : dataSources.length === 0 ? (
          <Alert severity="info">No data sources found. Create one to get started.</Alert>
        ) : (
          <Grid container spacing={2}>
            {dataSources.map((source) => (
              <Grid item xs={12} md={6} lg={4} key={source.id}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{source.name}</Typography>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditDataSource(source)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteDataSource(source.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {source.type}
                  </Typography>
                  {source.description && (
                    <Typography variant="body2" paragraph>
                      {source.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Chip
                      label={source.enabled ? 'Enabled' : 'Disabled'}
                      color={source.enabled ? 'success' : 'default'}
                      size="small"
                    />
                    {source.rate_limit && (
                      <Chip
                        label={`Rate Limit: ${source.rate_limit}/min`}
                        color="primary"
                        size="small"
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Data Pipelines Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Data Pipelines</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadDataPipelines}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetDataPipelineForm();
                setIsDataPipelineDialogOpen(true);
              }}
            >
              Add Pipeline
            </Button>
          </Box>
        </Box>

        {isDataPipelineLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : dataPipelines.length === 0 ? (
          <Alert severity="info">No data pipelines found. Create one to get started.</Alert>
        ) : (
          <Grid container spacing={2}>
            {dataPipelines.map((pipeline) => (
              <Grid item xs={12} md={6} key={pipeline.id}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{pipeline.name}</Typography>
                    <Box>
                      <Tooltip title="Run Pipeline">
                        <IconButton onClick={() => handleRunDataPipeline(pipeline.name)} size="small" color="primary">
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditDataPipeline(pipeline)} size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteDataPipeline(pipeline.id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {pipeline.description || 'No description'}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Steps: {pipeline.steps.length}
                    </Typography>
                    {pipeline.schedule && (
                      <Typography variant="body2">
                        Schedule: {pipeline.schedule}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Chip
                      label={pipeline.enabled ? 'Enabled' : 'Disabled'}
                      color={pipeline.enabled ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(pipeline.last_updated).toLocaleString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Data Jobs Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Data Jobs</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadDataJobs}
          >
            Refresh
          </Button>
        </Box>

        {isDataJobsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : dataJobs.length === 0 ? (
          <Alert severity="info">No data jobs found. Run a pipeline to create jobs.</Alert>
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job ID</TableCell>
                    <TableCell>Pipeline</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>End Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataJobs
                    .slice(dataJobsPage * dataJobsRowsPerPage, dataJobsPage * dataJobsRowsPerPage + dataJobsRowsPerPage)
                    .map((job) => (
                      <TableRow key={job.job_id}>
                        <TableCell>{job.job_id}</TableCell>
                        <TableCell>{job.pipeline_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={job.status}
                            color={
                              job.status === 'completed' ? 'success' :
                              job.status === 'failed' ? 'error' :
                              job.status === 'running' ? 'primary' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(job.start_time).toLocaleString()}</TableCell>
                        <TableCell>
                          {job.end_time ? new Date(job.end_time).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {job.status === 'running' && (
                            <Tooltip title="Cancel Job">
                              <IconButton onClick={() => handleCancelDataJob(job.job_id)} size="small" color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={dataJobs.length}
              rowsPerPage={dataJobsRowsPerPage}
              page={dataJobsPage}
              onPageChange={handleDataJobsPageChange}
              onRowsPerPageChange={handleDataJobsRowsPerPageChange}
            />
          </Paper>
        )}
      </TabPanel>

      {/* Scheduled Updates Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Scheduled Updates</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadScheduledJobs}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetScheduledJobForm();
                setIsScheduledJobDialogOpen(true);
              }}
            >
              Schedule Update
            </Button>
          </Box>
        </Box>

        {isScheduledJobLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : scheduledJobs.length === 0 ? (
          <Alert severity="info">No scheduled updates found. Create one to get started.</Alert>
        ) : (
          <Grid container spacing={2}>
            {scheduledJobs.map((job) => (
              <Grid item xs={12} md={6} lg={4} key={job.job_id}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{job.name}</Typography>
                    <Box>
                      {job.status === 'active' ? (
                        <Tooltip title="Pause">
                          <IconButton onClick={() => handlePauseScheduledJob(job.job_id)} size="small">
                            <PauseIcon />
                          </IconButton>
                        </Tooltip>
                      ) : job.status === 'paused' ? (
                        <Tooltip title="Resume">
                          <IconButton onClick={() => handleResumeScheduledJob(job.job_id)} size="small" color="primary">
                            <ResumeIcon />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                      <Tooltip title="Delete">
                        <IconButton onClick={() => handleDeleteScheduledJob(job.job_id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {job.data_type} | Source: {job.source}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Schedule: {job.schedule_type}
                  </Typography>
                  {job.symbols && job.symbols.length > 0 && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        Symbols:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {job.symbols.slice(0, 5).map((symbol, index) => (
                          <Chip key={index} label={symbol} size="small" />
                        ))}
                        {job.symbols.length > 5 && (
                          <Chip label={`+${job.symbols.length - 5} more`} size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Chip
                      label={job.status}
                      color={job.status === 'active' ? 'success' : job.status === 'paused' ? 'warning' : 'default'}
                      size="small"
                    />
                    {job.next_run_time && (
                      <Typography variant="caption" color="text.secondary">
                        Next run: {new Date(job.next_run_time).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Update Logs Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Update Logs</Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUpdateLogs}
          >
            Refresh
          </Button>
        </Box>

        {isUpdateLogsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : updateLogs.length === 0 ? (
          <Alert severity="info">No update logs found.</Alert>
        ) : (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job ID</TableCell>
                    <TableCell>Data Type</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Time</TableCell>
                    <TableCell>Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updateLogs
                    .slice(updateLogsPage * updateLogsRowsPerPage, updateLogsPage * updateLogsRowsPerPage + updateLogsRowsPerPage)
                    .map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.job_id}</TableCell>
                        <TableCell>{log.data_type}</TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.status}
                            color={
                              log.status === 'completed' ? 'success' :
                              log.status === 'failed' ? 'error' :
                              log.status === 'running' ? 'primary' :
                              'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(log.start_time).toLocaleString()}</TableCell>
                        <TableCell>
                          {log.duration ? `${log.duration.toFixed(2)}s` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={updateLogs.length}
              rowsPerPage={updateLogsRowsPerPage}
              page={updateLogsPage}
              onPageChange={handleUpdateLogsPageChange}
              onRowsPerPageChange={handleUpdateLogsRowsPerPageChange}
            />
          </Paper>
        )}
      </TabPanel>

      {/* Data Source Dialog */}
      <Dialog
        open={isDataSourceDialogOpen}
        onClose={() => setIsDataSourceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDataSource ? 'Edit Data Source' : 'Add Data Source'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Name"
                value={dataSourceForm.name}
                onChange={handleDataSourceFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="type"
                label="Type"
                value={dataSourceForm.type}
                onChange={handleDataSourceFormChange}
                fullWidth
                required
                helperText="e.g., market_data, fundamental_data, alternative_data"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={dataSourceForm.description}
                onChange={handleDataSourceFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="rate_limit"
                label="Rate Limit (per minute)"
                value={dataSourceForm.rate_limit}
                onChange={handleDataSourceFormChange}
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="enabled-label">Enabled</InputLabel>
                <Select
                  labelId="enabled-label"
                  name="enabled"
                  value={dataSourceForm.enabled}
                  onChange={handleDataSourceSelectChange}
                  label="Enabled"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="config"
                label="Configuration (JSON)"
                value={dataSourceForm.config}
                onChange={handleDataSourceFormChange}
                fullWidth
                multiline
                rows={6}
                helperText="Enter configuration as JSON object"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDataSourceDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDataSourceSubmit} variant="contained">
            {selectedDataSource ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Pipeline Dialog */}
      <Dialog
        open={isDataPipelineDialogOpen}
        onClose={() => setIsDataPipelineDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDataPipeline ? 'Edit Data Pipeline' : 'Add Data Pipeline'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="name"
                label="Name"
                value={dataPipelineForm.name}
                onChange={handleDataPipelineFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="source_id"
                label="Source ID"
                value={dataPipelineForm.source_id}
                onChange={handleDataPipelineFormChange}
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={dataPipelineForm.description}
                onChange={handleDataPipelineFormChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="schedule"
                label="Schedule"
                value={dataPipelineForm.schedule}
                onChange={handleDataPipelineFormChange}
                fullWidth
                helperText="Cron expression or interval"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="pipeline-enabled-label">Enabled</InputLabel>
                <Select
                  labelId="pipeline-enabled-label"
                  name="enabled"
                  value={dataPipelineForm.enabled}
                  onChange={handleDataPipelineSelectChange}
                  label="Enabled"
                >
                  <MenuItem value={true}>Yes</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="steps"
                label="Pipeline Steps (JSON)"
                value={dataPipelineForm.steps}
                onChange={handleDataPipelineFormChange}
                fullWidth
                multiline
                rows={6}
                helperText="Enter pipeline steps as JSON array"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="schedule_params"
                label="Schedule Parameters (JSON)"
                value={dataPipelineForm.schedule_params}
                onChange={handleDataPipelineFormChange}
                fullWidth
                multiline
                rows={3}
                helperText="Enter schedule parameters as JSON object"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDataPipelineDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDataPipelineSubmit} variant="contained">
            {selectedDataPipeline ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scheduled Job Dialog */}
      <Dialog
        open={isScheduledJobDialogOpen}
        onClose={() => setIsScheduledJobDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Schedule Data Update</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="data-type-label">Data Type</InputLabel>
                <Select
                  labelId="data-type-label"
                  name="data_type"
                  value={scheduledJobForm.data_type}
                  onChange={handleScheduledJobSelectChange}
                  label="Data Type"
                >
                  <MenuItem value="market_data">Market Data</MenuItem>
                  <MenuItem value="fundamental_data">Fundamental Data</MenuItem>
                  <MenuItem value="alternative_sentiment">Alternative - Sentiment</MenuItem>
                  <MenuItem value="alternative_news">Alternative - News</MenuItem>
                  <MenuItem value="alternative_social_media">Alternative - Social Media</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="source"
                label="Source"
                value={scheduledJobForm.source}
                onChange={handleScheduledJobFormChange}
                fullWidth
                required
                helperText="e.g., fmp, yahoo, alpha_vantage"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="symbols"
                label="Symbols"
                value={scheduledJobForm.symbols}
                onChange={handleScheduledJobFormChange}
                fullWidth
                helperText="Comma-separated list of symbols (e.g., AAPL, MSFT, GOOGL)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel id="schedule-type-label">Schedule Type</InputLabel>
                <Select
                  labelId="schedule-type-label"
                  name="schedule_type"
                  value={scheduledJobForm.schedule_type}
                  onChange={handleScheduledJobSelectChange}
                  label="Schedule Type"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="interval">Interval</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="schedule_params"
                label="Schedule Parameters (JSON)"
                value={scheduledJobForm.schedule_params}
                onChange={handleScheduledJobFormChange}
                fullWidth
                helperText={
                  scheduledJobForm.schedule_type === 'daily' ? 'e.g., {"hour": 9, "minute": 30}' :
                  scheduledJobForm.schedule_type === 'weekly' ? 'e.g., {"day_of_week": 1, "hour": 9, "minute": 30}' :
                  scheduledJobForm.schedule_type === 'monthly' ? 'e.g., {"day": 1, "hour": 9, "minute": 30}' :
                  'e.g., {"hours": 1, "minutes": 30}'
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsScheduledJobDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduledJobSubmit} variant="contained">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DataManagementDashboard;