import React, { useRef, useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, Switch } from '@mui/material';
import * as d3 from 'd3';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface DataPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  value: number;
  category?: string;
  label?: string;
  color?: string;
}

interface ThreeDVisualizationProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  zLabel?: string;
  colorScale?: string[];
  showLabels?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  pointSize?: number;
  categories?: string[];
  onPointClick?: (point: DataPoint) => void;
  isLoading?: boolean;
  rotationSpeed?: number;
}

const ThreeDVisualizationComponent: React.FC<ThreeDVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  title = '3D Data Visualization',
  xLabel = 'X Axis',
  yLabel = 'Y Axis',
  zLabel = 'Z Axis',
  colorScale = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  showLabels = true,
  showAxes = true,
  showGrid = true,
  showLegend = true,
  pointSize = 0.5,
  categories = [],
  onPointClick,
  isLoading = false,
  rotationSpeed = 0.001
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const labelsRef = useRef<THREE.Group | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPointSize, setSelectedPointSize] = useState<number>(pointSize);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  
  // Initialize the 3D scene
  useEffect(() => {
    if (!containerRef.current || isLoading || data.length === 0) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 20;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;
    
    // Add axes
    if (showAxes) {
      const axesHelper = new THREE.AxesHelper(10);
      scene.add(axesHelper);
      
      // Add axis labels
      const fontLoader = new THREE.FontLoader();
      fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        
        // X axis label
        const xTextGeometry = new THREE.TextGeometry(xLabel, {
          font: font,
          size: 0.5,
          height: 0.1
        });
        const xText = new THREE.Mesh(xTextGeometry, textMaterial);
        xText.position.set(11, 0, 0);
        scene.add(xText);
        
        // Y axis label
        const yTextGeometry = new THREE.TextGeometry(yLabel, {
          font: font,
          size: 0.5,
          height: 0.1
        });
        const yText = new THREE.Mesh(yTextGeometry, textMaterial);
        yText.position.set(0, 11, 0);
        scene.add(yText);
        
        // Z axis label
        const zTextGeometry = new THREE.TextGeometry(zLabel, {
          font: font,
          size: 0.5,
          height: 0.1
        });
        const zText = new THREE.Mesh(zTextGeometry, textMaterial);
        zText.position.set(0, 0, 11);
        scene.add(zText);
      });
    }
    
    // Add grid
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(20, 20);
      scene.add(gridHelper);
    }
    
    // Create points
    createPoints();
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Clean up
    return () => {
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (pointsRef.current && sceneRef.current) {
        sceneRef.current.remove(pointsRef.current);
      }
      
      if (labelsRef.current && sceneRef.current) {
        sceneRef.current.remove(labelsRef.current);
      }
    };
  }, [data, width, height, isLoading]);
  
  // Update controls when autoRotate changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);
  
  // Update point size when selectedPointSize changes
  useEffect(() => {
    if (pointsRef.current && pointsRef.current.material instanceof THREE.PointsMaterial) {
      pointsRef.current.material.size = selectedPointSize;
    }
  }, [selectedPointSize]);
  
  // Update visible points when selectedCategory changes
  useEffect(() => {
    createPoints();
  }, [selectedCategory]);
  
  // Create points based on data and selected category
  const createPoints = () => {
    if (!sceneRef.current) return;
    
    // Remove existing points
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
    }
    
    // Remove existing labels
    if (labelsRef.current) {
      sceneRef.current.remove(labelsRef.current);
    }
    
    // Filter data based on selected category
    const filteredData = selectedCategory === 'all' 
      ? data 
      : data.filter(point => point.category === selectedCategory);
    
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create positions array
    const positions = new Float32Array(filteredData.length * 3);
    const colors = new Float32Array(filteredData.length * 3);
    
    // Normalize data for visualization
    const xExtent = d3.extent(filteredData, d => d.x) as [number, number];
    const yExtent = d3.extent(filteredData, d => d.y) as [number, number];
    const zExtent = d3.extent(filteredData, d => d.z) as [number, number];
    
    const xScale = d3.scaleLinear().domain(xExtent).range([-10, 10]);
    const yScale = d3.scaleLinear().domain(yExtent).range([-10, 10]);
    const zScale = d3.scaleLinear().domain(zExtent).range([-10, 10]);
    
    // Create color scale
    const uniqueCategories = Array.from(new Set(filteredData.map(d => d.category)));
    const colorScaleFunc = d3.scaleOrdinal<string>()
      .domain(uniqueCategories.map(String))
      .range(colorScale);
    
    // Fill positions and colors arrays
    filteredData.forEach((point, i) => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      const z = zScale(point.z);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Set color based on category or custom color
      const color = point.color ? new THREE.Color(point.color) : new THREE.Color(colorScaleFunc(point.category || ''));
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    
    // Add positions to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: selectedPointSize,
      vertexColors: true,
      sizeAttenuation: true
    });
    
    // Create points
    const points = new THREE.Points(geometry, material);
    sceneRef.current.add(points);
    pointsRef.current = points;
    
    // Add labels if enabled
    if (showLabels) {
      const labelsGroup = new THREE.Group();
      
      // Create text sprites for labels
      filteredData.forEach((point, i) => {
        if (point.label) {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.width = 256;
            canvas.height = 64;
            
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            context.font = '24px Arial';
            context.fillStyle = 'black';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(point.label, canvas.width / 2, canvas.height / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            
            sprite.position.set(
              positions[i * 3],
              positions[i * 3 + 1] + 0.5,
              positions[i * 3 + 2]
            );
            
            sprite.scale.set(2, 0.5, 1);
            labelsGroup.add(sprite);
          }
        }
      });
      
      sceneRef.current.add(labelsGroup);
      labelsRef.current = labelsGroup;
    }
  };
  
  // Handle point size change
  const handlePointSizeChange = (event: Event, newValue: number | number[]) => {
    setSelectedPointSize(newValue as number);
  };
  
  // Handle category change
  const handleCategoryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCategory(event.target.value as string);
  };
  
  // Handle auto-rotate toggle
  const handleAutoRotateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRotate(event.target.checked);
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
          <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
            {categories.length > 0 && (
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Category"
                  size="small"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            <Box sx={{ width: 200 }}>
              <Typography variant="body2" gutterBottom>Point Size</Typography>
              <Slider
                value={selectedPointSize}
                onChange={handlePointSizeChange}
                min={0.1}
                max={2}
                step={0.1}
                valueLabelDisplay="auto"
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoRotate}
                  onChange={handleAutoRotateChange}
                />
              }
              label="Auto-rotate"
            />
          </Box>
          
          <Box ref={containerRef} sx={{ width, height }}>
            {/* 3D visualization will be rendered here */}
          </Box>
          
          {showLegend && categories.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {categories.map((category, index) => (
                <Box key={category} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      backgroundColor: colorScale[index % colorScale.length],
                      borderRadius: '50%',
                      mr: 1
                    }} 
                  />
                  <Typography variant="body2">{category}</Typography>
                </Box>
              ))}
            </Box>
          )}
          
          {hoveredPoint && (
            <Box sx={{ 
              position: 'absolute', 
              bottom: 16, 
              left: 16, 
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              p: 1,
              borderRadius: 1
            }}>
              <Typography variant="body2">
                {hoveredPoint.label || `Point ${hoveredPoint.id}`}
              </Typography>
              <Typography variant="caption">
                X: {hoveredPoint.x.toFixed(2)}, Y: {hoveredPoint.y.toFixed(2)}, Z: {hoveredPoint.z.toFixed(2)}
              </Typography>
              {hoveredPoint.category && (
                <Typography variant="caption" display="block">
                  Category: {hoveredPoint.category}
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ThreeDVisualizationComponent;