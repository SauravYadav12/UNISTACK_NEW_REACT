import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Interviews from '../../pages/Marketing/Interviews/Interviews';
import { useSearchParams } from 'react-router-dom';
import { InterviewStatus } from '../../Interfaces/reports';
import { createInterviewQueryParam } from '../../pages/Marketing/Interviews/interviewValues';
import { interviewStatusColors } from '../../pages/Marketing/Interviews/interviewValues';

export const interviewTabs: { label: string; status?: InterviewStatus; color: string }[] = [
  { label: 'All', color: '#5D87FF' },
  { label: 'Confirmed', status: 'Interview Confirm', color: interviewStatusColors['Interview Confirm'] },
  { label: 'Completed', status: 'Interview Completed', color: interviewStatusColors['Interview Completed'] },
  { label: 'Tentative', status: 'Interview Tentative', color: interviewStatusColors['Interview Tentative'] },
  { label: 'Re-Scheduled', status: 'Interview Re-Scheduled', color: interviewStatusColors['Interview Re-Scheduled'] },
  { label: 'Cancelled', status: 'Interview Cancelled', color: interviewStatusColors['Interview Cancelled'] },
];

export default function InterviewTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [archive, setArchive] = useState(false);
  const [value, setValue] = useState(0);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    searchParams.toString().length && setSearchParams({});
  };

  React.useEffect(() => {
    const interviewStatus = searchParams.get('interviewStatus');
    if (searchParams.toString().length && !interviewStatus) {
      setValue(interviewTabs.length - 1);
      return;
    }
    const i = interviewTabs.findIndex((t) => t.status === interviewStatus);
    if (i >= 1) {
      setValue(i);
    }
  }, []);

  const activeTab = interviewTabs[value];
  const myParams = new URLSearchParams(searchParams);
  myParams.delete(createInterviewQueryParam);
  const p = myParams.toString();
  const query = p.length ? p : activeTab.status ? `interviewStatus=${activeTab.status}` : '';

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box flex={1} minHeight="300px">
        <Interviews
          query={query}
          label={activeTab.label + ' Interviews'}
          archiveState={[archive, setArchive]}
          activeTabIndex={value}
          onTabChange={handleChange}
        />
      </Box>
    </Box>
  );
}
