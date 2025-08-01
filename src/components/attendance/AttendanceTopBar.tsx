import { Sync } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import { useState } from 'react';
import AttendanceExportModal from './AttendanceExportModal';
import { iUser } from '../../Interfaces/iUser';
import MarkMolidayModal from '../holiday/MarkMolidayModal';
import StatusLegend from './StatusLegend';

interface iProps {
  users: iUser[];
  reload: () => void;
}

export const AttendanceTopBar = ({ users, reload }: iProps) => {
  const [exportModal, setExportModal] = useState(false);
  return (
    <>
      <Box
        display={'flex'}
        justifyContent={'space-between'}
        flexWrap={'wrap'}
        alignItems={'center'}
      >
        <Box>
          <StatusLegend />
        </Box>
        <Box
          display={'flex'}
          justifyContent={'space-between'}
          flexWrap={'wrap'}
          alignItems={'center'}
          columnGap={2}
          rowGap={1}
        >
          <MarkMolidayModal />
          <Box sx={{ height: 'fit-content' }}>
            <AttendanceExportModal
              open={exportModal}
              onOpen={() => setExportModal(true)}
              onClose={() => setExportModal(false)}
              users={users || []}
            />
          </Box>
          <div>
            <IconButton onClick={reload}>
              <Sync color="primary" />
            </IconButton>
          </div>
        </Box>
      </Box>
    </>
  );
};
