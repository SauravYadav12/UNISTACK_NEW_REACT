import { Box, CircularProgress, Grid } from '@mui/material';
import BasicCard from '../../components/card/Card';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import InterpreterModeIcon from '@mui/icons-material/InterpreterMode';
import Face6Icon from '@mui/icons-material/Face6';
import SummarizeIcon from '@mui/icons-material/Summarize';
import BadgeIcon from '@mui/icons-material/Badge';
import { ReactElement, useEffect, useState } from 'react';
import { DashboardReport } from '../../Interfaces/reports';
import { toast } from 'react-toastify';
import { getDashboardReport } from '../../services/reportsApi';
import Interviews from '../Marketing/Interviews/Interviews';
import dayjs from 'dayjs';
import { dateFormate } from '../../components/constants';
interface CustomCard {
  color: string;
  title: string;
  count?: number;
  icon: ReactElement;
  titleColor: string;
}

function Dashboard() {
  const toDay = dayjs(new Date());
  const [report, setReport] = useState<DashboardReport>();
  const cardObject: CustomCard[] = [
    {
      color: '#ECF2FF',
      title: 'Requirements',
      count: report?.totalRequirements || 0,
      icon: <LeaderboardIcon fontSize="large" style={{ color: '#5D87FF' }} />,
      titleColor: '#5D87FF',
    },
    {
      color: '#FDF4E5',
      title: 'Interviews',
      count: report?.totalInterviews || 0,
      icon: (
        <InterpreterModeIcon fontSize="large" style={{ color: '#FFAE1F' }} />
      ),
      titleColor: '#FFAE1F',
    },
    {
      color: '#E8F7FF',
      title: 'Completed',
      count: report?.totalConfirmInterviews || 0,
      icon: <Face6Icon fontSize="large" style={{ color: '#49BEFF' }} />,
      titleColor: '#49BEFF',
    },
    {
      color: '#FCEDE8',
      title: 'Projects',
      count: undefined,
      icon: <SummarizeIcon fontSize="large" style={{ color: '#FA896B' }} />,
      titleColor: '#FA896B',
    },
    {
      color: '#E6FFFA',
      title: 'Active',
      count: report?.totalActiveUsers || 0,
      icon: <BadgeIcon fontSize="large" style={{ color: '#13DEB9' }} />,
      titleColor: '#13DEB9  ',
    },
    {
      color: '#ECF2FF',
      title: 'Employees',
      count: report?.totalUsers || 0,
      icon: <Face6Icon fontSize="large" style={{ color: '#5D87FF' }} />,
      titleColor: '#5D87FF',
    },
  ];

  const getMyReports = async () => {
    try {
      const { data } = await getDashboardReport();
      setReport(data.data);
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  useEffect(() => {
    getMyReports();
  }, []);

  if (!report)
    return (
      <Box height={100} className="loader" sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <>
     <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
     <Grid container spacing={2} sx={{ width: '100%' }}>
        {cardObject.map((card: any) => {
          return (
            <Grid key={card.title} item xs={12} sm={6} md={4} lg={2} xl={2}>
              <BasicCard
                color={card.color}
                title={card.title}
                count={card.count??"NA"}
                icon={card.icon}
                titleColor={card.titleColor}
              />
            </Grid>
          );
        })}
      </Grid>
      <div style={{ flex:1 }}>
        <Interviews
          addNew={false}
          query={`interviewDate=${toDay.format(
            'YYYY-MM-DD'
          )}&interviewDate=${toDay.format(dateFormate)}`}
          label={"Today's Interviews"}
        />
      </div>
     </div>
    </>
  );
}

export default Dashboard;
