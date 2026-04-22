import React from 'react';
import { Select, MenuItem } from '@mui/material';
import Chart from 'react-apexcharts';
import ChartCardWrapper from './ChartCardWrapper';

const PositionsChart = () => {
  const chartTypeOptions = [
    'Last week Vs This week',
    'Last month Vs This month',
    'Last Six Months',
    'This Year',
    'All',
  ];
  const [chartType, setChartType] = React.useState(chartTypeOptions[0]);
  const chartHeight = 370;
  const optionscolumnchart: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: "'Inter Variable', 'Inter', sans-serif",
      foreColor: '#5A6B7F',
      toolbar: {
        show: true,
      },
      height: chartHeight,
    },
    colors: ['#EC4599', '#37B7EA'],
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
      categories: ['Mon', 'Tue', 'Wed', 'Thus', 'Fri'],
      axisBorder: {
        show: false,
      },
    },
    tooltip: {
      theme: 'light',
      fillSeriesColor: false,
    },
  };
  const seriescolumnchart: ApexCharts.ApexOptions['series'] = [
    {
      name: 'Last week',
      data: [2, 10, 12, 5, 25],
    },
    {
      name: 'This week',
      data: [8, 4, 7, 19],
    },
  ];

  return (
    <ChartCardWrapper
      title="Positions Bar"
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
        height={chartHeight}
        width={'100%'}
      />
    </ChartCardWrapper>
  );
};

export default PositionsChart;
