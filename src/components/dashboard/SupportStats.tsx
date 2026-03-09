import React from 'react';
import Chart from 'react-apexcharts';
import {
  Grid,
  Typography,
  Stack,
  Avatar,
  Card,
  CardContent,
} from '@mui/material';
import { IconArrowUpLeft } from '@tabler/icons-react';
const SupportStats = () => {
  const optionscolumnchart: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 60,
      sparkline: {
        enabled: true,
      },
      group: 'sparklines',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: '60%',
        columnWidth: '42%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },
    fill: {
      colors: ['rgb(25, 118, 210)'],
      opacity: 0.9,
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: 'light',
    },
  };
  const seriescolumnchart: ApexCharts.ApexOptions['series'] = [
    {
      name: '',
      data: [0, 10, 60, 20, 10, 12, 58, 20],
    },
  ];
  return (
    <Card>
      <CardContent sx={{ p: '30px' }}>
        <Grid container spacing={3}>
          {/* column */}
          <Grid item xs={7} sm={7}>
            <Typography variant="subtitle1" fontWeight="600">
              Support Stats
            </Typography>
            <Stack direction="row" spacing={1} mt={1} alignItems="center">
              <Avatar sx={{ bgcolor: '#caefcc', width: 27, height: 27 }}>
                <IconArrowUpLeft width={20} color="#39B69A" />
              </Avatar>
              <Typography variant="subtitle2" fontWeight="600">
                +9%
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                last year
              </Typography>
            </Stack>
          </Grid>
        </Grid>
        <Chart
          options={optionscolumnchart}
          series={seriescolumnchart}
          type="bar"
          height={100}
          width={'100%'}
          style={{ marginBottom: '20px' }}
        />
      </CardContent>
    </Card>
  );
};

export default SupportStats;
