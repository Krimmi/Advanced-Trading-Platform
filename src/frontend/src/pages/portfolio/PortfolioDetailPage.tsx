import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  useTheme,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  AccountBalance,
  ArrowBack,
  Add,
  Edit,
  Delete,
  MoreVert,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Timeline,
  Insights,
  ShowChart
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';
import ValueChangeIndicator from '../../components/common/ValueChangeIndicator';
import StockChart from '../../components/common/StockChart';

// Services
import { portfolioService, marketService } from '../../services';

// Types
import { Portfolio, Position } from '../../services/portfolioService';

// Tab panel component
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `portfolio-tab-${index}`,
    'aria-controls': `portfolio-tabpanel-${index}`,
  };
}

const PortfolioDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [allocationData, setAllocationData] = useState<any[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog state
  const [addPositionDialogOpen, setAddPositionDialogOpen] = useState<boolean>(false);
  const [symbolInput, setSymbolInput] = useState<string>('');
  const [symbolOptions, setSymbolOptions] = useState<string[]>([]);
  const [symbolLoading, setSymbolLoading] = useState<boolean>(false);
  const [sharesInput, setSharesInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Fetch portfolio data on component mount
  useEffect(() => {
    if (!id) {
      setError('Portfolio ID is missing');
      setLoading(false);
      return;
    }
    
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch portfolio details
        const portfolioData = await portfolioService.getPortfolio(id);
        setPortfolio(portfolioData);
        
        // Fetch portfolio performance
        const performance = await portfolioService.getPortfolioPerformance(id, 'daily');
        setPerformanceData(performance);
        
        // Fetch portfolio allocation
        const allocation = await portfolioService.getPortfolioAllocation(id);
        setAllocationData(allocation);
        
        // Fetch risk metrics
        const risk = await portfolioService.getPortfolioRiskMetrics(id);
        setRiskMetrics(risk);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch portfolio data');
        setLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, [id]);
  
  // Handle symbol search
  const handleSymbolSearch = async (value: string) => {
    if (!value || value.length < 2) {
      setSymbolOptions([]);
      return;
    }
    
    try {
      setSymbolLoading(true);
      
      // In a real implementation, this would call an API to search for symbols
      // For now, we'll use a mock implementation
      setTimeout(() => {
        const mockOptions = [
          'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM'
        ].filter(option => option.toLowerCase().includes(value.toLowerCase()));
        
        setSymbolOptions(mockOptions);
        setSymbolLoading(false);
      }, 500);
    } catch (err) {
      setSymbolLoading(false);
    }
  };
  
  // Handle add position dialog open
  const handleAddPositionDialogOpen = () => {
    setAddPositionDialogOpen(true);
  };
  
  // Handle add position dialog close
  const handleAddPositionDialogClose = () => {
    setAddPositionDialogOpen(false);
    setSymbolInput('');
    setSharesInput('');
    setPriceInput('');
    setDateInput(new Date().toISOString().split('T')[0]);
  };
  
  // Handle add position
  const handleAddPosition = async () => {
    if (!id || !symbolInput || !sharesInput || !priceInput || !dateInput) return;
    
    try {
      const newPosition = await portfolioService.addPosition({
        portfolioId: id,
        symbol: symbolInput,
        shares: parseFloat(sharesInput),
        price: parseFloat(priceInput),
        date: dateInput
      });
      
      // Update portfolio with new position
      if (portfolio) {
        setPortfolio({
          ...portfolio,
          positions: [...portfolio.positions, newPosition]
        });
      }
      
      handleAddPositionDialogClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add position');
    }
  };
  
  // Handle position menu open
  const handlePositionMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, positionId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPositionId(positionId);
  };
  
  // Handle position menu close
  const handlePositionMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPositionId(null);
  };
  
  // Handle edit position
  const handleEditPosition = (positionId: string) => {
    // In a real implementation, this would open an edit dialog
    handlePositionMenuClose();
  };
  
  // Handle delete position
  const handleDeletePosition = async (positionId: string) => {
    if (!id) return;
    
    try {
      await portfolioService.removePosition(id, positionId);
      
      // Update portfolio by removing the deleted position
      if (portfolio) {
        setPortfolio({
          ...portfolio,
          positions: portfolio.positions.filter(p => p.id !== positionId)
        });
      }
      
      handlePositionMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete position');
    }
  };
  
  // Navigate back
  const handleBack = () => {
    navigate('/portfolio');
  };
  
  // Show loading state
  if (loading) {
    return <LoadingIndicator />;
  }
  
  // Show error state
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  // Show no data state
  if (!portfolio) {
    return <NoData message="Portfolio not found" />;
  }
  
  return (
    <Box>
      {/* Back button and header */}
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <PageHeader 
          title={portfolio.name}
          subtitle={portfolio.description || 'No description'}
          icon={<AccountBalance />}
          actions={
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddPositionDialogOpen}
            >
              Add Position
            </Button>
          }
        />
      </Box>
      
      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Value"
            value={portfolio.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            icon={<AccountBalance />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Today's Change"
            value={portfolio.dailyChange.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            change={portfolio.dailyChange}
            changePercent={portfolio.dailyChangePercent}
            icon={portfolio.dailyChange >= 0 ? <TrendingUp /> : <TrendingDown />}
            iconColor={portfolio.dailyChange >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Cash Balance"
            value={portfolio.cashBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            subtitle={`${((portfolio.cashBalance / portfolio.totalValue) * 100).toFixed(1)}% of portfolio`}
            icon={<ShowChart />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Positions"
            value={portfolio.positions.length.toString()}
            subtitle={`${portfolio.positions.filter(p => p.unrealizedPL > 0).length} profitable`}
            icon={<BarChart />}
          />
        </Grid>
      </Grid>
      
      {/* Portfolio Tabs */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="portfolio tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<ShowChart />} iconPosition="start" label="Holdings" {...a11yProps(0)} />
            <Tab icon={<Timeline />} iconPosition="start" label="Performance" {...a11yProps(1)} />
            <Tab icon={<PieChart />} iconPosition="start" label="Allocation" {...a11yProps(2)} />
            <Tab icon={<Insights />} iconPosition="start" label="Risk Analysis" {...a11yProps(3)} />
          </Tabs>
        </Box>
        
        {/* Holdings Tab */}
        <TabPanel value={tabValue} index={0}>
          {portfolio.positions.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Avg Cost</TableCell>
                    <TableCell align="right">Current Price</TableCell>
                    <TableCell align="right">Market Value</TableCell>
                    <TableCell align="right">Unrealized P/L</TableCell>
                    <TableCell align="right">Weight</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio.positions.map((position) => (
                    <TableRow key={position.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {position.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell>{position.companyName}</TableCell>
                      <TableCell align="right">{position.shares.toLocaleString()}</TableCell>
                      <TableCell align="right">
                        {position.averageCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell align="right">
                        {position.currentPrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell align="right">
                        {position.marketValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end">
                          <ValueChangeIndicator 
                            value={position.unrealizedPL} 
                            percentage={position.unrealizedPLPercent} 
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {(position.weight * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handlePositionMenuOpen(e, position.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <NoData 
              message="This portfolio has no positions" 
              actionText="Add Position"
              onAction={handleAddPositionDialogOpen}
            />
          )}
        </TabPanel>
        
        {/* Performance Tab */}
        <TabPanel value={tabValue} index={1}>
          {performanceData.length > 0 ? (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Portfolio Performance</Typography>
                <Box height={400}>
                  <StockChart 
                    data={performanceData} 
                    height={400} 
                    showVolume={false} 
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Daily"
                      value={`${portfolio.performance.daily >= 0 ? '+' : ''}${portfolio.performance.daily.toFixed(2)}%`}
                      iconColor={portfolio.performance.daily >= 0 ? 'success.main' : 'error.main'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Weekly"
                      value={`${portfolio.performance.weekly >= 0 ? '+' : ''}${portfolio.performance.weekly.toFixed(2)}%`}
                      iconColor={portfolio.performance.weekly >= 0 ? 'success.main' : 'error.main'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Monthly"
                      value={`${portfolio.performance.monthly >= 0 ? '+' : ''}${portfolio.performance.monthly.toFixed(2)}%`}
                      iconColor={portfolio.performance.monthly >= 0 ? 'success.main' : 'error.main'}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                      title="Yearly"
                      value={`${portfolio.performance.yearly >= 0 ? '+' : ''}${portfolio.performance.yearly.toFixed(2)}%`}
                      iconColor={portfolio.performance.yearly >= 0 ? 'success.main' : 'error.main'}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <NoData message="No performance data available" />
          )}
        </TabPanel>
        
        {/* Allocation Tab */}
        <TabPanel value={tabValue} index={2}>
          {allocationData.length > 0 ? (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Sector Allocation</Typography>
                <Box height={400}>
                  {/* Sector allocation chart would go here */}
                  <NoData message="Sector allocation chart visualization coming soon" />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Top Holdings</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell align="right">Weight</TableCell>
                        <TableCell align="right">Market Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {portfolio.positions
                        .sort((a, b) => b.weight - a.weight)
                        .slice(0, 5)
                        .map((position) => (
                          <TableRow key={position.id} hover>
                            <TableCell>
                              <Typography variant="body1" fontWeight="medium">
                                {position.symbol}
                              </Typography>
                            </TableCell>
                            <TableCell>{position.companyName}</TableCell>
                            <TableCell align="right">
                              {(position.weight * 100).toFixed(1)}%
                            </TableCell>
                            <TableCell align="right">
                              {position.marketValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          ) : (
            <NoData message="No allocation data available" />
          )}
        </TabPanel>
        
        {/* Risk Analysis Tab */}
        <TabPanel value={tabValue} index={3}>
          {riskMetrics ? (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Risk Metrics</Typography>
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            Volatility (Annual)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(riskMetrics.volatility * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            Sharpe Ratio
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {riskMetrics.sharpeRatio.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            Beta
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {riskMetrics.beta.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            Alpha (Annual)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(riskMetrics.alpha * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            Maximum Drawdown
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(riskMetrics.maxDrawdown * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            Value at Risk (95%)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {(riskMetrics.valueAtRisk * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Portfolio Optimization</Typography>
                <Box p={3} bgcolor="background.default" borderRadius={2}>
                  <Typography variant="body1" paragraph>
                    Based on our analysis, your portfolio could be optimized for better risk-adjusted returns.
                  </Typography>
                  
                  <Typography variant="subtitle1" gutterBottom>
                    Recommendations:
                  </Typography>
                  
                  <Box component="ul" sx={{ pl: 2 }}>
                    {riskMetrics.recommendations.map((rec: string, index: number) => (
                      <Box component="li" key={index} mb={1}>
                        <Typography variant="body1">{rec}</Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  <Box mt={2} display="flex" justifyContent="flex-end">
                    <Button variant="outlined">View Detailed Analysis</Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <NoData message="No risk metrics available" />
          )}
        </TabPanel>
      </Paper>
      
      {/* Position Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handlePositionMenuClose}
      >
        <MenuItem onClick={() => selectedPositionId && handleEditPosition(selectedPositionId)}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem 
          onClick={() => selectedPositionId && handleDeletePosition(selectedPositionId)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
      
      {/* Add Position Dialog */}
      <Dialog open={addPositionDialogOpen} onClose={handleAddPositionDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Position</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <Autocomplete
              autoFocus
              options={symbolOptions}
              loading={symbolLoading}
              onInputChange={(event, value) => {
                setSymbolInput(value);
                handleSymbolSearch(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Symbol"
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {symbolLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Shares"
              fullWidth
              variant="outlined"
              type="number"
              value={sharesInput}
              onChange={(e) => setSharesInput(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Price per Share"
              fullWidth
              variant="outlined"
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Purchase Date"
              fullWidth
              variant="outlined"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddPositionDialogClose}>Cancel</Button>
          <Button 
            onClick={handleAddPosition} 
            variant="contained" 
            disabled={!symbolInput || !sharesInput || !priceInput || !dateInput}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioDetailPage;