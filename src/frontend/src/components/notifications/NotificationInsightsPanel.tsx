import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Sector, AreaChart, Area
} from 'recharts';
import aiNotificationService, { NotificationInsight } from '../../services/aiNotificationService';

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
      id={`insight-tabpanel-${index}`}
      aria-labelledby={`insight-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `insight-tab-${index}`,
    'aria-controls': `insight-tabpanel-${index}`,
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const NotificationInsightsPanel: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [insights, setInsights] = useState<NotificationInsight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    loadInsights();
  }, [period]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiNotificationService.getNotificationInsights(period);
      setInsights(data);
    } catch (error) {
      console.error('Error loading notification insights:', error);
      setError('Failed to load notification insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePeriodChange = (event: SelectChangeEvent) => {
    setPeriod(event.target.value as any);
  };

  const handlePieEnter = (data: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
  
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
          {payload.name}
        </text>
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
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
          {`${value} (${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  const getInsightByType = (type: string): NotificationInsight | undefined => {
    return insights.find(insight => insight.type === type);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Notification Volume Insight
  const volumeInsight = getInsightByType('notification_volume');
  const volumeData = volumeInsight?.data?.daily || [];

  // Notification Types Insight
  const typesInsight = getInsightByType('notification_types');
  const typesData = typesInsight?.data?.types || [];

  // Notification Actions Insight
  const actionsInsight = getInsightByType('notification_actions');
  const actionsData = actionsInsight?.data?.actions || [];

  // Notification Sources Insight
  const sourcesInsight = getInsightByType('notification_sources');
  const sourcesData = sourcesInsight?.data?.sources || [];

  // Notification Engagement Insight
  const engagementInsight = getInsightByType('notification_engagement');
  const engagementData = engagementInsight?.data?.engagement || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Notification Insights
        </Typography>
        <Box display="flex" alignItems="center">
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              onChange={handlePeriodChange}
              label="Period"
            >
              <MenuItem value="day">Last 24 Hours</MenuItem>
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadInsights}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
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
      ) : insights.length === 0 ? (
        <Alert severity="info">
          No notification insights available for the selected period.
        </Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="insight tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                label="Volume" 
                icon={<TimelineIcon />} 
                iconPosition="start" 
                {...a11yProps(0)} 
              />
              <Tab 
                label="Types" 
                icon={<PieChartIcon />} 
                iconPosition="start" 
                {...a11yProps(1)} 
              />
              <Tab 
                label="Actions" 
                icon={<BarChartIcon />} 
                iconPosition="start" 
                {...a11yProps(2)} 
              />
              <Tab 
                label="Sources" 
                icon={<PieChartIcon />} 
                iconPosition="start" 
                {...a11yProps(3)} 
              />
              <Tab 
                label="Engagement" 
                icon={<BarChartIcon />} 
                iconPosition="start" 
                {...a11yProps(4)} 
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Card>
              <CardHeader 
                title="Notification Volume" 
                subheader={volumeInsight ? `${formatDate(volumeInsight.period.start)} - ${formatDate(volumeInsight.period.end)}` : ''}
              />
              <Divider />
              <CardContent>
                {volumeData.length === 0 ? (
                  <Alert severity="info">
                    No volume data available for the selected period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={volumeData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          name="Notifications" 
                          stroke="#8884d8" 
                          fill="#8884d8" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {volumeInsight?.data?.total || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Notifications
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {volumeInsight?.data?.daily_avg?.toFixed(1) || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Daily Average
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <Typography variant="h6" color={volumeInsight?.data?.trend > 0 ? 'success.main' : 'error.main'}>
                            {volumeInsight?.data?.trend > 0 ? '+' : ''}{volumeInsight?.data?.trend}%
                          </Typography>
                          {volumeInsight?.data?.trend > 0 ? (
                            <TrendingUpIcon color="success" sx={{ ml: 1 }} />
                          ) : (
                            <TrendingDownIcon color="error" sx={{ ml: 1 }} />
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          Trend vs Previous Period
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {volumeInsight?.data?.peak_day?.date || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Peak Day ({volumeInsight?.data?.peak_day?.count || 0} notifications)
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Card>
              <CardHeader 
                title="Notification Types" 
                subheader={typesInsight ? `${formatDate(typesInsight.period.start)} - ${formatDate(typesInsight.period.end)}` : ''}
              />
              <Divider />
              <CardContent>
                {typesData.length === 0 ? (
                  <Alert severity="info">
                    No type data available for the selected period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          data={typesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          onMouseEnter={handlePieEnter}
                        >
                          {typesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Grid container spacing={2}>
                    {typesData.slice(0, 4).map((type, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: COLORS[index % COLORS.length],
                                mr: 1,
                              }}
                            />
                            <Typography variant="subtitle2">
                              {type.name}
                            </Typography>
                          </Box>
                          <Typography variant="h6">
                            {type.value}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {((type.value / typesInsight?.data?.total) * 100).toFixed(1)}% of total
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Card>
              <CardHeader 
                title="Notification Actions" 
                subheader={actionsInsight ? `${formatDate(actionsInsight.period.start)} - ${formatDate(actionsInsight.period.end)}` : ''}
              />
              <Divider />
              <CardContent>
                {actionsData.length === 0 ? (
                  <Alert severity="info">
                    No action data available for the selected period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={actionsData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="executed" name="Executed" fill="#8884d8" />
                        <Bar dataKey="available" name="Available" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {actionsInsight?.data?.total_actions || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Actions Available
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {actionsInsight?.data?.total_executed || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Total Actions Executed
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="info.main">
                          {actionsInsight?.data?.execution_rate ? 
                            `${(actionsInsight.data.execution_rate * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Action Execution Rate
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {actionsInsight?.data?.most_popular?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Most Popular Action
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Card>
              <CardHeader 
                title="Notification Sources" 
                subheader={sourcesInsight ? `${formatDate(sourcesInsight.period.start)} - ${formatDate(sourcesInsight.period.end)}` : ''}
              />
              <Divider />
              <CardContent>
                {sourcesData.length === 0 ? (
                  <Alert severity="info">
                    No source data available for the selected period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourcesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {sourcesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Grid container spacing={2}>
                    {sourcesData.slice(0, 4).map((source, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: COLORS[index % COLORS.length],
                                mr: 1,
                              }}
                            />
                            <Typography variant="subtitle2">
                              {source.name}
                            </Typography>
                          </Box>
                          <Typography variant="h6">
                            {source.value}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {((source.value / sourcesInsight?.data?.total) * 100).toFixed(1)}% of total
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Card>
              <CardHeader 
                title="Notification Engagement" 
                subheader={engagementInsight ? `${formatDate(engagementInsight.period.start)} - ${formatDate(engagementInsight.period.end)}` : ''}
              />
              <Divider />
              <CardContent>
                {engagementData.length === 0 ? (
                  <Alert severity="info">
                    No engagement data available for the selected period.
                  </Alert>
                ) : (
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={engagementData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="read" name="Read" fill="#8884d8" />
                        <Bar dataKey="interacted" name="Interacted" fill="#82ca9d" />
                        <Bar dataKey="dismissed" name="Dismissed" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Box mt={3}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {engagementInsight?.data?.read_rate ? 
                            `${(engagementInsight.data.read_rate * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Read Rate
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="success.main">
                          {engagementInsight?.data?.interaction_rate ? 
                            `${(engagementInsight.data.interaction_rate * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Interaction Rate
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="error.main">
                          {engagementInsight?.data?.dismissal_rate ? 
                            `${(engagementInsight.data.dismissal_rate * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Dismissal Rate
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" color="warning.main">
                          {engagementInsight?.data?.avg_time_to_read ? 
                            `${engagementInsight.data.avg_time_to_read.toFixed(1)} min` : 
                            'N/A'
                          }
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Avg. Time to Read
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default NotificationInsightsPanel;