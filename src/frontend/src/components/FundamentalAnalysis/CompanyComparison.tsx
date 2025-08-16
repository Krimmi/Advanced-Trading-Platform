import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
  TextField,
  Button,
  Autocomplete,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';
import financialAnalysisService from '../../services/financialAnalysisService';

interface CompanyComparisonProps {
  mainSymbol: string;
  peerSymbols: string[];
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
      id={`comparison-tabpanel-${index}`}
      aria-labelledby={`comparison-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

interface CompanyData {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  financialRatios: {
    profitability: {
      grossProfitMargin: number;
      operatingProfitMargin: number;
      netProfitMargin: number;
      returnOnAssets: number;
      returnOnEquity: number;
      returnOnCapitalEmployed: number;
    };
    liquidity: {
      currentRatio: number;
      quickRatio: number;
      cashRatio: number;
      operatingCashFlowRatio: number;
    };
    leverage: {
      debtToEquity: number;
      debtToAssets: number;
      interestCoverage: number;
      debtToEBITDA: number;
    };
    efficiency: {
      assetTurnover: number;
      inventoryTurnover: number;
      receivablesTurnover: number;
      payablesTurnover: number;
      fixedAssetTurnover: number;
    };
    valuation: {
      peRatio: number;
      priceToBook: number;
      priceToSales: number;
      evToEBITDA: number;
      evToRevenue: number;
      peg: number;
    };
    growth: {
      revenueGrowth: number;
      earningsGrowth: number;
      dividendGrowth: number;
      bookValueGrowth: number;
      freeCashFlowGrowth: number;
    };
  };
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const CompanyComparison: React.FC<CompanyComparisonProps> = ({ mainSymbol, peerSymbols }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [companiesData, setCompaniesData] = useState<CompanyData[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([mainSymbol]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [customCompany, setCustomCompany] = useState<string>('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  
  useEffect(() => {
    // Initialize with main symbol and peer symbols
    const initialCompanies = [mainSymbol, ...peerSymbols.slice(0, 4)]; // Limit to 5 companies initially
    setSelectedCompanies(initialCompanies);
    setAvailableCompanies([...new Set([...peerSymbols, mainSymbol])]);
    
    // Set default selected metrics based on tab
    if (tabValue === 0) {
      setSelectedMetrics(['grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin', 'returnOnEquity']);
    } else if (tabValue === 1) {
      setSelectedMetrics(['currentRatio', 'quickRatio', 'cashRatio']);
    } else if (tabValue === 2) {
      setSelectedMetrics(['debtToEquity', 'interestCoverage']);
    } else if (tabValue === 3) {
      setSelectedMetrics(['assetTurnover', 'inventoryTurnover']);
    } else if (tabValue === 4) {
      setSelectedMetrics(['peRatio', 'priceToBook', 'priceToSales', 'evToEBITDA']);
    } else if (tabValue === 5) {
      setSelectedMetrics(['revenueGrowth', 'earningsGrowth']);
    }
    
    fetchCompaniesData(initialCompanies);
  }, [mainSymbol, peerSymbols]);

  const fetchCompaniesData = async (symbols: string[]) => {
    setLoading(true);
    try {
      const data = await Promise.all(
        symbols.map(symbol => financialAnalysisService.getCompanyComparisonData(symbol))
      );
      setCompaniesData(data);
    } catch (error) {
      console.error('Error fetching companies data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update selected metrics based on tab
    if (newValue === 0) {
      setSelectedMetrics(['grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin', 'returnOnEquity']);
    } else if (newValue === 1) {
      setSelectedMetrics(['currentRatio', 'quickRatio', 'cashRatio']);
    } else if (newValue === 2) {
      setSelectedMetrics(['debtToEquity', 'interestCoverage']);
    } else if (newValue === 3) {
      setSelectedMetrics(['assetTurnover', 'inventoryTurnover']);
    } else if (newValue === 4) {
      setSelectedMetrics(['peRatio', 'priceToBook', 'priceToSales', 'evToEBITDA']);
    } else if (newValue === 5) {
      setSelectedMetrics(['revenueGrowth', 'earningsGrowth']);
    }
  };

  const handleAddCompany = async () => {
    if (customCompany && !selectedCompanies.includes(customCompany)) {
      const newSelectedCompanies = [...selectedCompanies, customCompany];
      setSelectedCompanies(newSelectedCompanies);
      
      try {
        const newCompanyData = await financialAnalysisService.getCompanyComparisonData(customCompany);
        setCompaniesData([...companiesData, newCompanyData]);
        
        // Add to available companies if not already there
        if (!availableCompanies.includes(customCompany)) {
          setAvailableCompanies([...availableCompanies, customCompany]);
        }
      } catch (error) {
        console.error(`Error fetching data for ${customCompany}:`, error);
        // Remove from selected if fetch failed
        setSelectedCompanies(selectedCompanies);
      }
      
      setCustomCompany('');
    }
  };

  const handleRemoveCompany = (symbol: string) => {
    // Don't allow removing the main symbol
    if (symbol === mainSymbol) return;
    
    const newSelectedCompanies = selectedCompanies.filter(s => s !== symbol);
    setSelectedCompanies(newSelectedCompanies);
    setCompaniesData(companiesData.filter(company => company.symbol !== symbol));
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    if (value === undefined || value === null) return 'N/A';
    
    if (Math.abs(value) >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  // Format percentage values
  const formatPercentage = (value: number): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Format metric name for display
  const formatMetricName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1') // Insert a space before all capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize the first letter
  };

  // Get available metrics based on category
  const getAvailableMetrics = (category: string): { value: string, label: string }[] => {
    if (!companiesData || companiesData.length === 0) return [];
    
    const company = companiesData[0];
    if (!company || !company.financialRatios) return [];
    
    const categoryData = company.financialRatios[category as keyof typeof company.financialRatios];
    if (!categoryData) return [];
    
    return Object.keys(categoryData).map(metric => ({
      value: metric,
      label: formatMetricName(metric)
    }));
  };

  // Prepare data for bar chart comparison
  const prepareBarChartData = (metrics: string[], category: string) => {
    if (!companiesData || companiesData.length === 0) return [];
    
    return metrics.map(metric => {
      const data: any = {
        name: formatMetricName(metric)
      };
      
      companiesData.forEach(company => {
        const categoryData = company.financialRatios[category as keyof typeof company.financialRatios];
        if (categoryData) {
          data[company.symbol] = categoryData[metric as keyof typeof categoryData];
        }
      });
      
      return data;
    });
  };

  // Prepare data for radar chart comparison
  const prepareRadarData = (metrics: string[], category: string) => {
    if (!companiesData || companiesData.length === 0) return [];
    
    // Normalize values for better visualization
    const normalizedData: any[] = [];
    
    metrics.forEach(metric => {
      const values = companiesData.map(company => {
        const categoryData = company.financialRatios[category as keyof typeof company.financialRatios];
        return categoryData ? categoryData[metric as keyof typeof categoryData] : null;
      }).filter(value => value !== null);
      
      const max = Math.max(...values);
      const min = Math.min(...values);
      const range = max - min;
      
      companiesData.forEach(company => {
        const categoryData = company.financialRatios[category as keyof typeof company.financialRatios];
        if (!categoryData) return;
        
        const value = categoryData[metric as keyof typeof categoryData];
        if (value === null || value === undefined) return;
        
        // Find or create company data object
        let companyData = normalizedData.find(item => item.company === company.symbol);
        if (!companyData) {
          companyData = { company: company.symbol };
          normalizedData.push(companyData);
        }
        
        // Normalize value between 0 and 100
        let normalizedValue;
        if (range === 0) {
          normalizedValue = 50; // If all values are the same
        } else {
          normalizedValue = ((value - min) / range) * 100;
        }
        
        companyData[metric] = normalizedValue;
        companyData[`${metric}Original`] = value; // Store original value for tooltip
      });
    });
    
    return normalizedData;
  };

  // Get category based on tab value
  const getCategoryFromTab = (tab: number): string => {
    switch (tab) {
      case 0: return 'profitability';
      case 1: return 'liquidity';
      case 2: return 'leverage';
      case 3: return 'efficiency';
      case 4: return 'valuation';
      case 5: return 'growth';
      default: return 'profitability';
    }
  };

  // Render company selection panel
  const renderCompanySelectionPanel = () => {
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Company Selection</Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Autocomplete
              value={customCompany}
              onChange={(event, newValue) => setCustomCompany(newValue || '')}
              inputValue={customCompany}
              onInputChange={(event, newInputValue) => setCustomCompany(newInputValue)}
              options={availableCompanies.filter(symbol => !selectedCompanies.includes(symbol))}
              freeSolo
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Add Company" 
                  size="small" 
                  placeholder="Enter ticker symbol"
                />
              )}
            />
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddCompany}
              disabled={!customCompany || selectedCompanies.includes(customCompany)}
            >
              Add
            </Button>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedCompanies.map((symbol) => (
            <Chip
              key={symbol}
              label={symbol}
              color={symbol === mainSymbol ? 'primary' : 'default'}
              onDelete={symbol === mainSymbol ? undefined : () => handleRemoveCompany(symbol)}
            />
          ))}
        </Box>
      </Paper>
    );
  };

  // Render metric selection panel
  const renderMetricSelectionPanel = () => {
    const category = getCategoryFromTab(tabValue);
    const metrics = getAvailableMetrics(category);
    
    return (
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Metric Selection</Typography>
        
        <FormControl fullWidth size="small">
          <InputLabel id="metrics-select-label">Select Metrics</InputLabel>
          <Select
            labelId="metrics-select-label"
            id="metrics-select"
            multiple
            value={selectedMetrics}
            onChange={(e) => setSelectedMetrics(e.target.value as string[])}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={formatMetricName(value)} size="small" />
                ))}
              </Box>
            )}
            label="Select Metrics"
          >
            {metrics.map((metric) => (
              <MenuItem key={metric.value} value={metric.value}>
                {metric.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>
    );
  };

  // Render company overview cards
  const renderCompanyOverviewCards = () => {
    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {companiesData.map((company, index) => (
          <Grid item xs={12} sm={6} md={4} key={company.symbol}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {company.name} ({company.symbol})
                </Typography>
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Sector: {company.sector}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Industry: {company.industry}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Market Cap: {formatCurrency(company.marketCap)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Price: {formatCurrency(company.price)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Key Metrics
                </Typography>
                
                <Box>
                  <Typography variant="body2">
                    P/E Ratio: {company.financialRatios.valuation.peRatio?.toFixed(2) || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    Net Profit Margin: {formatPercentage(company.financialRatios.profitability.netProfitMargin)}
                  </Typography>
                  <Typography variant="body2">
                    ROE: {formatPercentage(company.financialRatios.profitability.returnOnEquity)}
                  </Typography>
                  <Typography variant="body2">
                    Debt to Equity: {company.financialRatios.leverage.debtToEquity?.toFixed(2) || 'N/A'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render bar chart comparison
  const renderBarChartComparison = () => {
    const category = getCategoryFromTab(tabValue);
    const data = prepareBarChartData(selectedMetrics, category);
    
    if (data.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No comparison data available</Typography>
        </Box>
      );
    }
    
    return (
      <Paper sx={{ p: 2, height: '400px' }}>
        <Typography variant="h6" align="center" gutterBottom>
          {formatMetricName(category)} Metrics Comparison
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            {companiesData.map((company, index) => (
              <Bar
                key={company.symbol}
                dataKey={company.symbol}
                name={company.symbol}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render radar chart comparison
  const renderRadarChartComparison = () => {
    const category = getCategoryFromTab(tabValue);
    const data = prepareRadarData(selectedMetrics, category);
    
    if (data.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No radar chart data available</Typography>
        </Box>
      );
    }
    
    return (
      <Paper sx={{ p: 2, height: '500px' }}>
        <Typography variant="h6" align="center" gutterBottom>
          {formatMetricName(category)} Metrics Radar Comparison
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <RadarChart outerRadius={150} data={selectedMetrics.map(metric => ({ name: formatMetricName(metric) }))}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            
            {data.map((entry, index) => (
              <Radar
                key={entry.company}
                name={entry.company}
                dataKey={(value) => entry[value.name.toLowerCase().replace(/\s+/g, '')]}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
            
            <Legend />
            <RechartsTooltip 
              formatter={(value: any, name: string, props: any) => {
                const metric = props.payload.name.toLowerCase().replace(/\s+/g, '');
                const originalValue = props.payload.payload[`${metric}Original`];
                return [originalValue?.toFixed(2), name];
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </Paper>
    );
  };

  // Render comparison table
  const renderComparisonTable = () => {
    const category = getCategoryFromTab(tabValue);
    const metrics = getAvailableMetrics(category);
    
    if (!companiesData || companiesData.length === 0 || metrics.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <Typography variant="body1">No comparison data available</Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              {companiesData.map((company) => (
                <TableCell key={company.symbol} align="right">
                  {company.symbol}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.map((metric) => {
              const isPercentageMetric = [
                'grossProfitMargin', 'operatingProfitMargin', 'netProfitMargin',
                'returnOnAssets', 'returnOnEquity', 'returnOnCapitalEmployed',
                'revenueGrowth', 'earningsGrowth', 'dividendGrowth', 'bookValueGrowth', 'freeCashFlowGrowth'
              ].includes(metric.value);
              
              return (
                <TableRow key={metric.value}>
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {metric.label}
                      <Tooltip title={`${metric.label} represents ${metric.value}`}>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  {companiesData.map((company) => {
                    const categoryData = company.financialRatios[category as keyof typeof company.financialRatios];
                    const value = categoryData ? categoryData[metric.value as keyof typeof categoryData] : null;
                    
                    return (
                      <TableCell key={`${company.symbol}-${metric.value}`} align="right">
                        {value !== null && value !== undefined
                          ? isPercentageMetric
                            ? formatPercentage(value as number)
                            : (value as number).toFixed(2)
                          : 'N/A'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderCompanySelectionPanel()}
          
          {renderCompanyOverviewCards()}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="company comparison tabs">
              <Tab label="Profitability" />
              <Tab label="Liquidity" />
              <Tab label="Leverage" />
              <Tab label="Efficiency" />
              <Tab label="Valuation" />
              <Tab label="Growth" />
            </Tabs>
          </Box>
          
          {renderMetricSelectionPanel()}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {renderBarChartComparison()}
            </Grid>
            
            <Grid item xs={12}>
              {renderRadarChartComparison()}
            </Grid>
            
            <Grid item xs={12}>
              {renderComparisonTable()}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default CompanyComparison;