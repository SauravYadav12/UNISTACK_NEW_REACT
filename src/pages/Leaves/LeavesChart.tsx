import React from 'react';
import { Select, MenuItem } from '@mui/material';
import Chart from 'react-apexcharts';
import ChartCardWrapper from '../../components/dashboard/ChartCardWrapper';
import { iUser, UserRole } from '../../Interfaces/iUser';

interface iProps {
  employees: iUser[];
}
const LeavesChart = ({ employees }: iProps) => {
  const chartTypeOptions = [
    'This month',
    'Last Six Months',
    'This Year',
    'All',
  ];
  const [chartType, setChartType] = React.useState(chartTypeOptions[0]);
  const chartheight = 250;
  let barCategories = employees
    .filter((e) => e.role !== UserRole['super-admin'] && e.active)
    .map((e) => e.firstName);
  const optionscolumnchart: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: {
        show: true,
      },
      height: chartheight,
    },
    colors: ['#02B2AF', '#2E96FF'],
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: '60%',
        columnWidth: '62%',
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },

    stroke: {
      show: true,
      width: 5,
      lineCap: 'butt',
      colors: ['transparent'],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    yaxis: {
      tickAmount: 4,
    },
    xaxis: {
      categories: barCategories,
      axisBorder: {
        show: false,
      },
    },
    tooltip: {
      theme: 'light',
      fillSeriesColor: false,
    },
  };
  const seriescolumnchart: any = [
    {
      name: 'Last week',
      data: [2, 10, 12, 1, 25, 12, 0, 25],
    },
    // {
    //   name: 'This week',
    //   data: [8, 4, 7, 19],
    // },
  ];

  return (
    <ChartCardWrapper
      title="Leaves Bar"
      subtitle={chartType}
      action={
        <Select
          labelId="month-dd"
          id="month-dd"
          value={chartType}
          size="small"
          onChange={(e) => setChartType(e.target.value)}
        >
          {chartTypeOptions.map((o, i) => {
            return (
              <MenuItem key={i} value={o}>
                {o}
              </MenuItem>
            );
          })}
        </Select>
      }
    >
      <Chart
        options={optionscolumnchart}
        series={seriescolumnchart}
        type="bar"
        height={chartheight}
        width={'100%'}
      />
    </ChartCardWrapper>
  );
};

export default LeavesChart;
