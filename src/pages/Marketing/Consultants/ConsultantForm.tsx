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
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  consultantStatusOptions,
  timeZoneOptions,
  visaStatusOptions,
} from './consultantValues';
import {
  createConsultant,
  deleteConsultant,
  updateConsultant,
} from '../../../services/consultantApi';

const initialValues = {
  timeZone: '',
  consultantStatus: '',
  visaStatus: '',
  projects: '',
  dob: null,
  consultantName: '',
  currentAddress: '',
  previousAddress: '',
  email: '',
  phone: '',
  degree: '',
  university: '',
  yearPassing: '',
  ssn: '',
  dlNo: '',
  psuedoName: '',
  skypeId: '',
  getVisa: '',
  cameToUsYear: '',
  originCountry: '',
  lookingToChange: '',
  createdBy:''
};

export default function ConsultantForm(props: any) {
  const [values, setValues] = useState<any>(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const { viewData, mode, setDrawerOpen, isEditing, onEdit } = props;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [projects, setProjects] = useState<any[]>([]);
  const [errors, setErrors] = useState(initialValues);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    if (mode === 'view' && viewData) {
      setValues(viewData);
      setProjects(viewData.projects || []);
    } else if (mode === 'add') {
      setValues(initialValues);
      setProjects([
        {
          projectNumber: 1,
          projectName: '',
          projectCity: '',
          projectState: '',
          projectStartDate: null,
          projectEndtDate: null,
          projectDescription: '',
        },
      ]);
    }
  }, [viewData, mode]);

  const handleAddProject = () => {
    setProjects([
      ...projects,
      {
        projectNumber: projects.length + 1,
        projectName: '',
        projectCity: '',
        projectState: '',
        projectStartDate: '',
        projectEndDate: '',
        projectDescription: '',
      },
    ]);
  };

  const addValue = (key: any, newValue: any, index?: number) => {
    setErrors(initialValues);
    if (index !== undefined) {
      setProjects((prevProjects: any) => {
        const updatedProjects = [...prevProjects];
        updatedProjects[index] = {
          ...updatedProjects[index],
          [key]: newValue,
        };
        return updatedProjects;
      });
    } else {
      setValues((prevValues: any) => ({ ...prevValues, [key]: newValue }));
    }
  };

  function handleChange(event: any, key: string) {
    setErrors(initialValues);
    setValues((prev: any) => ({ ...prev, [key]: event.target.value }));
  }

  async function handleSubmitForm(event: any) {
    event.preventDefault();
    const newErrors: any = {};
    if (!values.consultantStatus)
      newErrors.consultantStatus = 'Consultant Status is required';
    if (!values.consultantName)
      newErrors.consultantName = 'Consultant Name is required';
    if (!values.visaStatus) newErrors.visaStatus = 'Visa Status is required';
    if (!values.dob) newErrors.dob = 'Date of Birth is required';
    if (!values.currentAddress)
      newErrors.currentAddress = 'Address is required';
    if (!values.phone) newErrors.phone = 'Phone Number is required';
    if (!values.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(values.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!values.dlNo) newErrors.dlNo = 'Driving License No is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const filteredProjects = projects.filter(
      (project) =>
        project.projectName ||
        project.projectCity ||
        project.projectState ||
        project.projectStartDate ||
        project.projectEndDate ||
        project.projectDescription
    );
    const payload = {
      ...values,
      projects: filteredProjects,
      createdBy: user.firstName
    };
    try {
      const res = await createConsultant(payload);
      console.log('Create consultant', res);
      setDrawerOpen(false);
      console.log('Consultant Form submitted successfully', payload);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    }
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();
    const filteredProjects = projects.filter(
      (project) =>
        project.projectName ||
        project.projectCity ||
        project.projectState ||
        project.projectStartDate ||
        project.projectEndDate ||
        project.projectDescription
    );

    const payload = {
      ...values,
      projects: filteredProjects,
    };
    try {
      const res = await updateConsultant(values._id, payload);
      if (res.status === 200) {
        setDrawerOpen(false);
        console.log('Consultant updated successfully', res.data);
      }
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    }
  }

  async function handleDeleteConsultant(_id: any) {
    try {
      const response = await deleteConsultant(values._id);
      if (response.status === 200) {
        console.log('Consultant  deleted successfully:', response.data);
        setDrawerOpen(false);
      } else {
        console.error('Failed to delete Consultant:', response);
      }
    } catch (error) {
      console.error('An error occurred while deleting the Consultant:', error);
    }
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
                {'Delete Consultant?'}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  Are you sure you want to delete this Consultant? This action
                  cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClickCloseAlert} autoFocus>
                  Disagree
                </Button>
                <Button onClick={handleDeleteConsultant} autoFocus>
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
          <h4>1. Consultant Info</h4>
        </Grid>
        <CustomSelectField
          label="Consultant Status"
          size="small"
          valueOptions={consultantStatusOptions}
          selectedValue={values.consultantStatus}
          error={!!errors.consultantStatus}
          helperText={errors.consultantStatus}
          disabled={!isEditing}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'consultantStatus')
          }
          width={230}
        />
        <CustomTextField
          label="Consultant Name"
          width={230}
          selectedValue={values.consultantName}
          error={!!errors.consultantName}
          helperText={errors.consultantName}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('consultantName', event.target.value)
          }
        />
        <CustomSelectField
          label="Visa Status"
          valueOptions={visaStatusOptions}
          selectedValue={values.visaStatus}
          error={!!errors.visaStatus}
          helperText={errors.visaStatus}
          disabled={!isEditing}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'visaStatus')
          }
          width={230}
        />
        <Grid item>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              value={values.dob ? dayjs(values.dob) : null}
              onChange={(newValue) => addValue('dob', newValue)}
              renderInput={(params) => (
                <TextField
                  size="small"
                  {...params}
                  error={!!errors.dob}
                  helperText={errors.dob}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'black',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '10px',
                    },
                    width: 230,
                    mr: 1,
                  }}
                />
              )}
            />
          </LocalizationProvider>
        </Grid>
        <CustomTextField
          label="Current Address"
          width={230}
          selectedValue={values.currentAddress}
          error={!!errors.currentAddress}
          helperText={errors.currentAddress}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('currentAddress', event.target.value)
          }
        />
        <CustomTextField
          label="Previous Address"
          width={230}
          selectedValue={values.previousAddress}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('previousAddress', event.target.value)
          }
        />
        <CustomTextField
          label="Email"
          width={230}
          selectedValue={values.email}
          error={errors.email}
          helperText={errors.email}
          disabled={!isEditing}
          onChange={(event: any) => addValue('email', event.target.value)}
        />
        <CustomTextField
          label="Phone"
          width={230}
          type="number"
          selectedValue={values.phone}
          error={!!errors.phone}
          helperText={errors.phone}
          disabled={!isEditing}
          onChange={(event: any) => addValue('phone', event.target.value)}
        />
        <CustomSelectField
          label="Consultant Timezone"
          valueOptions={timeZoneOptions}
          selectedValue={values.timeZone}
          disabled={!isEditing}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'timeZone')
          }
          width={230}
        />
        <CustomTextField
          label="Degree Name"
          width={230}
          selectedValue={values.degree}
          disabled={!isEditing}
          onChange={(event: any) => addValue('degree', event.target.value)}
        />
        <CustomTextField
          label="University"
          width={230}
          selectedValue={values.university}
          disabled={!isEditing}
          onChange={(event: any) => addValue('university', event.target.value)}
        />
        <CustomTextField
          label="Year of Passing"
          width={230}
          selectedValue={values.yearPassing}
          disabled={!isEditing}
          onChange={(event: any) => addValue('yearPassing', event.target.value)}
        />
        <CustomTextField
          label="SSN"
          width={230}
          selectedValue={values.ssn}
          disabled={!isEditing}
          onChange={(event: any) => addValue('ssn', event.target.value)}
        />
        <CustomTextField
          label="Driving License"
          width={230}
          selectedValue={values.dlNo}
          error={!!errors.dlNo}
          helperText={errors.dlNo}
          disabled={!isEditing}
          onChange={(event: any) => addValue('dlNo', event.target.value)}
        />
        <CustomTextField
          label="Psuedo Name Of Consultant"
          width={230}
          selectedValue={values.psuedoName}
          disabled={!isEditing}
          onChange={(event: any) => addValue('psuedoName', event.target.value)}
        />
        <CustomTextField
          label="Skype-Id"
          width={230}
          selectedValue={values.skypeId}
          disabled={!isEditing}
          onChange={(event: any) => addValue('skypeId', event.target.value)}
        />
        <CustomTextField
          label="How did you get the VISA?"
          width={230}
          selectedValue={values.getVisa}
          disabled={!isEditing}
          onChange={(event: any) => addValue('getVisa', event.target.value)}
        />
        <CustomTextField
          label="In which year you came to US?"
          width={230}
          selectedValue={values.cameToUsYear}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('cameToUsYear', event.target.value)
          }
        />
        <CustomTextField
          label="Basicly from which country?"
          width={230}
          selectedValue={values.originCountry}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('originCountry', event.target.value)
          }
        />
        <CustomTextField
          label="Why are you looking for the change?"
          width={230}
          selectedValue={values.lookingToChange}
          disabled={!isEditing}
          onChange={(event: any) =>
            addValue('lookingToChange', event.target.value)
          }
        />
        {/* Section 2: Resume Info */}
        <Grid item xs={12}>
          <h4>2. Resume Info</h4>
        </Grid>
        {projects.map((project, index) => (
          <Grid key={index} container spacing={1}>
            <Grid item xs={12}>
              <h4>{`PROJECT ${project.projectNumber}`}</h4>
            </Grid>
            <CustomTextField
              label="Project Name"
              width={230}
              selectedValue={project.projectName}
              disabled={!isEditing}
              onChange={(event: any) =>
                addValue('projectName', event.target.value, index)
              }
            />
            <CustomTextField
              label="Project City"
              width={230}
              selectedValue={project.projectCity}
              disabled={!isEditing}
              onChange={(event: any) =>
                addValue('projectCity', event.target.value, index)
              }
            />
            <CustomTextField
              label="Project State"
              width={230}
              selectedValue={project.projectState}
              disabled={!isEditing}
              onChange={(event: any) =>
                addValue('projectState', event.target.value, index)
              }
            />
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Project Start Date"
                  value={
                    project.projectStartDate
                      ? dayjs(project.projectStartDate)
                      : null
                  }
                  onChange={(newValue) =>
                    addValue('projectStartDate', newValue, index)
                  }
                  renderInput={(params) => (
                    <TextField
                      size="small"
                      {...params}
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        },
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: 'black',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '10px',
                        },
                        width: 230,
                        mr: 1,
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Project End Date"
                  value={
                    project.projectEndDate
                      ? dayjs(project.projectEndDate)
                      : null
                  }
                  onChange={(newValue) =>
                    addValue('projectEndDate', newValue, index)
                  }
                  renderInput={(params) => (
                    <TextField
                      size="small"
                      {...params}
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                        },
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: 'black',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '10px',
                        },
                        width: 230,
                        mr: 1,
                        mb: 1,
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <CustomTextField
              label="Project Description"
              multiline
              width={970}
              selectedValue={project.projectDescription}
              disabled={!isEditing}
              onChange={(event: any) =>
                addValue('projectDescription', event.target.value, index)
              }
            />
          </Grid>
        ))}

        {/* Button to add new project */}
        <Grid item xs={12} style={{ marginTop: '10px' }}>
          {isEditing && (
            <Button
              variant="contained"
              size="small"
              onClick={handleAddProject}
              sx={{ borderRadius: '10px' }}
            >
              Add New Project
            </Button>
          )}
        </Grid>
      </Grid>
    </form>
  );
}
