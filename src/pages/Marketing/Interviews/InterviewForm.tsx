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
import CustomTextField from '../../../components/text_field/CustomTextField';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { useEffect, useState } from 'react';
import {
  DatePicker,
  LocalizationProvider,
  TimePicker,
} from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  intDurationOptions,
  intModeOptions,
  intRoundOptions,
  intStatusOptions,
  intTypeOptions,
  intWithOptions,
  meetingTypeOptions,
  paymentStatusOptions,
  resultOptions,
  timeZoneOptions,
} from './interviewValues';
import {
  createInterview,
  deleteInterview,
  updateInterview,
} from '../../../services/interviewApi';

const initialValues = {
  timeShift: '',
  timeZone: '',
  interviewType: '',
  interviewStatus: '',
  interviewWith: '',
  intResult: '',
  interviewRound: '',
  interviewViaMode: '',
  meetingType: '',
  interviewDuration: '',
  interviewDate: null,
  interviewTime: null,
  consultant: '',
  marketingPerson: '',
  vendorCompany: '',
  primeVendorCompany: '',
  codeLink: '',
  tentativeReason: '',
  remarks: '',
  subjectLine: '',
  interviewMode: '',
  interviewLink: '',
  interviewFocus: '',
  specialNote: '',
  interviewFeedback: '',
  jobTitle: '',
  reqID: '',
  clientName: '',
  taxType: '',
  duration: '',
  candidateName: '',
  rateForInterview: '',
  paymentStatus: '',
  jobDescription: '',
};

export default function InterviewForm(props: any) {
  const [values, setValues] = useState<any>(initialValues);
  const { selectedRecord, viewData, mode, isEditing, onEdit, setDrawerOpen } =
    props;
  const [errors, setErrors] = useState(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (selectedRecord) {
      setValues((prevValues: any) => ({
        ...prevValues,
        reqID: selectedRecord.id,
        clientName: selectedRecord.name,
        vendorCompany: selectedRecord.company,
        jobTitle: selectedRecord.title,
        primeVendorCompany: selectedRecord.primeVendorCompany,
        jobDescription: selectedRecord.jobDescription,
        duration: selectedRecord.duration,
        taxType: selectedRecord.taxType,
        marketingPerson: user.firstName,
      }));
    }
    if (!selectedRecord) {
      setValues(viewData);
    }
  }, [selectedRecord]);

  console.log('UserData', user);

  const addValue = (key: any, newValue: any) => {
    setErrors(initialValues);
    const updatedValues: any = { ...values, [key]: newValue };
    if (key === 'interviewDate') {
      updatedValues.interviewDate = newValue
        ? dayjs(newValue).format('YYYY-MM-DD')
        : null;
    } else if (key === 'interviewTime') {
      updatedValues.interviewTime = newValue
        ? dayjs(newValue).format('hh:mm:ss A')
        : null;
    }
    const {
      interviewWith,
      interviewDuration,
      interviewType,
      interviewViaMode,
      meetingType,
      vendorCompany,
      primeVendorCompany,
      clientName,
    }: any = updatedValues;
    if (interviewWith === 'Vendor') {
      updatedValues.subjectLine = `${interviewDuration}_${interviewType}_${interviewViaMode}_${meetingType}_Interview_With_Vendor_${vendorCompany}`;
    } else if (interviewWith === 'IMP/PV') {
      updatedValues.subjectLine = `${interviewDuration}_${interviewType}_${interviewViaMode}_${meetingType}_Interview_With_IMP/PV_${primeVendorCompany}`;
    } else if (interviewWith === 'Client') {
      updatedValues.subjectLine = `${interviewDuration}_${interviewType}_${interviewViaMode}_${meetingType}_Interview_With_Client_${clientName}`;
    }
    setValues(updatedValues);
  };

  async function handleSubmitForm(event: any) {
    event.preventDefault();
    const newErrors: any = {};
    if (!values.interviewDate) newErrors.interviewDate = 'Date is required';
    if (!values.interviewTime) newErrors.interviewTime = 'Time is required';
    if (!values.interviewType) newErrors.interviewType = 'Type is required';
    if (!values.interviewWith)
      newErrors.interviewWith = 'Interview with is required';
    if (!values.interviewViaMode)
      newErrors.interviewViaMode = 'Mode is required';
    if (!values.interviewDuration)
      newErrors.interviewDuration = 'Duration is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await createInterview(values);
      if (res.status === 200) setDrawerOpen(false);
      console.log('rsponse 200', res);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    }
    console.log('Interview Form submitted successfully', values);
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();
    console.log('Edit submit button clicked');
    try {
      const res = await updateInterview(values._id, values);
      if (res.status === 200) {
        setDrawerOpen(false);
        console.log('Interview updated successfully', res.data);
      }
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    }
  }

  async function handleDeleteInterview(_id: any) {
    // console.log('Delete button clicked');
    try {
      const response = await deleteInterview(values._id);
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

  function handleChange(event: any, key: string) {
    setErrors(initialValues);
    setValues((prev: any) => ({ ...prev, [key]: event.target.value }));
  }

  const handleClickOpenAlert = () => {
    setOpenAlert(true);
  };

  const handleClickCloseAlert = () => {
    setOpenAlert(false);
  };

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
                {'Delete Interview?'}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Are you sure you want to delete this Interview? This action
                  cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClickCloseAlert}>Disagree</Button>
                <Button onClick={handleDeleteInterview} autoFocus>
                  Agree
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Grid>

      <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
        {/* Section 1: Interview Details */}
        <Grid item xs={12}>
          <h4>1. Interview Details</h4>
        </Grid>
        <Grid
          item
          sx={{
            width: 190,
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Interview Date"
              value={values.interviewDate ? dayjs(values.interviewDate) : null}
              onChange={(newValue) => addValue('interviewDate', newValue)}
              renderInput={(params) => (
                <TextField
                  size="small"
                  {...params}
                  error={!!errors.interviewDate}
                  helperText={errors.interviewDate}
                  disabled={!isEditing}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <Grid
          item
          sx={{
            width: 190,
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
            },
          }}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label="Interview Time"
              value={
                values.interviewTime
                  ? dayjs(values.interviewTime, 'hh:mm:ss A')
                  : null
              }
              onChange={(newValue) => addValue('interviewTime', newValue)}
              renderInput={(params) => (
                <TextField
                  size="small"
                  {...params}
                  error={!!errors.interviewTime}
                  helperText={errors.interviewTime}
                  disabled={!isEditing}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <CustomSelectField
          label="Time Zone"
          valueOptions={timeZoneOptions}
          selectedValue={values.timeZone}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'timeZone')
          }
          width={180}
          disabled={!isEditing}
        />
        <CustomSelectField
          label="Interview Type"
          valueOptions={intTypeOptions}
          selectedValue={values.interviewType}
          error={errors.interviewType}
          helperText={errors.interviewType}
          disabled={!isEditing}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'interviewType')
          }
          width={180}
        />
        <CustomSelectField
          label="Interview Status"
          valueOptions={intStatusOptions}
          selectedValue={values.interviewStatus}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'interviewStatus')
          }
          width={180}
          disabled={!isEditing}
        />
        <CustomTextField
          label="Consultant"
          width={230}
          selectedValue={values.consultant}
          onChange={(event: any) => addValue('consultant', event.target.value)}
          disabled
        />
        <CustomTextField
          label="Marketing Person"
          width={230}
          selectedValue={values.marketingPerson}
          disabled
          onChange={(event: any) =>
            addValue('marketingPerson', event.target.value)
          }
        />
        <CustomTextField
          label="Vendor Company"
          width={230}
          selectedValue={values.vendorCompany}
          disabled
          onChange={(event: any) =>
            addValue('vendorCompany', event.target.value)
          }
        />
        <CustomTextField
          label="Prime Vendor Company"
          width={230}
          selectedValue={values.primeVendorCompany}
          disabled
          onChange={(event: any) =>
            addValue('primeVendorCompany', event.target.value)
          }
        />
        <CustomSelectField
          label="Interview With"
          valueOptions={intWithOptions}
          selectedValue={values.interviewWith}
          error={errors.interviewWith}
          helperText={errors.interviewWith}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'interviewWith')
          }
          width={230}
          disabled={!isEditing}
        />
        <CustomTextField
          label="Submitted Any Code(if Yes Enter the Link)"
          width={230}
          selectedValue={values.codeLink}
          disabled={!isEditing}
          onChange={(event: any) => addValue('codeLink', event.target.value)}
        />
        <CustomSelectField
          label="Result"
          valueOptions={resultOptions}
          selectedValue={values.intResult}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'intResult')
          }
          width={230}
          disabled={!isEditing}
        />
        <CustomSelectField
          label="Interview Round"
          valueOptions={intRoundOptions}
          selectedValue={values.interviewRound}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'interviewRound')
          }
          width={230}
          disabled={!isEditing}
        />
        <CustomTextField
          label="Tentative Reason (if Any)"
          width={230}
          selectedValue={values.tentativeReason}
          onChange={(event: any) =>
            addValue('tentativeReason', event.target.value)
          }
          disabled={!isEditing}
        />
        <CustomSelectField
          label="Interview via Mode"
          valueOptions={intModeOptions}
          selectedValue={values.interviewViaMode}
          error={errors.interviewViaMode}
          helperText={errors.interviewViaMode}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'interviewViaMode')
          }
          width={230}
          disabled={!isEditing}
        />
        <CustomSelectField
          label="Meeting type"
          valueOptions={meetingTypeOptions}
          selectedValue={values.meetingType}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'meetingType')
          }
          width={230}
          disabled={!isEditing}
        />
        <CustomSelectField
          label="Interview Duration"
          valueOptions={intDurationOptions}
          selectedValue={values.interviewDuration}
          error={errors.interviewDuration}
          helperText={errors.interviewDuration}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'interviewDuration')
          }
          width={230}
          disabled={!isEditing}
        />
        <CustomTextField
          label="Remarks/Comments (if negative / if on hold / If anything else? Why?)"
          multiline
          rows={2}
          width={970}
          selectedValue={values.remarks}
          disabled={!isEditing}
          onChange={(event: any) => addValue('remarks', event.target.value)}
        />

        <Grid item xs={12}>
          <h4>2. Details of Interview</h4>
        </Grid>
        <CustomTextField
          label="Subject line (Enter Duration + Mode Of Interview + Interview With only)"
          multiline
          disabled
          width={970}
          selectedValue={values.subjectLine}
          onChange={(event: any) => addValue('subjectLine', event.target.value)}
        />
        <CustomTextField
          label="Interview / interviewer / Interview Mode Details"
          multiline
          width={970}
          disabled={!isEditing}
          selectedValue={values.interviewMode}
          onChange={(event: any) =>
            addValue('interviewMode', event.target.value)
          }
        />
        <CustomTextField
          label="Interview Link"
          multiline
          width={970}
          disabled={!isEditing}
          selectedValue={values.interviewLink}
          onChange={(event: any) =>
            addValue('interviewLink', event.target.value)
          }
        />
        <CustomTextField
          label="Interview Focus"
          multiline
          width={970}
          disabled={!isEditing}
          selectedValue={values.interviewFocus}
          onChange={(event: any) =>
            addValue('interviewFocus', event.target.value)
          }
        />
        <CustomTextField
          label="Special Note"
          multiline
          width={970}
          disabled={!isEditing}
          selectedValue={values.specialNote}
          onChange={(event: any) => addValue('specialNote', event.target.value)}
        />
        <CustomTextField
          label="Job Description"
          multiline
          width={970}
          disabled
          selectedValue={values.jobDescription}
          onChange={(event: any) =>
            addValue('jobDescription', event.target.value)
          }
        />

        {/* Section 3: Interview Feedback */}
        <Grid item xs={12}>
          <h4>3. Interview Feedback</h4>
        </Grid>
        <CustomTextField
          label="Feedback"
          width={970}
          multiline
          disabled={!isEditing}
          selectedValue={values.interviewFeedback}
          onChange={(event: any) =>
            addValue('interviewFeedback', event.target.value)
          }
        />
        <CustomTextField
          label="Job Title"
          disabled
          width={320}
          selectedValue={values.jobTitle}
          onChange={(event: any) => addValue('jobTitle', event.target.value)}
        />
        <CustomTextField
          label="Req ID"
          disabled
          width={320}
          selectedValue={values.reqID}
          onChange={(event: any) => addValue('reqID', event.target.value)}
        />
        <CustomTextField
          label="Client Name"
          width={300}
          disabled
          selectedValue={values.clientName}
          onChange={(event: any) => addValue('clientName', event.target.value)}
        />
        <CustomTextField
          label="Tax Type"
          width={320}
          disabled
          selectedValue={values.taxType}
          onChange={(event: any) => addValue('taxType', event.target.value)}
        />
        <CustomTextField
          label="Duration"
          width={320}
          disabled
          selectedValue={values.duration}
          onChange={(event: any) => addValue('duration', event.target.value)}
        />

        {/* Section 4: Interviewee Candidate Details */}
        <Grid item xs={12}>
          <h4>4. Interviewee Candidate Details</h4>
        </Grid>
        <CustomTextField
          label="Candidate Name"
          width={310}
          disabled={!isEditing}
          selectedValue={values.candidateName}
          onChange={(event: any) =>
            addValue('candidateName', event.target.value)
          }
        />
        <CustomTextField
          label="Rates For Interview"
          width={310}
          disabled={!isEditing}
          selectedValue={values.rateForInterview}
          onChange={(event: any) =>
            addValue('rateForInterview', event.target.value)
          }
        />
        <CustomSelectField
          label="Payment Status"
          valueOptions={paymentStatusOptions}
          selectedValue={values.paymentStatus}
          disabled={!isEditing}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'paymentStatus')
          }
          width={310}
        />
      </Grid>
    </form>
  );
}
