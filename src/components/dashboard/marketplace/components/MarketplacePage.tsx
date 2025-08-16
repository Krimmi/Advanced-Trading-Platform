/**
 * Marketplace Page
 * 
 * This component displays the widget marketplace, allowing users to browse,
 * search, and install widgets for their personalized dashboards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Divider,
  CircularProgress,
  Rating,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import VerifiedIcon from '@mui/icons-material/Verified';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import FilterListIcon from '@mui/icons-material/FilterList';

import MarketplaceService from '../services/MarketplaceService';
import { WidgetMetadata, WidgetCategory } from '../models/WidgetMetadata';
import WidgetDetailPanel from './WidgetDetailPanel';

// Material UI icons mapping
const iconMapping: Record<string, React.ElementType> = {
  TrendingUp: require('@mui/icons-material/TrendingUp').default,
  AccountBalanceWallet: require('@mui/icons-material/AccountBalanceWallet').default,
  ListAlt: require('@mui/icons-material/ListAlt').default,
  Article: require('@mui/icons-material/Article').default,
  CalendarToday: require('@mui/icons-material/CalendarToday').default,
  ShowChart: require('@mui/icons-material/ShowChart').default,
  CurrencyBitcoin: require('@mui/icons-material/CurrencyBitcoin').default,
  CallSplit: require('@mui/icons-material/CallSplit').default
};

interface MarketplacePageProps {
  onWidgetInstall?: (widgetId: string) => void;
  onClose?: () => void;
  dashboardId?: string;
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onWidgetInstall,
  onClose,
  dashboardId
}) => {
  const theme = useTheme();
  const marketplaceService = MarketplaceService.getInstance();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('featured');
  const [categories, setCategories] = useState<WidgetCategory[]>([]);
  const [widgets, setWidgets] = useState<WidgetMetadata[]>([]);
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetMetadata[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<WidgetMetadata | null>(null);
  const [installingWidgetId, setInstallingWidgetId] = useState<string | null>(null);
  
  // Fetch categories and widgets
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [categoriesData, widgetsData] = await Promise.all([
          marketplaceService.getCategories(),
          marketplaceService.getWidgets()
        ]);
        
        setCategories(categoriesData);
        setWidgets(widgetsData);
        
        // Set initial filtered widgets based on active tab
        if (activeTab === 'featured') {
          const featuredWidgets = await marketplaceService.getFeaturedWidgets();
          setFilteredWidgets(featuredWidgets);
        } else if (activeTab === 'popular') {
          const popularWidgets = await marketplaceService.getPopularWidgets();
          setFilteredWidgets(popularWidgets);
        } else if (activeTab === 'new') {
          const newWidgets = await marketplaceService.getNewWidgets();
          setFilteredWidgets(newWidgets);
        } else if (activeTab === 'all') {
          setFilteredWidgets(widgetsData);
        } else {
          // Category tab
          const categoryWidgets = await marketplaceService.getWidgetsByCategory(activeTab);
          setFilteredWidgets(categoryWidgets);
        }
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeTab]);
  
  // Handle search
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery) {
        // Reset to active tab's widgets
        if (activeTab === 'featured') {
          const featuredWidgets = await marketplaceService.getFeaturedWidgets();
          setFilteredWidgets(featuredWidgets);
        } else if (activeTab === 'popular') {
          const popularWidgets = await marketplaceService.getPopularWidgets();
          setFilteredWidgets(popularWidgets);
        } else if (activeTab === 'new') {
          const newWidgets = await marketplaceService.getNewWidgets();
          setFilteredWidgets(newWidgets);
        } else if (activeTab === 'all') {
          setFilteredWidgets(widgets);
        } else {
          // Category tab
          const categoryWidgets = await marketplaceService.getWidgetsByCategory(activeTab);
          setFilteredWidgets(categoryWidgets);
        }
        return;
      }
      
      // Search widgets
      const results = await marketplaceService.searchWidgets(searchQuery);
      setFilteredWidgets(results);
    };
    
    handleSearch();
  }, [searchQuery, widgets, activeTab]);
  
  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    setSearchQuery('');
  }, []);
  
  // Handle widget click
  const handleWidgetClick = useCallback((widget: WidgetMetadata) => {
    setSelectedWidget(widget);
  }, []);
  
  // Handle widget install
  const handleWidgetInstall = useCallback(async (widgetId: string) => {
    setInstallingWidgetId(widgetId);
    
    try {
      if (dashboardId) {
        // Add widget directly to dashboard
        const instanceId = await marketplaceService.addWidgetToDashboard(dashboardId, widgetId);
        if (instanceId && onWidgetInstall) {
          onWidgetInstall(widgetId);
        }
      } else {
        // Just install the widget
        await marketplaceService.installWidget(widgetId);
      }
      
      // Update widgets to reflect installation status
      const updatedWidgets = widgets.map(w => ({
        ...w,
        isInstalled: w.id === widgetId ? true : marketplaceService.isWidgetInstalled(w.id)
      }));
      
      setWidgets(updatedWidgets);
      setFilteredWidgets(filteredWidgets.map(w => ({
        ...w,
        isInstalled: w.id === widgetId ? true : marketplaceService.isWidgetInstalled(w.id)
      })));
      
      // Update selected widget if it's the one being installed
      if (selectedWidget && selectedWidget.id === widgetId) {
        setSelectedWidget({
          ...selectedWidget,
          isInstalled: true
        });
      }
    } catch (error) {
      console.error('Error installing widget:', error);
    } finally {
      setInstallingWidgetId(null);
    }
  }, [dashboardId, onWidgetInstall, widgets, filteredWidgets, selectedWidget]);
  
  // Handle back button click
  const handleBackClick = useCallback(() => {
    setSelectedWidget(null);
  }, []);
  
  // Handle close
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  // Render widget card
  const renderWidgetCard = (widget: WidgetMetadata) => {
    const isInstalled = marketplaceService.isWidgetInstalled(widget.id);
    const isInstalling = installingWidgetId === widget.id;
    const IconComponent = iconMapping[widget.icon] || iconMapping.TrendingUp;
    
    return (
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          },
          position: 'relative'
        }}
      >
        {widget.featured && (
          <Chip
            label="Featured"
            color="primary"
            size="small"
            icon={<FavoriteIcon />}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1
            }}
          />
        )}
        
        {new Date(widget.created) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
          <Chip
            label="New"
            color="secondary"
            size="small"
            icon={<NewReleasesIcon />}
            sx={{
              position: 'absolute',
              top: widget.featured ? 40 : 8,
              right: 8,
              zIndex: 1
            }}
          />
        )}
        
        <CardMedia
          sx={{ 
            height: 140, 
            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.light, 0.2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <IconComponent sx={{ fontSize: 64, color: theme.palette.primary.main }} />
        </CardMedia>
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
              {widget.name}
            </Typography>
            {widget.verified && (
              <Tooltip title="Verified Widget">
                <VerifiedIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {widget.description}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Rating
              value={widget.rating?.averageScore || 0}
              precision={0.5}
              size="small"
              readOnly
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({widget.rating?.totalRatings || 0})
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={categories.find(c => c.id === widget.category)?.name || widget.category}
              size="small"
              variant="outlined"
            />
            {widget.tags.slice(0, 2).map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ opacity: 0.7 }}
              />
            ))}
          </Box>
        </CardContent>
        
        <Divider />
        
        <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={`${widget.installCount} installations`}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DownloadIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                <Typography variant="body2" color="text.secondary">
                  {widget.installCount > 1000 
                    ? `${(widget.installCount / 1000).toFixed(1)}K` 
                    : widget.installCount}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          
          <Box>
            <Button
              size="small"
              onClick={() => handleWidgetClick(widget)}
            >
              Details
            </Button>
            
            <Button
              size="small"
              variant={isInstalled ? "outlined" : "contained"}
              color={isInstalled ? "success" : "primary"}
              startIcon={isInstalled ? <CheckIcon /> : <AddIcon />}
              onClick={() => handleWidgetInstall(widget.id)}
              disabled={isInstalling}
            >
              {isInstalling ? (
                <CircularProgress size={20} />
              ) : isInstalled ? (
                "Installed"
              ) : (
                "Install"
              )}
            </Button>
          </Box>
        </CardActions>
      </Card>
    );
  };
  
  // If a widget is selected, show its details
  if (selectedWidget) {
    return (
      <WidgetDetailPanel
        widget={selectedWidget}
        onBack={handleBackClick}
        onInstall={handleWidgetInstall}
        isInstalling={installingWidgetId === selectedWidget.id}
        isInstalled={marketplaceService.isWidgetInstalled(selectedWidget.id)}
        dashboardId={dashboardId}
      />
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, bgcolor: theme.palette.background.paper }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Widget Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover and install widgets to customize your dashboard experience.
        </Typography>
        
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />
        
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Featured" value="featured" />
          <Tab label="Popular" value="popular" />
          <Tab label="New" value="new" />
          <Tab label="All" value="all" />
          {categories.map(category => (
            <Tab
              key={category.id}
              label={category.name}
              value={category.id}
              icon={iconMapping[category.icon] ? React.createElement(iconMapping[category.icon]) : undefined}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>
      
      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredWidgets.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No widgets found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredWidgets.map(widget => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={widget.id}>
                {renderWidgetCard(widget)}
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Footer */}
      {dashboardId && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: theme.palette.background.paper }}>
          <Button variant="outlined" onClick={handleClose}>
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MarketplacePage;