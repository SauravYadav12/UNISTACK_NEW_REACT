import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CustomSelect from '../../../components/select/CustomSelectField';
import { useEffect, useState } from 'react';
import CustomTextField from '../../../components/text_field/CustomTextField';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  appliedForOptions,
  assignedToOptions,
  gotRequirementForm,
  requestStatusOptions,
  taxTypeOptions,
  techStack,
} from './requirementsValues';
import {
  createRequirement,
  deleteRequirement,
  updateRequirement,
} from '../../../services/requirementApi';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const initialValues = {
  reqStatus: '',
  assignedTo: '',
  appliedFor: '',
  reqForm: '',
  primaryTechStack: '',
  file: undefined,
  nextStep: '',
  taxType: '',
  rate: '',
  remote: '',
  duration: '',
  mComment: [],
  clientCompany: '',
  clientWebsite: '',
  clientAddress: '',
  clientPerson: '',
  clientPhone: '',
  clientEmail: '',
  primeVendorCompany: '',
  primeVendorWebsite: '',
  primeVendorName: '',
  primeVendorPhone: '',
  primeVendorEmail: '',
  vendorCompany: '',
  vendorWebsite: '',
  vendorPersonName: '',
  vendorPhone: '',
  vendorEmail: '',
  reqEnteredDate: dayjs().format('YYYY-MM-DD'),
  gotReqFrom: '',
  primaryTech: '',
  jobTitle: '',
  employmentType: '',
  jobPortalLink: '',
  reqEnteredBy: '',
  secondaryTech: '',
  jobDescription: '',
};

