import { Box, Grid } from '@mui/material';
import React from 'react';
import PositionsChart from '../../components/dashboard/PositionsChart';
import PositionsSummary from '../../components/dashboard/PositionsSummary';
import MonthlyProgress from '../../components/dashboard/MonthlyProgress';
import DataCards from '../../components/dashboard/DataCards';
import SupportStats from '../../components/dashboard/SupportStats';

const ChartsGrid = () => {
  return (
    <Box>
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        <PositionsChart />
      </Grid>
      <Grid item xs={12} lg={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <PositionsSummary />
          </Grid>
          <Grid item xs={12}>
            <MonthlyProgress />
          </Grid>
        </Grid>
      </Grid>
      <Grid item container spacing={3} xs={12} lg={8}>
        <Grid item xs={12} md={6}>
          <DataCards />
        </Grid>
        <Grid item xs={12} md={6}>
          <DataCards />
        </Grid>
        <Grid item xs={12} md={6}>
          <DataCards />
        </Grid>
      </Grid>
      <Grid item container spacing={3} xs={12} lg={4}>
        <Grid item xs={12} md={6} lg={12}>
          <SupportStats />
        </Grid>
        <Grid item xs={12} md={6} lg={12}>
          <SupportStats />
        </Grid>
      </Grid>
    </Grid>
    </Box>
  );
};

export default ChartsGrid;
