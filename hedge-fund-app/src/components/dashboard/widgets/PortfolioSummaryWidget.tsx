import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Divider, 
  Button, 
  useTheme,
  Paper,
  LinearProgress
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';

interface PortfolioSummaryWidgetProps {
  settings: {
    showPerformance?: boolean;
    showAllocation?: boolean;
    period?: string;
  };
}

interface PortfolioData {
  totalValue: number;
  cashBalance: number;
  dayChange: number;
  dayChangePercent: number;
  periodChange: number;
  periodChangePercent: number;
  allocation: {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }[];
}

const PortfolioSummaryWidget: React.FC<PortfolioSummaryWidgetProps> = ({ settings }) => {
  const theme = useTheme();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  
  // Default settings
  const showPerformance = settings.showPerformance !== undefined ? settings.showPerformance : true;
  const showAllocation = settings.showAllocation !== undefined ? settings.showAllocation : true;
  const period = settings.period || '1M';
  
  // Load portfolio data
  useEffect(() => {
    const fetchPortfolioData = () => {
      setIsLoading(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        // Mock portfolio data
        const mockData: PortfolioData = {
          totalValue: 1245678.90,
          cashBalance: 125678.45,
          dayChange: 24567.89,
          dayChangePercent: 2.1,
          periodChange: 78945.67,
          periodChangePercent: 6.8,
          allocation: [
            { name: 'Technology', value: 435987.62, percentage: 35, color: '#3f51b5' },
            { name: 'Healthcare', value: 249135.78, percentage: 20, color: '#4caf50' },
            { name: 'Financials', value: 186851.84, percentage: 15, color: '#f44336' },
            { name: 'Consumer', value: 149481.47, percentage: 12, color: '#ff9800' },
            { name: 'Energy', value: 99654.31, percentage: 8, color: '#9c27b0' },
            { name: 'Other', value: 124567.89, percentage: 10, color: '#607d8b' }
          ]
        };
        
        setPortfolioData(mockData);
        setIsLoading(false);
      }, 1000);
    };
    
    // Initial fetch
    fetchPortfolioData();
  }, [period]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2">Loading portfolio data...</Typography>
      </Box>
    );
  }
  
  if (!portfolioData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2" color="error">Error loading portfolio data</Typography>
      </Box>
    );
  }
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Get period label
  const getPeriodLabel = () => {
    switch (period) {
      case '1D': return 'Today';
      case '1W': return 'This Week';
      case '1M': return 'This Month';
      case '3M': return '3 Months';
      case '6M': return '6 Months';
      case '1Y': return 'This Year';
      case 'YTD': return 'Year to Date';
      default: return period;
    }
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Portfolio value */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <AccountBalanceIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Portfolio Value
          </Typography>
        </Box>
        
        <Typography variant="h5" component="div" fontWeight="bold">
          {formatCurrency(portfolioData.totalValue)}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
          {portfolioData.dayChange >= 0 ? (
            <>
              <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="success.main" fontWeight="medium">
                +{formatCurrency(portfolioData.dayChange)} ({portfolioData.dayChangePercent.toFixed(2)}%)
              </Typography>
            </>
          ) : (
            <>
              <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="error.main" fontWeight="medium">
                {formatCurrency(portfolioData.dayChange)} ({portfolioData.dayChangePercent.toFixed(2)}%)
              </Typography>
            </>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Today
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ my: 1.5 }} />
      
      {/* Cash balance */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <AttachMoneyIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="subtitle2" color="text.secondary">
            Cash Balance
          </Typography>
        </Box>
        
        <Typography variant="h6" component="div">
          {formatCurrency(portfolioData.cashBalance)}
        </Typography>
        
        <Typography variant="caption" color="text.secondary">
          {(portfolioData.cashBalance / portfolioData.totalValue * 100).toFixed(2)}% of portfolio
        </Typography>
      </Box>
      
      {/* Performance */}
      {showPerformance && (
        <>
          <Divider sx={{ my: 1.5 }} />
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <ShowChartIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                {getPeriodLabel()} Performance
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {portfolioData.periodChange >= 0 ? (
                <>
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body1" color="success.main" fontWeight="medium">
                    +{formatCurrency(portfolioData.periodChange)} ({portfolioData.periodChangePercent.toFixed(2)}%)
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body1" color="error.main" fontWeight="medium">
                    {formatCurrency(portfolioData.periodChange)} ({portfolioData.periodChangePercent.toFixed(2)}%)
                  </Typography>
                </>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Button size="small" variant="text">
                View Details
              </Button>
              
              <Box sx={{ display: 'flex' }}>
                {['1D', '1W', '1M', '3M', '1Y', 'YTD'].map((p) => (
                  <Button
                    key={p}
                    size="small"
                    variant={period === p ? 'contained' : 'text'}
                    color={period === p ? 'primary' : 'inherit'}
                    sx={{ minWidth: 'auto', px: 1 }}
                    // In a real implementation, this would update the period
                    // onClick={() => handlePeriodChange(p)}
                  >
                    {p}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        </>
      )}
      
      {/* Asset allocation */}
      {showAllocation && (
        <>
          <Divider sx={{ my: 1.5 }} />
          
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PieChartIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Asset Allocation
              </Typography>
            </Box>
            
            <Box sx={{ mt: 1 }}>
              {portfolioData.allocation.map((asset) => (
                <Box key={asset.name} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">
                      {asset.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {asset.percentage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={asset.percentage}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: asset.color
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button size="small" variant="text">
                View Details
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PortfolioSummaryWidget;