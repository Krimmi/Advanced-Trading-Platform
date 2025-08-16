import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  Build as BuildIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { technicalService, technicalServiceExtensions } from '../../services';
import IndicatorSelectionPanel from './IndicatorSelectionPanel';
import ChartPatternRecognitionPanel from './ChartPatternRecognitionPanel';
import MultiTimeframeAnalysisPanel from './MultiTimeframeAnalysisPanel';
import CustomIndicatorBuilder from './CustomIndicatorBuilder';
import TechnicalAnalysisComparisonPanel from './TechnicalAnalysisComparisonPanel';

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
      id={`technical-tabpanel-${index}`}
      aria-labelledby={`technical-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `technical-tab-${index}`,
    'aria-controls': `technical-tabpanel-${index}`,
  };
}

const TechnicalAnalysisDashboard: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [symbol, setSymbol] = useState<string>('AAPL');
  const [loading, setLoading] = useState<boolean>(false);
  const [availableIndicators, setAvailableIndicators] = useState<any[]>([]);
  const [customIndicators, setCustomIndicators] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [indicatorsData, customIndicatorsData] = await Promise.all([
          technicalServiceExtensions.getAvailableIndicators(),
          technicalServiceExtensions.getCustomIndicators(),
        ]);
        
        setAvailableIndicators(indicatorsData);
        setCustomIndicators(customIndicatorsData);
      } catch (error) {
        console.error('Error fetching technical analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  const handleCustomIndicatorCreated = async () => {
    try {
      const customIndicatorsData = await technicalServiceExtensions.getCustomIndicators();
      setCustomIndicators(customIndicatorsData);
    } catch (error) {
      console.error('Error fetching custom indicators:', error);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center">
            <ShowChartIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Advanced Technical Analysis</Typography>
          </Box>
        }
      />
      <Divider />
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="technical analysis tabs">
          <Tab 
            icon={<TimelineIcon />} 
            iconPosition="start" 
            label="Indicators" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={<TrendingUpIcon />} 
            iconPosition="start" 
            label="Pattern Recognition" 
            {...a11yProps(1)} 
          />
          <Tab 
            icon={<BarChartIcon />} 
            iconPosition="start" 
            label="Multi-Timeframe" 
            {...a11yProps(2)} 
          />
          <Tab 
            icon={<BuildIcon />} 
            iconPosition="start" 
            label="Custom Indicators" 
            {...a11yProps(3)} 
          />
          <Tab 
            icon={<CompareIcon />} 
            iconPosition="start" 
            label="Comparison" 
            {...a11yProps(4)} 
          />
        </Tabs>
      </Box>
      <CardContent sx={{ p: 0 }}>
        <TabPanel value={tabValue} index={0}>
          <IndicatorSelectionPanel 
            symbol={symbol} 
            onSymbolChange={handleSymbolChange} 
            availableIndicators={availableIndicators}
            customIndicators={customIndicators}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ChartPatternRecognitionPanel 
            symbol={symbol} 
            onSymbolChange={handleSymbolChange} 
          />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <MultiTimeframeAnalysisPanel 
            symbol={symbol} 
            onSymbolChange={handleSymbolChange} 
            availableIndicators={availableIndicators}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <CustomIndicatorBuilder 
            customIndicators={customIndicators}
            onCustomIndicatorCreated={handleCustomIndicatorCreated}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <TechnicalAnalysisComparisonPanel 
            symbol={symbol} 
            onSymbolChange={handleSymbolChange} 
            availableIndicators={availableIndicators}
            customIndicators={customIndicators}
          />
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default TechnicalAnalysisDashboard;