import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  alpha
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  AccountBalance as AccountBalanceIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

// Components
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ChartContainer from '../../components/common/ChartContainer';
import DataTable from '../../components/common/DataTable';
import ErrorBoundary from '../../components/common/ErrorBoundary';

// Store
import { RootState } from '../../store';
import { 
  fetchPortfolio, 
  updatePortfolio, 
  deletePortfolio,
  setActivePortfolio,
  Position
} from '../../store/slices/portfolioSlice';

// Types
import { Column } from '../../components/common/DataTable';

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

const PortfolioDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL'>('1M');
  
  // Redux state
  const { portfolios, activePortfolioId, loading, error } = useSelector((state: RootState) => state.portfolio);
  const portfolio = id ? portfolios[id] : undefined;
  
  // Load portfolio data
  useEffect(() => {
    if (id) {
      dispatch(fetchPortfolio(id) as any);
    }
  }, [dispatch, id]);
  
  // Update local state when portfolio data changes
  useEffect(() => {
    if (portfolio) {
      setPortfolioName(portfolio.name);
      setPortfolioDescription(portfolio.description || '');
    }
  }, [portfolio]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    if (id) {
      dispatch(fetchPortfolio(id) as any);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    navigate('/portfolio');
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle set active portfolio
  const handleSetActivePortfolio = () => {
    if (id) {
      dispatch(setActivePortfolio(id));
    }
    handleMenuClose();
  };
  
  // Handle edit portfolio
  const handleEditPortfolioOpen = () => {
    setEditDialogOpen(true);
    handleMenuClose();
  };
  
  // Handle edit portfolio confirm
  const handleEditPortfolioConfirm = () => {
    if (id && portfolioName.trim()) {
      dispatch(updatePortfolio({
        portfolioId: id,
        data: {
          name: portfolioName.trim(),
          description: portfolioDescription.trim() || undefined,
        },
      }) as any);
      setEditDialogOpen(false);
    }
  };
  
  // Handle duplicate portfolio
  const handleDuplicatePortfolio = () => {
    // TODO: Implement duplicate portfolio functionality
    handleMenuClose();
  };
  
  // Handle delete portfolio
  const handleDeletePortfolioConfirm = () => {
    if (id) {
      dispatch(deletePortfolio(id) as any);
      navigate('/portfolio');
    }
    setDeleteDialogOpen(false);
    handleMenuClose();
  };
  
  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'YTD' | 'ALL') => {
    setTimeframe(newTimeframe);
  };
  
  // Filter positions based on search term
  const filteredPositions = portfolio?.positions.filter(position => {
    if (!searchTerm) return true;
    
    return (
      position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }) || [];
  
  // Position table columns
  const positionColumns: Column<Position>[] = [
    {
      id: 'symbol',
      label: 'Symbol',
      width: '10%',
      format: (value) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight="medium">
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      width: '20%',
    },
    {
      id: 'quantity',
      label: 'Quantity',
      numeric: true,
      width: '10%',
      format: (value) => value.toLocaleString(),
    },
    {
      id: 'currentPrice',
      label: 'Price',
      numeric: true,
      width: '10%',
      format: (value) => `$${value.toFixed(2)}`,
    },
    {
      id: 'marketValue',
      label: 'Market Value',
      numeric: true,
      width: '15%',
      format: (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      id: 'unrealizedPL',
      label: 'Unrealized P/L',
      numeric: true,
      width: '15%',
      format: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <Typography
            variant="body2"
            color={value >= 0 ? 'success.main' : 'error.main'}
          >
            {value >= 0 ? '+' : ''}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({row.unrealizedPLPercent >= 0 ? '+' : ''}{row.unrealizedPLPercent.toFixed(2)}%)
          </Typography>
        </Box>
      ),
    },
    {
      id: 'dayChange',
      label: 'Day Change',
      numeric: true,
      width: '15%',
      format: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {value > 0 ? (
            <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
          ) : (
            <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
          )}
          <Typography
            variant="body2"
            color={value > 0 ? 'success.main' : 'error.main'}
          >
            {value > 0 ? '+' : ''}{value.toFixed(2)}%
          </Typography>
        </Box>
      ),
    },
    {
      id: 'weight',
      label: 'Weight',
      numeric: true,
      width: '10%',
      format: (value) => `${value.toFixed(2)}%`,
    },
  ];
  
  // Render loading state
  if (loading && !portfolio) {
    return <LoadingIndicator message={`Loading portfolio details...`} />;
  }
  
  // Render error state
  if (error && !portfolio) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading portfolio
        </Typography>
        <Typography color="text.secondary" paragraph>
          {error}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Portfolios
          </Button>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }
  
  // Render not found state
  if (!loading && !portfolio) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Portfolio not found
        </Typography>
        <Typography color="text.secondary" paragraph>
          The portfolio you're looking for doesn't exist or has been deleted.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Portfolios
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Portfolios
        </Button>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="h4" component="h1">
                {portfolio?.name}
              </Typography>
              {id === activePortfolioId && (
                <Chip
                  label="Active"
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Box>
            
            {portfolio?.description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {portfolio.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mr: 2 }}>
                ${portfolio?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {portfolio && portfolio.dayChange >= 0 ? (
                  <>
                    <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'medium' }}>
                      +${portfolio.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{portfolio.dayChangePercent.toFixed(2)}%)
                    </Typography>
                  </>
                ) : (
                  <>
                    <TrendingDownIcon color="error" sx={{ mr: 0.5 }} />
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 'medium' }}>
                      ${portfolio?.dayChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolio?.dayChangePercent.toFixed(2)}%)
                    </Typography>
                  </>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Today
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {portfolio ? (
                `Last updated: ${new Date(portfolio.updatedAt).toLocaleString()}`
              ) : (
                'Loading portfolio data...'
              )}
            </Typography>
          </Box>
          
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              variant="outlined"
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            <Button
              startIcon={<MoreVertIcon />}
              variant="outlined"
              onClick={handleMenuOpen}
            >
              Actions
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* Portfolio Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Total Value
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              ${portfolio?.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {portfolio && portfolio.totalGain >= 0 ? (
                <>
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'medium' }}>
                    +${portfolio.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{portfolio.totalGainPercent.toFixed(2)}%)
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 'medium' }}>
                    ${portfolio?.totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({portfolio?.totalGainPercent.toFixed(2)}%)
                  </Typography>
                </>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                All Time
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SwapHorizIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Cash Balance
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              ${portfolio?.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {((portfolio?.cashBalance || 0) / (portfolio?.totalValue || 1) * 100).toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                of Portfolio
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AssessmentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Risk Metrics
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {portfolio?.risk.beta.toFixed(2)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Beta
              </Typography>
              <Tooltip title="Portfolio volatility relative to the market">
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  vs. S&P 500
                </Typography>
              </Tooltip>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PieChartIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" color="text.secondary">
                Positions
              </Typography>
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {portfolio?.positions.length}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Button size="small" variant="text">
                Add Position
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Portfolio Performance Chart */}
      <ErrorBoundary>
        <Box sx={{ mb: 4 }}>
          <ChartContainer
            title="Portfolio Performance"
            subtitle="Historical performance vs benchmark"
            height={400}
            onRefresh={handleRefresh}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
              {(['1D', '1W', '1M', '3M', '1Y', 'YTD', 'ALL'] as const).map((tf) => (
                <Chip
                  key={tf}
                  label={tf}
                  color={timeframe === tf ? 'primary' : 'default'}
                  variant={timeframe === tf ? 'filled' : 'outlined'}
                  onClick={() => handleTimeframeChange(tf)}
                  size="small"
                />
              ))}
            </Box>
            
            <Box sx={{ height: 'calc(100% - 40px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                [Portfolio Performance Chart - Placeholder]
              </Typography>
            </Box>
          </ChartContainer>
        </Box>
      </ErrorBoundary>
      
      {/* Portfolio Details Tabs */}
      <Box sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="portfolio details tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Holdings" />
          <Tab label="Allocation" />
          <Tab label="Performance" />
          <Tab label="Risk Analysis" />
          <Tab label="Transactions" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search holdings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 250 }}
            />
            
            <Button
              startIcon={<AddIcon />}
              variant="contained"
            >
              Add Position
            </Button>
          </Box>
          
          <DataTable
            columns={positionColumns}
            data={filteredPositions}
            onRowClick={(position) => navigate(`/market/${position.symbol}`)}
            getRowId={(row) => row.symbol}
            emptyMessage="No positions found"
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Sector Allocation"
                  subtitle="Distribution by sector"
                  height={350}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Sector Allocation Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Asset Class Allocation"
                  subtitle="Distribution by asset class"
                  height={350}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Asset Class Allocation Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12}>
              <ErrorBoundary>
                <ChartContainer
                  title="Geographic Allocation"
                  subtitle="Distribution by region"
                  height={350}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Geographic Allocation Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ErrorBoundary>
                <ChartContainer
                  title="Historical Performance"
                  subtitle="Portfolio vs benchmark"
                  height={400}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Historical Performance Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Monthly Returns"
                  subtitle="Performance by month"
                  height={350}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Monthly Returns Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Drawdown Analysis"
                  subtitle="Historical drawdowns"
                  height={350}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Drawdown Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  height: '100%'
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Risk Metrics
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Beta
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {portfolio?.risk.beta.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Volatility
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {portfolio?.risk.volatility.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {portfolio?.risk.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Max Drawdown
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {portfolio?.risk.drawdown.toFixed(2)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Value at Risk (95%)
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {portfolio?.risk.var.toFixed(2)}%
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <ErrorBoundary>
                <ChartContainer
                  title="Correlation Matrix"
                  subtitle="Correlation with market indices"
                  height={350}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Correlation Matrix Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
            <Grid item xs={12}>
              <ErrorBoundary>
                <ChartContainer
                  title="Risk vs. Return"
                  subtitle="Portfolio positioning"
                  height={400}
                >
                  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      [Risk vs. Return Chart - Placeholder]
                    </Typography>
                  </Box>
                </ChartContainer>
              </ErrorBoundary>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
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
      </Box>
      
      {/* Portfolio Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleSetActivePortfolio}>
          <ListItemIcon>
            <StarIcon fontSize="small" color={id === activePortfolioId ? 'primary' : 'inherit'} />
          </ListItemIcon>
          <ListItemText>{id === activePortfolioId ? 'Active Portfolio' : 'Set as Active'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEditPortfolioOpen}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Portfolio</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDuplicatePortfolio}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate Portfolio</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Portfolio</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Edit Portfolio Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Portfolio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Portfolio Name"
            fullWidth
            variant="outlined"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditPortfolioConfirm}
            variant="contained"
            disabled={!portfolioName.trim()}
          >
            Save
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

export default PortfolioDetailPage;