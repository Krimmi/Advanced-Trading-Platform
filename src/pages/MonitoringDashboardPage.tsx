import React from 'react';
import { Box } from '@mui/material';
import { MonitoringDashboard } from '../components/monitoring';

const MonitoringDashboardPage: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MonitoringDashboard />
    </Box>
  );
};

export default MonitoringDashboardPage;