import React, { useState } from 'react';
import {
  Button,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { AttendanceStatus } from '../../Interfaces/iUser';
import {
  getStatusShortForm,
  HolidayStatus,
  iHolidayStatus,
} from '../../utils/holidayUtil';
import { StatusBox } from './AttendanceStatusBox';

type StatusItem = {
  label: string;
  status: AttendanceStatus | iHolidayStatus;
};

const StatusLegend = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'status-legend-popover' : undefined;

  const statusItems: StatusItem[] = [
    ...Object.values(AttendanceStatus).map((a) => ({ label: a, status: a })),
    { label: HolidayStatus, status: HolidayStatus },
  ];

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Info />}
        onClick={handleClick}
        aria-describedby={id}
      >
        Legend
      </Button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Status Legend
          </Typography>
          <Divider sx={{ mb: 1 }} />
          <List dense>
            {statusItems.map((item) => (
              <ListItem key={item.label} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <StatusBox status={item.status}>
                    {getStatusShortForm(item.status)}
                  </StatusBox>
                </ListItemIcon>
                <ListItemText primary={item.label} sx={{ pl: 3 }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Popover>
    </>
  );
};

export default StatusLegend;
