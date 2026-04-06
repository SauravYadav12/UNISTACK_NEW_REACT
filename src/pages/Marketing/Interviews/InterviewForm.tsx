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
  interviewFormInitialValues,
  interviewValidationMeta,
  intModeOptions,
  intRoundOptions,
  intStatusOptions,
  intTypeOptions,
  intWithOptions,
  meetingTypeOptions,
  resultOptions,
  timeZoneOptions,
} from './interviewValues';
import {
  createInterview,
  deleteInterview,
  updateInterview,
} from '../../../services/interviewApi';
import { dateFormate, timeFormate } from '../../../components/constants';
import ScriptModal from '../../../components/interview/ScriptModal';
import { isFieldValid, validateAllFields } from '../../../utils/validators';
import { convertValuesToEmptyString, downloadFile } from '../../../utils/utils';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { UserRole } from '../../../Interfaces/iUser';
import RequirementDrawer from '../../../components/requirement/RequirementDrawer';
import { SetResults } from '../../../hooks/paginationHook';
import { FormMode } from '../Requirements/Requirements';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { toast } from 'react-toastify';
import ScriptBox from './ScriptBox';
import { IInterview, IRequirement, ITeam } from '../../../Interfaces/types';

interface iProps {
  viewData?: IInterview;
  requirement?: IRequirement;
  teamsList: ITeam[];
  isEditing?: boolean;
  hideButtons?: boolean;
  mode?: FormMode;
  disableGenerateScript?: boolean;
  disableDelete?: boolean;
  archive?: boolean;
  onDrawerClose?: () => void;
  onCreate?: () => void;
  onEdit?: (editMode: boolean) => void;
  setResults?: SetResults;
}

export default function InterviewForm(props: iProps) {
  const {
    viewData,
    requirement,
    teamsList,
    mode = 'view',
    isEditing = false,
    hideButtons = false,
    disableGenerateScript,
    disableDelete,
    archive,
    onEdit,
    onDrawerClose,
    setResults,
    onCreate,
  } = props;
  const [values, setValues] = useState<Partial<IInterview>>(
    interviewFormInitialValues
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>(
    convertValuesToEmptyString(interviewFormInitialValues)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [scriptModal, setScriptModal] = useState(false);
  const [reqDrawer, setReqDrawer] = useState<string>();
  const user = useAuth().iUser;

  useHardKeySubmit(
    {
      onSubmit: (e) => {
        mode === 'add' && handleSubmitForm(e);
        mode === 'edit' && handleEditSubmitForm(e);
      },
    },
    [values, errors, isEditing, hideButtons, mode, viewData, requirement]
  );
  useEffect(() => {
    requirement && initializeValuesToCreateInterview(requirement);
  }, [requirement]);

  useEffect(() => {
    if (mode === 'view' || mode === 'edit') {
      setValues(viewData || {});
    }
    setErrors(convertValuesToEmptyString(interviewFormInitialValues));
  }, [mode, viewData]);

  function initializeValuesToCreateInterview(requirement: IRequirement) {
    if (!requirement) return;
    const {
      reqID,
      appliedFor,
      appliedForRef,
      clientCompany,
      duration,
      taxType,
      jobTitle,
      vendorCompany,
      primeVendorCompany,
      jobDescription,
    } = requirement;
    setValues((prevValues: Partial<IInterview>) => ({
      ...prevValues,
      consultant: appliedFor,
      consultantRef: appliedForRef,
      clientName: clientCompany,
      reqID,
      vendorCompany,
      primeVendorCompany,
      jobDescription,
      jobTitle,
      duration,
      taxType,
      interviewStatus: intStatusOptions[0] || '',
      marketingPerson: `${user?.firstName} ${user?.lastName}`,
      marketingPersonRef: user?.id,
    }));
  }

  const addValue = (key: keyof IInterview, newValue: unknown) => {
    const meta = interviewValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) {
        setErrors((pre) => ({ ...pre, [key]: '' }));
      }
      if (meta.transform) {
        newValue = meta.transform(newValue);
      }
    }

    setValues((pre) => {
      const updatedValues = { ...pre, [key]: newValue };

      const {
        interviewWith = '',
        interviewDuration = '',
        interviewType = '',
        interviewViaMode = '',
        meetingType = '',
        vendorCompany = '',
        primeVendorCompany = '',
        clientName = '',
      } = updatedValues;

      const subjectLine = (type: string) =>
        `${interviewDuration}_${interviewType}_${interviewViaMode}_${meetingType}_${type}`;

      if (interviewWith === 'Vendor') {
        updatedValues.subjectLine = subjectLine(
          `Interview_With_Vendor_${vendorCompany}`
        );
      } else if (interviewWith === 'IMP/PV') {
        updatedValues.subjectLine = subjectLine(
          `Interview_With_IMP/PV_${primeVendorCompany}`
        );
      } else if (interviewWith === 'Client') {
        updatedValues.subjectLine = subjectLine(
          `Interview_With_Client_${clientName}`
        );
      }

      return { ...updatedValues };
    });
  };

  async function handleSubmitForm(
    event: React.MouseEvent<HTMLButtonElement> | KeyboardEvent
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    const isValid = validateAllFields(
      interviewValidationMeta,
      values,
      setErrors
    );
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const { data } = await createInterview(values);
      setResults?.((pre) => [data.data, ...pre]);
      onCreate?.();
      onDrawerClose?.();
    } catch (error) {
      console.log('An error occurred while saving the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmitForm(
    event: React.MouseEvent<HTMLButtonElement> | KeyboardEvent
  ) {
    event.preventDefault();
    if (isSubmitting || !values._id) return;
    const isValid = validateAllFields(
      interviewValidationMeta,
      values,
      setErrors
    );
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const { data } = await updateInterview(values._id, values);
      setResults?.((pre) => {
        pre = pre.map((d) => {
          if (d._id === data.data?._id) return data.data;
          return d;
        });
        return [...pre];
      });
      onDrawerClose?.();
    } catch (error) {
      console.log('An error occurred while updating the form:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSaveScript = async (script: string) => {
    try {
      if (!values._id) {
        toast.error('Missing interview id');
        return;
      }

      const { data } = await updateInterview(values._id, { script });
      setValues({ ...values, script });
      setResults?.((pre) => {
        pre = pre.map((d) => {
          if (d._id === data.data?._id) return data.data;
          return d;
        });
        return [...pre];
      });
    } catch (error) {
      toast.error('Failed to save');
      console.log('An error occurred while updating script field:', error);
    }
  };

  async function handleDeleteInterview() {
    try {
      if (!values._id) {
        toast.error('Missing interview id');
        return;
      }
      await deleteInterview(values._id);
      setResults?.((pre) => [...pre].filter((p) => p._id !== values._id));
      onDrawerClose?.();
    } catch (error) {
      console.error('An error occurred while deleting the interview:', error);
    }
  }

  const handleClickOpenAlert = () => {
    setOpenAlert(true);
  };

  const handleClickCloseAlert = () => {
    setOpenAlert(false);
  };

  const onBlur = (key: keyof typeof values) => {
    const meta = interviewValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
  };

  if (!values)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress size={25} />
      </Box>
    );
  return (
    <>
      <form style={{ margin: '0 20px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap-reverse',
            rowGap: '20px',
          }}
        >
          <Box>
            {!!values?.script && mode === 'view' && (
              <ScriptBox scriptUrl={values.script} />
            )}
          </Box>

          {!hideButtons && (
            <Grid
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
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
                      setValues(viewData || {});
                      onEdit?.(false);
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
                    onClick={() => onEdit?.(true)}
                    size="small"
                    sx={{ borderRadius: '10px' }}
                  >
                    Edit
                  </Button>
                  {!disableGenerateScript &&
                    !['Interview Cancelled', 'Interview Tentative'].includes(
                      values.interviewStatus || ''
                    ) && (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          type="button"
                          onClick={() => setScriptModal(true)}
                          size="small"
                          sx={{ borderRadius: '10px' }}
                        >
                          {values.script
                            ? 'Re-generate scirpt'
                            : 'Generate script'}
                        </Button>
                      </>
                    )}
                  {!disableDelete && user?.role.includes(UserRole['super-admin']) && (
                    <>
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
                            Are you sure you want to delete this Interview? This
                            action cannot be undone.
                          </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                          <Button onClick={handleClickCloseAlert}>
                            Disagree
                          </Button>
                          <Button onClick={handleDeleteInterview} autoFocus>
                            Agree
                          </Button>
                        </DialogActions>
                      </Dialog>
                    </>
                  )}
                </>
              )}
            </Grid>
          )}
        </Box>
        <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
          {/* Section 1: Interview Details */}
          <Grid item xs={12}>
            <h4>1. Interview Details</h4>
          </Grid>
          <Grid>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                // onClose={() => onBlur('interviewDate')}
                inputFormat={dateFormate}
                disabled={!isEditing}
                label="Interview Date"
                value={
                  values.interviewDate ? dayjs(values.interviewDate) : null
                }
                onChange={(newValue) => addValue('interviewDate', newValue)}
                renderInput={(params) => (
                  <TextField
                    onBlur={() => onBlur('interviewDate')}
                    size="small"
                    {...params}
                    error={!!errors.interviewDate}
                    helperText={errors.interviewDate}
                    disabled={!isEditing}
                    sx={{
                      width: 230,
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
          </Grid>
          <Grid>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                onClose={() => onBlur('interviewTime')}
                disabled={!isEditing}
                inputFormat={timeFormate}
                label="Interview Time"
                value={
                  values.interviewTime
                    ? dayjs(values.interviewTime, timeFormate)
                    : null
                }
                onChange={(newValue) => addValue('interviewTime', newValue)}
                renderInput={(params) => (
                  <TextField
                    onBlur={() => onBlur('interviewTime')}
                    size="small"
                    {...params}
                    error={!!errors.interviewTime}
                    helperText={errors.interviewTime}
                    disabled={!isEditing}
                    sx={{
                      width: 230,
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
          </Grid>
          <CustomSelectField
            label="Time Zone"
            valueOptions={timeZoneOptions}
            selectedValue={values.timeZone || ''}
            onChange={(value) => addValue('timeZone', value)}
            width={230}
            disabled={!isEditing}
          />
          <CustomSelectField
            label="Interview Type"
            onBlur={() => onBlur('interviewType')}
            valueOptions={intTypeOptions}
            selectedValue={values.interviewType || ''}
            error={!!errors.interviewType}
            helperText={errors.interviewType}
            disabled={!isEditing}
            freeSolo
            onChange={(value) => addValue('interviewType', value)}
            width={230}
          />
          <CustomSelectField
            label="Interview Status"
            valueOptions={intStatusOptions}
            selectedValue={values.interviewStatus || ''}
            onChange={(value) => addValue('interviewStatus', value)}
            width={230}
            disabled={!isEditing}
          />
          <CustomTextField
            label="Consultant"
            width={230}
            selectedValue={values.consultant || ''}
            onChange={(event) => addValue('consultant', event.target.value)}
            disabled
          />
          <CustomTextField
            label="Marketing Person"
            width={230}
            selectedValue={values.marketingPerson || ''}
            disabled
            onChange={(event) =>
              addValue('marketingPerson', event.target.value)
            }
          />
          <CustomTextField
            label="Vendor Company"
            width={230}
            selectedValue={values.vendorCompany || ''}
            disabled
            onChange={(event) => addValue('vendorCompany', event.target.value)}
          />
          <CustomTextField
            label="Prime Vendor Company"
            width={230}
            selectedValue={values.primeVendorCompany || ''}
            disabled
            onChange={(event) =>
              addValue('primeVendorCompany', event.target.value)
            }
          />
          <CustomSelectField
            label="Interview With"
            onBlur={() => onBlur('interviewWith')}
            valueOptions={intWithOptions}
            selectedValue={values.interviewWith || ''}
            error={!!errors.interviewWith}
            helperText={errors.interviewWith}
            onChange={(value) => addValue('interviewWith', value)}
            width={230}
            freeSolo
            disabled={!isEditing}
          />
          <CustomTextField
            label="Submitted Any Code(if Yes Enter the Link)"
            width={230}
            selectedValue={values.codeLink || ''}
            disabled={!isEditing}
            onChange={(event) => addValue('codeLink', event.target.value)}
          />
          <CustomSelectField
            label="Result"
            valueOptions={resultOptions}
            selectedValue={values.intResult || ''}
            onChange={(value) => addValue('intResult', value)}
            width={230}
            disabled={!isEditing}
          />
          <CustomSelectField
            label="Interview Round"
            valueOptions={intRoundOptions}
            selectedValue={values.interviewRound || ''}
            onChange={(value) => addValue('interviewRound', value)}
            width={230}
            freeSolo
            disabled={!isEditing}
          />
          <CustomTextField
            label="Tentative Reason (if Any)"
            width={230}
            selectedValue={values.tentativeReason || ''}
            onChange={(event) =>
              addValue('tentativeReason', event.target.value)
            }
            disabled={!isEditing}
          />
          <CustomSelectField
            label="Interview via Mode"
            onBlur={() => onBlur('interviewViaMode')}
            valueOptions={intModeOptions}
            selectedValue={values.interviewViaMode || ''}
            error={!!errors.interviewViaMode}
            helperText={errors.interviewViaMode}
            onChange={(value) => addValue('interviewViaMode', value)}
            width={230}
            freeSolo
            disabled={!isEditing}
          />
          <CustomSelectField
            label="Meeting type"
            valueOptions={meetingTypeOptions}
            selectedValue={values.meetingType || ''}
            onChange={(value) => addValue('meetingType', value)}
            width={230}
            freeSolo
            disabled={!isEditing}
          />
          <CustomSelectField
            label="Interview Duration"
            onBlur={() => onBlur('interviewDuration')}
            valueOptions={intDurationOptions}
            selectedValue={values.interviewDuration || ''}
            error={!!errors.interviewDuration}
            helperText={errors.interviewDuration}
            onChange={(value) => addValue('interviewDuration', value)}
            width={230}
            freeSolo
            disabled={!isEditing}
          />
          <CustomTextField
            label="Remarks/Comments (if negative / if on hold / If anything else? Why?)"
            width={720}
            selectedValue={values.remarks || ''}
            disabled={!isEditing}
            onChange={(event) => addValue('remarks', event.target.value)}
          />

          <Grid item xs={12}>
            <h4>2. Details of Interview</h4>
          </Grid>
          <CustomTextField
            label="Subject line (Enter Duration + Mode Of Interview + Interview With only)"
            disabled
            width={970}
            selectedValue={values.subjectLine || ' '}
            onChange={(event) => addValue('subjectLine', event.target.value)}
          />
          <CustomTextField
            label="Interview / interviewer / Interview Mode Details"
            width={970}
            disabled={!isEditing}
            selectedValue={values.interviewMode || ''}
            onChange={(event) => addValue('interviewMode', event.target.value)}
          />
          <CustomTextField
            label="Interview Link"
            width={970}
            disabled={!isEditing}
            selectedValue={values.interviewLink || ''}
            onChange={(event) => addValue('interviewLink', event.target.value)}
          />
          <CustomTextField
            label="Interview Focus"
            width={970}
            disabled={!isEditing}
            selectedValue={values.interviewFocus || ''}
            onChange={(event) => addValue('interviewFocus', event.target.value)}
          />
          <CustomTextField
            label="Special Note"
            width={970}
            disabled={!isEditing}
            selectedValue={values.specialNote || ''}
            onChange={(event) => addValue('specialNote', event.target.value)}
          />
          <CustomTextField
            label="Job Description"
            width={970}
            disabled
            selectedValue={values.jobDescription || ''}
            onChange={(event) => addValue('jobDescription', event.target.value)}
          />

          {/* Section 3: Interview Feedback */}
          <Grid item xs={12}>
            <h4>3. Interview Feedback</h4>
          </Grid>
          <CustomTextField
            label="Feedback"
            width={970}
            disabled={!isEditing}
            selectedValue={values.interviewFeedback || ''}
            onChange={(event) =>
              addValue('interviewFeedback', event.target.value)
            }
          />
          <CustomTextField
            label="Job Title"
            disabled
            width={320}
            selectedValue={values.jobTitle || ''}
            onChange={(event) => addValue('jobTitle', event.target.value)}
          />

          <div>
            <Grid item sx={{ m: 1, width: 320, position: 'relative' }}>
              <MyButtonLayer onClick={() => setReqDrawer(values.reqID)} />
              <TextField
                label={'Req ID'}
                value={values.reqID || ''}
                disabled
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    backgroundColor: '#f0f0f0',
                    textDecoration: 'underline',
                    textUnderlineOffset: '4px',
                    color: '#1976d2',
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    fontSize: 'small',
                    fontWeight: 600,
                    WebkitTextFillColor: '#1976d2',
                    backgroundColor: '#f0f0f0',
                  },
                }}
                multiline={true}
              />
            </Grid>
          </div>

          <CustomTextField
            label="Client Name"
            width={300}
            disabled
            selectedValue={values.clientName || ''}
            onChange={(event) => addValue('clientName', event.target.value)}
          />
          <CustomTextField
            label="Tax Type"
            width={320}
            disabled
            selectedValue={values.taxType?.toString() || ''}
            onChange={(event) => addValue('taxType', event.target.value)}
          />
          <CustomTextField
            label="Duration"
            width={320}
            disabled
            selectedValue={values.duration?.toString() || ''}
            onChange={(event) => addValue('duration', event.target.value)}
          />

          {/* Section 4: Interviewee Candidate Details */}
          {user &&
            user.role.some(role => [UserRole.admin, UserRole['super-admin']].includes(role)) && (
              <>
                <Grid item xs={12}>
                  <h4>4. Interviewee Candidate Details</h4>
                </Grid>
                {isEditing ? (
                  <CustomSelectField
                    label="Team"
                    valueOptions={teamsList.map((c) => c.teamName || '')}
                    selectedValue={values.candidateName || ''}
                    onChange={(value) => {
                      const _id = teamsList?.find(
                        (c) => c.teamName === value
                      )?._id;
                      addValue('candidateName', value);
                      addValue('candidateRef', _id);
                      console.log({ _id });
                    }}
                    width={310}
                  />
                ) : (
                  <CustomTextField
                    label="Team"
                    width={310}
                    disabled={!isEditing}
                    selectedValue={values.candidateName || ''}
                    onChange={(event) =>
                      addValue('candidateName', event.target.value)
                    }
                  />
                )}
                <CustomTextField
                  label="Teck Stack"
                  width={310}
                  disabled={!isEditing}
                  selectedValue={values.teckStack || ''}
                  onChange={(event) =>
                    addValue('teckStack', event.target.value)
                  }
                />
                <CustomTextField
                  label="Developer Name"
                  selectedValue={values.developerName || ''}
                  disabled={!isEditing}
                  onChange={(event) =>
                    addValue('developerName', event.target.value)
                  }
                  width={310}
                />
              </>
            )}
        </Grid>
      </form>
      {scriptModal && viewData && (
        <ScriptModal
          interview={{ ...viewData, ...values }}
          open={scriptModal}
          onClose={() => setScriptModal(!scriptModal)}
          onSave={handleSaveScript}
        />
      )}

      {values.reqID && (
        <RequirementDrawer
          open={Boolean(reqDrawer)}
          onClose={() => setReqDrawer(undefined)}
          reqID={values.reqID}
          archive={archive}
          hideButtons={archive}
        />
      )}
    </>
  );
}

interface MyButtonLayer {
  onClick: () => void;
}
function MyButtonLayer({ onClick }: MyButtonLayer) {
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <span
        onClick={onClick}
        style={{
          height: '23px',
          background: 'transparent',
          width: '95%',
          zIndex: 1,
          cursor: 'pointer',
        }}
      ></span>
    </div>
  );
}
