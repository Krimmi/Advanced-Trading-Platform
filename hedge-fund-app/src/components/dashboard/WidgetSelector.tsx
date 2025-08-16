import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  TextField, 
  InputAdornment,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import WidgetRegistry, { WidgetDefinition } from '../../services/dashboard/WidgetRegistry';

interface WidgetSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectWidget: (widgetType: string) => void;
}

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
      id={`widget-tabpanel-${index}`}
      aria-labelledby={`widget-tab-${index}`}
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

const WidgetSelector: React.FC<WidgetSelectorProps> = ({ open, onClose, onSelectWidget }) => {
  const theme = useTheme();
  const widgetRegistry = WidgetRegistry.getInstance();
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetDefinition[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  
  // Load widgets
  useEffect(() => {
    const allWidgets = widgetRegistry.getAllWidgetDefinitions();
    setWidgets(allWidgets);
    setFilteredWidgets(allWidgets);
    
    // Extract unique categories
    const uniqueCategories = Array.from(new Set(allWidgets.map(widget => widget.category)));
    setCategories(uniqueCategories);
  }, [widgetRegistry]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    if (newValue === 0) {
      // All widgets
      filterWidgets(searchQuery, null);
    } else {
      // Filter by category
      filterWidgets(searchQuery, categories[newValue - 1]);
    }
  };
  
  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    const category = tabValue === 0 ? null : categories[tabValue - 1];
    filterWidgets(query, category);
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
        widget.type.toLowerCase().includes(lowerQuery)
      );
    }
    
    setFilteredWidgets(filtered);
  };
  
  // Handle widget selection
  const handleSelectWidget = (widgetType: string) => {
    setSelectedWidget(widgetType);
  };
  
  // Handle add widget
  const handleAddWidget = () => {
    if (selectedWidget) {
      onSelectWidget(selectedWidget);
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="widget-selector-dialog-title"
    >
      <DialogTitle id="widget-selector-dialog-title">
        Add Widget
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Search bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
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
            {categories.map((category, index) => (
              <Tab key={index} label={category} />
            ))}
          </Tabs>
        </Box>
        
        {/* All widgets tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {filteredWidgets.map((widget) => (
              <Grid item xs={12} sm={6} md={4} key={widget.type}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: selectedWidget === widget.type 
                      ? `2px solid ${theme.palette.primary.main}` 
                      : `1px solid ${theme.palette.divider}`,
                    backgroundColor: selectedWidget === widget.type 
                      ? alpha(theme.palette.primary.light, 0.1)
                      : 'background.paper',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: theme.shadows[2]
                    }
                  }}
                  onClick={() => handleSelectWidget(widget.type)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" component="div" fontWeight="medium">
                        {widget.name}
                      </Typography>
                      <Box 
                        sx={{ 
                          ml: 1, 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          backgroundColor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          fontSize: '0.75rem'
                        }}
                      >
                        {widget.category}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {widget.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<InfoIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Show widget details (could be implemented in the future)
                        console.log('Show widget details:', widget);
                      }}
                    >
                      Details
                    </Button>
                    <Button 
                      size="small" 
                      color="primary" 
                      startIcon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectWidget(widget.type);
                      }}
                    >
                      Add
                    </Button>
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
        
        {/* Category tabs */}
        {categories.map((category, index) => (
          <TabPanel key={index} value={tabValue} index={index + 1}>
            <Grid container spacing={2}>
              {filteredWidgets.map((widget) => (
                <Grid item xs={12} sm={6} md={4} key={widget.type}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: selectedWidget === widget.type 
                        ? `2px solid ${theme.palette.primary.main}` 
                        : `1px solid ${theme.palette.divider}`,
                      backgroundColor: selectedWidget === widget.type 
                        ? alpha(theme.palette.primary.light, 0.1)
                        : 'background.paper',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: theme.shadows[2]
                      }
                    }}
                    onClick={() => handleSelectWidget(widget.type)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" component="div" fontWeight="medium">
                        {widget.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {widget.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        startIcon={<InfoIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show widget details (could be implemented in the future)
                          console.log('Show widget details:', widget);
                        }}
                      >
                        Details
                      </Button>
                      <Button 
                        size="small" 
                        color="primary" 
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWidget(widget.type);
                        }}
                      >
                        Add
                      </Button>
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
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleAddWidget} 
          variant="contained" 
          color="primary"
          disabled={!selectedWidget}
        >
          Add Widget
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WidgetSelector;