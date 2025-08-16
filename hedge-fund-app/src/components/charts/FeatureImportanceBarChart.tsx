import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  ReferenceLine
} from 'recharts';
import { 
  Box, 
  Typography, 
  useTheme, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Slider, 
  FormControlLabel, 
  Switch, 
  Chip,
  Tooltip as MuiTooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

export interface FeatureImportance {
  feature: string;
  importance: number;
  category?: string;
  description?: string;
  color?: string;
}

interface FeatureImportanceBarChartProps {
  data: FeatureImportance[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showValues?: boolean;
  maxFeatures?: number;
  sortBy?: 'importance' | 'alphabetical' | 'category';
  orientation?: 'horizontal' | 'vertical';
  colorBy?: 'importance' | 'category' | 'single';
  baseColor?: string;
  valueFormatter?: (value: number) => string;
  onFeatureClick?: (feature: string) => void;
}

const FeatureImportanceBarChart: React.FC<FeatureImportanceBarChartProps> = ({
  data,
  title,
  subtitle,
  height = 400,
  width = '100%',
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  showValues = true,
  maxFeatures = 10,
  sortBy = 'importance',
  orientation = 'horizontal',
  colorBy = 'importance',
  baseColor,
  valueFormatter = (value) => value.toFixed(4),
  onFeatureClick,
}) => {
  const theme = useTheme();
  const [displayedFeatures, setDisplayedFeatures] = useState<number>(Math.min(maxFeatures, data.length));
  const [sortMethod, setSortMethod] = useState<'importance' | 'alphabetical' | 'category'>(sortBy);
  const [chartOrientation, setChartOrientation] = useState<'horizontal' | 'vertical'>(orientation);
  const [colorMethod, setColorMethod] = useState<'importance' | 'category' | 'single'>(colorBy);
  const [showLabels, setShowLabels] = useState<boolean>(showValues);
  
  // Default colors
  const defaultColor = baseColor || theme.palette.primary.main;
  const gradientColors = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];
  
  const categoryColors: Record<string, string> = {
    'price': theme.palette.primary.main,
    'volume': theme.palette.secondary.main,
    'technical': theme.palette.success.main,
    'fundamental': theme.palette.info.main,
    'sentiment': theme.palette.warning.main,
    'macro': theme.palette.error.main,
    'other': theme.palette.grey[500],
  };
  
  // Sort and limit data
  const processData = () => {
    let processedData = [...data];
    
    // Sort data
    switch (sortMethod) {
      case 'importance':
        processedData.sort((a, b) => b.importance - a.importance);
        break;
      case 'alphabetical':
        processedData.sort((a, b) => a.feature.localeCompare(b.feature));
        break;
      case 'category':
        processedData.sort((a, b) => {
          if (a.category && b.category) {
            const categoryCompare = a.category.localeCompare(b.category);
            if (categoryCompare !== 0) return categoryCompare;
          }
          return b.importance - a.importance;
        });
        break;
    }
    
    // Limit to displayed features
    processedData = processedData.slice(0, displayedFeatures);
    
    return processedData;
  };
  
  const chartData = processData();
  
  // Get color for a bar
  const getBarColor = (item: FeatureImportance, index: number) => {
    if (item.color) return item.color;
    
    switch (colorMethod) {
      case 'importance':
        // Calculate color based on importance (gradient)
        const maxImportance = Math.max(...chartData.map(d => d.importance));
        const normalizedValue = item.importance / maxImportance;
        const colorIndex = Math.min(
          Math.floor(normalizedValue * gradientColors.length),
          gradientColors.length - 1
        );
        return gradientColors[colorIndex];
      
      case 'category':
        // Color by category
        return item.category && categoryColors[item.category] 
          ? categoryColors[item.category] 
          : theme.palette.grey[500];
      
      case 'single':
      default:
        return defaultColor;
    }
  };
  
  // Handle feature click
  const handleFeatureClick = (feature: string) => {
    if (onFeatureClick) {
      onFeatureClick(feature);
    }
  };
  
  // Handle displayed features change
  const handleFeaturesChange = (event: Event, newValue: number | number[]) => {
    setDisplayedFeatures(newValue as number);
  };
  
  // Handle sort method change
  const handleSortMethodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortMethod(event.target.value as 'importance' | 'alphabetical' | 'category');
  };
  
  // Handle orientation change
  const handleOrientationChange = () => {
    setChartOrientation(chartOrientation === 'horizontal' ? 'vertical' : 'horizontal');
  };
  
  // Handle color method change
  const handleColorMethodChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setColorMethod(event.target.value as 'importance' | 'category' | 'single');
  };
  
  // Handle labels toggle
  const handleLabelsToggle = () => {
    setShowLabels(!showLabels);
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: theme.shadows[2],
            maxWidth: 300,
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {item.feature}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Importance: {valueFormatter(item.importance)}
          </Typography>
          
          {item.category && (
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Category: {item.category}
            </Typography>
          )}
          
          {item.description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {item.description}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };
  
  // Generate category legend if needed
  const renderCategoryLegend = () => {
    if (colorMethod !== 'category' || !showLegend) return null;
    
    // Get unique categories
    const categories = Array.from(new Set(data.map(d => d.category).filter(Boolean)));
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            size="small"
            sx={{
              backgroundColor: categoryColors[category as string] || theme.palette.grey[500],
              color: theme.palette.getContrastText(categoryColors[category as string] || theme.palette.grey[500]),
            }}
          />
        ))}
      </Box>
    );
  };
  
  return (
    <Box sx={{ width, height: typeof height === 'number' ? height + 100 : height }}>
      {/* Chart Header */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          {title && (
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
          )}
          
          <MuiTooltip title="Feature importance shows how much each feature contributes to the model's predictions. Higher values indicate greater influence on the model output.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </MuiTooltip>
        </Box>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {/* Controls */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="sort-method-label">Sort By</InputLabel>
            <Select
              labelId="sort-method-label"
              value={sortMethod}
              label="Sort By"
              onChange={handleSortMethodChange}
            >
              <MenuItem value="importance">Importance</MenuItem>
              <MenuItem value="alphabetical">Alphabetical</MenuItem>
              <MenuItem value="category">Category</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="color-method-label">Color By</InputLabel>
            <Select
              labelId="color-method-label"
              value={colorMethod}
              label="Color By"
              onChange={handleColorMethodChange}
            >
              <MenuItem value="importance">Importance</MenuItem>
              <MenuItem value="category">Category</MenuItem>
              <MenuItem value="single">Single Color</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={chartOrientation === 'horizontal'}
                onChange={handleOrientationChange}
                size="small"
              />
            }
            label="Horizontal"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showLabels}
                onChange={handleLabelsToggle}
                size="small"
              />
            }
            label="Show Values"
          />
        </Box>
        
        {/* Features Slider */}
        <Box sx={{ mt: 2, px: 2 }}>
          <Typography variant="body2" gutterBottom>
            Features to display: {displayedFeatures}
          </Typography>
          <Slider
            value={displayedFeatures}
            onChange={handleFeaturesChange}
            aria-labelledby="features-slider"
            valueLabelDisplay="auto"
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: Math.floor(data.length / 2), label: Math.floor(data.length / 2).toString() },
              { value: data.length, label: data.length.toString() },
            ]}
            min={1}
            max={data.length}
          />
        </Box>
        
        {/* Category Legend */}
        {renderCategoryLegend()}
      </Box>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={typeof height === 'number' ? height - 100 : '70%'}>
        {chartOrientation === 'horizontal' ? (
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} horizontal={false} />}
            <XAxis
              type="number"
              tick={{ fill: theme.palette.text.secondary }}
              tickFormatter={valueFormatter}
              stroke={theme.palette.divider}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fill: theme.palette.text.secondary }}
              width={100}
              stroke={theme.palette.divider}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && colorMethod === 'importance' && <Legend />}
            <ReferenceLine x={0} stroke={theme.palette.divider} />
            <Bar
              dataKey="importance"
              onClick={(data) => handleFeatureClick(data.feature)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
              ))}
              {showLabels && (
                <LabelList
                  dataKey="importance"
                  position="right"
                  formatter={valueFormatter}
                  style={{ fill: theme.palette.text.primary }}
                />
              )}
            </Bar>
          </BarChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
            <XAxis
              dataKey="feature"
              tick={{ fill: theme.palette.text.secondary }}
              stroke={theme.palette.divider}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis
              tick={{ fill: theme.palette.text.secondary }}
              tickFormatter={valueFormatter}
              stroke={theme.palette.divider}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && colorMethod === 'importance' && <Legend />}
            <ReferenceLine y={0} stroke={theme.palette.divider} />
            <Bar
              dataKey="importance"
              onClick={(data) => handleFeatureClick(data.feature)}
              cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry, index)} />
              ))}
              {showLabels && (
                <LabelList
                  dataKey="importance"
                  position="top"
                  formatter={valueFormatter}
                  style={{ fill: theme.palette.text.primary }}
                />
              )}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default FeatureImportanceBarChart;