import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton,
  Slider,
  TextField,
  InputAdornment,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  Cell,
  PieChart,
  Pie,
  Sector
} from 'recharts';
import valuationService from '../../services/valuationService';

interface ValuationModelVisualizationProps {
  symbol: string;
  valuationData: {
    dcf: {
      fairValue: number;
      currentPrice: number;
      upside: number;
      assumptions: {
        growthRate: number;
        discountRate: number;
        terminalGrowthRate: number;
        projectionYears: number;
      };
      projections: Array<{
        year: number;
        revenue: number;
        ebit: number;
        fcf: number;
        presentValue: number;
      }>;
    };
    comparables: {
      fairValue: number;
      currentPrice: number;
      upside: number;
      metrics: {
        peRatio: number;
        evToEbitda: number;
        priceToBook: number;
        priceToSales: number;
      };
      peerComparisons: Array<{
        symbol: string;
        name: string;
        peRatio: number;
        evToEbitda: number;
        priceToBook: number;
        priceToSales: number;
      }>;
    };
    consensusTargets: {
      meanTarget: number;
      highTarget: number;
      lowTarget: number;
      currentPrice: number;
      upside: number;
      numAnalysts: number;
      recommendations: {
        buy: number;
        overweight: number;
        hold: number;
        underweight: number;
        sell: number;
      };
    };
  };
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
      id={`valuation-tabpanel-${index}`}
      aria-labelledby={`valuation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ValuationModelVisualization: React.FC<ValuationModelVisualizationProps> = ({ symbol, valuationData }) => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [editingDCF, setEditingDCF] = useState<boolean>(false);
  const [dcfAssumptions, setDcfAssumptions] = useState(valuationData.dcf.assumptions);
  const [recalculatedDCF, setRecalculatedDCF] = useState<any>(null);
  const [recalculatingDCF, setRecalculatingDCF] = useState<boolean>(false);
  const [activeRecommendationIndex, setActiveRecommendationIndex] = useState<number | undefined>(undefined);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Reset DCF assumptions when valuationData changes
  useEffect(() => {
    setDcfAssumptions(valuationData.dcf.assumptions);
    setRecalculatedDCF(null);
  }, [valuationData]);

  const handleDCFAssumptionChange = (assumption: string, value: number) => {
    setDcfAssumptions({
      ...dcfAssumptions,
      [assumption]: value
    });
  };

  const handleRecalculateDCF = async () => {
    setRecalculatingDCF(true);
    try {
      const result = await valuationService.recalculateDCF(symbol, dcfAssumptions);
      setRecalculatedDCF(result);
    } catch (error) {
      console.error('Error recalculating DCF:', error);
    } finally {
      setRecalculatingDCF(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  // Prepare data for valuation comparison chart
  const prepareValuationComparisonData = () => {
    const data = [
      {
        name: 'DCF Model',
        value: recalculatedDCF ? recalculatedDCF.fairValue : valuationData.dcf.fairValue,
        color: COLORS[0]
      },
      {
        name: 'Comparable Companies',
        value: valuationData.comparables.fairValue,
        color: COLORS[1]
      },
      {
        name: 'Analyst Consensus',
        value: valuationData.consensusTargets.meanTarget,
        color: COLORS[2]
      },
      {
        name: 'Current Price',
        value: valuationData.dcf.currentPrice,
        color: COLORS[3]
      }
    ];
    
    return data;
  };

  // Prepare data for DCF projections chart
  const prepareDCFProjectionsData = () => {
    const projections = recalculatedDCF ? recalculatedDCF.projections : valuationData.dcf.projections;
    return projections.map((projection: any) => ({
      year: projection.year,
      revenue: projection.revenue,
      ebit: projection.ebit,
      fcf: projection.fcf,
      presentValue: projection.presentValue
    }));
  };

  // Prepare data for comparable companies chart
  const prepareComparableCompaniesData = () => {
    const metrics = ['peRatio', 'evToEbitda', 'priceToBook', 'priceToSales'];
    const companies = valuationData.comparables.peerComparisons;
    
    // Add the main company to the comparison
    const mainCompany = {
      symbol: symbol,
      name: symbol,
      peRatio: valuationData.comparables.metrics.peRatio,
      evToEbitda: valuationData.comparables.metrics.evToEbitda,
      priceToBook: valuationData.comparables.metrics.priceToBook,
      priceToSales: valuationData.comparables.metrics.priceToSales
    };
    
    const allCompanies = [mainCompany, ...companies];
    
    return metrics.map(metric => {
      const formattedMetric = metric
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
      
      return {
        name: formattedMetric,
        ...allCompanies.reduce((acc, company) => {
          acc[company.symbol] = company[metric as keyof typeof company];
          return acc;
        }, {} as Record<string, number>)
      };
    });
  };

  // Prepare data for analyst recommendations pie chart
  const prepareAnalystRecommendationsData = () => {
    const { recommendations } = valuationData.consensusTargets;
    return [
      { name: 'Buy', value: recommendations.buy, color: '#4caf50' },
      { name: 'Overweight', value: recommendations.overweight, color: '#8bc34a' },
      { name: 'Hold', value: recommendations.hold, color: '#ffeb3b' },
      { name: 'Underweight', value: recommendations.underweight, color: '#ff9800' },
      { name: 'Sell', value: recommendations.sell, color: '#f44336' }
    ];
  };

  // Custom active shape for pie chart
  const renderActiveShape = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-midAngle * Math.PI / 180);
    const cos = Math.cos(-midAngle * Math.PI / 180);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.name}: ${value}`}</text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey + 18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  // Render DCF model tab
  const renderDCFModelTab = () => {
    const dcfData = recalculatedDCF || valuationData.dcf;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">DCF Valuation Summary</Typography>
                <IconButton size="small" onClick={() => setEditingDCF(!editingDCF)}>
                  {editingDCF ? <CheckIcon /> : <EditIcon />}
                </IconButton>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Fair Value</Typography>
                <Typography variant="h4" color={dcfData.upside > 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(dcfData.fairValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Price: {formatCurrency(dcfData.currentPrice)}
                </Typography>
                <Typography 
                  variant="body1" 
                  color={dcfData.upside > 0 ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {dcfData.upside > 0 ? 'Undervalued' : 'Overvalued'} by {formatPercentage(Math.abs(dcfData.upside))}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>Model Assumptions</Typography>
              
              {editingDCF ? (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>Growth Rate (%)</Typography>
                    <Slider
                      value={dcfAssumptions.growthRate}
                      min={-20}
                      max={50}
                      step={0.5}
                      onChange={(_, value) => handleDCFAssumptionChange('growthRate', value as number)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <TextField
                      size="small"
                      value={dcfAssumptions.growthRate}
                      onChange={(e) => handleDCFAssumptionChange('growthRate', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>Discount Rate (%)</Typography>
                    <Slider
                      value={dcfAssumptions.discountRate}
                      min={5}
                      max={20}
                      step={0.5}
                      onChange={(_, value) => handleDCFAssumptionChange('discountRate', value as number)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <TextField
                      size="small"
                      value={dcfAssumptions.discountRate}
                      onChange={(e) => handleDCFAssumptionChange('discountRate', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>Terminal Growth Rate (%)</Typography>
                    <Slider
                      value={dcfAssumptions.terminalGrowthRate}
                      min={0}
                      max={5}
                      step={0.1}
                      onChange={(_, value) => handleDCFAssumptionChange('terminalGrowthRate', value as number)}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value}%`}
                    />
                    <TextField
                      size="small"
                      value={dcfAssumptions.terminalGrowthRate}
                      onChange={(e) => handleDCFAssumptionChange('terminalGrowthRate', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>Projection Years</Typography>
                    <Slider
                      value={dcfAssumptions.projectionYears}
                      min={3}
                      max={10}
                      step={1}
                      onChange={(_, value) => handleDCFAssumptionChange('projectionYears', value as number)}
                      valueLabelDisplay="auto"
                      marks
                    />
                    <TextField
                      size="small"
                      value={dcfAssumptions.projectionYears}
                      onChange={(e) => handleDCFAssumptionChange('projectionYears', Number(e.target.value))}
                    />
                  </Box>
                  
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={handleRecalculateDCF}
                    disabled={recalculatingDCF}
                  >
                    {recalculatingDCF ? <CircularProgress size={24} /> : 'Recalculate DCF'}
                  </Button>
                </Box>
              ) : (
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Growth Rate" 
                      secondary={`${dcfData.assumptions.growthRate}%`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Discount Rate" 
                      secondary={`${dcfData.assumptions.discountRate}%`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Terminal Growth Rate" 
                      secondary={`${dcfData.assumptions.terminalGrowthRate}%`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Projection Years" 
                      secondary={dcfData.assumptions.projectionYears} 
                    />
                  </ListItem>
                </List>
              )}
              
              {recalculatedDCF && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This is a recalculated valuation based on your custom assumptions.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" align="center" gutterBottom>
              DCF Projections
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart
                data={prepareDCFProjectionsData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" />
                <Line type="monotone" dataKey="ebit" name="EBIT" stroke="#82ca9d" />
                <Line type="monotone" dataKey="fcf" name="Free Cash Flow" stroke="#ffc658" />
                <Line type="monotone" dataKey="presentValue" name="Present Value" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render comparable companies tab
  const renderComparableCompaniesTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Comparable Companies Valuation</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Fair Value</Typography>
                <Typography 
                  variant="h4" 
                  color={valuationData.comparables.upside > 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(valuationData.comparables.fairValue)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Price: {formatCurrency(valuationData.comparables.currentPrice)}
                </Typography>
                <Typography 
                  variant="body1" 
                  color={valuationData.comparables.upside > 0 ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {valuationData.comparables.upside > 0 ? 'Undervalued' : 'Overvalued'} by {formatPercentage(Math.abs(valuationData.comparables.upside))}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>Key Metrics</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="P/E Ratio" 
                    secondary={valuationData.comparables.metrics.peRatio.toFixed(2)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="EV/EBITDA" 
                    secondary={valuationData.comparables.metrics.evToEbitda.toFixed(2)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Price/Book" 
                    secondary={valuationData.comparables.metrics.priceToBook.toFixed(2)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Price/Sales" 
                    secondary={valuationData.comparables.metrics.priceToSales.toFixed(2)} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" align="center" gutterBottom>
              Peer Comparison
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={prepareComparableCompaniesData()}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Legend />
                {valuationData.comparables.peerComparisons.map((company, index) => (
                  <Bar 
                    key={company.symbol} 
                    dataKey={company.symbol} 
                    name={company.name} 
                    fill={COLORS[(index + 1) % COLORS.length]} 
                  />
                ))}
                <Bar dataKey={symbol} name={symbol} fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render analyst consensus tab
  const renderAnalystConsensusTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Analyst Consensus</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Mean Target Price</Typography>
                <Typography 
                  variant="h4" 
                  color={valuationData.consensusTargets.upside > 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(valuationData.consensusTargets.meanTarget)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Price: {formatCurrency(valuationData.consensusTargets.currentPrice)}
                </Typography>
                <Typography 
                  variant="body1" 
                  color={valuationData.consensusTargets.upside > 0 ? 'success.main' : 'error.main'}
                  fontWeight="medium"
                >
                  {valuationData.consensusTargets.upside > 0 ? 'Upside' : 'Downside'} of {formatPercentage(Math.abs(valuationData.consensusTargets.upside))}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>Price Targets</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="High Target" 
                    secondary={formatCurrency(valuationData.consensusTargets.highTarget)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Mean Target" 
                    secondary={formatCurrency(valuationData.consensusTargets.meanTarget)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Low Target" 
                    secondary={formatCurrency(valuationData.consensusTargets.lowTarget)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Number of Analysts" 
                    secondary={valuationData.consensusTargets.numAnalysts} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" align="center" gutterBottom>
              Analyst Recommendations
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart>
                <Pie
                  activeIndex={activeRecommendationIndex}
                  activeShape={renderActiveShape}
                  data={prepareAnalystRecommendationsData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveRecommendationIndex(index)}
                  onMouseLeave={() => setActiveRecommendationIndex(undefined)}
                >
                  {prepareAnalystRecommendationsData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render valuation comparison tab
  const renderValuationComparisonTab = () => {
    const data = prepareValuationComparisonData();
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" align="center" gutterBottom>
              Valuation Model Comparison
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="value" name="Price">
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Valuation Summary</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" align="center">DCF Model</Typography>
                      <Typography variant="h5" align="center" color={valuationData.dcf.upside > 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(recalculatedDCF ? recalculatedDCF.fairValue : valuationData.dcf.fairValue)}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        {(recalculatedDCF ? recalculatedDCF.upside : valuationData.dcf.upside) > 0 ? 'Undervalued' : 'Overvalued'} by {formatPercentage(Math.abs(recalculatedDCF ? recalculatedDCF.upside : valuationData.dcf.upside))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" align="center">Comparable Companies</Typography>
                      <Typography variant="h5" align="center" color={valuationData.comparables.upside > 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(valuationData.comparables.fairValue)}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        {valuationData.comparables.upside > 0 ? 'Undervalued' : 'Overvalued'} by {formatPercentage(Math.abs(valuationData.comparables.upside))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" align="center">Analyst Consensus</Typography>
                      <Typography variant="h5" align="center" color={valuationData.consensusTargets.upside > 0 ? 'success.main' : 'error.main'}>
                        {formatCurrency(valuationData.consensusTargets.meanTarget)}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        {valuationData.consensusTargets.upside > 0 ? 'Upside' : 'Downside'} of {formatPercentage(Math.abs(valuationData.consensusTargets.upside))}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Current Price</Typography>
                <Typography variant="h4">
                  {formatCurrency(valuationData.dcf.currentPrice)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="valuation model tabs">
          <Tab label="DCF Model" />
          <Tab label="Comparable Companies" />
          <Tab label="Analyst Consensus" />
          <Tab label="Valuation Comparison" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderDCFModelTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderComparableCompaniesTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderAnalystConsensusTab()}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderValuationComparisonTab()}
      </TabPanel>
    </Box>
  );
};

export default ValuationModelVisualization;