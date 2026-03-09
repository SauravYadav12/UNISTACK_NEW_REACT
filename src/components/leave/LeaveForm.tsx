import React, { useEffect, useState } from 'react';
import { iLeave, LeaveStatus } from '../../Interfaces/leaves';

import DownloadIcon from '@mui/icons-material/Download';
import {
  Grid,
  Button,
  TextField,
  Box,
  Card,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import AlertBox from '../alert/AlertBox';
import CustomSelectField from '../select/CustomSelectField';
import CustomTextField from '../text_field/CustomTextField';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { dateFormate2 } from '../constants';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import { UserRole } from '../../Interfaces/iUser';
interface iProps {
  viewData: iLeave;
  isEditing?: boolean;
  hideButtons?: boolean;
  disableDelete?: boolean;
  onEdit?: (editMode: boolean) => void;
  onDelete?: () => void;
  onDrawerClose?: () => void;
}
const DateFieldTextInputStyle = {
  width: 230,
  mr: 1,
  mt: 1,
  ml: 1,
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: '#f0f0f0',
  },
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: 'black',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
  },
};
const LeaveForm = ({
  viewData,
  isEditing = false,
  hideButtons,
  disableDelete,
  onEdit,
  onDrawerClose,
}: iProps) => {
  const [values, setValues] = useState<iLeave>();
  const { iUser: user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [deleteAlert, setDeleteAlert] = useState(false);
  function handleChange(field: keyof iLeave, value: string) {
    setValues((pre) => {
      if (!pre) return;
      return { ...pre, [field]: value };
    });
  }

  useEffect(() => {
    setValues(viewData);
  }, [viewData]);

  function MyDateFields() {
    if (values?.startDate === values?.endDate || values?.isHalfDay) {
      return (
        <Grid>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              disabled
              inputFormat={dateFormate2}
              label="Date"
              value={values?.startDate ? moment(values.startDate) : null}
              onChange={() => {}}
              renderInput={(params) => (
                <TextField
                  disabled
                  size="small"
                  {...params}
                  sx={DateFieldTextInputStyle}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
      );
    }

    return (
      <>
        <Grid>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              disabled
              inputFormat={dateFormate2}
              label="Start Date"
              value={values?.startDate ? moment(values?.startDate) : null}
              onChange={() => {}}
              renderInput={(params) => (
                <TextField
                  disabled
                  size="small"
                  {...params}
                  sx={DateFieldTextInputStyle}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid>
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              disabled
              inputFormat={dateFormate2}
              label="End Date"
              value={values?.endDate ? moment(values?.endDate) : null}
              onChange={() => {}}
              renderInput={(params) => (
                <TextField
                  disabled
                  size="small"
                  {...params}
                  sx={DateFieldTextInputStyle}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
      </>
    );
  }
  return (
    <>
      <Box sx={{ width: '100%', margin: '0 20px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
            flexWrap: 'wrap-reverse',
            rowGap: '20px',
          }}
        >
          <Box>
            {!!values?.attachments?.length && (
              <>
                <Card
                  variant="outlined"
                  className="document-container"
                  sx={{
                    borderRadius: '10px',
                    justifyContent: 'space-between',
                    width: '210px',
                    padding: 0,
                  }}
                >
                  <Stack
                    py={'6px'}
                    pl={2}
                    direction={'row'}
                    alignItems={'center'}
                  >
                    <img
                      src={`${getMaterialFileIcon(values.attachments[0])}`}
                      alt="icon"
                      style={{
                        width: '17px',
                        height: '17px',
                      }}
                    />
                    <Typography variant={'subtitle2'} pl={'3px'}>
                      Attachment
                    </Typography>
                  </Stack>
                  <Box pr={1}>
                    <IconButton
                      download
                      href={values.attachments[0]}
                      size="small"
                      sx={{ height: '30px' }}
                    >
                      <DownloadIcon
                        style={{ color: '#1976d2', width: '16px' }}
                      />
                    </IconButton>
                  </Box>
                </Card>
              </>
            )}
          </Box>
          {!hideButtons && (
            <Grid
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                marginRight: 10,
                flexWrap: 'wrap',
              }}
            >
              {isEditing ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    type="button"
                    onClick={() => {
                      setValues(viewData);
                      onEdit?.(false);
                    }}
                    size="small"
                    disabled={isSubmitting}
                    sx={{ borderRadius: '10px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    onClick={() => {}}
                    size="small"
                    sx={{ borderRadius: '10px' }}
                    disabled={isSubmitting}
                  >
                    Submit
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    type="button"
                    onClick={() => onEdit?.(true)}
                    size="small"
                    sx={{ borderRadius: '10px' }}
                  >
                    Edit
                  </Button>
                  {!disableDelete && user?.role === UserRole['super-admin'] && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        type="button"
                        size="small"
                        sx={{ borderRadius: '10px' }}
                        onClick={() => setDeleteAlert(true)}
                        disabled={isSubmitting}
                      >
                        Delete
                      </Button>
                      <AlertBox
                        open={deleteAlert}
                        title="Delete Leave"
                        description="Are you sure you want to delete this leave? This
                  action cannot be undone."
                        onClose={() => setDeleteAlert(false)}
                        onOk={() => {}}
                      />
                    </>
                  )}
                </>
              )}
            </Grid>
          )}
        </Box>
      </Box>
      <form style={{ margin: '0 20px' }}>
        <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
          <Grid item xs={12}>
            <h4>1. Leave details</h4>
          </Grid>
          <CustomTextField
            label="Name"
            width={220}
            selectedValue={values?.name|| ''}
            disabled
          />
          <CustomTextField
            label="Leave Type"
            width={220}
            selectedValue={values?.type || ''}
            disabled
          />
          <CustomSelectField
            label="Status"
            valueOptions={Object.values(LeaveStatus)}
            selectedValue={values?.status || ''}
            width={230}
            onChange={(v) => handleChange('status', v)}
            disabled={!isEditing}
          />

          {values?.isHalfDay && (
            <CustomTextField
              label="Half day type"
              width={220}
              selectedValue={values?.halfDayType || ''}
              disabled
            />
          )}
          <MyDateFields />

          <Grid my={1} width={'100%'} minWidth={220}>
            <CustomTextField
              label="Reason"
              width={'100%'}
              disabled
              selectedValue={values?.reason || ''}
            />
          </Grid>

          {values?.status === LeaveStatus.Rejected && (
            <Grid my={1} width={'100%'} minWidth={220}>
              <CustomTextField
                label="Rejection Reason"
                width={'100%'}
                disabled={!isEditing}
                selectedValue={values?.rejectionReason || ''}
              />
            </Grid>
          )}

          {values?.createdAt && (
            <CustomTextField
              label="Applied At"
              width={220}
              selectedValue={moment(values.createdAt).format(dateFormate2)}
              disabled
            />
          )}
          {values?.respondedAt && (
            <CustomTextField
              label="Responded At"
              width={220}
              selectedValue={moment(values.respondedAt).format(dateFormate2)}
              disabled
            />
          )}
        </Grid>
      </form>
    </>
  );
};

export default LeaveForm;
