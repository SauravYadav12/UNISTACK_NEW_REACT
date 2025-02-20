import Chart from 'react-apexcharts';
import { Stack, Typography, Avatar, Fab } from '@mui/material';
import { IconArrowDownRight, IconCurrencyDollar } from '@tabler/icons-react';
import ChartCardWrapper from './ChartCardWrapper';

const MonthlyProgress = () => {
  const secondarylight = '#f5fcff';
  const errorlight = '#fdede8';

  const optionscolumnchart: any = {
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
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      colors: [secondarylight],
      type: 'solid',
      opacity: 0.05,
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: 'light',
    },
  };
  const seriescolumnchart: any = [
    {
      name: '',
      color: '#bb86fc',
      data: [0, 10, 60,20, 10, 12, 58, 20],
    },
  ];

  return (
    <ChartCardWrapper
      title="Monthly Progress"
      action={
        <Fab color="secondary" size="medium" sx={{ color: '#ffffff' }}>
          <IconCurrencyDollar width={24} />
        </Fab>
      }
      footer={
        <Chart
          options={optionscolumnchart}
          series={seriescolumnchart}
          type="area"
          height={60}
          width={'100%'}
        />
      }
    >
      <>
        <Typography variant="h6" fontWeight="600" mt="-20px">
          6,820
        </Typography>
        <Stack direction="row" spacing={1} my={1} alignItems="center">
          <Avatar sx={{ bgcolor: errorlight, width: 27, height: 27 }}>
            <IconArrowDownRight width={20} color="#FA896B" />
          </Avatar>
          <Typography variant="subtitle2" fontWeight="600">
            +9%
          </Typography>
          <Typography variant="subtitle2" color="textSecondary">
            last year
          </Typography>
        </Stack>
      </>
    </ChartCardWrapper>
  );
};

export default MonthlyProgress;
