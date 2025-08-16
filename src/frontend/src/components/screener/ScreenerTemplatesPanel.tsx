import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PlayArrow as RunIcon,
  ContentCopy as DuplicateIcon,
  FilterList as FilterIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import screenerService, { PresetScreen } from '../../services/screenerService';

interface ScreenerTemplatesPanelProps {
  onLoadTemplate: (template: PresetScreen) => void;
  onRunTemplate: (template: PresetScreen) => void;
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
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `template-tab-${index}`,
    'aria-controls': `template-tabpanel-${index}`,
  };
}

const ScreenerTemplatesPanel: React.FC<ScreenerTemplatesPanelProps> = ({
  onLoadTemplate,
  onRunTemplate,
}) => {
  const [templates, setTemplates] = useState<PresetScreen[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const presetScreens = await screenerService.getPresetScreens();
      setTemplates(presetScreens);
      
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(presetScreens.map(template => template.category || 'General'))
      );
      setCategories(['All', ...uniqueCategories]);
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load screener templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilterSummary = (filters: any[]) => {
    if (filters.length === 0) return 'No filters';
    
    // Group filters by category
    const filterCategories: Record<string, number> = {};
    filters.forEach(filter => {
      const category = filter.category || 'Other';
      filterCategories[category] = (filterCategories[category] || 0) + 1;
    });
    
    return Object.entries(filterCategories).map(([category, count]) => (
      `${category}: ${count}`
    )).join(', ');
  };

  const getTemplatesForCategory = (categoryIndex: number) => {
    if (categoryIndex === 0) {
      // "All" category
      return templates;
    } else {
      const category = categories[categoryIndex];
      return templates.filter(template => (template.category || 'General') === category);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Screener Templates
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadTemplates}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Alert severity="info">
          No screener templates available.
        </Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="template categories"
              variant="scrollable"
              scrollButtons="auto"
            >
              {categories.map((category, index) => (
                <Tab 
                  key={category}
                  label={category} 
                  icon={<CategoryIcon />} 
                  iconPosition="start" 
                  {...a11yProps(index)} 
                />
              ))}
            </Tabs>
          </Box>

          {categories.map((category, index) => (
            <TabPanel key={category} value={tabValue} index={index}>
              <Grid container spacing={3}>
                {getTemplatesForCategory(index).map((template) => (
                  <Grid item xs={12} md={6} lg={4} key={template.id}>
                    <Card variant="outlined">
                      <CardHeader
                        title={template.name}
                        subheader={template.category || 'General'}
                        action={
                          <Tooltip title="Template">
                            <Chip size="small" label="Template" color="secondary" />
                          </Tooltip>
                        }
                      />
                      <Divider />
                      <CardContent>
                        {template.description && (
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {template.description}
                          </Typography>
                        )}
                        
                        <Box mb={2}>
                          <Typography variant="subtitle2" gutterBottom>
                            Filters:
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 1.5 }}>
                            <Box display="flex" alignItems="center">
                              <FilterIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {template.filters.length} filter{template.filters.length !== 1 ? 's' : ''}
                                {' - '}{getFilterSummary(template.filters)}
                              </Typography>
                            </Box>
                          </Paper>
                        </Box>
                        
                        {template.sortBy && (
                          <Typography variant="body2" color="textSecondary">
                            Sort by: <strong>{template.sortBy}</strong> ({template.sortDirection === 'asc' ? 'ascending' : 'descending'})
                          </Typography>
                        )}
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button
                          size="small"
                          startIcon={<DuplicateIcon />}
                          onClick={() => onLoadTemplate(template)}
                        >
                          Use Template
                        </Button>
                        <Button
                          size="small"
                          startIcon={<RunIcon />}
                          onClick={() => onRunTemplate(template)}
                          color="primary"
                        >
                          Run
                        </Button>
                        <Box flexGrow={1} />
                        <Tooltip title="Info">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </TabPanel>
          ))}
        </>
      )}
    </Box>
  );
};

export default ScreenerTemplatesPanel;