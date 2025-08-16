import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon
} from '@mui/icons-material';

// Components
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ChartContainer from '../../components/common/ChartContainer';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Store
import { RootState } from '../../store';
import { 
  fetchPortfolioSummary, 
  createPortfolio, 
  deletePortfolio, 
  setActivePortfolio,
  PortfolioSummary
} from '../../store/slices/portfolioSlice';

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
      id={`portfolio-tabpanel-${index}`}
      aria-labelledby={`portfolio-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PortfolioPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');
  
  // Redux state
  const { portfolioSummaries, activePortfolioId, loading, error } = useSelector((state: RootState) => state.portfolio);
  
  // Load portfolio data
  useEffect(() => {
    dispatch(fetchPortfolioSummary() as any);
  }, [dispatch]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchPortfolioSummary() as any);
  };
  
  // Handle portfolio click
  const handlePortfolioClick = (portfolioId: string) => {
    navigate(`/portfolio/${portfolioId}`);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, portfolioId: string) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedPortfolioId(portfolioId);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPortfolioId(null);
  };
  
  // Handle set active portfolio
  const handleSetActivePortfolio = (portfolioId: string) => {
    dispatch(setActivePortfolio(portfolioId));
    handleMenuClose();
  };
  
  // Handle edit portfolio
  const handleEditPortfolio = (portfolioId: string) => {
    navigate(`/portfolio/${portfolioId}/edit`);
    handleMenuClose();
  };
  
  // Handle duplicate portfolio
  const handleDuplicatePortfolio = (portfolioId: string) => {
    // TODO: Implement duplicate portfolio functionality
    handleMenuClose();
  };
  
  // Handle delete portfolio
  const handleDeletePortfolioConfirm = () => {
    if (selectedPortfolioId) {
      dispatch(deletePortfolio(selectedPortfolioId) as any);
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };
  
  // Handle create portfolio
  const handleCreatePortfolioConfirm = () => {
    if (newPortfolioName.trim()) {
      dispatch(createPortfolio({
        name: newPortfolioName.trim(),
        description: newPortfolioDescription.trim() || undefined,
      }) as any);
      setNewPortfolioName('');
      setNewPortfolioDescription('');
      setCreateDialogOpen(false);
    }
  };
  
  // Render loading state
  if (loading && portfolioSummaries.length === 0) {
    return <LoadingIndicator message="Loading portfolios..." />;
  }
  
  // Render error state
  if (error && portfolioSummaries.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading portfolios
        </Typography>
        <Typography color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Portfolios
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your investment portfolios
          </Typography>
        </Box>
        
        <Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            variant="outlined"
            sx={{ mr: 1 }}
            disabled={loading}
          >
            Refresh
          </Button>
          
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setCreateDialogOpen(true)}
          >
            New Portfolio
          </Button>
        </Box>
      </Box>
      
      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {portfolioSummaries.map((portfolio) => (
          <Grid item xs={12} md={6} lg={4} key={portfolio.id}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                  cursor: 'pointer',
                },
                ...(portfolio.id === activePortfolioId && {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
                }),
              }}
              onClick={() => handlePortfolioClick(portfolio.id)}
            >
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {portfolio.name}
                  </Typography>
                  
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, portfolio.id)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ${portfolio.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {portfolio.dayChange >= 0 ? (
                    <>
                      <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                        +${portfolio.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{portfolio.dayChangePercent.toFixed(2)}%)
                      </Typography>
                    </>
                  ) : (
                    <>
                      <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 'medium' }}>
                        ${portfolio.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolio.dayChangePercent.toFixed(2)}%)
                      </Typography>
                    </>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    Today
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Gain/Loss
                    </Typography>
                    <Typography
                      variant="body2"
                      color={portfolio.totalGain >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 'medium' }}
                    >
                      {portfolio.totalGain >= 0 ? '+' : ''}${portfolio.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolio.totalGainPercent.toFixed(2)}%)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Positions
                    </Typography>
                    <Typography variant="body2">
                      {portfolio.positionCount}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Top Holdings
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {portfolio.topPositions.map((position) => (
                      <Chip
                        key={position.symbol}
                        label={`${position.symbol} ${position.weight.toFixed(1)}%`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              
              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button size="small" onClick={(e) => { e.stopPropagation(); handlePortfolioClick(portfolio.id); }}>
                  View Details
                </Button>
                {portfolio.id === activePortfolioId && (
                  <Chip
                    label="Active"
                    color="primary"
                    size="small"
                    sx={{ ml: 'auto' }}
                  />
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
        
        {/* Add Portfolio Card */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: 2,
              border: `1px dashed ${theme.palette.divider}`,
              py: 6,
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                cursor: 'pointer',
              },
            }}
            onClick={() => setCreateDialogOpen(true)}
          >
            <AddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Create New Portfolio
            </Typography>
          </Card>
        </Grid>
      </Grid>
      
      {/* Portfolio Analytics */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Portfolio Analytics
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="portfolio analytics tabs"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<AccountBalanceIcon />} label="Allocation" />
            <Tab icon={<TrendingUpIcon />} label="Performance" />
            <Tab icon={<SwapHorizIcon />} label="Transactions" />
            <Tab icon={<AssessmentIcon />} label="Risk Analysis" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Asset Allocation"
                  subtitle="Distribution by asset class"
                  height={300}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Asset Allocation Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Sector Allocation"
                  subtitle="Distribution by sector"
                  height={300}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Sector Allocation Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <ErrorBoundary>
            <ChartContainer
              title="Portfolio Performance"
              subtitle="Historical performance vs benchmark"
              height={400}
            >
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  [Performance Chart - Placeholder]
                </Typography>
              </Box>
            </ChartContainer>
          </ErrorBoundary>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" paragraph>
              Transaction history will be implemented in the next phase.
            </Typography>
            <Button variant="outlined">
              View Transactions
            </Button>
          </Paper>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              textAlign: 'center'
            }}
          >
            <Typography variant="body1" paragraph>
              Risk analysis will be implemented in the next phase.
            </Typography>
            <Button variant="outlined">
              View Risk Analysis
            </Button>
          </Paper>
        </TabPanel>
      </Box>
      
      {/* Portfolio Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => selectedPortfolioId && handleSetActivePortfolio(selectedPortfolioId)}>
          <ListItemIcon>
            <AccountBalanceIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Set as Active</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedPortfolioId && handleEditPortfolio(selectedPortfolioId)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedPortfolioId && handleDuplicatePortfolio(selectedPortfolioId)}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Create Portfolio Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            fullWidth
            variant="outlined"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newPortfolioDescription}
            onChange={(e) => setNewPortfolioDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePortfolioConfirm}
            variant="contained"
            disabled={!newPortfolioName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Portfolio Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Portfolio</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this portfolio? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeletePortfolioConfirm}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioPage;