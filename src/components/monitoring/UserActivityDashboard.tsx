import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useTheme,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Chip,
  Avatar
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import DevicesIcon from '@mui/icons-material/Devices';
import PublicIcon from '@mui/icons-material/Public';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import PieChartIcon from '@mui/icons-material/PieChart';
import MapIcon from '@mui/icons-material/Map';
import FunctionsIcon from '@mui/icons-material/Functions';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Treemap
} from 'recharts';

import VirtualizedTable from '../common/VirtualizedTable.optimized';
import { useComponentPerformance } from '../../utils/withPerformanceTracking.optimized';

// Mock service for user activity monitoring
// In a real application, this would be replaced with actual API calls
const UserActivityService = {
  getUserActivity: async (period: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate time series data based on period
    const now = new Date();
    const points = period === '1h' ? 12 : period === '24h' ? 24 : period === '7d' ? 7 : 30;
    const interval = period === '1h' ? 5 * 60 * 1000 : period === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    
    const timeSeriesData = Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now.getTime() - (points - i - 1) * interval);
      return {
        timestamp: timestamp.toISOString(),
        activeUsers: 100 + Math.random() * 200 + (i * 5),
        newUsers: 5 + Math.random() * 20,
        pageViews: 500 + Math.random() * 1000 + (i * 25),
        sessions: 150 + Math.random() * 300 + (i * 10),
        avgSessionDuration: 120 + Math.random() * 180,
        bounceRate: 20 + Math.random() * 15
      };
    });
    
    return {
      period,
      timeSeriesData,
      summary: {
        totalActiveUsers: timeSeriesData.reduce((sum, item) => sum + item.activeUsers, 0) / points,
        totalNewUsers: timeSeriesData.reduce((sum, item) => sum + item.newUsers, 0),
        totalPageViews: timeSeriesData.reduce((sum, item) => sum + item.pageViews, 0),
        totalSessions: timeSeriesData.reduce((sum, item) => sum + item.sessions, 0),
        avgSessionDuration: timeSeriesData.reduce((sum, item) => sum + item.avgSessionDuration, 0) / points,
        avgBounceRate: timeSeriesData.reduce((sum, item) => sum + item.bounceRate, 0) / points
      }
    };
  },
  
  getFeatureUsage: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      features: [
        { name: 'Dashboard', usageCount: 4250, uniqueUsers: 850, avgTimeSpent: 320, growth: 12.5 },
        { name: 'Portfolio Analysis', usageCount: 3800, uniqueUsers: 720, avgTimeSpent: 480, growth: 8.2 },
        { name: 'Market Data', usageCount: 3600, uniqueUsers: 780, avgTimeSpent: 210, growth: 5.7 },
        { name: 'Risk Management', usageCount: 2800, uniqueUsers: 520, avgTimeSpent: 390, growth: 15.3 },
        { name: 'Algorithmic Trading', usageCount: 2200, uniqueUsers: 320, avgTimeSpent: 540, growth: 22.8 },
        { name: 'Backtesting', usageCount: 1950, uniqueUsers: 280, avgTimeSpent: 620, growth: 18.4 },
        { name: 'Watchlists', usageCount: 3200, uniqueUsers: 680, avgTimeSpent: 180, growth: 3.2 },
        { name: 'Alerts', usageCount: 2700, uniqueUsers: 590, avgTimeSpent: 120, growth: 7.8 },
        { name: 'Reports', usageCount: 1800, uniqueUsers: 420, avgTimeSpent: 280, growth: 9.1 },
        { name: 'Settings', usageCount: 1200, uniqueUsers: 750, avgTimeSpent: 90, growth: -2.3 }
      ],
      
      featureCategories: [
        { name: 'Analysis', value: 8550, percentage: 32.5 },
        { name: 'Trading', value: 6950, percentage: 26.4 },
        { name: 'Monitoring', value: 5900, percentage: 22.4 },
        { name: 'Configuration', value: 3100, percentage: 11.8 },
        { name: 'Reporting', value: 1800, percentage: 6.9 }
      ]
    };
  },
  
  getUserSegmentation: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 550));
    
    return {
      userTypes: [
        { name: 'Professional Traders', count: 320, percentage: 28.6 },
        { name: 'Institutional Investors', count: 180, percentage: 16.1 },
        { name: 'Retail Investors', count: 420, percentage: 37.5 },
        { name: 'Financial Advisors', count: 150, percentage: 13.4 },
        { name: 'Others', count: 50, percentage: 4.4 }
      ],
      
      deviceDistribution: [
        { name: 'Desktop', count: 680, percentage: 60.7 },
        { name: 'Mobile', count: 320, percentage: 28.6 },
        { name: 'Tablet', count: 120, percentage: 10.7 }
      ],
      
      geographicDistribution: [
        { name: 'North America', count: 520, percentage: 46.4 },
        { name: 'Europe', count: 280, percentage: 25.0 },
        { name: 'Asia', count: 210, percentage: 18.8 },
        { name: 'Australia', count: 60, percentage: 5.4 },
        { name: 'South America', count: 40, percentage: 3.6 },
        { name: 'Africa', count: 10, percentage: 0.8 }
      ],
      
      activityLevel: [
        { name: 'Very Active (Daily)', count: 380, percentage: 33.9 },
        { name: 'Active (Weekly)', count: 420, percentage: 37.5 },
        { name: 'Occasional (Monthly)', count: 220, percentage: 19.6 },
        { name: 'Rare (Quarterly or less)', count: 100, percentage: 9.0 }
      ]
    };
  },
  
  getConversionFunnel: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 480));
    
    return {
      stages: [
        { name: 'Visitors', count: 10000, conversionRate: 100 },
        { name: 'Sign Up Page', count: 5000, conversionRate: 50 },
        { name: 'Registration Started', count: 3000, conversionRate: 30 },
        { name: 'Registration Completed', count: 2000, conversionRate: 20 },
        { name: 'First Login', count: 1800, conversionRate: 18 },
        { name: 'Feature Exploration', count: 1500, conversionRate: 15 },
        { name: 'First Transaction', count: 800, conversionRate: 8 },
        { name: 'Active User', count: 600, conversionRate: 6 }
      ],
      
      dropOffPoints: [
        { stage: 'Sign Up to Registration', dropOffRate: 40, possibleReasons: ['Form complexity', 'Required information', 'Privacy concerns'] },
        { stage: 'Registration to First Login', dropOffRate: 10, possibleReasons: ['Email verification issues', 'Forgot password', 'Changed mind'] },
        { stage: 'Feature Exploration to Transaction', dropOffRate: 46.7, possibleReasons: ['Complexity', 'Pricing concerns', 'Missing features', 'Competitive options'] }
      ],
      
      userJourneys: [
        { path: 'Home → Features → Pricing → Sign Up → Dashboard', count: 320, conversionRate: 8.5 },
        { path: 'Home → Pricing → Sign Up → Dashboard', count: 280, conversionRate: 12.2 },
        { path: 'Home → Sign Up → Dashboard', count: 180, conversionRate: 15.8 },
        { path: 'Features → Pricing → Sign Up → Dashboard', count: 150, conversionRate: 7.3 },
        { path: 'Blog → Features → Sign Up → Dashboard', count: 120, conversionRate: 6.2 }
      ]
    };
  },
  
  getActiveUsers: async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate random user data
    const users = Array.from({ length: 50 }, (_, i) => {
      const lastActive = new Date();
      lastActive.setMinutes(lastActive.getMinutes() - Math.floor(Math.random() * 60));
      
      return {
        id: 1000 + i,
        name: `User ${1000 + i}`,
        email: `user${1000 + i}@example.com`,
        lastActive: lastActive.toISOString(),
        sessionDuration: Math.floor(Math.random() * 120) + 5,
        currentPage: i % 5 === 0 ? '/dashboard' : 
                     i % 5 === 1 ? '/portfolio' : 
                     i % 5 === 2 ? '/market-data' : 
                     i % 5 === 3 ? '/risk-management' : 
                     '/settings',
        device: i % 3 === 0 ? 'Desktop' : i % 3 === 1 ? 'Mobile' : 'Tablet',
        browser: i % 4 === 0 ? 'Chrome' : i % 4 === 1 ? 'Firefox' : i % 4 === 2 ? 'Safari' : 'Edge',
        location: i % 6 === 0 ? 'United States' : 
                  i % 6 === 1 ? 'United Kingdom' : 
                  i % 6 === 2 ? 'Germany' : 
                  i % 6 === 3 ? 'Japan' : 
                  i % 6 === 4 ? 'Australia' : 
                  'Canada'
      };
    });
    
    return users;
  }
};

interface UserActivityDashboardProps {
  refreshInterval?: number; // in milliseconds
  onSettingsClick?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`activity-tabpanel-${index}`}
      aria-labelledby={`activity-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
});

const UserActivityDashboard: React.FC<UserActivityDashboardProps> = ({
  refreshInterval = 60000, // Default to 60 seconds
  onSettingsClick
}) => {
  const theme = useTheme();
  const { trackOperation } = useComponentPerformance('UserActivityDashboard');
  
  // State for data
  const [userActivity, setUserActivity] = useState<any>(null);
  const [featureUsage, setFeatureUsage] = useState<any>(null);
  const [userSegmentation, setUserSegmentation] = useState<any>(null);
  const [conversionFunnel, setConversionFunnel] = useState<any>(null);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('24h');
  
  // Colors for charts
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.primary.light,
    theme.palette.secondary.light,
    theme.palette.error.light,
    theme.palette.warning.light
  ];
  
  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      const [activityData, featureData, segmentationData, funnelData, usersData] = await Promise.all([
        UserActivityService.getUserActivity(selectedPeriod),
        UserActivityService.getFeatureUsage(),
        UserActivityService.getUserSegmentation(),
        UserActivityService.getConversionFunnel(),
        UserActivityService.getActiveUsers()
      ]);
      
      setUserActivity(activityData);
      setFeatureUsage(featureData);
      setUserSegmentation(segmentationData);
      setConversionFunnel(funnelData);
      setActiveUsers(usersData);
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user activity data:', err);
      setError('Failed to fetch user activity data. Please try again later.');
      setLoading(false);
    }
  }, [selectedPeriod]);
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Auto-refresh setup
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchData();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, fetchData, refreshInterval]);
  
  // Handle tab change
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);
  
  // Handle period change
  const handlePeriodChange = useCallback((event: SelectChangeEvent) => {
    setSelectedPeriod(event.target.value);
  }, []);
  
  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // Toggle auto refresh
  const handleAutoRefreshToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefresh(event.target.checked);
  }, []);
  
  // Format date
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  }, []);
  
  // Format time in seconds
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // Get growth indicator
  const getGrowthIndicator = useCallback((growth: number) => {
    if (growth > 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.success.main }}>
          <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">{growth.toFixed(1)}%</Typography>
        </Box>
      );
    } else if (growth < 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.error.main }}>
          <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">{Math.abs(growth).toFixed(1)}%</Typography>
        </Box>
      );
    } else {
      return (
        <Typography variant="body2" color="text.secondary">0%</Typography>
      );
    }
  }, [theme]);
  
  // Memoized components for better performance
  
  // User Activity Overview
  const userActivityOverview = useMemo(() => {
    if (!userActivity) return null;
    
    const { timeSeriesData, summary } = userActivity;
    
    // Format timestamp for display
    const formattedData = timeSeriesData.map((item: any) => ({
      ...item,
      formattedTime: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="User Activity Over Time" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      name="Active Users" 
                      stroke={theme.palette.primary.main} 
                      activeDot={{ r: 8 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      name="Sessions" 
                      stroke={theme.palette.secondary.main} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Activity Summary" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Active Users
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(summary.totalActiveUsers)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      New Users
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(summary.totalNewUsers)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Page Views
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(summary.totalPageViews).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Sessions
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(summary.totalSessions).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Avg Session Duration
                    </Typography>
                    <Typography variant="h6">
                      {formatTime(summary.avgSessionDuration)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Bounce Rate
                    </Typography>
                    <Typography variant="h6">
                      {summary.avgBounceRate.toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Page Views & New Users" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="pageViews" 
                      name="Page Views" 
                      fill={theme.palette.info.main} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="newUsers" 
                      name="New Users" 
                      stroke={theme.palette.success.main} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Session Duration & Bounce Rate" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="formattedTime" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="avgSessionDuration" 
                      name="Avg Session Duration (s)" 
                      stroke={theme.palette.warning.main} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="bounceRate" 
                      name="Bounce Rate (%)" 
                      stroke={theme.palette.error.main} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [userActivity, formatTime, theme]);
  
  // Feature Usage Panel
  const featureUsagePanel = useMemo(() => {
    if (!featureUsage) return null;
    
    const { features, featureCategories } = featureUsage;
    
    // Columns for feature usage table
    const columns = [
      { id: 'name', label: 'Feature', minWidth: 150 },
      { 
        id: 'usageCount', 
        label: 'Usage Count', 
        minWidth: 120,
        align: 'right' as const,
        format: (value: number) => value.toLocaleString()
      },
      { 
        id: 'uniqueUsers', 
        label: 'Unique Users', 
        minWidth: 120,
        align: 'right' as const,
        format: (value: number) => value.toLocaleString()
      },
      { 
        id: 'avgTimeSpent', 
        label: 'Avg Time (s)', 
        minWidth: 120,
        align: 'right' as const
      },
      { 
        id: 'growth', 
        label: 'Growth', 
        minWidth: 100,
        align: 'right' as const,
        format: (value: number) => getGrowthIndicator(value)
      }
    ];
    
    // Prepare data for feature usage chart
    const featureUsageData = features.map(feature => ({
      name: feature.name,
      usageCount: feature.usageCount
    }));
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Feature Usage Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureUsageData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="usageCount" name="Usage Count" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Feature Categories" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={featureCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {featureCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Feature Category Details
                </Typography>
                {featureCategories.map((category, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: COLORS[index % COLORS.length],
                          mr: 1
                        }}
                      />
                      <Typography variant="body2">{category.name}</Typography>
                    </Box>
                    <Typography variant="body2">{category.value.toLocaleString()} ({category.percentage}%)</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Feature Usage Details" />
            <Divider />
            <CardContent>
              <VirtualizedTable
                columns={columns}
                data={features}
                maxHeight={350}
                virtualizationThreshold={20}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Feature Usage Heatmap" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={features}
                    dataKey="usageCount"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill={theme.palette.primary.main}
                  >
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                  </Treemap>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [featureUsage, getGrowthIndicator, theme, COLORS]);
  
  // User Segmentation Panel
  const userSegmentationPanel = useMemo(() => {
    if (!userSegmentation) return null;
    
    const { userTypes, deviceDistribution, geographicDistribution, activityLevel } = userSegmentation;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="User Types" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {userTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Device Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Geographic Distribution" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={geographicDistribution}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Bar dataKey="count" name="Users" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Activity Level" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityLevel}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {activityLevel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="User Segmentation Summary" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    User Types
                  </Typography>
                  {userTypes.map((type, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: COLORS[index % COLORS.length],
                            mr: 1
                          }}
                        />
                        <Typography variant="body2">{type.name}</Typography>
                      </Box>
                      <Typography variant="body2">{type.count} ({type.percentage}%)</Typography>
                    </Box>
                  ))}
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Device Distribution
                  </Typography>
                  {deviceDistribution.map((device, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: COLORS[index % COLORS.length],
                            mr: 1
                          }}
                        />
                        <Typography variant="body2">{device.name}</Typography>
                      </Box>
                      <Typography variant="body2">{device.count} ({device.percentage}%)</Typography>
                    </Box>
                  ))}
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Geographic Distribution
                  </Typography>
                  {geographicDistribution.map((geo, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: COLORS[index % COLORS.length],
                            mr: 1
                          }}
                        />
                        <Typography variant="body2">{geo.name}</Typography>
                      </Box>
                      <Typography variant="body2">{geo.count} ({geo.percentage}%)</Typography>
                    </Box>
                  ))}
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Activity Level
                  </Typography>
                  {activityLevel.map((activity, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: COLORS[index % COLORS.length],
                            mr: 1
                          }}
                        />
                        <Typography variant="body2">{activity.name}</Typography>
                      </Box>
                      <Typography variant="body2">{activity.count} ({activity.percentage}%)</Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [userSegmentation, theme, COLORS]);
  
  // Conversion Funnel Panel
  const conversionFunnelPanel = useMemo(() => {
    if (!conversionFunnel) return null;
    
    const { stages, dropOffPoints, userJourneys } = conversionFunnel;
    
    // Prepare data for funnel chart
    const funnelData = stages.map(stage => ({
      name: stage.name,
      value: stage.count
    }));
    
    // Columns for user journeys table
    const columns = [
      { id: 'path', label: 'User Journey Path', minWidth: 300 },
      { 
        id: 'count', 
        label: 'Users', 
        minWidth: 100,
        align: 'right' as const,
        format: (value: number) => value.toLocaleString()
      },
      { 
        id: 'conversionRate', 
        label: 'Conversion Rate', 
        minWidth: 150,
        align: 'right' as const,
        format: (value: number) => `${value.toFixed(1)}%`
      }
    ];
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Conversion Funnel" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Bar 
                      dataKey="value" 
                      name="Users" 
                      fill={theme.palette.primary.main}
                      label={{ position: 'top', formatter: (value: number) => value.toLocaleString() }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Drop-off Points" />
            <Divider />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                {dropOffPoints.map((point, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">{point.stage}</Typography>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ color: point.dropOffRate > 30 ? theme.palette.error.main : theme.palette.warning.main }}
                      >
                        {point.dropOffRate}% Drop-off
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={point.dropOffRate} 
                        color={point.dropOffRate > 30 ? "error" : "warning"}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Possible reasons:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                      {point.possibleReasons.map((reason, i) => (
                        <Chip key={i} label={reason} size="small" />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Conversion Rates by Stage" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stages}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="conversionRate" 
                      name="Conversion Rate (%)" 
                      stroke={theme.palette.secondary.main} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Top User Journeys" />
            <Divider />
            <CardContent>
              <VirtualizedTable
                columns={columns}
                data={userJourneys}
                maxHeight={300}
                virtualizationThreshold={20}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [conversionFunnel, theme]);
  
  // Active Users Panel
  const activeUsersPanel = useMemo(() => {
    if (!activeUsers || activeUsers.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No active users found
          </Typography>
        </Box>
      );
    }
    
    // Columns for active users table
    const columns = [
      { 
        id: 'name', 
        label: 'User', 
        minWidth: 120,
        format: (value: string) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Typography variant="body2">{value}</Typography>
          </Box>
        )
      },
      { id: 'email', label: 'Email', minWidth: 200 },
      { 
        id: 'lastActive', 
        label: 'Last Active', 
        minWidth: 160,
        format: (value: string) => formatDate(value)
      },
      { 
        id: 'sessionDuration', 
        label: 'Session Duration', 
        minWidth: 150,
        format: (value: number) => `${value} min`
      },
      { id: 'currentPage', label: 'Current Page', minWidth: 150 },
      { 
        id: 'device', 
        label: 'Device', 
        minWidth: 100,
        format: (value: string) => (
          <Chip 
            icon={<DevicesIcon fontSize="small" />} 
            label={value} 
            size="small" 
            variant="outlined" 
          />
        )
      },
      { id: 'browser', label: 'Browser', minWidth: 100 },
      { 
        id: 'location', 
        label: 'Location', 
        minWidth: 120,
        format: (value: string) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PublicIcon fontSize="small" sx={{ mr: 0.5 }} />
            <Typography variant="body2">{value}</Typography>
          </Box>
        )
      }
    ];
    
    // Prepare data for device distribution chart
    const deviceCounts: Record<string, number> = {};
    const pageCounts: Record<string, number> = {};
    const locationCounts: Record<string, number> = {};
    
    activeUsers.forEach(user => {
      deviceCounts[user.device] = (deviceCounts[user.device] || 0) + 1;
      pageCounts[user.currentPage] = (pageCounts[user.currentPage] || 0) + 1;
      locationCounts[user.location] = (locationCounts[user.location] || 0) + 1;
    });
    
    const deviceData = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
    const pageData = Object.entries(pageCounts).map(([name, value]) => ({ name, value }));
    const locationData = Object.entries(locationCounts).map(([name, value]) => ({ name, value }));
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Currently Active Users" 
              subheader={`${activeUsers.length} users currently active`}
            />
            <Divider />
            <CardContent>
              <VirtualizedTable
                columns={columns}
                data={activeUsers}
                maxHeight={400}
                virtualizationThreshold={20}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Active Users by Device" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Active Users by Page" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Active Users by Location" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={locationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {locationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }, [activeUsers, formatDate, COLORS]);
  
  // Render loading state
  if (loading && !userActivity && !featureUsage && !userSegmentation && !conversionFunnel) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ mr: 1 }} />
              <Typography variant="h5" component="h1">
                User Activity Dashboard
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {lastUpdated ? (
                `Last updated: ${lastUpdated.toLocaleString()}`
              ) : (
                'Loading user activity data...'
              )}
            </Typography>
          </Grid>
          <Grid item>
            <FormControl size="small" sx={{ mr: 2, minWidth: 120 }}>
              <InputLabel id="time-period-label">Time Period</InputLabel>
              <Select
                labelId="time-period-label"
                id="time-period-select"
                value={selectedPeriod}
                label="Time Period"
                onChange={handlePeriodChange}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                  color="primary"
                />
              }
              label="Auto Refresh"
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} sx={{ mr: 1 }} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={onSettingsClick}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<TimelineIcon />} iconPosition="start" label="Activity Overview" />
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Feature Usage" />
          <Tab icon={<PieChartIcon />} iconPosition="start" label="User Segmentation" />
          <Tab icon={<FunctionsIcon />} iconPosition="start" label="Conversion Funnel" />
          <Tab icon={<PeopleIcon />} iconPosition="start" label="Active Users" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={activeTab} index={0}>
          {userActivityOverview}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          {featureUsagePanel}
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          {userSegmentationPanel}
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          {conversionFunnelPanel}
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          {activeUsersPanel}
        </TabPanel>
      </Box>
    </Box>
  );
};

export default React.memo(UserActivityDashboard);