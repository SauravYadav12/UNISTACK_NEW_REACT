import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
} from '@mui/material';
import examples from 'libphonenumber-js/examples.mobile.json';
import CustomTextField from '../../../components/text_field/CustomTextField';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { useEffect, useState } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  consultantStatusOptions,
  consultantValidationMeta,
  timeZoneOptions,
  visaStatusOptions,
} from './consultantValues';
import {
  createConsultant,
  deleteConsultant,
  updateConsultant,
} from '../../../services/consultantApi';
import { dateFormate } from '../../../components/constants';
import { isFieldValid, validateAllFields } from '../../../utils/validators';
import { convertValuesToEmptyString } from '../../../utils/utils';
import { MuiTelInput, MuiTelInputInfo } from 'mui-tel-input';
import { getExampleNumber } from 'libphonenumber-js';

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
  createdBy: '',
};

export default function ConsultantForm(props: any) {
  const [values, setValues] = useState<any>(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { viewData, mode, setDrawerOpen, isEditing, onEdit, setResults } =
    props;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [projects, setProjects] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: any }>(
    convertValuesToEmptyString(initialValues)
  );

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
          isCurrent: true,
        },
      ]);
    }
    setErrors(convertValuesToEmptyString(initialValues));
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
    const meta = consultantValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) {
        setErrors((pre) => ({ ...pre, [key]: '' }));
      }
      if (meta.transform) {
        newValue = meta.transform(newValue);
      }
    }

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
    addValue(key, event.target.value);
  }

  async function handleSubmitForm(event: any) {
    event.preventDefault();

    if (isSubmitting) return;

    const isValid = validateAllFields(
      consultantValidationMeta,
      values,
      setErrors
    );
    if (!isValid) return;

    setIsSubmitting(true);

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
      createdBy: user.firstName,
    };
    try {
      const { data } = await createConsultant(payload);
      setResults((pre: any) => [data.data, ...pre]);
      setDrawerOpen(false);
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();

    if (isSubmitting) return;
    const isValid = validateAllFields(
      consultantValidationMeta,
      values,
      setErrors
    );
    if (!isValid) return;
    setIsSubmitting(true);

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
      const { data } = await updateConsultant(values._id, payload);
      setResults((pre: any) => {
        pre = pre.map((d: any) => {
          if (d._id === data.data._id) return data.data;
          return d;
        });
        return [...pre];
      });
      setDrawerOpen(false);
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConsultant(_id: any) {
    try {
      await deleteConsultant(values._id);
      setResults((pre: any) => [...pre].filter((p) => p._id !== values._id));
      setDrawerOpen(false);
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

  const onBlur = (key: string) => {
    const meta = consultantValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
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
              onClick={() => {
                // setValues(viewData)
                onEdit(false);
              }}
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
          onBlur={() => onBlur('consultantStatus')}
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
          onBlur={() => onBlur('consultantName')}
        />
        <CustomSelectField
          onBlur={() => onBlur('visaStatus')}
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
              inputFormat={dateFormate}
              disabled={!isEditing}
              label="Date of Birth"
              value={values.dob ? dayjs(values.dob) : null}
              onChange={(newValue) => addValue('dob', newValue)}
              renderInput={(params) => (
                <TextField
                  onBlur={() => onBlur('dob')}
                  size="small"
                  {...params}
                  error={!!errors.dob}
                  helperText={errors.dob}
                  disabled={!isEditing}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: !isEditing ? '#f0f0f0' : 'transparent',
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
          onBlur={() => onBlur('currentAddress')}
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
          onChange={(event: any) =>
            addValue('email', event.target.value?.toLowerCase())
          }
          onBlur={() => onBlur('email')}
        />
        <PhoneField
          onBlur={() => onBlur('phone')}
          label="Phone"
          value={values.phone}
          errorText={errors.phone}
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
          onBlur={() => onBlur('dlNo')}
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
                  views={['month', 'year']}
                  // inputFormat={dateFormate}
                  disabled={!isEditing}
                  label="Project Start Date"
                  value={
                    project.projectStartDate
                      ? dayjs(project.projectStartDate)
                      : null
                  }
                  onChange={(newValue) => {
                    addValue('projectStartDate', newValue, index);
                    console.log(newValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      size="small"
                      {...params}
                      disabled={!isEditing}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          backgroundColor: !isEditing
                            ? '#f0f0f0'
                            : 'transparent',
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
            {(isEditing || project.isCurrent) && (
              <Grid sx={{ m: 1 }}>
                <FormControlLabel
                  sx={{ minWidth: 230 }}
                  // disabled={isSubmitting || !isEditing}
                  control={<Switch checked={!!project.isCurrent} />}
                  label={`Current project`}
                  onChange={() => {
                    if(isSubmitting || !isEditing)return
                    addValue('isCurrent', !project.isCurrent, index);
                    // addValue('projectEndDate', '', index);
                  }}
                />
              </Grid>
            )}
            {!project.isCurrent && (
              <Grid item>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    // inputFormat={dateFormate}
                    views={['month', 'year']}
                    disabled={!isEditing}
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
                            backgroundColor: !isEditing
                              ? '#f0f0f0'
                              : 'transparent',
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
            )}

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

function PhoneField({
  disabled,
  onChange,
  onBlur,
  label,
  value,
  errorText,
}: PhoneFieldProps) {
  const [maxPhoneLength, setMaxPhoneLength] = useState(15);
  const [muiTelInputInfo, setMuiTelInputInfo] = useState<MuiTelInputInfo>();

  const onPhoneChange = (value: string, info: MuiTelInputInfo) => {
    if (info.countryCode && info.countryCode !== muiTelInputInfo?.countryCode) {
      const exampleNumberLength = getExampleNumber(
        info.countryCode,
        examples
      )?.formatInternational().length;
      exampleNumberLength && setMaxPhoneLength(exampleNumberLength);
      setMuiTelInputInfo(info);
    }
    onChange({ target: { value } } as any);
  };
  return (
    <div>
      <Grid item sx={{ width: 230, m: 1 }}>
        <MuiTelInput
          disabled={disabled}
          inputProps={{ maxLength: maxPhoneLength }}
          defaultCountry={'US'}
          onChange={onPhoneChange}
          onBlur={() => onBlur && onBlur()}
          label={label}
          value={value}
          fullWidth
          error={!!errorText}
          helperText={errorText}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              backgroundColor: disabled ? '#f0f0f0' : 'transparent',
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: 'black',
              backgroundColor: '#f0f0f0',
            },
          }}
        />
      </Grid>
    </div>
  );
}

interface PhoneFieldProps {
  disabled: boolean;
  label: string;
  value: string;
  errorText: string;
  onChange: (e: any) => void;
  onBlur: () => void;
}