export default function RequirementsForm(props: any) {
  const [values, setValues] = useState<any>(initialValues);
  const [file, setFile]: any = useState(null);
  const [errors, setErrors] = useState(initialValues);
  const [comments, setComments] = useState<any>('');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [openAlert, setOpenAlert] = useState(false);
  const { viewData, mode, setDrawerOpen, isEditing, onEdit } = props;

  useEffect(() => {
    setValues(viewData);
  }, []);

  // console.log('values', values);
  function handleFileChange(event: any) {
    event.preventDefault();
    setFile(event.target.files[0]);
  }

  function handleUpload(event: any) {
    event.preventDefault();
    console.log('file is uploaded', file);
  }

  async function handleSubmitForm(event: any) {
    event.preventDefault();

    // console.log('mComment', comments);
    const newErrors: any = {};
    if (!values.reqStatus) newErrors.reqStatus = 'Req Status is required';
    if (!values.assignedTo) newErrors.assignedTo = 'Assigned To is required';
    if (!values.jobDescription)
      newErrors.jobDescription = 'Job Description is required';
    if (!values.vendorCompany)
      newErrors.vendorCompany = 'Vendor Company is required';
    if (!values.vendorPersonName)
      newErrors.vendorPersonName = 'Vendor Person Name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop the form submission
    }
    const commentsPayload = {
      username: user.firstName,
      date: new Date(),
      comment: comments,
    };
    values.mComment = values.mComment
      ? [...values.mComment, commentsPayload]
      : [commentsPayload];

    try {
      console.log('Form is submitted successfully', values);
      const res = await createRequirement(values);
      if (res.status === 200) {
        setDrawerOpen(false);
      } else {
        console.error('Form submission failed:', res);
      }
      console.log('POST', res);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    }
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();
    if (!comments.trim()) {
      return;
    }
    const commentsPayload = {
      username: user.firstName,
      date: new Date(),
      comment: comments,
    };
    const updatedComments = values.mComment
      ? [...values.mComment, commentsPayload]
      : [commentsPayload];

    try {
      const payload = { ...values, mComment: updatedComments };

      const response: any = await updateRequirement(values._id, payload);
      if (response.status === 200) {
        // console.log('Comment updated successfully:', response.data);
        setDrawerOpen(false); // Close the drawer after successful update
      } else {
        console.error('Failed to update the comment:', response);
      }
    } catch (error) {
      console.log('An error occurred while updating the comment:', error);
    }
  }

  async function handleDeleteRequirement(_id: any) {
    try {
      const response = await deleteRequirement(values._id);

      if (response.status === 200) {
        // console.log('Requirement deleted successfully:', response.data);
        setDrawerOpen(false);
      } else {
        console.error('Failed to delete requirement:', response);
      }
    } catch (error) {
      console.error('An error occurred while deleting the requirement:', error);
    }
  }

  const handleClickOpenAlert = () => {
    setOpenAlert(true);
  };

  const handleClickCloseAlert = () => {
    setOpenAlert(false);
  };

  const handleChange = (event: any, key: string) => {
    setErrors(initialValues);
    setValues((prev: any) => ({ ...prev, [key]: event.target.value }));
  };

  const addValue = (key: any, newValue: any) => {
    console.log('AddValues', newValue);
    if (key === 'reqEnteredDate') {
      const formattedDate = newValue
        ? dayjs(newValue).format('YYYY-MM-DD')
        : null;
      setValues((prevValues: any) => ({
        ...prevValues,
        [key]: formattedDate,
      }));
    } else
      setValues((prevValues: any) => ({
        ...prevValues,
        [key]: newValue,
      }));
  };

  const handleEmail = (event: any, field: any) => {
    const value = event.target.value;
    if (!emailRegex.test(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: 'Invalid email format',
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: null }));
      addValue(field, value);
    }
  };

  return (
    <>
      <Box sx={{ width: '100%', margin: '0 20px' }}>
        <Typography variant="h6">Choose File</Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              type="text"
              value={file ? file.name : 'No File Chosen'}
              size="small"
              disabled
              sx={{
                width: '230px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  height: '30px',
                },
              }}
            />
            <Button
              variant="contained"
              component="label"
              startIcon={<AttachFileIcon />}
              size="small"
              sx={{
                borderRadius: '10px',
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' },
              }}
            >
              Choose File
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            <Button
              onClick={handleUpload}
              color="success"
              variant="contained"
              size="small"
              disabled={!file}
              sx={{ borderRadius: '10px' }}
            >
              Upload
            </Button>
          </Box>
          <Grid
            sx={{
              display: 'flex',
              alignItems: 'center',
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
                  // onClick={handleDeleteRequirement}
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
                    {'Delete Requirement?'}
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      Are you sure you want to delete this requirement? This
                      action cannot be undone.
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClickCloseAlert}>Disagree</Button>
                    <Button onClick={handleDeleteRequirement} autoFocus>
                      Agree
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </Grid>
        </Box>
      </Box>
      <form style={{ margin: '0 20px' }}>
        <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
          {/* Section 1: Requirement & Communication */}
          <Grid item xs={12}>
            <h4>1. Requirement & Communication</h4>
          </Grid>
          <CustomSelect
            label="Req Status"
            valueOptions={requestStatusOptions}
            selectedValue={values.reqStatus}
            disabled={!isEditing}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'reqStatus')
            }
            width={230}
            error={!!errors.reqStatus}
            helperText={errors.reqStatus}
          />
          <CustomSelect
            label="Assigned To"
            valueOptions={assignedToOptions}
            selectedValue={values.assignedTo}
            disabled={!isEditing}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'assignedTo')
            }
            width={230}
            error={!!errors.assignedTo}
            helperText={errors.assignedTo}
          />
          <CustomTextField
            label="Next Step"
            width={230}
            disabled={!isEditing}
            selectedValue={values.nextStep}
            onChange={(event: any) => addValue('nextStep', event.target.value)}
          />
          <CustomSelect
            label="Applied For"
            valueOptions={appliedForOptions}
            disabled={!isEditing}
            selectedValue={values.appliedFor}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'appliedFor')
            }
            width={230}
          />

          <CustomTextField
            label={'Rate'}
            width={230}
            disabled={!isEditing}
            selectedValue={values.rate}
            onChange={(event: any) => addValue('rate', event.target.value)}
          />

          <CustomSelect
            label={'Tax Type'}
            width={230}
            disabled={!isEditing}
            valueOptions={taxTypeOptions}
            selectedValue={values.taxType}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'taxType')
            }
          />

          <CustomTextField
            label={'Remote %'}
            width={230}
            disabled={!isEditing}
            selectedValue={values.remote}
            onChange={(event: any) => addValue('remote', event.target.value)}
          />

          <CustomTextField
            label={'Duration'}
            width={230}
            disabled={!isEditing}
            selectedValue={values.duration}
            onChange={(event: any) => addValue('duration', event.target.value)}
          />

          <Stack>
            {values?.mComment?.filter((comment: any) => comment.comment?.trim())
              .length
              ? values?.mComment
                  ?.filter((comment: any) => comment.comment.trim())
                  .map((comment: any) => {
                    return (
                      <CustomTextField
                        label={"Marketing Person's Comment"}
                        width={970}
                        disabled={true}
                        selectedValue={comment.comment}
                      />
                    );
                  })
              : null}

            {isEditing && (
              <CustomTextField
                label={"Marketing Person's Comment"}
                width={970}
                disabled={!isEditing}
                selectedValue={comments}
                onChange={(event: any) => setComments(event.target.value)}
              />
            )}
          </Stack>
        </Grid>

        <Grid container spacing={2}>
          {/* Section 2: Client Info */}
          <Grid item xs={12}>
            <h4>2. Client Info</h4>
          </Grid>
          <CustomTextField
            label="Client Company"
            width={315}
            selectedValue={values.clientCompany}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('clientCompany', event.target.value)
            }
          />
          <CustomTextField
            label="Client Website"
            width={315}
            selectedValue={values.clientWebsite}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('clientWebsite', event.target.value)
            }
          />
          <CustomTextField
            label="Client Address"
            width={315}
            selectedValue={values.clientAddress}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('clientAddress', event.target.value)
            }
          />
          <CustomTextField
            label="Client Person Name"
            width={315}
            selectedValue={values.clientPerson}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('clientPerson', event.target.value)
            }
          />
          <CustomTextField
            label="Client Phone number"
            width={315}
            type="number"
            selectedValue={values.clientPhone}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('clientPhone', event.target.value)
            }
          />

          <CustomTextField
            label="Client Email"
            width={315}
            selectedValue={values.clientEmail}
            disabled={!isEditing}
            onChange={(event: any) => handleEmail(event, 'clientEmail')}
            helperText={errors.clientEmail}
            error={errors.clientEmail}
          />
        </Grid>

        <Grid container spacing={2}>
          {/* Section 3: Prime Vendor Info */}
          <Grid item xs={12}>
            <h4>3. Prime Vendor Info</h4>
          </Grid>
          <CustomTextField
            label="Prime Vendor Company"
            width={315}
            selectedValue={values.primeVendorCompany}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('primeVendorCompany', event.target.value)
            }
          />
          <CustomTextField
            label="Prime Vendor Website"
            width={315}
            selectedValue={values.primeVendorWebsite}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('primeVendorWebsite', event.target.value)
            }
          />
          <CustomTextField
            label="Prime Vendor Person Name"
            width={315}
            selectedValue={values.primeVendorName}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('primeVendorName', event.target.value)
            }
          />
          <CustomTextField
            label="Prime Vendor Phone number"
            width={315}
            type="number"
            selectedValue={values.primeVendorPhone}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('primeVendorPhone', event.target.value)
            }
          />

          <CustomTextField
            label="Prime Vendor Email"
            width={315}
            selectedValue={values.primeVendorEmail}
            disabled={!isEditing}
            onChange={(event: any) => handleEmail(event, 'primeVendorEmail')}
            helperText={errors.primeVendorEmail}
            error={errors.primeVendorEmail}
          />
        </Grid>

        <Grid container spacing={2}>
          {/* Section 4: Vendor Info */}
          <Grid item xs={12}>
            <h4>4. Vendor Info</h4>
          </Grid>
          <CustomTextField
            label="Vendor Company"
            width={315}
            selectedValue={values.vendorCompany}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('vendorCompany', event.target.value)
            }
            error={!!errors.vendorCompany}
            helperText={errors.vendorCompany}
          />
          <CustomTextField
            label="Vendor Website"
            width={315}
            selectedValue={values.vendorWebsite}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('vendorWebsite', event.target.value)
            }
          />
          <CustomTextField
            label="Vendor Person Name"
            width={315}
            selectedValue={values.vendorPersonName}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('vendorPersonName', event.target.value)
            }
            error={!!errors.vendorPersonName}
            helperText={errors.vendorPersonName}
          />
          <CustomTextField
            label="Vendor Phone number"
            width={315}
            selectedValue={values.vendorPhone}
            type="number"
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('vendorPhone', event.target.value)
            }
          />

          <CustomTextField
            label="Vendor Email"
            width={315}
            selectedValue={values.vendorEmail}
            disabled={!isEditing}
            onChange={(event: any) => handleEmail(event, 'vendorEmail')}
            helperText={errors.vendorEmail}
            error={errors.vendorEmail}
          />
        </Grid>

        <Grid container spacing={2}>
          {/* Section 5: Job Requirement Info */}
          <Grid item xs={12}>
            <h4>5. Job Requirement Info</h4>
          </Grid>
          <Grid>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Requirement Entered Date"
                value={values.reqEnteredDate}
                disabled
                onChange={(newValue) => addValue('reqEnteredDate', newValue)} // Handle date change
                renderInput={(params) => (
                  <TextField
                    size="small"
                    {...params}
                    sx={{
                      width: 315,
                      mt: 1,
                      ml: 1,
                      mr: 1,
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
          <CustomSelect
            label="Got Requirement from"
            valueOptions={gotRequirementForm}
            selectedValue={values.gotReqFrom || ''}
            disabled={!isEditing}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'gotReqFrom')
            }
            width={315}
          />
          <CustomSelect
            label="Primary Tech Stack"
            valueOptions={techStack}
            selectedValue={values.primaryTechStack}
            disabled={!isEditing}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'primaryTechStack')
            }
            width={315}
          />
          <CustomTextField
            label="Job Title"
            width={315}
            selectedValue={values.jobTitle}
            disabled={!isEditing}
            onChange={(event: any) => addValue('jobTitle', event.target.value)}
          />
          <CustomTextField
            label="Employement Type (If Mentioned)"
            width={315}
            selectedValue={values.employmentType}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('employmentType', event.target.value)
            }
          />
          <CustomTextField
            label="Job Portal Link"
            width={315}
            selectedValue={values.jobPortalLink}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('jobPortalLink', event.target.value)
            }
          />
          <CustomTextField
            label="Requirement Entered By"
            width={315}
            selectedValue={values.reqEnteredBy}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('reqEnteredBy', event.target.value)
            }
          />
          <CustomTextField
            label="Primary Tech Stack"
            width={315}
            selectedValue={values.primaryTech}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('primaryTech', event.target.value)
            }
          />
          <CustomTextField
            label="Secondary Tech Stack"
            width={315}
            selectedValue={values.secondaryTech}
            disabled={!isEditing}
            onChange={(event: any) =>
              addValue('secondaryTech', event.target.value)
            }
          />
          <CustomTextField
            label="Complete Job Description"
            multiline
            width={980}
            disabled={!isEditing}
            selectedValue={values.jobDescription}
            onChange={(event: any) =>
              addValue('jobDescription', event.target.value)
            }
            error={!!errors.jobDescription}
            helperText={errors.jobDescription}
          />
        </Grid>
      </form>
    </>
  );
}
