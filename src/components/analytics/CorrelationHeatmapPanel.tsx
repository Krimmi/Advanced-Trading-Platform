import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Slider,
  TextField,
  Autocomplete,
  Chip,
  Button,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import GridViewIcon from '@mui/icons-material/GridView';
import TableChartIcon from '@mui/icons-material/TableChart';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';

// Import chart components (assuming we're using recharts and react-vis for heatmap)
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

// Import types
import { CorrelationData } from '../../types/analytics';

// Mock component for heatmap (in a real app, you'd use a proper heatmap library)
const HeatmapChart = ({ data, colorRange }: { data: any[][], colorRange: [string, string] }) => {
  const theme = useTheme();
  const minColor = colorRange[0];
  const maxColor = colorRange[1];
  
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Box sx={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column'
      }}>
        {data.map((row, rowIndex) => (
          <Box 
            key={rowIndex} 
            sx={{ 
              display: 'flex', 
              flex: 1 
            }}
          >
            {row.map((value, colIndex) => {
              // Normalize value between -1 and 1
              const normalizedValue = Math.max(-1, Math.min(1, value));
              
              // Calculate color based on value
              let backgroundColor;
              if (normalizedValue > 0) {
                backgroundColor = alpha(maxColor, normalizedValue);
              } else {
                backgroundColor = alpha(minColor, Math.abs(normalizedValue));
              }
              
              return (
                <Box 
                  key={colIndex} 
                  sx={{ 
                    flex: 1, 
                    backgroundColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${theme.palette.divider}`,
                    color: Math.abs(normalizedValue) > 0.7 ? theme.palette.getContrastText(backgroundColor) : theme.palette.text.primary,
                    fontSize: '0.75rem',
                    fontWeight: Math.abs(normalizedValue) > 0.7 ? 'bold' : 'normal'
                  }}
                >
                  {value.toFixed(2)}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Mock component for network graph (in a real app, you'd use a proper network graph library)
const NetworkGraph = ({ data, threshold }: { data: any[][], threshold: number }) => {
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1
    }}>
      <Typography variant="body2" color="text.secondary">
        Network graph visualization would be displayed here.
        <br />
        Showing correlations with absolute value above {threshold}.
      </Typography>
    </Box>
  );
};

interface CorrelationHeatmapPanelProps {
  data: CorrelationData;
}

const CorrelationHeatmapPanel: React.FC<CorrelationHeatmapPanelProps> = ({ data }) => {
  const theme = useTheme();
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [assetClass, setAssetClass] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('heatmap');
  const [correlationThreshold, setCorrelationThreshold] = useState<number>(0.7);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredMatrix, setFilteredMatrix] = useState<any[][]>(data.correlationMatrix);
  const [filteredAssets, setFilteredAssets] = useState<string[]>(data.assets);
  
  // Colors for correlation heatmap
  const correlationColors: [string, string] = [theme.palette.error.main, theme.palette.success.main];
  
  // Effect to filter the correlation matrix based on selected assets and asset class
  useEffect(() => {
    let assetsToShow = data.assets;
    
    // Filter by asset class
    if (assetClass !== 'all') {
      const assetIndices = data.assets.map((asset, index) => {
        const assetInfo = data.assetInfo.find(info => info.symbol === asset);
        return assetInfo?.assetClass === assetClass ? index : -1;
      }).filter(index => index !== -1);
      
      assetsToShow = assetIndices.map(index => data.assets[index]);
    }
    
    // Filter by selected assets if any
    if (selectedAssets.length > 0) {
      assetsToShow = assetsToShow.filter(asset => selectedAssets.includes(asset));
    }
    
    // Filter by search query
    if (searchQuery) {
      assetsToShow = assetsToShow.filter(asset => 
        asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        data.assetInfo.find(info => info.symbol === asset)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Create filtered matrix
    const filteredIndices = assetsToShow.map(asset => data.assets.indexOf(asset));
    const newFilteredMatrix = filteredIndices.map(rowIndex => 
      filteredIndices.map(colIndex => data.correlationMatrix[rowIndex][colIndex])
    );
    
    setFilteredMatrix(newFilteredMatrix);
    setFilteredAssets(assetsToShow);
  }, [data, assetClass, selectedAssets, searchQuery]);
  
  const handleTimeframeChange = (event: SelectChangeEvent) => {
    setTimeframe(event.target.value);
  };
  
  const handleAssetClassChange = (event: SelectChangeEvent) => {
    setAssetClass(event.target.value);
  };
  
  const handleViewModeChange = (event: React.MouseEvent<HTMLElement>, newViewMode: string) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };
  
  const handleThresholdChange = (event: Event, newValue: number | number[]) => {
    setCorrelationThreshold(newValue as number);
  };
  
  const handleAssetSelectionChange = (event: React.SyntheticEvent, newValue: string[]) => {
    setSelectedAssets(newValue);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  const handleClearFilters = () => {
    setAssetClass('all');
    setSelectedAssets([]);
    setSearchQuery('');
  };
  
  // Find highly correlated pairs
  const getHighlyCorrelatedPairs = () => {
    const pairs: { asset1: string; asset2: string; correlation: number }[] = [];
    
    for (let i = 0; i < data.assets.length; i++) {
      for (let j = i + 1; j < data.assets.length; j++) {
        const correlation = data.correlationMatrix[i][j];
        if (Math.abs(correlation) >= correlationThreshold) {
          pairs.push({
            asset1: data.assets[i],
            asset2: data.assets[j],
            correlation
          });
        }
      }
    }
    
    // Sort by absolute correlation value (descending)
    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  };
  
  // Get asset name from symbol
  const getAssetName = (symbol: string) => {
    const assetInfo = data.assetInfo.find(info => info.symbol === symbol);
    return assetInfo ? assetInfo.name : symbol;
  };
  
  // Get asset class from symbol
  const getAssetClass = (symbol: string) => {
    const assetInfo = data.assetInfo.find(info => info.symbol === symbol);
    return assetInfo ? assetInfo.assetClass : 'Unknown';
  };
  
  // Render the correlation heatmap
  const renderCorrelationHeatmap = () => {
    if (filteredAssets.length === 0) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            No assets match the current filter criteria.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: '100%', position: 'relative' }}>
        {/* Asset labels for Y-axis */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100px', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1
        }}>
          {filteredAssets.map((asset, index) => (
            <Box 
              key={index} 
              sx={{ 
                flex: 1, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 1,
                fontSize: '0.75rem',
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {asset}
            </Box>
          ))}
        </Box>
        
        {/* Asset labels for X-axis */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: '100px', 
          width: 'calc(100% - 100px)', 
          height: '30px',
          display: 'flex',
          zIndex: 1
        }}>
          {filteredAssets.map((asset, index) => (
            <Box 
              key={index} 
              sx={{ 
                flex: 1, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'medium',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transform: 'rotate(-45deg)',
                transformOrigin: 'bottom left',
                height: '100%'
              }}
            >
              {asset}
            </Box>
          ))}
        </Box>
        
        {/* Heatmap */}
        <Box sx={{ 
          position: 'absolute', 
          top: '30px', 
          left: '100px', 
          width: 'calc(100% - 100px)', 
          height: 'calc(100% - 30px)'
        }}>
          <HeatmapChart data={filteredMatrix} colorRange={correlationColors} />
        </Box>
      </Box>
    );
  };
  
  // Render the correlation table
  const renderCorrelationTable = () => {
    return (
      <TableContainer component={Paper} sx={{ height: '100%', overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Asset 1</TableCell>
              <TableCell>Asset 2</TableCell>
              <TableCell align="right">Correlation</TableCell>
              <TableCell>Asset Classes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getHighlyCorrelatedPairs().map((pair, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Tooltip title={getAssetName(pair.asset1)}>
                    <Typography variant="body2">{pair.asset1}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title={getAssetName(pair.asset2)}>
                    <Typography variant="body2">{pair.asset2}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end',
                    color: pair.correlation > 0 ? 'success.main' : 'error.main',
                    fontWeight: Math.abs(pair.correlation) > 0.8 ? 'bold' : 'normal'
                  }}>
                    {pair.correlation.toFixed(3)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Chip 
                      label={getAssetClass(pair.asset1)} 
                      size="small" 
                      sx={{ fontSize: '0.7rem' }}
                    />
                    <Chip 
                      label={getAssetClass(pair.asset2)} 
                      size="small" 
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Render the network graph
  const renderNetworkGraph = () => {
    return (
      <NetworkGraph data={data.correlationMatrix} threshold={correlationThreshold} />
    );
  };
  
  // Render the correlation scatter plot
  const renderCorrelationScatterPlot = () => {
    // Create scatter plot data
    const scatterData = [];
    for (let i = 0; i < data.assets.length; i++) {
      for (let j = i + 1; j < data.assets.length; j++) {
        const asset1 = data.assets[i];
        const asset2 = data.assets[j];
        const correlation = data.correlationMatrix[i][j];
        const assetClass1 = getAssetClass(asset1);
        const assetClass2 = getAssetClass(asset2);
        
        // Only include if both assets match the filter
        if (
          (assetClass === 'all' || assetClass1 === assetClass || assetClass2 === assetClass) &&
          (selectedAssets.length === 0 || selectedAssets.includes(asset1) || selectedAssets.includes(asset2)) &&
          (!searchQuery || 
            asset1.toLowerCase().includes(searchQuery.toLowerCase()) || 
            asset2.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getAssetName(asset1).toLowerCase().includes(searchQuery.toLowerCase()) ||
            getAssetName(asset2).toLowerCase().includes(searchQuery.toLowerCase())
          )
        ) {
          scatterData.push({
            x: i,
            y: j,
            z: Math.abs(correlation),
            correlation,
            asset1,
            asset2,
            assetClass1,
            assetClass2
          });
        }
      }
    }
    
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="Asset Index" hide />
            <YAxis type="number" dataKey="y" name="Asset Index" hide />
            <RechartsTooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <Box sx={{ 
                      bgcolor: 'background.paper', 
                      p: 1, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2">{data.asset1} vs {data.asset2}</Typography>
                      <Typography variant="body2" sx={{ 
                        color: data.correlation > 0 ? 'success.main' : 'error.main',
                        fontWeight: 'bold'
                      }}>
                        Correlation: {data.correlation.toFixed(3)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {data.assetClass1} / {data.assetClass2}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              name="Correlations" 
              data={scatterData} 
              fill={theme.palette.primary.main}
              shape={(props) => {
                const { cx, cy, payload } = props;
                const size = payload.z * 20; // Scale by correlation strength
                const color = payload.correlation > 0 ? theme.palette.success.main : theme.palette.error.main;
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={size} 
                    fill={alpha(color, 0.6)}
                    stroke={color}
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the correlation over time chart
  const renderCorrelationOverTime = () => {
    // If no assets are selected, show a message
    if (selectedAssets.length !== 2) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            Select exactly 2 assets to view correlation over time.
          </Typography>
        </Box>
      );
    }
    
    // Get the correlation time series for the selected assets
    const asset1Index = data.assets.indexOf(selectedAssets[0]);
    const asset2Index = data.assets.indexOf(selectedAssets[1]);
    
    // Find the correlation time series
    const correlationTimeSeries = data.correlationTimeSeries.find(
      series => 
        (series.asset1 === selectedAssets[0] && series.asset2 === selectedAssets[1]) ||
        (series.asset1 === selectedAssets[1] && series.asset2 === selectedAssets[0])
    );
    
    if (!correlationTimeSeries) {
      return (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1
        }}>
          <Typography variant="body2" color="text.secondary">
            No correlation time series data available for these assets.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <Typography variant="subtitle2" gutterBottom>
          Correlation: {selectedAssets[0]} vs {selectedAssets[1]}
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart
            data={correlationTimeSeries.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[-1, 1]} />
            <RechartsTooltip />
            <Line 
              type="monotone" 
              dataKey="correlation" 
              stroke={theme.palette.primary.main} 
              dot={false}
            />
            <ReferenceLine y={0} stroke={theme.palette.divider} />
            <ReferenceLine y={0.7} stroke={theme.palette.success.light} strokeDasharray="3 3" />
            <ReferenceLine y={-0.7} stroke={theme.palette.error.light} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    );
  };
  
  // Render the main visualization based on view mode
  const renderVisualization = () => {
    switch (viewMode) {
      case 'heatmap':
        return renderCorrelationHeatmap();
      case 'table':
        return renderCorrelationTable();
      case 'network':
        return renderNetworkGraph();
      case 'scatter':
        return renderCorrelationScatterPlot();
      case 'timeseries':
        return renderCorrelationOverTime();
      default:
        return renderCorrelationHeatmap();
    }
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeframe-label">Timeframe</InputLabel>
              <Select
                labelId="timeframe-label"
                id="timeframe-select"
                value={timeframe}
                label="Timeframe"
                onChange={handleTimeframeChange}
              >
                <MenuItem value="1d">1 Day</MenuItem>
                <MenuItem value="5d">5 Days</MenuItem>
                <MenuItem value="1m">1 Month</MenuItem>
                <MenuItem value="3m">3 Months</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="asset-class-label">Asset Class</InputLabel>
              <Select
                labelId="asset-class-label"
                id="asset-class-select"
                value={assetClass}
                label="Asset Class"
                onChange={handleAssetClassChange}
              >
                <MenuItem value="all">All Asset Classes</MenuItem>
                {data.assetClasses.map((assetClass) => (
                  <MenuItem key={assetClass} value={assetClass}>{assetClass}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Assets"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<FilterListIcon />}
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
              <IconButton size="small">
                <DownloadIcon />
              </IconButton>
              <IconButton size="small">
                <SettingsIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              size="small"
              options={data.assets}
              value={selectedAssets}
              onChange={handleAssetSelectionChange}
              getOptionLabel={(option) => `${option} - ${getAssetName(option)}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Assets"
                  placeholder="Type to search assets"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ minWidth: 180 }}>
                Correlation Threshold: {correlationThreshold.toFixed(2)}
              </Typography>
              <Slider
                value={correlationThreshold}
                onChange={handleThresholdChange}
                min={0}
                max={1}
                step={0.05}
                valueLabelDisplay="auto"
                sx={{ flex: 1 }}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          aria-label="view mode"
          size="small"
        >
          <ToggleButton value="heatmap" aria-label="heatmap">
            <Tooltip title="Heatmap View">
              <GridViewIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table" aria-label="table">
            <Tooltip title="Table View">
              <TableChartIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="network" aria-label="network">
            <Tooltip title="Network Graph">
              <NetworkCheckIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="scatter" aria-label="scatter">
            <Tooltip title="Scatter Plot">
              <FilterListIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="timeseries" aria-label="timeseries">
            <Tooltip title="Correlation Over Time">
              <TimelineIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'hidden', minHeight: 400 }}>
        {renderVisualization()}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
          Correlation data as of {data.asOf}. Positive correlations in green, negative in red.
        </Typography>
      </Box>
    </Box>
  );
};

export default CorrelationHeatmapPanel;