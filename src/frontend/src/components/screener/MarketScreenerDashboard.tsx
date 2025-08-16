import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  TableChart as TableIcon,
} from '@mui/icons-material';
import screenerService, { ScreenerFilter, ScreenerResult, ScreenerRequest } from '../../services/screenerService';
import ScreenerCriteriaBuilder from './ScreenerCriteriaBuilder';
import ScreenerResultsPanel from './ScreenerResultsPanel';
import SavedScreenersPanel from './SavedScreenersPanel';
import ScreenerTemplatesPanel from './ScreenerTemplatesPanel';

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
      id={`screener-tabpanel-${index}`}
      aria-labelledby={`screener-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `screener-tab-${index}`,
    'aria-controls': `screener-tabpanel-${index}`,
  };
}

const MarketScreenerDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<ScreenerFilter[]>([]);
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [availableMetrics, setAvailableMetrics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [screenName, setScreenName] = useState<string>('');
  const [screenDescription, setScreenDescription] = useState<string>('');
  const [totalResults, setTotalResults] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);

  useEffect(() => {
    loadAvailableMetrics();
  }, []);

  const loadAvailableMetrics = async () => {
    try {
      const metrics = await screenerService.getAvailableMetrics();
      setAvailableMetrics(metrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      setError('Failed to load screening metrics. Please try again.');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFiltersChange = (newFilters: ScreenerFilter[]) => {
    setFilters(newFilters);
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortBy(field);
    setSortDirection(direction);
    
    if (results.length > 0) {
      runScreener(filters, field, direction, page, limit);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    runScreener(filters, sortBy, sortDirection, newPage, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
    runScreener(filters, sortBy, sortDirection, 1, newLimit);
  };

  const runScreener = async (
    screenFilters: ScreenerFilter[],
    screenSortBy: string = sortBy,
    screenSortDirection: 'asc' | 'desc' = sortDirection,
    screenPage: number = page,
    screenLimit: number = limit
  ) => {
    if (screenFilters.length === 0) {
      setError('Please add at least one filter criterion');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: ScreenerRequest = {
        filters: screenFilters,
        sortBy: screenSortBy,
        sortDirection: screenSortDirection,
        page: screenPage,
        limit: screenLimit,
      };

      const response = await screenerService.screenStocks(request);
      setResults(response.results);
      setTotalResults(response.total);
      
      // Switch to results tab if we're not already there
      if (tabValue !== 1) {
        setTabValue(1);
      }
    } catch (error) {
      console.error('Error running screener:', error);
      setError('Failed to run screener. Please check your criteria and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScreen = async () => {
    if (!screenName) {
      setError('Please enter a name for this screen');
      return;
    }

    if (filters.length === 0) {
      setError('Please add at least one filter criterion');
      return;
    }

    setLoading(true);
    try {
      await screenerService.saveCustomScreen(
        screenName,
        screenDescription,
        filters,
        sortBy,
        sortDirection
      );
      
      // Show success message or notification
      alert('Screen saved successfully');
      
      // Optionally switch to saved screens tab
      setTabValue(2);
    } catch (error) {
      console.error('Error saving screen:', error);
      setError('Failed to save screen. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadScreen = (screen: any) => {
    setFilters(screen.filters);
    setSortBy(screen.sortBy || 'marketCap');
    setSortDirection(screen.sortDirection || 'desc');
    setScreenName(screen.name);
    setScreenDescription(screen.description || '');
    
    // Switch to criteria builder tab
    setTabValue(0);
  };

  const handleLoadTemplate = (template: any) => {
    setFilters(template.filters);
    setSortBy(template.sortBy || 'marketCap');
    setSortDirection(template.sortDirection || 'desc');
    setScreenName(`${template.name} (Custom)`);
    setScreenDescription(template.description || '');
    
    // Switch to criteria builder tab
    setTabValue(0);
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      setError('No results to export');
      return;
    }

    const csv = screenerService.exportToCsv(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${screenName || 'screener'}_results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Stock Market Screener
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Find investment opportunities that match your criteria
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="screener tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Criteria Builder" 
            icon={<FilterIcon />} 
            iconPosition="start" 
            {...a11yProps(0)} 
          />
          <Tab 
            label="Results" 
            icon={<TableIcon />} 
            iconPosition="start" 
            {...a11yProps(1)} 
            disabled={results.length === 0}
          />
          <Tab 
            label="Saved Screens" 
            icon={<SaveIcon />} 
            iconPosition="start" 
            {...a11yProps(2)} 
          />
          <Tab 
            label="Templates" 
            icon={<SearchIcon />} 
            iconPosition="start" 
            {...a11yProps(3)} 
          />
        </Tabs>
      </Box>

      {error && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <TabPanel value={tabValue} index={0}>
        <ScreenerCriteriaBuilder
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableMetrics={availableMetrics}
          screenName={screenName}
          onScreenNameChange={setScreenName}
          screenDescription={screenDescription}
          onScreenDescriptionChange={setScreenDescription}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onRunScreener={() => runScreener(filters)}
          onSaveScreen={handleSaveScreen}
          loading={loading}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ScreenerResultsPanel
          results={results}
          loading={loading}
          totalResults={totalResults}
          page={page}
          limit={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onExportResults={handleExportResults}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <SavedScreenersPanel
          onLoadScreen={handleLoadScreen}
          onRunScreen={(screen) => runScreener(
            screen.filters,
            screen.sortBy || sortBy,
            screen.sortDirection || sortDirection
          )}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <ScreenerTemplatesPanel
          onLoadTemplate={handleLoadTemplate}
          onRunTemplate={(template) => runScreener(
            template.filters,
            template.sortBy || sortBy,
            template.sortDirection || sortDirection
          )}
        />
      </TabPanel>
    </Container>
  );
};

export default MarketScreenerDashboard;