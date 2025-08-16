import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Badge,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

// Import chart components (assuming we're using recharts)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

// Import services and types
import { MLService } from '../../services';
import { 
  MLModel, 
  ModelStatus, 
  ModelType, 
  ModelVersion, 
  ModelMetrics, 
  ModelTrainingConfig 
} from '../../types/ml';

interface MLModelManagementPanelProps {
  onModelSelect?: (model: MLModel) => void;
  onModelDeploy?: (model: MLModel) => void;
  onModelCreate?: (model: MLModel) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ml-model-tabpanel-${index}`}
      aria-labelledby={`ml-model-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const MLModelManagementPanel: React.FC<MLModelManagementPanelProps> = ({
  onModelSelect,
  onModelDeploy,
  onModelCreate
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [models, setModels] = useState<MLModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelTypeFilter, setModelTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  
  // New model form state
  const [newModelName, setNewModelName] = useState('');
  const [newModelType, setNewModelType] = useState<ModelType>(ModelType.REGRESSION);
  const [newModelDescription, setNewModelDescription] = useState('');
  
  // Service instance
  const mlService = new MLService();
  
  // Fetch models on component mount
  useEffect(() => {
    fetchModels();
  }, []);
  
  // Fetch models from the API
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedModels = await mlService.getModels();
      setModels(fetchedModels);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError('Failed to fetch models. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search query change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };
  
  // Handle model type filter change
  const handleModelTypeFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setModelTypeFilter(event.target.value as string);
    setPage(0);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as string);
    setPage(0);
  };
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setPage(0);
  };
  
  // Handle model selection
  const handleModelSelect = (model: MLModel) => {
    setSelectedModel(model);
    if (onModelSelect) {
      onModelSelect(model);
    }
  };
  
