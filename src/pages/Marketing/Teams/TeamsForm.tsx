import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import CustomTextField from '../../../components/text_field/CustomTextField';
import { createTeam, deleteTeam, updateTeam } from '../../../services/teamsApi';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { dateFormate } from '../../../components/constants';
import {
  isFieldValid,
  validateAllFields,
  ValidationMeta,
} from '../../../utils/validators';
import { convertValuesToEmptyString } from '../../../utils/utils';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { ITeam } from '../../../Interfaces/types';
import { FormMode } from '../Requirements/Requirements';
import { toast } from 'react-toastify';
import { SetResults } from '../../../hooks/paginationHook';

const teamValidationMeta: ValidationMeta[] = [
  {
    field: 'teamName',
    required: true,
  },
];
const initialValues = {
  teamName: '',
  teckStack: '',
  developerName: '',
  createdBy: '',
};

interface iProps {
  viewData?: ITeam;
  mode: FormMode;
  setDrawerOpen: (open: boolean) => void;
  isEditing: boolean;
  onEdit: (editing: boolean) => void;
  setResults: SetResults;
}

export default function TeamsForm(props: iProps) {
  const [values, setValues] = useState<Partial<ITeam>>(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const user = useAuth().iUser!;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>(
    convertValuesToEmptyString(initialValues)
  );
  const { viewData, mode, setDrawerOpen, isEditing, onEdit, setResults } =
    props;

  useHardKeySubmit(
    {
      onSubmit: (e) => {
        mode === 'add' && handleSubmitForm(e);
        mode === 'edit' && handleEditSubmitForm(e);
      },
    },
    [values, mode, errors, isEditing]
  );

  useEffect(() => {
    if (!user) return;
    if (mode === 'view' || mode === 'edit') {
      setValues(viewData || {});
    } else if (mode === 'add') {
      setValues((prevValues) => ({
        ...prevValues,
        createdBy: user.firstName + ' ' + user.lastName,
      }));
    }
    setErrors(convertValuesToEmptyString(initialValues));
  }, [mode, viewData]);

  const handleClickOpenAlert = () => {
    setOpenAlert(true);
  };

  const handleClickCloseAlert = () => {
    setOpenAlert(false);
  };

  const addValue = (key: keyof ITeam, newValue: unknown) => {
    const meta = teamValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) {
        setErrors((pre) => ({ ...pre, [key]: '' }));
      }
      if (meta.transform) {
        newValue = meta.transform(newValue);
      }
    }
    setValues((prevValues) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

  async function handleSubmitForm(
    event: React.FormEvent<HTMLButtonElement> | KeyboardEvent
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    const isValid = validateAllFields(teamValidationMeta, values, setErrors);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const { data } = await createTeam(values);
      setResults((pre) => [data.data, ...pre||[]]);
      setDrawerOpen(false);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmitForm(
    event: React.FormEvent<HTMLButtonElement> | KeyboardEvent
  ) {
    event.preventDefault();
    if (isSubmitting) return;

    const isValid = validateAllFields(teamValidationMeta, values, setErrors);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      if (!values._id) {
        toast.error('Team ID is missing. Cannot update the team.');
        return;
      }
      const { data } = await updateTeam(values._id, values);
      setResults((pre) => {
        pre = pre?.map((d) => {
          if (d._id === data.data._id) return data.data;
          return d;
        });
        return [...pre||[]];
      });
      setDrawerOpen(false);
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }
  async function handleDeleteTeam() {
    try {
      if (!values._id) {
        toast.error('Team ID is missing. Cannot delete the team.');
        return;
      }
      await deleteTeam(values._id);
      setResults((pre) => [...pre||[]].filter((p) => p._id !== values._id));
      setDrawerOpen(false);
    } catch (error) {
      console.error('An error occurred while deleting the team:', error);
      toast.error('An error occurred while deleting the team.');
    }
  }

  const onBlur = (key: keyof ITeam) => {
    const meta = teamValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
  };

  if (!user) return null;
  if (!values)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress size={25} />
      </Box>
    );
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
            {user?.role === 'super-admin' && (
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
                {'Delete Team?'}
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
          selectedValue={values.teamName || ''}
          error={!!errors.teamName}
          helperText={errors.teamName}
          disabled={!isEditing}
          onBlur={() => onBlur('teamName')}
          onChange={(event) => addValue('teamName', event.target.value)}
        />
        <CustomTextField
          onBlur={() => onBlur('teckStack')}
          label="Teck Stack"
          width={320}
          selectedValue={values.teckStack || ''}
          error={!!errors.teckStack}
          helperText={errors.teckStack}
          disabled={!isEditing}
          onChange={(event) => addValue('teckStack', event.target.value)}
        />
        <CustomTextField
          onBlur={() => onBlur('developerName')}
          label="Developer Name"
          width={320}
          selectedValue={values.developerName || ''}
          error={!!errors.developerName}
          helperText={errors.developerName}
          disabled={!isEditing}
          onChange={(event) => addValue('developerName', event.target.value)}
        />
        {mode === 'view' && (
          <>
            <CustomTextField
              label="Created by"
              width={320}
              selectedValue={values.createdBy || ''}
              error={!!errors.createdBy}
              helperText={errors.createdBy}
              disabled
              onChange={(event) => addValue('createdBy', event.target.value)}
            />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                inputFormat={dateFormate}
                label="Created at"
                value={values.createdAt ? dayjs(values.createdAt) : null}
                disabled
                onChange={(newValue) => addValue('createdAt', newValue)}
                renderInput={(params) => (
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
                        backgroundColor: !isEditing ? '#f0f0f0' : 'transparent',
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
          </>
        )}
      </Grid>
    </form>
  );
}
