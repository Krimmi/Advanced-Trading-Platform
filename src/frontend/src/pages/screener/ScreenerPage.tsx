import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  FilterList,
  Add,
  Delete,
  ExpandMore,
  Save,
  Refresh,
  TrendingUp,
  TrendingDown,
  Search,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';

// Components
import PageHeader from '../../components/common/PageHeader';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import NoData from '../../components/common/NoData';
import ValueChangeIndicator from '../../components/common/ValueChangeIndicator';

// Services
import { screenerService } from '../../services';

// Types
import { ScreenerFilter, ScreenerResult } from '../../services/screenerService';

const ScreenerPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [filters, setFilters] = useState<ScreenerFilter[]>([]);
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [presetScreens, setPresetScreens] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [totalResults, setTotalResults] = useState<number>(0);
  
  // Dialog state
  const [addFilterDialogOpen, setAddFilterDialogOpen] = useState<boolean>(false);
  const [saveScreenDialogOpen, setSaveScreenDialogOpen] = useState<boolean>(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [filterValue2, setFilterValue2] = useState<string>('');
  const [screenName, setScreenName] = useState<string>('');
  const [screenDescription, setScreenDescription] = useState<string>('');
  
  // Fetch available fields and preset screens on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch available fields for screening
        const fieldsData = await screenerService.getScreenerFields();
        setAvailableFields(fieldsData);
        
        // Fetch preset screens
        const presetsData = await screenerService.getPresetScreens();
        setPresetScreens(presetsData);
        
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch screener data');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Run screen when filters change
  useEffect(() => {
    if (filters.length > 0) {
      runScreen();
    }
  }, [filters, page, rowsPerPage, sortBy, sortDirection]);
  
  // Run screen
  const runScreen = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const screenData = await screenerService.runScreen({
        filters,
        sortBy,
        sortDirection,
        limit: rowsPerPage,
        offset: page * rowsPerPage
      });
      
      setResults(screenData);
      setTotalResults(screenData.length > 0 ? 100 : 0); // Mock total count
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to run screen');
      setLoading(false);
    }
  };
  
  // Handle add filter dialog
  const handleAddFilterDialogOpen = () => {
    setSelectedField('');
    setSelectedOperator('');
    setFilterValue('');
    setFilterValue2('');
    setAddFilterDialogOpen(true);
  };
  
  const handleAddFilterDialogClose = () => {
    setAddFilterDialogOpen(false);
  };
  
  // Handle save screen dialog
  const handleSaveScreenDialogOpen = () => {
    setScreenName('');
    setScreenDescription('');
    setSaveScreenDialogOpen(true);
  };
  
  const handleSaveScreenDialogClose = () => {
    setSaveScreenDialogOpen(false);
  };
  
  // Handle add filter
  const handleAddFilter = () => {
    if (!selectedField || !selectedOperator || !filterValue) return;
    
    const newFilter: ScreenerFilter = {
      field: selectedField,
      operator: selectedOperator as any,
      value: filterValue
    };
    
    // Add second value for 'between' operator
    if (selectedOperator === 'between' && filterValue2) {
      newFilter.secondValue = filterValue2;
    }
    
    setFilters([...filters, newFilter]);
    handleAddFilterDialogClose();
  };
  
  // Handle remove filter
  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };
  
  // Handle save screen
  const handleSaveScreen = async () => {
    if (!screenName) return;
    
    try {
      await screenerService.saveCustomScreen(screenName, screenDescription, filters);
      setSaveScreenDialogOpen(false);
      
      // Refresh preset screens
      const presetsData = await screenerService.getPresetScreens();
      setPresetScreens(presetsData);
    } catch (err: any) {
      setError(err.message || 'Failed to save screen');
    }
  };
  
  // Handle load preset screen
  const handleLoadPresetScreen = async (presetId: string) => {
    try {
      const preset = presetScreens.find(p => p.id === presetId);
      if (preset) {
        setFilters(preset.filters);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load preset screen');
    }
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilters([]);
    setResults([]);
  };
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  // Get field label
  const getFieldLabel = (fieldName: string): string => {
    for (const category of availableFields) {
      for (const field of category.fields) {
        if (field.name === fieldName) {
          return field.label;
        }
      }
    }
    return fieldName;
  };
  
  // Get operator label
  const getOperatorLabel = (operator: string): string => {
    const operatorMap: Record<string, string> = {
      'equals': 'equals',
      'notEquals': 'not equals',
      'greaterThan': 'greater than',
      'lessThan': 'less than',
      'between': 'between',
      'in': 'in'
    };
    
    return operatorMap[operator] || operator;
  };
  
  // Show loading state
  if (loading && !results.length) {
    return <LoadingIndicator />;
  }
  
  // Show error state
  if (error) {
    return <ErrorDisplay message={error} />;
  }
  
  return (
    <Box>
      <PageHeader 
        title="Stock Screener" 
        subtitle="Find stocks based on custom criteria"
        icon={<FilterList />}
      />
      
      {/* Preset Screens */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>Preset Screens</Typography>
        <Grid container spacing={2}>
          {presetScreens.map((preset) => (
            <Grid item key={preset.id}>
              <Chip 
                label={preset.name} 
                onClick={() => handleLoadPresetScreen(preset.id)}
                clickable
                color="primary"
                variant="outlined"
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
      
      {/* Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Filters</Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<Save />} 
              onClick={handleSaveScreenDialogOpen}
              disabled={filters.length === 0}
              sx={{ mr: 1 }}
            >
              Save Screen
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<Delete />} 
              onClick={handleClearFilters}
              disabled={filters.length === 0}
              sx={{ mr: 1 }}
            >
              Clear All
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={handleAddFilterDialogOpen}
            >
              Add Filter
            </Button>
          </Box>
        </Box>
        
        {filters.length > 0 ? (
          <Grid container spacing={2}>
            {filters.map((filter, index) => (
              <Grid item key={index}>
                <Chip 
                  label={`${getFieldLabel(filter.field)} ${getOperatorLabel(filter.operator)} ${filter.value}${filter.secondValue ? ` to ${filter.secondValue}` : ''}`}
                  onDelete={() => handleRemoveFilter(index)}
                  color="primary"
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No filters applied. Add filters to start screening stocks.
          </Typography>
        )}
      </Paper>
      
      {/* Results */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={3}>
          <Typography variant="h6">
            Results {totalResults > 0 ? `(${totalResults})` : ''}
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />} 
            onClick={runScreen}
            disabled={filters.length === 0}
          >
            Run Screen
          </Button>
        </Box>
        
        {loading && results.length > 0 ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : results.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell 
                      align="right" 
                      onClick={() => handleSortChange('price')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Price
                      {sortBy === 'price' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </TableCell>
                    <TableCell 
                      align="right"
                      onClick={() => handleSortChange('change')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Change
                      {sortBy === 'change' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </TableCell>
                    <TableCell 
                      align="right"
                      onClick={() => handleSortChange('marketCap')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Market Cap
                      {sortBy === 'marketCap' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </TableCell>
                    <TableCell 
                      align="right"
                      onClick={() => handleSortChange('sector')}
                      sx={{ cursor: 'pointer' }}
                    >
                      Sector
                      {sortBy === 'sector' && (
                        sortDirection === 'asc' ? ' ↑' : ' ↓'
                      )}
                    </TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.symbol} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {result.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell>{result.name}</TableCell>
                      <TableCell align="right">
                        {result.price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </TableCell>
                      <TableCell align="right">
                        <ValueChangeIndicator 
                          value={result.change} 
                          percentage={result.changePercent} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        {result.marketCap >= 1e12 ? 
                          `$${(result.marketCap / 1e12).toFixed(2)}T` : 
                          result.marketCap >= 1e9 ? 
                            `$${(result.marketCap / 1e9).toFixed(2)}B` : 
                            `$${(result.marketCap / 1e6).toFixed(2)}M`
                        }
                      </TableCell>
                      <TableCell align="right">{result.sector}</TableCell>
                      <TableCell align="right">
                        <Box>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => navigate(`/stock/${result.symbol}`)}
                            >
                              <Search fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add to Watchlist">
                            <IconButton size="small">
                              <BookmarkBorder fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalResults}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        ) : filters.length > 0 ? (
          <NoData message="No stocks match your criteria" />
        ) : (
          <NoData message="Add filters and run the screen to see results" />
        )}
      </Paper>
      
      {/* Add Filter Dialog */}
      <Dialog open={addFilterDialogOpen} onClose={handleAddFilterDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Filter</DialogTitle>
        <DialogContent>
          <Box mt={1}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                label="Field"
              >
                {availableFields.map((category) => [
                  <MenuItem key={category.category} disabled divider>
                    <Typography variant="subtitle2">{category.category}</Typography>
                  </MenuItem>,
                  ...category.fields.map((field: any) => (
                    <MenuItem key={field.name} value={field.name}>
                      {field.label}
                    </MenuItem>
                  ))
                ])}
              </Select>
            </FormControl>
            
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                label="Operator"
                disabled={!selectedField}
              >
                <MenuItem value="equals">Equals</MenuItem>
                <MenuItem value="notEquals">Not Equals</MenuItem>
                <MenuItem value="greaterThan">Greater Than</MenuItem>
                <MenuItem value="lessThan">Less Than</MenuItem>
                <MenuItem value="between">Between</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              label="Value"
              fullWidth
              variant="outlined"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={!selectedOperator}
              sx={{ mb: selectedOperator === 'between' ? 2 : 0 }}
            />
            
            {selectedOperator === 'between' && (
              <TextField
                margin="dense"
                label="Second Value"
                fullWidth
                variant="outlined"
                value={filterValue2}
                onChange={(e) => setFilterValue2(e.target.value)}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddFilterDialogClose}>Cancel</Button>
          <Button 
            onClick={handleAddFilter} 
            variant="contained"
            disabled={!selectedField || !selectedOperator || !filterValue || (selectedOperator === 'between' && !filterValue2)}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Save Screen Dialog */}
      <Dialog open={saveScreenDialogOpen} onClose={handleSaveScreenDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Save Screen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Screen Name"
            fullWidth
            variant="outlined"
            value={screenName}
            onChange={(e) => setScreenName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={screenDescription}
            onChange={(e) => setScreenDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveScreenDialogClose}>Cancel</Button>
          <Button 
            onClick={handleSaveScreen} 
            variant="contained"
            disabled={!screenName}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScreenerPage;