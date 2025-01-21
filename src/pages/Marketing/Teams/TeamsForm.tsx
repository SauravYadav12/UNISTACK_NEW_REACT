import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomTextField from '../../../components/text_field/CustomTextField';
import { createTeam, deleteTeam, updateTeam } from '../../../services/teamsApi';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';

const initialValues = {
  teamName: '',
  contactPerson: '',
  phone: '',
  createdBy: '',
};

export default function TeamsForm(props: any) {
  const [values, setValues] = useState<any>(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [errors, setErrors] = useState(initialValues);
  const { viewData, mode, setDrawerOpen, isEditing, onEdit } = props;

  useEffect(() => {
    if (mode === 'view') {
      setValues(viewData);
    } else if (mode === 'add') {
      setValues((prevValues: any) => ({
        ...prevValues,
        createdBy: user.firstName || '',
      }));
    }
  }, [mode, viewData]);

  const handleClickOpenAlert = () => {
    setOpenAlert(true);
  };

  const handleClickCloseAlert = () => {
    setOpenAlert(false);
  };

  const addValue = (key: any, newValue: any) => {
    // console.log('AddValues', newValue);
    if (key === 'createdAt') {
      const formattedDate = newValue
        ? dayjs(newValue).format('YYYY-MM-DD')
        : null;
      setValues((prevValues: any) => ({
        ...prevValues,
        [key]: formattedDate,
      }));
    } else {
      setValues((prevValues: any) => ({
        ...prevValues,
        [key]: newValue,
      }));
    }
  };

  async function handleSubmitForm(event: any) {
    event.preventDefault();
    const newErrors: any = {};
    if (!values.teamName) newErrors.teamName = 'Team Name is required';
    if (!values.contactPerson)
      newErrors.contactPerson = 'Consultant Name is required';
    if (!values.phone) newErrors.phone = 'Phone Number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    console.log('Submit button clicked');
    try {
      const res = await createTeam(values);
      if (res.status === 200) console.log('Create Team', res);
      setDrawerOpen(false);
      console.log('Teams Form submitted successfully', values);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    }
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();
    console.log('Edit submit clicked', values.createdAt);
    try {
      const res = await updateTeam(values._id, values);
      if (res.status === 200) {
        setDrawerOpen(false);
        console.log('Team updated successfully', res.data);
        onEdit(res.data);
      }
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    }
  }
  async function handleDeleteTeam(_id: any) {
    console.log('Delete button clicked');
    try {
      const response = await deleteTeam(values._id);
      if (response.status === 200) {
        console.log('Interview  deleted successfully:', response.data);
        setDrawerOpen(false);
      } else {
        console.error('Failed to delete requirement:', response);
      }
    } catch (error) {
      console.error('An error occurred while deleting the requirement:', error);
    }
  }

  return (
    <form style={{ margin: '0 20px' }}>
      <Grid
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
          marginRight: 10,
        }}
      >
        {mode === 'add' ? (
          <Button
            variant="contained"
            color="primary"
            type="submit"
            onClick={handleSubmitForm}
            size="small"
            sx={{ borderRadius: '10px' }}
          >
            Submit
          </Button>
        ) : isEditing ? (
          <>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => onEdit(false)}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={handleEditSubmitForm}
              size="small"
              sx={{ borderRadius: '10px' }}
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
              onClick={() => onEdit(true)}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Edit
            </Button>
            {user.role === 'super-admin' && (
              <Button
                variant="contained"
                color="primary"
                type="button"
                size="small"
                sx={{ borderRadius: '10px' }}
                onClick={handleClickOpenAlert}
              >
                Delete
              </Button>
            )}
            <Dialog
              open={openAlert}
              onClose={handleClickCloseAlert}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
            >
              <DialogTitle id="alert-dialog-title">
                {'Delete Consultant?'}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Are you sure you want to delete this Teams? This action cannot
                  be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClickCloseAlert} autoFocus>
                  Disagree
                </Button>
                <Button onClick={handleDeleteTeam} autoFocus>
                  Agree
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Grid>
      <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
        {/* Section 1: Consultant Info */}
        <Grid item xs={12}>
          <h4>1. Teams Info</h4>
        </Grid>
        <CustomTextField
          label="Team Name"
          width={320}
          selectedValue={values.teamName}
          error={!!errors.teamName}
          helperText={errors.teamName}
          disabled={!isEditing}
          onChange={(event: any) => addValue('teamName', event.target.value)}
        />
        <CustomTextField
          label="Contact Person Name"
          width={320}
          selectedValue={values.contactPerson}
          error={!!errors.contactPerson}
          helperText={errors.contactPerson}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('contactPerson', event.target.value)
          }
        />
        <CustomTextField
          label="Phone"
          width={320}
          selectedValue={values.phone}
          type="number"
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={!isEditing}
          onChange={(event: any) => addValue('phone', event.target.value)}
        />
        <CustomTextField
          label="Created by"
          width={320}
          selectedValue={values.createdBy}
          error={!!errors.createdBy}
          helperText={errors.createdBy}
          disabled={!isEditing}
          onChange={(event: any) => addValue('createdBy', event.target.value)}
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Created at"
            value={values.createdAt ? dayjs(values.createdAt) : null}
            disabled={!isEditing}
            onChange={(newValue) => addValue('createdAt', newValue)}
            renderInput={(params: any) => (
              <TextField
                size="small"
                {...params}
                sx={{
                  width: 320,
                  mr: 1,
                  mt: 1,
                  ml: 1,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'black',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                  },
                }}
              />
            )}
          />
        </LocalizationProvider>
      </Grid>
    </form>
  );
}
