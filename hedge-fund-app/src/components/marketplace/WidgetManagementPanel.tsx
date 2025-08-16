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
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  InputAdornment, 
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon, 
  Search as SearchIcon, 
  Add as AddIcon, 
  Settings as SettingsIcon, 
  Info as InfoIcon 
} from '@mui/icons-material';

import { WidgetMetadata, UserWidgetData } from '../../services/marketplace/MarketplaceService';
import MarketplaceService from '../../services/marketplace/MarketplaceService';
import WidgetDetailPanel from './WidgetDetailPanel';

interface WidgetManagementPanelProps {
  userId: string;
  onAddWidget?: () => void;
}

const WidgetManagementPanel: React.FC<WidgetManagementPanelProps> = ({ userId, onAddWidget }) => {
  const theme = useTheme();
  const marketplaceService = MarketplaceService.getInstance();
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [userWidgets, setUserWidgets] = useState<UserWidgetData | null>(null);
  const [installedWidgets, setInstalledWidgets] = useState<WidgetMetadata[]>([]);
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<WidgetMetadata | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  // Load user widgets
  useEffect(() => {
    const loadUserWidgets = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user's installed widgets
        const userWidgetData = await marketplaceService.getUserWidgets(userId);
        setUserWidgets(userWidgetData);
        
        // Fetch widget metadata for installed widgets
        const allWidgets = await marketplaceService.getAvailableWidgets();
        const userInstalledWidgets = allWidgets.filter(widget => 
          userWidgetData.installedWidgets.some(installed => installed.widgetId === widget.id)
        );
        
        setInstalledWidgets(userInstalledWidgets);
        setFilteredWidgets(userInstalledWidgets);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user widgets:', error);
        setIsLoading(false);
      }
    };
    
    loadUserWidgets();
  }, [userId, marketplaceService]);
  
  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (!query) {
      setFilteredWidgets(installedWidgets);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = installedWidgets.filter(widget => 
      widget.name.toLowerCase().includes(lowerQuery) || 
      widget.description.toLowerCase().includes(lowerQuery) ||
      widget.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
    
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
  
  // Uninstall widget
  const handleUninstallWidget = async (widgetId: string) => {
    try {
      await marketplaceService.uninstallWidget(userId, widgetId);
      
      // Update user widgets
      const updatedUserWidgets = await marketplaceService.getUserWidgets(userId);
      setUserWidgets(updatedUserWidgets);
      
      // Update installed widgets
      setInstalledWidgets(prev => prev.filter(widget => widget.id !== widgetId));
      setFilteredWidgets(prev => prev.filter(widget => widget.id !== widgetId));
      
      // Close details panel if the uninstalled widget was selected
      if (selectedWidget?.id === widgetId) {
        setDetailsOpen(false);
      }
    } catch (error) {
      console.error(`Error uninstalling widget ${widgetId}:`, error);
    }
  };
  
  // Toggle favorite
  const handleToggleFavorite = async (widgetId: string) => {
    try {
      await marketplaceService.toggleFavorite(userId, widgetId);
      
      // Update user widgets
      const updatedUserWidgets = await marketplaceService.getUserWidgets(userId);
      setUserWidgets(updatedUserWidgets);
    } catch (error) {
      console.error(`Error toggling favorite for widget ${widgetId}:`, error);
    }
  };
  
  // Check if a widget is favorited
  const isWidgetFavorite = (widgetId: string): boolean => {
    if (!userWidgets) return false;
    const installedWidget = userWidgets.installedWidgets.find(w => w.widgetId === widgetId);
    return installedWidget ? installedWidget.isFavorite : false;
  };
  
  // Format date
  const formatDate = (date: Date | undefined): string => {
    if (!date) return 'Unknown';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress size={24} sx={{ mr: 1 }} />
        <Typography variant="body2">Loading installed widgets...</Typography>
      </Box>
    );
  }
  
  if (!userWidgets || installedWidgets.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px',
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
          onClick={onAddWidget}
        >
          Browse Widgets
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Search bar */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search installed widgets..."
        value={searchQuery}
        onChange={handleSearch}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      {/* Widget list */}
      <List 
        sx={{ 
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          mb: 2
        }}
      >
        {filteredWidgets.map((widget) => {
          const installedWidget = userWidgets.installedWidgets.find(w => w.widgetId === widget.id);
          
          return (
            <React.Fragment key={widget.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {widget.name}
                      </Typography>
                      {isWidgetFavorite(widget.id) && (
                        <FavoriteIcon color="primary" fontSize="small" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {widget.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={widget.category} 
                          size="small" 
                          variant="outlined" 
                          sx={{ mr: 1 }} 
                        />
                        <Typography variant="caption" color="text.secondary">
                          Installed: {formatDate(installedWidget?.installDate)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="favorite"
                    onClick={() => handleToggleFavorite(widget.id)}
                    sx={{ mr: 1 }}
                  >
                    {isWidgetFavorite(widget.id) ? (
                      <FavoriteIcon color="primary" />
                    ) : (
                      <FavoriteBorderIcon />
                    )}
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="info"
                    onClick={() => handleOpenDetails(widget)}
                    sx={{ mr: 1 }}
                  >
                    <InfoIcon />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleUninstallWidget(widget.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          );
        })}
      </List>
      
      {filteredWidgets.length === 0 && searchQuery && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100px',
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            No widgets found matching "{searchQuery}"
          </Typography>
        </Box>
      )}
      
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button 
          variant="outlined" 
          startIcon={<SettingsIcon />}
        >
          Manage Preferences
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={onAddWidget}
        >
          Add Widgets
        </Button>
      </Box>
      
      {/* Widget details dialog */}
      {selectedWidget && (
        <WidgetDetailPanel
          widget={selectedWidget}
          open={detailsOpen}
          onClose={handleCloseDetails}
          isInstalled={true}
          isFavorite={isWidgetFavorite(selectedWidget.id)}
          onInstall={() => {}}
          onUninstall={() => handleUninstallWidget(selectedWidget.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedWidget.id)}
        />
      )}
    </Box>
  );
};

export default WidgetManagementPanel;