import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import { Grid, Stack, Typography, Avatar, Box } from '@mui/material';
import ChartCardWrapper from './ChartCardWrapper';
const DataCards = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = '#ecf2ff';
  // chart
  const optionscolumnchart: ApexCharts.ApexOptions  = {
    chart: {
      type: 'donut',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: false,
      },
      height: 155,
    },
    colors: [primary, primarylight, '#F9F9FD'],
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        donut: {
          size: '75%',
          background: 'transparent',
        },
      },
    },
    tooltip: {
      theme: 'light',
      fillSeriesColor: false,
    },
    stroke: {
      show: false,
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 991,
        options: {
          chart: {
            width: 120,
          },
        },
      },
    ],
  };
  const seriescolumnchart: ApexCharts.ApexOptions['series'] = [38, 40, 25];

  return (
    <ChartCardWrapper title="">
      <Grid container spacing={3}>
        <Grid item xs={7} sm={7}>
          <Typography variant="h6" fontWeight="400">
            User Status
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 9,
                height: 9,
                bgcolor: primary,
                svg: { display: 'none' },
              }}
            ></Avatar>
            <Typography variant="subtitle2" color="textSecondary">
              Active: 14
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 9,
                height: 9,
                bgcolor: primarylight,
                svg: { display: 'none' },
              }}
            ></Avatar>
            <Typography variant="subtitle2" color="textSecondary">
              InActive: 5
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 9,
                height: 9,
                bgcolor: primarylight,
                svg: { display: 'none' },
              }}
            ></Avatar>
            <Typography variant="subtitle2" color="textSecondary">
              InActive: 5
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 9,
                height: 9,
                bgcolor: primarylight,
                svg: { display: 'none' },
              }}
            ></Avatar>
            <Typography variant="subtitle2" color="textSecondary">
              InActive: 5
            </Typography>
          </Stack>
        </Grid>
        {/* column */}
        <Grid item xs={5} sm={5} alignContent={'center'}>
         <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="donut"
            height={150}
            width={'100%'}
          />
        </Grid>
      </Grid>
    </ChartCardWrapper>
  );
};

export default DataCards;
