import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import {
  Grid,
  Stack,
  Typography,
  Avatar,
  MenuItem,
  Select,
} from '@mui/material';
import { IconArrowUpLeft } from '@tabler/icons-react';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import { useState } from 'react';

interface iProps {
  title?: string;
}

const LeavesSummery = ({ title }: iProps) => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const primarylight = '#ecf2ff';
  const successlight = theme.palette.success.light;
  const options = ['This month', 'Last month', 'Last six month', 'This year'];
  const [selectedOption, setSelectedOption] = useState(
    options[options.length - 1]
  );
  // chart
  const optionscolumnchart: any = {
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
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
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
  const seriescolumnchart: any = [38, 40, 25];

  return (
    <ChartCardWrapper
      title={title || 'Leaves summary'}
      action={
        <Select
          //   disabled={loading}
          value={selectedOption}
          size="small"
          onChange={(e) => {
            setSelectedOption(e.target.value as any);
          }}
        >
          {options.map((o, i) => {
            return (
              <MenuItem key={i} value={o}>
                {o}
              </MenuItem>
            );
          })}
        </Select>
      }
    >
      <Grid container spacing={3} pt={3}>
        <Grid item xs={7} sm={7}>
          <Typography variant="h6" fontWeight="600">
            10 days
          </Typography>
          <Stack direction="row" spacing={1} mt={1} alignItems="center">
            <Avatar sx={{ bgcolor: '#caefcc', width: 27, height: 27 }}>
              <IconArrowUpLeft width={20} color="#39B69A" />
            </Avatar>
            <Typography variant="subtitle2" fontWeight="600">
              +4 days
            </Typography>
            <Typography variant="subtitle2" color="textSecondary">
              last 6 months
            </Typography>
          </Stack>
          <Stack spacing={3} mt={5} direction="row">
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
                Approved
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
                Rejected
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        {/* column */}
        <Grid item xs={5} sm={5}>
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

export default LeavesSummery;
