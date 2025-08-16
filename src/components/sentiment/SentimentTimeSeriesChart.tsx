import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  ButtonGroup, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SentimentTimeSeriesChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[];
  };
  onTimeframeChange: (days: number) => void;
  currentTimeframe: number;
}

const SentimentTimeSeriesChart: React.FC<SentimentTimeSeriesChartProps> = ({ 
  data, 
  onTimeframeChange,
  currentTimeframe
}) => {
  const [selectedSources, setSelectedSources] = React.useState<string[]>(['News', 'Social Media', 'Earnings Calls', 'SEC Filings']);
  
  const handleSourceChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedSources(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Filter datasets based on selected sources
  const filteredData = {
    labels: data.labels,
    datasets: data.datasets.filter(dataset => selectedSources.includes(dataset.label))
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Sentiment Time Series (${currentTimeframe} Days)`
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        min: -1,
        max: 1,
        title: {
          display: true,
          text: 'Sentiment Score'
        }
      }
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sentiment Time Series</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="source-select-label">Sources</InputLabel>
            <Select
              labelId="source-select-label"
              id="source-select"
              multiple
              value={selectedSources}
              onChange={handleSourceChange}
              label="Sources"
              renderValue={(selected) => selected.join(', ')}
            >
              {data.datasets.map((dataset) => (
                <MenuItem key={dataset.label} value={dataset.label}>
                  {dataset.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ButtonGroup size="small">
            <Button 
              onClick={() => onTimeframeChange(7)} 
              variant={currentTimeframe === 7 ? 'contained' : 'outlined'}
            >
              7D
            </Button>
            <Button 
              onClick={() => onTimeframeChange(30)} 
              variant={currentTimeframe === 30 ? 'contained' : 'outlined'}
            >
              30D
            </Button>
            <Button 
              onClick={() => onTimeframeChange(90)} 
              variant={currentTimeframe === 90 ? 'contained' : 'outlined'}
            >
              90D
            </Button>
          </ButtonGroup>
        </Box>
      </Box>
      <Box sx={{ height: 350 }}>
        <Line options={chartOptions} data={filteredData} />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          This chart shows sentiment scores from different sources over time. 
          Positive values indicate positive sentiment, negative values indicate negative sentiment.
          Use the controls above to adjust the timeframe and filter sources.
        </Typography>
      </Box>
    </Paper>
  );
};

export default SentimentTimeSeriesChart;