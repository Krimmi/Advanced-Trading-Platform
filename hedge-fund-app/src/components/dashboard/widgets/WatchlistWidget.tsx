import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Button, 
  Divider, 
  TextField, 
  InputAdornment,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface WatchlistWidgetProps {
  settings: {
    watchlistId?: string;
    showCharts?: boolean;
    refreshInterval?: number;
  };
}

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}

const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({ settings }) => {
  const theme = useTheme();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlist, setActiveWatchlist] = useState<Watchlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  
  // Default settings
  const watchlistId = settings.watchlistId || 'default';
  const showCharts = settings.showCharts !== undefined ? settings.showCharts : true;
  const refreshInterval = settings.refreshInterval || 30;
  
  // Load watchlist data
  useEffect(() => {
    const fetchWatchlistData = () => {
      setIsLoading(true);
      
      // Simulate API call with mock data
      setTimeout(() => {
        // Mock watchlists
        const mockWatchlists: Watchlist[] = [
          {
            id: 'default',
            name: 'Default Watchlist',
            items: [
              { symbol: 'AAPL', name: 'Apple Inc.', price: 243.58, change: 5.67, changePercent: 2.45, volume: 28456789 },
              { symbol: 'MSFT', name: 'Microsoft Corp.', price: 387.92, change: 7.12, changePercent: 1.87, volume: 15678234 },
              { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.45, change: 3.56, changePercent: 2.03, volume: 8765432 },
              { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 192.36, change: 6.01, changePercent: 3.21, volume: 12345678 },
              { symbol: 'TSLA', name: 'Tesla Inc.', price: 267.89, change: -7.65, changePercent: -2.78, volume: 34567890 },
              { symbol: 'META', name: 'Meta Platforms Inc.', price: 432.12, change: -8.34, changePercent: -1.89, volume: 9876543 }
            ]
          },
          {
            id: 'tech',
            name: 'Technology Stocks',
            items: [
              { symbol: 'AAPL', name: 'Apple Inc.', price: 243.58, change: 5.67, changePercent: 2.45, volume: 28456789 },
              { symbol: 'MSFT', name: 'Microsoft Corp.', price: 387.92, change: 7.12, changePercent: 1.87, volume: 15678234 },
              { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.45, change: 3.56, changePercent: 2.03, volume: 8765432 },
              { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 845.23, change: 23.45, changePercent: 2.85, volume: 23456789 },
              { symbol: 'AMD', name: 'Advanced Micro Devices', price: 176.34, change: 4.56, changePercent: 2.65, volume: 12345678 }
            ]
          },
          {
            id: 'finance',
            name: 'Financial Stocks',
            items: [
              { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 187.45, change: 2.34, changePercent: 1.26, volume: 9876543 },
              { symbol: 'BAC', name: 'Bank of America Corp.', price: 43.21, change: 0.87, changePercent: 2.05, volume: 15678234 },
              { symbol: 'WFC', name: 'Wells Fargo & Co.', price: 56.78, change: -0.45, changePercent: -0.79, volume: 8765432 },
              { symbol: 'GS', name: 'Goldman Sachs Group Inc.', price: 432.12, change: 5.67, changePercent: 1.33, volume: 5678901 },
              { symbol: 'MS', name: 'Morgan Stanley', price: 98.76, change: 1.23, changePercent: 1.26, volume: 7654321 }
            ]
          }
        ];
        
        setWatchlists(mockWatchlists);
        
        // Set active watchlist
        const active = mockWatchlists.find(w => w.id === watchlistId) || mockWatchlists[0];
        setActiveWatchlist(active);
        
        setIsLoading(false);
      }, 1000);
    };
    
    // Initial fetch
    fetchWatchlistData();
    
    // Set up refresh interval
    const intervalId = setInterval(fetchWatchlistData, refreshInterval * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [watchlistId, refreshInterval]);
  
  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Filter watchlist items based on search query
  const filteredItems = activeWatchlist?.items.filter(item => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.symbol.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query)
    );
  }) || [];
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, symbol: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedSymbol(symbol);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedSymbol(null);
  };
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2">Loading watchlist...</Typography>
      </Box>
    );
  }
  
  if (!activeWatchlist) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2" color="error">Error loading watchlist</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Watchlist header */}
      <Box sx={{ p: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {activeWatchlist.name}
          </Typography>
          
          <Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              variant="text"
            >
              Add Symbol
            </Button>
          </Box>
        </Box>
        
        <TextField
          fullWidth
          size="small"
          placeholder="Search symbols..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <Divider />
      
      {/* Watchlist items */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredItems.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No symbols found
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredItems.map((item) => (
              <React.Fragment key={item.symbol}>
                <ListItem disableGutters sx={{ px: 2 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium">
                          {item.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {item.name}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        Vol: {formatNumber(item.volume)}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Typography variant="body2" fontWeight="medium">
                        ${item.price.toFixed(2)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {item.change >= 0 ? (
                          <>
                            <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" color="success.main">
                              +{item.changePercent.toFixed(2)}%
                            </Typography>
                          </>
                        ) : (
                          <>
                            <TrendingDownIcon color="error" fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" color="error.main">
                              {item.changePercent.toFixed(2)}%
                            </Typography>
                          </>
                        )}
                        <IconButton
                          edge="end"
                          size="small"
                          aria-label="more"
                          onClick={(e) => handleMenuOpen(e, item.symbol)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      
      {/* Footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
        
        <Box>
          {watchlists.length > 1 && (
            <Button size="small" variant="text">
              Change Watchlist
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Item menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="body2">View Details</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="body2">Trade</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Typography variant="body2">Add to Portfolio</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">Remove from Watchlist</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default WatchlistWidget;