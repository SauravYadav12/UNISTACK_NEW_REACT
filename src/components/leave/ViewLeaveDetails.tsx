import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Grid,
  Divider,
  TextField,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { iLeave, LeaveStatus } from '../../Interfaces/leaves';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { UserRole } from '../../Interfaces/iUser';
import { updateLeave } from '../../services/leavesApi';
import moment from 'moment';

interface LeaveDetailsProps {
  leave: iLeave;
  onUpdate?: (leave: iLeave) => void;
}

const StatusChip = styled(Chip)<{ status: LeaveStatus }>(({
  theme,
  status,
}) => {
  const colors = {
    [LeaveStatus.Pending]: {
      bg: theme.palette.warning.light,
      color: theme.palette.warning.dark,
    },
    [LeaveStatus.Approved]: {
      bg: theme.palette.success.light,
      color: theme.palette.success.dark,
    },
    [LeaveStatus.Rejected]: {
      bg: theme.palette.error.light,
      color: theme.palette.error.dark,
    },
  };

  return {
    backgroundColor: colors[status].bg,
    color: colors[status].color,
    fontWeight: 600,
    fontSize: '0.875rem',
  };
});

const InfoItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: 8,
  height: '100%',
}));

const ViewLeaveDetails: React.FC<LeaveDetailsProps> = ({ leave, onUpdate }) => {
  const { iUser } = useAuth();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const totalDays =
    moment(leave.endDate).diff(moment(leave.startDate), 'days') + 1;
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const iLeave = await updateLeave(leave._id, {
        status: LeaveStatus.Approved,
      });
      if (onUpdate && iLeave) {
        onUpdate(iLeave);
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;

    setIsRejecting(true);
    try {
      const iLeave = await updateLeave(leave._id, {
        status: LeaveStatus.Rejected,
        rejectionReason: rejectReason,
      });
      if (onUpdate && iLeave) {
        onUpdate(iLeave);
      }
      setShowRejectDialog(false);
      setRejectReason('');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRejectCancel = () => {
    setShowRejectDialog(false);
    setRejectReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getLeaveDuration = () => {
    if (leave.isHalfDay && leave.halfDayType) {
      return `Half Day (${leave.halfDayType})`;
    }
    return 'Full Day';
  };

  return (
    <>
      <Box>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Employee
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {leave.name}
                </Typography>
              </InfoItem>
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Leave Type
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {leave.type}
                </Typography>
              </InfoItem>
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Total Duration
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                 <>
                  {totalDays} {totalDays > 1 ? 'Days' : 'Day'} 
                 </>
                   {' - '} {getLeaveDuration()}
                </Typography>
              </InfoItem>
            </Grid>
            <Grid item xs={12} md={6}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Status
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  <StatusChip
                    label={leave.status}
                    status={leave.status}
                    size="medium"
                  />
                </Typography>
              </InfoItem>
            </Grid>

            <Grid item xs={12} md={6}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Start Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(leave.startDate)}
                </Typography>
              </InfoItem>
            </Grid>

            <Grid item xs={12} md={6}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  End Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(leave.endDate)}
                </Typography>
              </InfoItem>
            </Grid>

            <Grid item xs={12}>
              <InfoItem>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Reason for Leave
                </Typography>
                <Typography variant="body1">{leave.reason}</Typography>
              </InfoItem>
            </Grid>

            {/* Attachments */}
            {leave.attachments && leave.attachments.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Attachments
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {leave.attachments.map((attachment, index) => (
                    <Chip
                      key={index}
                      icon={<AttachFileIcon />}
                      label={`Attachment ${index + 1}`}
                      onClick={() => window.open(attachment, '_blank')}
                      clickable
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Grid>
            )}

            {/* Response Details */}
            {leave.status !== LeaveStatus.Pending && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12} md={6}>
                  <InfoItem>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Responded By
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {leave.respondBy || 'N/A'}
                    </Typography>
                  </InfoItem>
                </Grid>

                <Grid item xs={12} md={6}>
                  <InfoItem>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      Responded At
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {leave.respondedAt
                        ? formatDate(leave.respondedAt)
                        : 'N/A'}
                    </Typography>
                  </InfoItem>
                </Grid>

                {leave.status === LeaveStatus.Rejected &&
                  leave.rejectionReason && (
                    <Grid item xs={12}>
                      <InfoItem sx={{ backgroundColor: 'error.lighter' }}>
                        <Typography
                          variant="subtitle2"
                          color="error"
                          gutterBottom
                        >
                          Rejection Reason
                        </Typography>
                        <Typography variant="body1" color="error.dark">
                          {leave.rejectionReason}
                        </Typography>
                      </InfoItem>
                    </Grid>
                  )}
              </>
            )}

            <Grid item xs={12}>
              <Typography variant="caption" color="textSecondary">
                Request submitted on {formatDate(leave.createdAt)}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          {iUser?.role.includes(UserRole['super-admin']) &&
            leave.status === LeaveStatus.Pending && (
              <>
                <Button
                  onClick={handleRejectClick}
                  variant="outlined"
                  color="error"
                  startIcon={isRejecting ? <CircularProgress size={20} /> : <RejectIcon />}
                  disabled={isRejecting || isApproving}
                >
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  variant="contained"
                  color="success"
                  startIcon={isApproving ? <CircularProgress size={20} /> : <ApproveIcon />}
                  disabled={isApproving || isRejecting}
                >
                  Approve
                </Button>
              </>
            )}
        </DialogActions>
      </Box>

      {/* Reject Reason Dialog */}
      <Dialog
        open={showRejectDialog}
        onClose={handleRejectCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Reject Leave Request</Typography>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this leave request..."
            required
            error={!rejectReason.trim()}
            helperText={
              !rejectReason.trim() ? 'Rejection reason is required' : ''
            }
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleRejectCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={!rejectReason.trim() || isRejecting}
            startIcon={isRejecting ? <CircularProgress size={20} /> : undefined}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ViewLeaveDetails;
