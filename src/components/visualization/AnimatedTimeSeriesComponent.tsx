import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, Switch, Button, ButtonGroup } from '@mui/material';
import * as d3 from 'd3';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SpeedIcon from '@mui/icons-material/Speed';

interface TimeSeriesDataPoint {
  date: Date;
  value: number;
  category?: string;
}

interface TimeSeriesData {
  id: string;
  name: string;
  color?: string;
  category?: string;
  data: TimeSeriesDataPoint[];
}

interface AnimatedTimeSeriesProps {
  series: TimeSeriesData[];
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  colorScale?: string[];
  showLegend?: boolean;
  categories?: string[];
  isLoading?: boolean;
  animationDuration?: number;
  showControls?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  dateFormat?: string;
  valueFormat?: string;
  yAxisMin?: number;
  yAxisMax?: number;
  onTimePointChange?: (date: Date) => void;
}

const AnimatedTimeSeriesComponent: React.FC<AnimatedTimeSeriesProps> = ({
  series,
  width = 800,
  height = 500,
  title = 'Animated Time Series',
  xLabel = 'Date',
  yLabel = 'Value',
  colorScale = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  showLegend = true,
  categories = [],
  isLoading = false,
  animationDuration = 20000,
  showControls = true,
  showGrid = true,
  showTooltip = true,
  dateFormat = '%b %d, %Y',
  valueFormat = ',.2f',
  yAxisMin,
  yAxisMax,
  onTimePointChange
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [currentTimeIndex, setCurrentTimeIndex] = useState<number>(0);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showArea, setShowArea] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    series: TimeSeriesData;
    point: TimeSeriesDataPoint;
    x: number;
    y: number;
  } | null>(null);
  
  // Extract all unique dates across all series
  const allDates = React.useMemo(() => {
    const dateSet = new Set<number>();
    series.forEach(s => {
      s.data.forEach(d => {
        dateSet.add(d.date.getTime());
      });
    });
    return Array.from(dateSet).sort((a, b) => a - b).map(t => new Date(t));
  }, [series]);
  
  // Animation timer reference
  const animationTimerRef = useRef<number | null>(null);
  
  // Filter series based on selected categories
  const filteredSeries = React.useMemo(() => {
    if (selectedCategories.length === 0 || selectedCategories.length === categories.length) {
      return series;
    }
    return series.filter(s => !s.category || selectedCategories.includes(s.category));
  }, [series, selectedCategories, categories]);
  
  // Create color scale
  const colorScaleFunc = React.useMemo(() => {
    return d3.scaleOrdinal<string>()
      .domain(series.map(s => s.id))
      .range(colorScale);
  }, [series, colorScale]);
  
  // Format functions
  const dateFormatter = d3.timeFormat(dateFormat);
  const valueFormatter = d3.format(valueFormat);
  
  // Handle animation
  useEffect(() => {
    if (isPlaying) {
      // Clear any existing timer
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
      }
      
      // Set up new timer
      animationTimerRef.current = window.setInterval(() => {
        setCurrentTimeIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= allDates.length) {
            // Stop at the end
            setIsPlaying(false);
            return prevIndex;
          }
          return nextIndex;
        });
      }, animationDuration / allDates.length / animationSpeed);
    } else if (animationTimerRef.current !== null) {
      // Stop animation
      window.clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    
    // Clean up on unmount
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlaying, allDates.length, animationDuration, animationSpeed]);
  
  // Notify parent component of time point change
  useEffect(() => {
    if (onTimePointChange && allDates.length > 0 && currentTimeIndex < allDates.length) {
      onTimePointChange(allDates[currentTimeIndex]);
    }
  }, [currentTimeIndex, allDates, onTimePointChange]);
  
  // Create the time series visualization
  useEffect(() => {
    if (!svgRef.current || isLoading || filteredSeries.length === 0 || allDates.length === 0) return;
    
    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();
    
    // Set up margins and dimensions
    const margin = { top: 20, right: 80, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(svgRef.current);
    
    // Create container group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Get current date
    const currentDate = allDates[currentTimeIndex];
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain([allDates[0], allDates[allDates.length - 1]])
      .range([0, innerWidth]);
    
    // Find min and max values across all series
    let minValue = yAxisMin !== undefined ? yAxisMin : d3.min(filteredSeries, s => d3.min(s.data, d => d.value)) || 0;
    let maxValue = yAxisMax !== undefined ? yAxisMax : d3.max(filteredSeries, s => d3.max(s.data, d => d.value)) || 0;
    
    // Add some padding to the y-axis
    const yPadding = (maxValue - minValue) * 0.1;
    minValue -= yPadding;
    maxValue += yPadding;
    
    const yScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([innerHeight, 0]);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    // Add x-axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    
    // Add y-axis
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);
    
    // Add grid lines if enabled
    if (showGrid) {
      // Add x grid lines
      g.append('g')
        .attr('class', 'grid x-grid')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(
          d3.axisBottom(xScale)
            .tickSize(-innerHeight)
            .tickFormat(() => '')
        )
        .attr('opacity', 0.1);
      
      // Add y grid lines
      g.append('g')
        .attr('class', 'grid y-grid')
        .call(
          d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .attr('opacity', 0.1);
    }
    
    // Add axis labels
    g.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 40)
      .text(xLabel);
    
    g.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -40)
      .text(yLabel);
    
    // Create line generator
    const line = d3.line<TimeSeriesDataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Create area generator if needed
    const area = d3.area<TimeSeriesDataPoint>()
      .x(d => xScale(d.date))
      .y0(yScale(minValue))
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Add time marker line
    const timeMarker = g.append('line')
      .attr('class', 'time-marker')
      .attr('x1', xScale(currentDate))
      .attr('y1', 0)
      .attr('x2', xScale(currentDate))
      .attr('y2', innerHeight)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5');
    
    // Add time marker label
    const timeMarkerLabel = g.append('text')
      .attr('class', 'time-marker-label')
      .attr('x', xScale(currentDate))
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(dateFormatter(currentDate));
    
    // Draw series
    filteredSeries.forEach(s => {
      // Filter data up to current date
      const currentData = s.data.filter(d => d.date <= currentDate);
      
      if (currentData.length === 0) return;
      
      // Add area if enabled
      if (showArea) {
        g.append('path')
          .datum(currentData)
          .attr('class', `area-${s.id}`)
          .attr('fill', s.color || colorScaleFunc(s.id))
          .attr('fill-opacity', 0.1)
          .attr('d', area);
      }
      
      // Add line
      g.append('path')
        .datum(currentData)
        .attr('class', `line-${s.id}`)
        .attr('fill', 'none')
        .attr('stroke', s.color || colorScaleFunc(s.id))
        .attr('stroke-width', 2)
        .attr('d', line);
      
      // Add points if enabled
      if (showPoints) {
        g.selectAll(`.point-${s.id}`)
          .data(currentData)
          .enter()
          .append('circle')
          .attr('class', `point-${s.id}`)
          .attr('cx', d => xScale(d.date))
          .attr('cy', d => yScale(d.value))
          .attr('r', 3)
          .attr('fill', s.color || colorScaleFunc(s.id))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .on('mouseover', function(event, d) {
            if (showTooltip) {
              d3.select(this)
                .attr('r', 5)
                .attr('stroke-width', 2);
              
              setHoveredPoint({
                series: s,
                point: d,
                x: event.pageX,
                y: event.pageY
              });
            }
          })
          .on('mouseout', function() {
            if (showTooltip) {
              d3.select(this)
                .attr('r', 3)
                .attr('stroke-width', 1);
              
              setHoveredPoint(null);
            }
          });
      }
      
      // Add current value label
      if (currentData.length > 0) {
        const lastPoint = currentData[currentData.length - 1];
        
        g.append('text')
          .attr('class', `value-label-${s.id}`)
          .attr('x', xScale(lastPoint.date) + 5)
          .attr('y', yScale(lastPoint.value))
          .attr('dy', '0.35em')
          .attr('font-size', '10px')
          .attr('fill', s.color || colorScaleFunc(s.id))
          .text(`${s.name}: ${valueFormatter(lastPoint.value)}`);
      }
    });
    
    // Add legend if enabled
    if (showLegend && filteredSeries.length > 0) {
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
      
      filteredSeries.forEach((s, i) => {
        const legendItem = legend.append('g')
          .attr('transform', `translate(0, ${i * 20})`);
        
        legendItem.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', s.color || colorScaleFunc(s.id));
        
        legendItem.append('text')
          .attr('x', 20)
          .attr('y', 10)
          .attr('font-size', '12px')
          .text(s.name);
      });
    }
    
  }, [
    filteredSeries,
    width,
    height,
    isLoading,
    currentTimeIndex,
    allDates,
    colorScaleFunc,
    showPoints,
    showArea,
    showGrid,
    showTooltip,
    dateFormatter,
    valueFormatter,
    xLabel,
    yLabel,
    yAxisMin,
    yAxisMax
  ]);
  
  // Handle category selection change
  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCategories(event.target.value as string[]);
  };
  
  // Handle animation controls
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleRestart = () => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  };
  
  // Handle animation speed change
  const handleSpeedChange = (event: Event, newValue: number | number[]) => {
    setAnimationSpeed(newValue as number);
  };
  
  // Handle time slider change
  const handleTimeSliderChange = (event: Event, newValue: number | number[]) => {
    setCurrentTimeIndex(newValue as number);
  };
  
  // Handle display options
  const handlePointsToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowPoints(event.target.checked);
  };
  
  const handleAreaToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowArea(event.target.checked);
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: height }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', mb: 2, gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={selectedCategories}
                  onChange={handleCategoryChange}
                  label="Categories"
                  size="small"
                  renderValue={(selected) => (selected as string[]).join(', ')}
                >
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={showPoints}
                  onChange={handlePointsToggle}
                />
              }
              label="Show Points"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={showArea}
                  onChange={handleAreaToggle}
                />
              }
              label="Show Area"
            />
          </Box>
          
          {showControls && (
            <Box sx={{ display: 'flex', mb: 2, gap: 2, alignItems: 'center' }}>
              <ButtonGroup variant="outlined" size="small">
                <Button 
                  onClick={handlePlayPause}
                  startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button 
                  onClick={handleRestart}
                  startIcon={<RestartAltIcon />}
                >
                  Restart
                </Button>
              </ButtonGroup>
              
              <Box sx={{ display: 'flex', alignItems: 'center', width: 150 }}>
                <SpeedIcon sx={{ mr: 1, fontSize: 'small' }} />
                <Slider
                  value={animationSpeed}
                  onChange={handleSpeedChange}
                  min={0.25}
                  max={3}
                  step={0.25}
                  marks
                  valueLabelDisplay="auto"
                  valueLabelFormat={x => `${x}x`}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Slider
                  value={currentTimeIndex}
                  onChange={handleTimeSliderChange}
                  min={0}
                  max={allDates.length - 1}
                  step={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={i => dateFormatter(allDates[i])}
                />
              </Box>
              
              <Typography variant="body2">
                {allDates.length > 0 && currentTimeIndex < allDates.length ? 
                  dateFormatter(allDates[currentTimeIndex]) : ''}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ position: 'relative', width, height }}>
            <svg ref={svgRef} width={width} height={height} />
            
            {hoveredPoint && (
              <Box
                ref={tooltipRef}
                sx={{
                  position: 'absolute',
                  top: hoveredPoint.y - 70,
                  left: hoveredPoint.x + 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  padding: 1,
                  pointerEvents: 'none',
                  zIndex: 1000,
                  boxShadow: 1
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {hoveredPoint.series.name}
                </Typography>
                <Typography variant="caption" display="block">
                  Date: {dateFormatter(hoveredPoint.point.date)}
                </Typography>
                <Typography variant="caption" display="block">
                  Value: {valueFormatter(hoveredPoint.point.value)}
                </Typography>
                {hoveredPoint.point.category && (
                  <Typography variant="caption" display="block">
                    Category: {hoveredPoint.point.category}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default AnimatedTimeSeriesComponent;