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
  Divider,
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
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Add,
  AccountBalance,
  MoreVert,
  Delete,
  Edit,
  ContentCopy,
  BarChart,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import StatsCard from '../../components/common/StatsCard';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';
import ValueChangeIndicator from '../../components/common/ValueChangeIndicator';

// Services
import { portfolioService } from '../../services';

// Types
import { Portfolio, Position } from '../../services/portfolioService';

const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [totalChange, setTotalChange] = useState<number>(0);
  const [totalChangePercent, setTotalChangePercent] = useState<number>(0);
  
  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newPortfolioName, setNewPortfolioName] = useState<string>('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState<string>('');
  const [newPortfolioCash, setNewPortfolioCash] = useState<string>('10000');
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  
  // Fetch portfolios on component mount
  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await portfolioService.getPortfolios();
        setPortfolios(data);
        
        // Calculate totals
        let totalVal = 0;
        let totalChg = 0;
        let weightedChangePercent = 0;
        
        data.forEach(portfolio => {
          totalVal += portfolio.totalValue;
          totalChg += portfolio.dailyChange;
          weightedChangePercent += (portfolio.dailyChangePercent * portfolio.totalValue);
        });
        
        setTotalValue(totalVal);
        setTotalChange(totalChg);
        setTotalChangePercent(totalVal > 0 ? weightedChangePercent / totalVal : 0);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch portfolios');
        setLoading(false);
      }
    };
    
    fetchPortfolios();
  }, []);
  
  // Handle portfolio menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, portfolioId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPortfolioId(portfolioId);
  };
  
  // Handle portfolio menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPortfolioId(null);
  };
  
  // Handle create portfolio dialog open
  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };
  
  // Handle create portfolio dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setNewPortfolioName('');
    setNewPortfolioDescription('');
    setNewPortfolioCash('10000');
  };
  
  // Handle create portfolio
  const handleCreatePortfolio = async () => {
    if (!newPortfolioName) return;
    
    try {
      const newPortfolio = await portfolioService.createPortfolio({
        name: newPortfolioName,
        description: newPortfolioDescription,
        initialCash: parseFloat(newPortfolioCash)
      });
      
      setPortfolios([...portfolios, newPortfolio]);
      handleCreateDialogClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create portfolio');
    }
  };
  
  // Handle view portfolio
  const handleViewPortfolio = (portfolioId: string) => {
    navigate(`/portfolio/${portfolioId}`);
  };
  
  // Handle edit portfolio
  const handleEditPortfolio = (portfolioId: string) => {
    navigate(`/portfolio/${portfolioId}/edit`);
    handleMenuClose();
  };
  
  // Handle delete portfolio
  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await portfolioService.deletePortfolio(portfolioId);
      setPortfolios(portfolios.filter(p => p.id !== portfolioId));
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete portfolio');
    }
  };
  
  // Handle duplicate portfolio
  const handleDuplicatePortfolio = async (portfolioId: string) => {
    try {
      const portfolioToDuplicate = portfolios.find(p => p.id === portfolioId);
      
      if (!portfolioToDuplicate) return;
      
      const newPortfolio = await portfolioService.createPortfolio({
        name: `${portfolioToDuplicate.name} (Copy)`,
        description: portfolioToDuplicate.description,
        initialCash: portfolioToDuplicate.cashBalance
      });
      
      // In a real implementation, we would also copy the positions
      
      setPortfolios([...portfolios, newPortfolio]);
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate portfolio');
    }
  };
  
  // Show loading state
  if (loading) {
    return <LoadingIndicator />;
  }
  
  // Show error state
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  return (
    <Box>
      <PageHeader 
        title="Portfolios" 
        subtitle="Manage and track your investment portfolios"
        icon={<AccountBalance />}
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateDialogOpen}
          >
            Create Portfolio
          </Button>
        }
      />
      
      {/* Portfolio Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Portfolio Value"
            value={totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            icon={<AccountBalance />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Today's Change"
            value={totalChange.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            change={totalChange}
            changePercent={totalChangePercent}
            icon={totalChange >= 0 ? <TrendingUp /> : <TrendingDown />}
            iconColor={totalChange >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Number of Portfolios"
            value={portfolios.length.toString()}
            icon={<BarChart />}
          />
        </Grid>
      </Grid>
      
      {/* Portfolios List */}
      {portfolios.length > 0 ? (
        <Grid container spacing={3}>
          {portfolios.map((portfolio) => (
            <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleViewPortfolio(portfolio.id)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="h6" noWrap sx={{ maxWidth: '80%' }}>
                    {portfolio.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, portfolio.id);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {portfolio.description || 'No description'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Total Value</Typography>
                  <Typography variant="h6">
                    {portfolio.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </Typography>
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">Today's Change</Typography>
                  <Box display="flex" alignItems="center">
                    <ValueChangeIndicator 
                      value={portfolio.dailyChange} 
                      percentage={portfolio.dailyChangePercent} 
                      showIcon 
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">Positions</Typography>
                  <Typography variant="body1">
                    {portfolio.positions.length} {portfolio.positions.length === 1 ? 'stock' : 'stocks'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <NoData 
          message="You don't have any portfolios yet" 
          actionText="Create Portfolio"
          onAction={handleCreateDialogOpen}
        />
      )}
      
      {/* Portfolio Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedPortfolioId && handleEditPortfolio(selectedPortfolioId)}>
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => selectedPortfolioId && handleDuplicatePortfolio(selectedPortfolioId)}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
        <MenuItem 
          onClick={() => selectedPortfolioId && handleDeletePortfolio(selectedPortfolioId)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
      
      {/* Create Portfolio Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Portfolio</DialogTitle>
        <DialogContent>
          <Box mt={1}>
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
              rows={2}
              value={newPortfolioDescription}
              onChange={(e) => setNewPortfolioDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Initial Cash"
              fullWidth
              variant="outlined"
              type="number"
              value={newPortfolioCash}
              onChange={(e) => setNewPortfolioCash(e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCreatePortfolio} 
            variant="contained" 
            disabled={!newPortfolioName || !newPortfolioCash}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioPage;