import ChartCardWrapper from '../dashboard/ChartCardWrapper';
// import { useFetchData } from '../../hooks/fetchDataHook';
// import { getLeaves } from '../../services/leavesApi';
// import { useAuth } from '../../AuthGaurd/AuthContextProvider';

const RecentLeaveApplicationStatus = () => {
  // const { iUser } = useAuth();
  // const {
  //   data: leaveHistory,
  //   error,
  //   loading,
  //   loadData,
  //   setData,
  // } = useFetchData(async () => {
  //   const { data } = await getLeaves(`userRef=${iUser?._id}&limit=5`);
  //   return data.data?.results;
  // }, []);

  return (
    <ChartCardWrapper title="Recent" subtitle={'TO - DO'}>

    </ChartCardWrapper>
  );
};

export default RecentLeaveApplicationStatus;
