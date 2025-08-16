import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  CardActions, 
  Button, 
  Chip, 
  TextField, 
  InputAdornment, 
  Tabs, 
  Tab, 
  Rating, 
  Divider, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon, 
  Check as CheckIcon, 
  Star as StarIcon, 
  Download as DownloadIcon, 
  Info as InfoIcon, 
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';

import { RootState } from '../../store';
import MarketplaceService, { WidgetMetadata, UserWidgetData } from '../../services/marketplace/MarketplaceService';
import WidgetDetailPanel from '../../components/marketplace/WidgetDetailPanel';

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
      id={`marketplace-tabpanel-${index}`}
      aria-labelledby={`marketplace-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MarketplacePage: React.FC = () => {
  const theme = useTheme();
  const marketplaceService = MarketplaceService.getInstance();
  
  // Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState<WidgetMetadata[]>([]);
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetMetadata[]>([]);
  const [userWidgets, setUserWidgets] = useState<UserWidgetData | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<WidgetMetadata | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Load marketplace data
  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch available widgets
        const availableWidgets = await marketplaceService.getAvailableWidgets();
        setWidgets(availableWidgets);
        setFilteredWidgets(availableWidgets);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(availableWidgets.map(widget => widget.category)));
        setCategories(uniqueCategories);
        
        // Fetch user's installed widgets
        if (user) {
          const userWidgetData = await marketplaceService.getUserWidgets(user.id);
          setUserWidgets(userWidgetData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
        setIsLoading(false);
      }
    };
    
    loadMarketplaceData();
  }, [user, marketplaceService]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    if (newValue === 0) {
      // All widgets
      filterWidgets(searchQuery, null);
    } else if (newValue === 1) {
      // Installed widgets
      filterInstalledWidgets(searchQuery);
    } else {
      // Filter by category
      filterWidgets(searchQuery, categories[newValue - 2]);
    }
  };
  
  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (tabValue === 0) {
      // All widgets
      filterWidgets(query, null);
    } else if (tabValue === 1) {
      // Installed widgets
      filterInstalledWidgets(query);
    } else {
      // Filter by category
      filterWidgets(query, categories[tabValue - 2]);
    }
  };
  
  // Filter widgets
  const filterWidgets = (query: string, category: string | null) => {
    let filtered = widgets;
    
    // Filter by category if specified
    if (category) {
      filtered = filtered.filter(widget => widget.category === category);
    }
    
    // Filter by search query if specified
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(widget => 
        widget.name.toLowerCase().includes(lowerQuery) || 
        widget.description.toLowerCase().includes(lowerQuery) ||
        widget.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    setFilteredWidgets(filtered);
  };
  
  // Filter installed widgets
  const filterInstalledWidgets = (query: string) => {
    if (!userWidgets) {
      setFilteredWidgets([]);
      return;
    }
    
    const installedWidgetIds = userWidgets.installedWidgets.map(w => w.widgetId);
    let filtered = widgets.filter(widget => installedWidgetIds.includes(widget.id));
    
    // Filter by search query if specified
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(widget => 
        widget.name.toLowerCase().includes(lowerQuery) || 
        widget.description.toLowerCase().includes(lowerQuery) ||
        widget.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    setFilteredWidgets(filtered);
  };
  
  // Open widget details
  const handleOpenDetails = (widget: WidgetMetadata) => {
    setSelectedWidget(widget);
    setDetailsOpen(true);
  };
  
  // Close widget details
  const handleCloseDetails = () => {
    setDetailsOpen(false);
  };
  
  // Install widget
  const handleInstallWidget = async (widgetId: string) => {
    if (!user) return;
    
    try {
      await marketplaceService.installWidget(user.id, widgetId);
      
      // Update user widgets
      const updatedUserWidgets = await marketplaceService.getUserWidgets(user.id);
      setUserWidgets(updatedUserWidgets);
      
      // Show success message (in a real app, this would use a snackbar or toast)
      console.log(`Widget ${widgetId} installed successfully`);
    } catch (error) {
      console.error(`Error installing widget ${widgetId}:`, error);
    }
  };
  
  // Uninstall widget
  const handleUninstallWidget = async (widgetId: string) => {
    if (!user) return;
    
    try {
      await marketplaceService.uninstallWidget(user.id, widgetId);
      
      // Update user widgets
      const updatedUserWidgets = await marketplaceService.getUserWidgets(user.id);
      setUserWidgets(updatedUserWidgets);
      
      // Show success message (in a real app, this would use a snackbar or toast)
      console.log(`Widget ${widgetId} uninstalled successfully`);
    } catch (error) {
      console.error(`Error uninstalling widget ${widgetId}:`, error);
    }
  };
  
  // Toggle favorite
  const handleToggleFavorite = async (widgetId: string) => {
    if (!user) return;
    
    try {
      await marketplaceService.toggleFavorite(user.id, widgetId);
      
      // Update user widgets
      const updatedUserWidgets = await marketplaceService.getUserWidgets(user.id);
      setUserWidgets(updatedUserWidgets);
    } catch (error) {
      console.error(`Error toggling favorite for widget ${widgetId}:`, error);
    }
  };
  
  // Check if a widget is installed
  const isWidgetInstalled = (widgetId: string): boolean => {
    if (!userWidgets) return false;
    return userWidgets.installedWidgets.some(w => w.widgetId === widgetId);
  };
  
  // Check if a widget is favorited
  const isWidgetFavorite = (widgetId: string): boolean => {
    if (!userWidgets) return false;
    const installedWidget = userWidgets.installedWidgets.find(w => w.widgetId === widgetId);
    return installedWidget ? installedWidget.isFavorite : false;
  };
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <CircularProgress size={40} sx={{ mr: 2 }} />
          <Typography variant="h6">Loading Widget Marketplace...</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Widget Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and install widgets to enhance your trading dashboard
        </Typography>
      </Box>
      
      {/* Search bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search widgets by name, description, or tags..."
        value={searchQuery}
        onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />
      
      {/* Category tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="widget categories"
        >
          <Tab label="All Widgets" />
          <Tab label="My Widgets" />
          {categories.map((category, index) => (
            <Tab key={index} label={category} />
          ))}
        </Tabs>
      </Box>
      
      {/* All widgets tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {filteredWidgets.map((widget) => (
            <Grid item xs={12} sm={6} md={4} key={widget.id}>
              <Card 
                elevation={1}
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={widget.screenshots[0]}
                  alt={widget.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                      {widget.name}
                    </Typography>
                    {widget.isPremium && (
                      <Chip 
                        label={`$${widget.price}`} 
                        size="small" 
                        color="primary" 
                        sx={{ fontWeight: 'bold' }} 
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={widget.rating} precision={0.5} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({widget.ratingCount})
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {widget.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {widget.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {widget.tags.length > 3 && (
                      <Chip label={`+${widget.tags.length - 3}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatNumber(widget.downloadCount)} downloads
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      v{widget.version}
                    </Typography>
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<InfoIcon />}
                    onClick={() => handleOpenDetails(widget)}
                  >
                    Details
                  </Button>
                  
                  {isWidgetInstalled(widget.id) ? (
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<CloseIcon />}
                      onClick={() => handleUninstallWidget(widget.id)}
                    >
                      Uninstall
                    </Button>
                  ) : (
                    <Button 
                      size="small" 
                      color="primary" 
                      variant="contained"
                      startIcon={widget.isPremium ? <DownloadIcon /> : <AddIcon />}
                      onClick={() => handleInstallWidget(widget.id)}
                    >
                      {widget.isPremium ? 'Buy' : 'Install'}
                    </Button>
                  )}
                  
                  {isWidgetInstalled(widget.id) && (
                    <IconButton 
                      size="small" 
                      color={isWidgetFavorite(widget.id) ? 'primary' : 'default'}
                      onClick={() => handleToggleFavorite(widget.id)}
                      sx={{ ml: 'auto' }}
                    >
                      {isWidgetFavorite(widget.id) ? (
                        <FavoriteIcon fontSize="small" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {filteredWidgets.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px' 
          }}>
            <Typography variant="body1" color="text.secondary">
              No widgets found matching your search
            </Typography>
          </Box>
        )}
      </TabPanel>
      
      {/* My Widgets tab */}
      <TabPanel value={tabValue} index={1}>
        {!userWidgets || userWidgets.installedWidgets.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '200px',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 2,
            p: 3
          }}>
            <Typography variant="h6" gutterBottom>
              No Widgets Installed
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Browse the marketplace to find and install widgets for your dashboard
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => setTabValue(0)}
            >
              Browse Widgets
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredWidgets.map((widget) => (
              <Grid item xs={12} sm={6} md={4} key={widget.id}>
                <Card 
                  elevation={1}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    border: isWidgetFavorite(widget.id) ? `2px solid ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={widget.screenshots[0]}
                    alt={widget.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {widget.name}
                      </Typography>
                      {isWidgetFavorite(widget.id) && (
                        <FavoriteIcon color="primary" fontSize="small" />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {widget.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {widget.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      Installed: {
                        userWidgets.installedWidgets.find(w => w.widgetId === widget.id)?.installDate.toLocaleDateString()
                      }
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetails(widget)}
                    >
                      Details
                    </Button>
                    
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<CloseIcon />}
                      onClick={() => handleUninstallWidget(widget.id)}
                    >
                      Uninstall
                    </Button>
                    
                    <IconButton 
                      size="small" 
                      color={isWidgetFavorite(widget.id) ? 'primary' : 'default'}
                      onClick={() => handleToggleFavorite(widget.id)}
                      sx={{ ml: 'auto' }}
                    >
                      {isWidgetFavorite(widget.id) ? (
                        <FavoriteIcon fontSize="small" />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" />
                      )}
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
      
      {/* Category tabs */}
      {categories.map((category, index) => (
        <TabPanel key={index} value={tabValue} index={index + 2}>
          <Grid container spacing={3}>
            {filteredWidgets.map((widget) => (
              <Grid item xs={12} sm={6} md={4} key={widget.id}>
                <Card 
                  elevation={1}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={widget.screenshots[0]}
                    alt={widget.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="div" gutterBottom>
                        {widget.name}
                      </Typography>
                      {widget.isPremium && (
                        <Chip 
                          label={`$${widget.price}`} 
                          size="small" 
                          color="primary" 
                          sx={{ fontWeight: 'bold' }} 
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating value={widget.rating} precision={0.5} size="small" readOnly />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({widget.ratingCount})
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {widget.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {widget.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                      {widget.tags.length > 3 && (
                        <Chip label={`+${widget.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatNumber(widget.downloadCount)} downloads
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        v{widget.version}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<InfoIcon />}
                      onClick={() => handleOpenDetails(widget)}
                    >
                      Details
                    </Button>
                    
                    {isWidgetInstalled(widget.id) ? (
                      <Button 
                        size="small" 
                        color="error" 
                        startIcon={<CloseIcon />}
                        onClick={() => handleUninstallWidget(widget.id)}
                      >
                        Uninstall
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        color="primary" 
                        variant="contained"
                        startIcon={widget.isPremium ? <DownloadIcon /> : <AddIcon />}
                        onClick={() => handleInstallWidget(widget.id)}
                      >
                        {widget.isPremium ? 'Buy' : 'Install'}
                      </Button>
                    )}
                    
                    {isWidgetInstalled(widget.id) && (
                      <IconButton 
                        size="small" 
                        color={isWidgetFavorite(widget.id) ? 'primary' : 'default'}
                        onClick={() => handleToggleFavorite(widget.id)}
                        sx={{ ml: 'auto' }}
                      >
                        {isWidgetFavorite(widget.id) ? (
                          <FavoriteIcon fontSize="small" />
                        ) : (
                          <FavoriteBorderIcon fontSize="small" />
                        )}
                      </IconButton>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {filteredWidgets.length === 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '200px' 
            }}>
              <Typography variant="body1" color="text.secondary">
                No widgets found in this category
              </Typography>
            </Box>
          )}
        </TabPanel>
      ))}
      
      {/* Widget details dialog */}
      {selectedWidget && (
        <WidgetDetailPanel
          widget={selectedWidget}
          open={detailsOpen}
          onClose={handleCloseDetails}
          isInstalled={isWidgetInstalled(selectedWidget.id)}
          isFavorite={isWidgetFavorite(selectedWidget.id)}
          onInstall={() => handleInstallWidget(selectedWidget.id)}
          onUninstall={() => handleUninstallWidget(selectedWidget.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedWidget.id)}
        />
      )}
    </Container>
  );
};

export default MarketplacePage;