  // Handle model creation dialog open
  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };
  
  // Handle model creation dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setNewModelName('');
    setNewModelType(ModelType.REGRESSION);
    setNewModelDescription('');
  };
  
  // Handle model creation
  const handleCreateModel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const newModel = await mlService.createModel({
        name: newModelName,
        type: newModelType,
        description: newModelDescription
      });
      
      setModels([...models, newModel]);
      setCreateDialogOpen(false);
      setNewModelName('');
      setNewModelType(ModelType.REGRESSION);
      setNewModelDescription('');
      
      if (onModelCreate) {
        onModelCreate(newModel);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error creating model:', err);
      setError('Failed to create model. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle model deletion dialog open
  const handleDeleteDialogOpen = (model: MLModel) => {
    setSelectedModel(model);
    setDeleteDialogOpen(true);
  };
  
  // Handle model deletion dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle model deletion
  const handleDeleteModel = async () => {
    if (!selectedModel) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await mlService.deleteModel(selectedModel.id);
      
      setModels(models.filter(model => model.id !== selectedModel.id));
      setDeleteDialogOpen(false);
      setSelectedModel(null);
      
      setLoading(false);
    } catch (err) {
      console.error('Error deleting model:', err);
      setError('Failed to delete model. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle model deployment dialog open
  const handleDeployDialogOpen = (model: MLModel) => {
    setSelectedModel(model);
    setDeployDialogOpen(true);
  };
  
  // Handle model deployment dialog close
  const handleDeployDialogClose = () => {
    setDeployDialogOpen(false);
  };
  
  // Handle model deployment
  const handleDeployModel = async () => {
    if (!selectedModel) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const deployedModel = await mlService.deployModel(selectedModel.id);
      
      // Update the model in the list
      setModels(models.map(model => 
        model.id === deployedModel.id ? deployedModel : model
      ));
      
      setDeployDialogOpen(false);
      
      if (onModelDeploy) {
        onModelDeploy(deployedModel);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error deploying model:', err);
      setError('Failed to deploy model. Please try again later.');
      setLoading(false);
    }
  };
  
  // Filter and sort models
  const filteredModels = models.filter(model => {
    // Filter by search query
    const matchesSearch = 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by model type
    const matchesType = modelTypeFilter === 'all' || model.type === modelTypeFilter;
    
    // Filter by status
    const matchesStatus = statusFilter === 'all' || model.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => {
    // Sort by selected column
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'accuracy':
        comparison = (a.metrics?.accuracy || 0) - (b.metrics?.accuracy || 0);
        break;
      case 'lastUpdated':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Paginate models
  const paginatedModels = filteredModels.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Get status color
  const getStatusColor = (status: ModelStatus) => {
    switch (status) {
      case ModelStatus.DEPLOYED:
        return theme.palette.success.main;
      case ModelStatus.TRAINING:
        return theme.palette.warning.main;
      case ModelStatus.FAILED:
        return theme.palette.error.main;
      case ModelStatus.DRAFT:
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: ModelStatus) => {
    switch (status) {
      case ModelStatus.DEPLOYED:
        return <CheckCircleIcon sx={{ color: getStatusColor(status) }} />;
      case ModelStatus.TRAINING:
        return <InfoIcon sx={{ color: getStatusColor(status) }} />;
      case ModelStatus.FAILED:
        return <ErrorIcon sx={{ color: getStatusColor(status) }} />;
      case ModelStatus.DRAFT:
        return <WarningIcon sx={{ color: getStatusColor(status) }} />;
      default:
        return null;
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Render model list
  const renderModelList = () => {
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              label="Search Models"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="model-type-filter-label">Model Type</InputLabel>
              <Select
                labelId="model-type-filter-label"
                id="model-type-filter"
                value={modelTypeFilter}
                label="Model Type"
                onChange={handleModelTypeFilterChange as any}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value={ModelType.REGRESSION}>Regression</MenuItem>
                <MenuItem value={ModelType.CLASSIFICATION}>Classification</MenuItem>
                <MenuItem value={ModelType.TIME_SERIES}>Time Series</MenuItem>
                <MenuItem value={ModelType.CLUSTERING}>Clustering</MenuItem>
                <MenuItem value={ModelType.REINFORCEMENT}>Reinforcement</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange as any}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value={ModelStatus.DEPLOYED}>Deployed</MenuItem>
                <MenuItem value={ModelStatus.TRAINING}>Training</MenuItem>
                <MenuItem value={ModelStatus.FAILED}>Failed</MenuItem>
                <MenuItem value={ModelStatus.DRAFT}>Draft</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateDialogOpen}
            >
              New Model
            </Button>
          </Box>
        </Box>
        
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleSortChange('name')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Name
                  {sortBy === 'name' && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </TableCell>
                <TableCell 
                  onClick={() => handleSortChange('type')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Type
                  {sortBy === 'type' && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </TableCell>
                <TableCell 
                  onClick={() => handleSortChange('status')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Status
                  {sortBy === 'status' && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </TableCell>
                <TableCell 
                  onClick={() => handleSortChange('accuracy')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                  align="right"
                >
                  Accuracy
                  {sortBy === 'accuracy' && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </TableCell>
                <TableCell 
                  onClick={() => handleSortChange('lastUpdated')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Last Updated
                  {sortBy === 'lastUpdated' && (
                    <Box component="span" sx={{ ml: 0.5 }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </Box>
                  )}
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <LinearProgress />
                  </TableCell>
                </TableRow>
              ) : paginatedModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No models found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModels.map((model) => (
                  <TableRow 
                    key={model.id}
                    hover
                    onClick={() => handleModelSelect(model)}
                    sx={{ 
                      cursor: 'pointer',
                      bgcolor: selectedModel?.id === model.id ? 
                        alpha(theme.palette.primary.main, 0.1) : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {model.name}
                        </Typography>
                        {model.isProduction && (
                          <Chip 
                            label="Production" 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1, fontSize: '0.7rem' }} 
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {model.description.length > 50 ? 
                          model.description.substring(0, 50) + '...' : 
                          model.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.type} 
                        size="small" 
                        sx={{ fontSize: '0.7rem' }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(model.status)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {model.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      {model.metrics?.accuracy ? 
                        `${(model.metrics.accuracy * 100).toFixed(2)}%` : 
                        'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatDate(model.updatedAt)}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModelSelect(model);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {model.status !== ModelStatus.DEPLOYED && (
                          <Tooltip title="Deploy Model">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeployDialogOpen(model);
                              }}
                              disabled={model.status === ModelStatus.TRAINING}
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete Model">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDialogOpen(model);
                            }}
                            disabled={model.isProduction}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredModels.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    );
  };
  
  // Render model details
  const renderModelDetails = () => {
    if (!selectedModel) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 3
        }}>
          <Typography variant="body1" color="text.secondary">
            Select a model to view details
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Card sx={{ mb: 2 }}>
          <CardHeader 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6">{selectedModel.name}</Typography>
                {selectedModel.isProduction && (
                  <Chip 
                    label="Production" 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Box>
            }
            subheader={
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Chip 
                  label={selectedModel.type} 
                  size="small" 
                  sx={{ mr: 1, fontSize: '0.7rem' }} 
                />
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getStatusIcon(selectedModel.status)}
                  <Typography variant="body2" sx={{ ml: 0.5 }}>
                    {selectedModel.status}
                  </Typography>
                </Box>
              </Box>
            }
            action={
              <Box>
                {selectedModel.status !== ModelStatus.DEPLOYED && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleDeployDialogOpen(selectedModel)}
                    disabled={selectedModel.status === ModelStatus.TRAINING}
                    sx={{ mr: 1 }}
                  >
                    Deploy
                  </Button>
                )}
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2">
                  {selectedModel.description || 'No description provided'}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Model Information
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">ID</TableCell>
                          <TableCell>{selectedModel.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Created</TableCell>
                          <TableCell>{formatDate(selectedModel.createdAt)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Last Updated</TableCell>
                          <TableCell>{formatDate(selectedModel.updatedAt)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Framework</TableCell>
                          <TableCell>{selectedModel.framework || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Version</TableCell>
                          <TableCell>{selectedModel.version || '1.0.0'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Metrics
                </Typography>
                {selectedModel.metrics ? (
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="caption" color="text.secondary">
                              Accuracy
                            </Typography>
                            <Typography variant="h6">
                              {(selectedModel.metrics.accuracy * 100).toFixed(2)}%
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="caption" color="text.secondary">
                              F1 Score
                            </Typography>
                            <Typography variant="h6">
                              {selectedModel.metrics.f1Score?.toFixed(3) || 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="caption" color="text.secondary">
                              Precision
                            </Typography>
                            <Typography variant="h6">
                              {selectedModel.metrics.precision?.toFixed(3) || 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                            <Typography variant="caption" color="text.secondary">
                              Recall
                            </Typography>
                            <Typography variant="h6">
                              {selectedModel.metrics.recall?.toFixed(3) || 'N/A'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Training History
                      </Typography>
                      <Box sx={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={selectedModel.trainingHistory || []}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="epoch" />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="accuracy" 
                              name="Training Accuracy" 
                              stroke={theme.palette.primary.main} 
                              activeDot={{ r: 8 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="val_accuracy" 
                              name="Validation Accuracy" 
                              stroke={theme.palette.secondary.main} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 3
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No metrics available for this model
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Versions" />
            <Tab label="Features" />
            <Tab label="Predictions" />
            <Tab label="Logs" />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Model Versions
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Version</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Accuracy</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedModel.versions?.length ? (
                    selectedModel.versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {version.version}
                            </Typography>
                            {version.isProduction && (
                              <Chip 
                                label="Production" 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1, fontSize: '0.7rem' }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(version.status)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {version.status}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {version.metrics?.accuracy ? 
                            `${(version.metrics.accuracy * 100).toFixed(2)}%` : 
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatDate(version.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Tooltip title="Compare">
                              <IconButton size="small">
                                <CompareArrowsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Deploy Version">
                              <IconButton 
                                size="small"
                                disabled={version.status !== ModelStatus.READY}
                              >
                                <PlayArrowIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton size="small">
                                <CloudDownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No versions available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Feature Importance
            </Typography>
            {selectedModel.featureImportance?.length ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedModel.featureImportance
                      .sort((a, b) => b.importance - a.importance)
                      .slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="feature" 
                      width={100}
                    />
                    <RechartsTooltip />
                    <Bar 
                      dataKey="importance" 
                      name="Importance" 
                      fill={theme.palette.primary.main} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3
              }}>
                <Typography variant="body2" color="text.secondary">
                  No feature importance data available
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recent Predictions
            </Typography>
            {selectedModel.recentPredictions?.length ? (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Input</TableCell>
                      <TableCell>Prediction</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Actual</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedModel.recentPredictions.map((prediction, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(prediction.timestamp)}</TableCell>
                        <TableCell>
                          {typeof prediction.input === 'object' ? 
                            JSON.stringify(prediction.input).substring(0, 30) + '...' : 
                            prediction.input}
                        </TableCell>
                        <TableCell>{prediction.prediction}</TableCell>
                        <TableCell>
                          {prediction.confidence ? 
                            `${(prediction.confidence * 100).toFixed(2)}%` : 
                            'N/A'}
                        </TableCell>
                        <TableCell>
                          {prediction.actual !== undefined ? 
                            prediction.actual : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3
              }}>
                <Typography variant="body2" color="text.secondary">
                  No prediction data available
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Model Logs
            </Typography>
            {selectedModel.logs?.length ? (
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedModel.logs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={log.level} 
                            size="small" 
                            color={
                              log.level === 'ERROR' ? 'error' : 
                              log.level === 'WARNING' ? 'warning' : 
                              log.level === 'INFO' ? 'info' : 
                              'default'
                            }
                            sx={{ fontSize: '0.7rem' }} 
                          />
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 3
              }}>
                <Typography variant="body2" color="text.secondary">
                  No logs available
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Box>
    );
  };
  
  // Create model dialog
  const renderCreateModelDialog = () => (
    <Dialog open={createDialogOpen} onClose={handleCreateDialogClose}>
      <DialogTitle>Create New Model</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Create a new machine learning model. You can configure the model type and other settings.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Model Name"
          type="text"
          fullWidth
          variant="outlined"
          value={newModelName}
          onChange={(e) => setNewModelName(e.target.value)}
          sx={{ mt: 2 }}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel id="model-type-label">Model Type</InputLabel>
          <Select
            labelId="model-type-label"
            id="model-type"
            value={newModelType}
            label="Model Type"
            onChange={(e) => setNewModelType(e.target.value as ModelType)}
          >
            <MenuItem value={ModelType.REGRESSION}>Regression</MenuItem>
            <MenuItem value={ModelType.CLASSIFICATION}>Classification</MenuItem>
            <MenuItem value={ModelType.TIME_SERIES}>Time Series</MenuItem>
            <MenuItem value={ModelType.CLUSTERING}>Clustering</MenuItem>
            <MenuItem value={ModelType.REINFORCEMENT}>Reinforcement</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          id="description"
          label="Description"
          type="text"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={newModelDescription}
          onChange={(e) => setNewModelDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreateDialogClose}>Cancel</Button>
        <Button 
          onClick={handleCreateModel}
          variant="contained"
          disabled={!newModelName}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Delete model dialog
  const renderDeleteModelDialog = () => (
    <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
      <DialogTitle>Delete Model</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the model "{selectedModel?.name}"? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeleteDialogClose}>Cancel</Button>
        <Button 
          onClick={handleDeleteModel}
          variant="contained"
          color="error"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Deploy model dialog
  const renderDeployModelDialog = () => (
    <Dialog open={deployDialogOpen} onClose={handleDeployDialogClose}>
      <DialogTitle>Deploy Model</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to deploy the model "{selectedModel?.name}"? This will make the model available for predictions.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleDeployDialogClose}>Cancel</Button>
        <Button 
          onClick={handleDeployModel}
          variant="contained"
          color="primary"
        >
          Deploy
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">ML Model Management</Typography>
        <Box>
          <IconButton onClick={fetchModels} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
          >
            New Model
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={selectedModel ? 5 : 12} sx={{ height: '100%' }}>
          {renderModelList()}
        </Grid>
        {selectedModel && (
          <Grid item xs={12} md={7} sx={{ height: '100%' }}>
            {renderModelDetails()}
          </Grid>
        )}
      </Grid>
      
      {renderCreateModelDialog()}
      {renderDeleteModelDialog()}
      {renderDeployModelDialog()}
    </Box>
  );
};

export default MLModelManagementPanel;