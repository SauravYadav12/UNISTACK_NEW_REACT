import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import moment from 'moment';
import { dateFormate2 } from '../constants';

// Sample leave history data (replace with your actual data fetching)
const sampleLeaveHistory = [
  {
    name: 'Test user',
    id: 1,
    startDate: new Date('2025-05-05'),
    endDate: new Date('2025-05-07'),
    leaveType: 'Casual Leave',
    status: 'Approved',
    reason: 'Personal work',
  },
  {
    name: 'Test user',
    id: 2,
    startDate: new Date('2025-06-10'),
    endDate: new Date('2025-06-10'),
    leaveType: 'Sick Leave',
    status: 'Pending',
    reason: 'Feeling unwell',
  },
  {
    name: 'Test user',
    id: 3,
    startDate: new Date('2025-07-15'),
    endDate: new Date('2025-07-19'),
    leaveType: 'Annual Leave',
    status: 'Approved',
    reason: 'Vacation',
  },
  {
    name: 'Test user',
    id: 4,
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-03'),
    leaveType: 'Casual Leave',
    status: 'Rejected',
    reason: 'Insufficient balance',
  },
];

interface iProps {
  tableContainerHeight?: number;
}

function LeaveHistoryTable({ tableContainerHeight = 480 }: iProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div>
      <TableContainer
        sx={{ height: tableContainerHeight, scrollbarWidth: 'thin' }}
      >
        <Table
          sx={{ minWidth: 650 }}
          stickyHeader
          aria-label="leave history table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Dates</TableCell>
              {/* <TableCell>End Date</TableCell> */}
              <TableCell>Leave Type</TableCell>
              <TableCell>Status</TableCell>
              {!isMobile && <TableCell>Reason</TableCell>}
              <TableCell>Created At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sampleLeaveHistory.map((leave) => (
              <TableRow
                key={leave.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {leave.name}
                </TableCell>
                <TableCell>
                  {moment(leave.startDate).format(dateFormate2)} To{' '}
                  {moment(leave.endDate).format(dateFormate2)}
                </TableCell>
                {/* <TableCell>{format(leave.endDate, 'dd-MMM-yyyy')}</TableCell> */}
                <TableCell>{leave.leaveType}</TableCell>
                <TableCell>{leave.status}</TableCell>
                {!isMobile && <TableCell>{leave.reason}</TableCell>}
                <TableCell>
                  {moment(leave.startDate).format(dateFormate2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default LeaveHistoryTable;
