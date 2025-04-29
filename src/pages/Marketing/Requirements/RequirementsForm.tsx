import {
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import CustomTextField from '../../../components/text_field/CustomTextField';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DownloadIcon from '@mui/icons-material/Download';
import {
  duration,
  gotRequirementForm,
  requirementFormInitialValues,
  requestStatusOptions,
  taxTypeOptions,
  techStack,
  requirementValidationMeta,
} from './requirementsValues';
import {
  createRequirement,
  deleteRequirement,
  updateRequirement,
} from '../../../services/requirementApi';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { convertValuesToEmptyString } from '../../../utils/utils';
import { SelectedFile } from '../../../components/profile/formFields/DocumentsField';
import { AttachFile } from '@mui/icons-material';
import { uploadFile } from '../../../services/storageApi';
import { toast } from 'react-toastify';
import AlertBox from '../../../components/alert/AlertBox';
import { useNavigate } from 'react-router-dom';
import { dateFormate, timeFormate } from '../../../components/constants';
import {
  isFieldValid,
  urlValidator,
  validateAllFields,
} from '../../../utils/validators';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { FormMode } from './Requirements';
import { iUser, UserRole } from '../../../Interfaces/iUser';
import { SetResults } from '../../../hooks/paginationHook';
import { createInterviewQueryParam } from '../Interviews/interviewValues';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';

interface iProps {
  viewData: any;
  isEditing?: boolean;
  hideButtons?: boolean;
  mode?: FormMode;
  accounts?: iUser[];
  consultants?: any[];
  reqToCopy?: any;
  disableCreateInterview?: boolean;
  disableCopyRequirement?: boolean;
  disableDelete?: boolean;
  onDrawerClose?: () => void;
  onEdit?: (editMode: boolean) => void;
  onCopy?: () => void;
  setResults?: SetResults;
}

export default function RequirementsForm(props: iProps) {
  const [values, setValues] = useState<any>(requirementFormInitialValues);
  const [file, setFile] = useState<File>();
  const [errors, setErrors] = useState<{ [key: string]: any }>(
    convertValuesToEmptyString(requirementFormInitialValues)
  );
  const [comment, setComment] = useState('');
  const user = useAuth().iUser!;
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [copyAlert, setCopyAlert] = useState(false);
  const {
    viewData,
    accounts,
    consultants,
    reqToCopy,
    isEditing = false,
    hideButtons = false,
    disableCopyRequirement,
    disableCreateInterview,
    disableDelete,
    mode = 'view',
    onEdit,
    onDrawerClose,
    onCopy: handleCopyRequirement,
    setResults,
  } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentFile =
    file ||
    (values?.resumeUpload && urlValidator(values?.resumeUpload)
      ? values.resumeUpload
      : '');
  const fileCardButtonDisabled = mode === 'view' || isSubmitting;
  const navigate = useNavigate();

  useHardKeySubmit(
    {
      onSubmit: (e) => {
        mode === 'add' && handleSubmitForm(e);
        mode === 'edit' && handleEditSubmitForm(e);
      },
    },
    [
      values,
      file,
      errors,
      reqToCopy,
      isEditing,
      hideButtons,
      mode,
      viewData,
      comment,
      accounts,
      consultants,
    ]
  );

  useEffect(() => {
    if (mode === 'view' || mode === 'edit') {
      setValues(viewData);
    } else if (mode === 'add') {
      setValues((pre: any) => ({
        ...pre,
        reqEnteredBy: `${user?.firstName} ${user?.lastName}`,
        reqEnteredByRef: `${user?.id}`,
      }));
    }
    setFile(undefined);
    setErrors(convertValuesToEmptyString(requirementFormInitialValues));
  }, [mode, viewData]);

  useEffect(() => {
    if (!reqToCopy) return;
    setValues({ ...reqToCopy });
    setErrors(convertValuesToEmptyString(requirementFormInitialValues));
  }, [reqToCopy]);

  function handleFileChange(e?: React.ChangeEvent<HTMLInputElement>) {
    e?.preventDefault();
    if (!e?.target.files?.length) return;
    const maxSize = 5 * (1024 * 1024);
    const file = e.target.files[0];
    if (file.size > maxSize) {
      setFile(undefined);
      setErrors((pre: any) => ({
        ...pre,
        resumeUpload: `File size should be less than ${(
          maxSize /
          (1024 * 1024)
        ).toFixed(2)} MB`,
      }));
      return;
    }

    setFile(file);
    setErrors((pre: any) => ({
      ...pre,
      resumeUpload: ``,
    }));
  }

  async function handleFileUpload(file: File) {
    try {
      const { data } = await uploadFile(file);
      setValues((pre: any) => ({ ...pre, resumeUpload: data.data.url }));
      setFile(undefined);
      setErrors((pre: any) => ({
        ...pre,
        resumeUpload: ``,
      }));
      return data.data.url;
    } catch (error) {
      console.log(error);
      toast.error('Failed to upload');
    }
  }
  const removeFile = () => {
    setFile(undefined);
    setValues((pre: any) => ({ ...pre, resumeUpload: '' }));
  };

  async function handleSubmitForm(event: any) {
    event.preventDefault();
    if (isSubmitting) return;

    const isValid = validateAllFields(
      requirementValidationMeta,
      values,
      setErrors
    );

    if (!isValid) return;

    const payload = { ...values };
    delete payload.mComment;

    if (comment.trim().length) {
      const commentsPayload = {
        username: `${user.firstName} ${user.lastName}`,
        date: new Date(),
        comment: comment,
      };
      payload.mComment = commentsPayload;
    }

    setIsSubmitting(true);

    try {
      if (file) {
        const url = await handleFileUpload(file);
        if (url) {
          payload.resumeUpload = url;
        }
      }
      const { data } = await createRequirement(payload);
      setResults?.((pre: any) => [data.data, ...pre]);
      onDrawerClose?.();
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
      requirementValidationMeta,
      values,
      setErrors as any
    );

    if (!isValid) return;
    const payload = { ...values };
    delete payload.mComment;
    if (comment.trim().length) {
      const commentPayload = {
        username: `${user.firstName} ${user.lastName}`,
        date: new Date(),
        comment: comment,
      };
      payload.mComment = commentPayload;
    }
    setIsSubmitting(true);
    try {
      if (file) {
        const url = await handleFileUpload(file);
        if (url) {
          payload.resumeUpload = url;
        }
      }
      const { data } = await updateRequirement(values._id, payload);
      setResults?.((pre: any) => {
        pre = pre.map((d: any) => {
          if (d._id === data.data._id) return data.data;
          return d;
        });
        return [...pre];
      });
      onDrawerClose?.(); // Close the drawer after successful update
    } catch (error) {
      console.log('An error occurred while updating the comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRequirement() {
    try {
      await deleteRequirement(values._id);
      setResults?.((pre: any) => [...pre].filter((p) => p._id !== values._id));
      onDrawerClose?.();
    } catch (error) {
      console.error('An error occurred while deleting the requirement:', error);
    }
  }

  const handleChange = (event: any, key: string) => {
    const val = event.target.value;
    addValue(key, val);
  };

  const addValue = (key: any, newValue: any) => {
    const meta = requirementValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) {
        setErrors((pre) => ({ ...pre, [key]: '' }));
      }
      if (meta.transform) {
        newValue = meta.transform(newValue);
      }
    }
    setValues((prevValues: any) => ({
      ...prevValues,
      [key]: newValue,
    }));
  };

  const handleEmail = (event: any, field: any) => {
    const value: string = event.target.value?.toLowerCase();
    addValue(field, value);
  };

  const onBlur = (key: string) => {
    const meta = requirementValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
  };

  function handlecreateInterview() {
    try {
      navigate(`/interviews?${createInterviewQueryParam}=${viewData.reqID}`);
    } catch (error) {
      toast.error('Failed to create interview');
      console.error('An error occurred while creating the interview:', error);
    }
  }

  if (!values)
    return (
      <Box className="loader" sx={{ py: 10 }}>
        <CircularProgress size={25} />
      </Box>
    );

  const appliedForField = (
    <>
      {mode === 'view' ? (
        <CustomTextField
          label="Applied For"
          width={230}
          disabled={!isEditing}
          selectedValue={values.appliedFor}
        />
      ) : (
        <CustomSelectField
          label="Applied For"
          valueOptions={consultants?.map((c: any) => c.consultantName) || []}
          disabled={!isEditing}
          selectedValue={values.appliedFor}
          onChange={(value: any) => {
            const _id = consultants?.find(
              (c: any) => c.consultantName === value
            );
            handleChange({ target: { value } }, 'appliedFor');
            handleChange({ target: { value: _id } }, 'appliedForRef');
          }}
          width={230}
        />
      )}
    </>
  );

  const AssignedToField = (
    <>
      {mode === 'view' ? (
        <CustomTextField
          label="Assigned To"
          width={230}
          disabled={!isEditing}
          selectedValue={values.assignedTo}
        />
      ) : (
        <CustomSelectField
          label="Assigned To"
          valueOptions={
            accounts?.map((a: any) => `${a.firstName} ${a.lastName}`) || []
          }
          selectedValue={values.assignedTo}
          disabled={!isEditing}
          onBlur={() => onBlur('assignedTo')}
          onChange={(value: any) => {
            handleChange({ target: { value } }, 'assignedTo');
            const id = accounts?.find(
              (a: any) => `${a.firstName} ${a.lastName}` === value
            )?._id;
            handleChange({ target: { value: id } }, 'assignedToRef');
          }}
          width={230}
          error={!!errors.assignedTo}
          helperText={errors.assignedTo}
        />
      )}
    </>
  );

  const GotReqFromField = (
    <>
      {mode === 'view' ? (
        <CustomTextField
          label="Got Requirement from"
          selectedValue={values.gotReqFrom || ''}
          width={230}
          disabled={!isEditing}
        />
      ) : (
        <CustomSelectField
          label="Got Requirement from"
          valueOptions={gotRequirementForm}
          selectedValue={values.gotReqFrom || ''}
          disabled={!isEditing}
          onChange={(value: any) =>
            handleChange({ target: { value } }, 'gotReqFrom')
          }
          width={315}
        />
      )}
    </>
  );

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
            {mode === 'edit' && <h4 style={{ margin: 0 }}>Resume</h4>}
            <Card
              variant="outlined"
              className="document-container"
              sx={{
                borderRadius: '10px',
                justifyContent: mode === 'view' ? 'space-between' : 'center',
                width: mode === 'view' ? '210px' : '275px',
                padding: 0,
              }}
            >
              {!!currentFile ? (
                mode === 'view' ? (
                  <>
                    <Stack
                      py={'6px'}
                      pl={2}
                      direction={'row'}
                      alignItems={'center'}
                    >
                      <img
                        src={`${getMaterialFileIcon(values.resumeUpload)}`}
                        alt="icon"
                        style={{
                          width: '17px',
                          height: '17px',
                        }}
                      />
                      <Typography variant={'subtitle2'} pl={'3px'}>
                        Resume
                      </Typography>
                    </Stack>
                    <Box pr={1}>
                      <IconButton
                        download
                        href={currentFile}
                        size="small"
                        sx={{ height: '30px' }}
                      >
                        <DownloadIcon
                          style={{ color: '#1976d2', width: '16px' }}
                        />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <SelectedFile
                    previewType="icon"
                    disabled={isSubmitting}
                    file={currentFile}
                    onClickDelete={removeFile}
                    onClickUpload={() => file && handleFileUpload(file)}
                  />
                )
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      columnGap: '5px',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    {mode === 'view' ? (
                      <Box p={1}>
                        <Typography variant={'subtitle2'}>
                          No resume uploaded
                        </Typography>
                      </Box>
                    ) : (
                      <Button
                        disabled={fileCardButtonDisabled}
                        variant="contained"
                        component="label"
                        startIcon={<AttachFile />}
                        size="small"
                        sx={{
                          m: '6px 0px',
                          borderRadius: '10px',
                          backgroundColor: '#1976d2',
                          '&:hover': { backgroundColor: '#1565c0' },
                        }}
                      >
                        Choose File
                        <input
                          type="file"
                          accept={'.doc,.docx'}
                          hidden
                          onChange={handleFileChange}
                        />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
            {!!errors.resumeUpload && (
              <p style={{ margin: 0, fontSize: 'small', color: 'red' }}>
                {errors.resumeUpload}
              </p>
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
              {mode === 'add' ? (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={handleSubmitForm}
                  size="small"
                  sx={{ borderRadius: '10px' }}
                  disabled={isSubmitting}
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
                    onClick={handleEditSubmitForm}
                    size="small"
                    sx={{ borderRadius: '10px' }}
                    disabled={isSubmitting}
                  >
                    Submit
                  </Button>
                </>
              ) : (
                <>
                  {!disableCreateInterview &&
                    viewData.reqStatus === 'Submitted' && (
                      <Button
                        variant="contained"
                        color="primary"
                        type="button"
                        onClick={handlecreateInterview}
                        size="small"
                        sx={{ borderRadius: '10px', width: 'max-content' }}
                        disabled={isSubmitting}
                      >
                        Create interview
                      </Button>
                    )}
                  {!disableCopyRequirement && (
                    <>
                      <AlertBox
                        open={copyAlert}
                        title="Copy Requirement"
                        description="Are you sure you want to copy this requirement ?"
                        onClose={() => setCopyAlert(false)}
                        onOk={() => handleCopyRequirement?.()}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        type="button"
                        onClick={() => setCopyAlert(true)}
                        size="small"
                        sx={{ borderRadius: '10px' }}
                      >
                        Copy
                      </Button>
                    </>
                  )}
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
                  {!disableDelete && user.role === UserRole['super-admin'] && (
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
                        title="Delete Requirement"
                        description="Are you sure you want to delete this requirement? This
                      action cannot be undone."
                        onClose={() => setDeleteAlert(false)}
                        onOk={() => handleDeleteRequirement()}
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
          {/* Section 1: Requirement & Communication */}
          <Grid item xs={12}>
            <h4>1. Requirement & Communication</h4>
          </Grid>
          <CustomSelectField
            label="Req Status"
            valueOptions={requestStatusOptions}
            selectedValue={values.reqStatus}
            disabled={!isEditing}
            onBlur={() => onBlur('reqStatus')}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'reqStatus')
            }
            width={230}
            error={!!errors.reqStatus}
            helperText={errors.reqStatus}
          />
          {AssignedToField}
          <CustomTextField
            label="Next Step"
            width={230}
            disabled={!isEditing}
            selectedValue={values.nextStep}
            onChange={(event: any) => addValue('nextStep', event.target.value)}
          />
          {appliedForField}
          <CustomTextField
            label={'Rate'}
            width={230}
            disabled={!isEditing}
            selectedValue={values.rate}
            onChange={(event: any) => addValue('rate', event.target.value)}
          />

          <CustomSelectField
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

          <CustomSelectField
            label={'Duration'}
            width={230}
            disabled={!isEditing}
            valueOptions={duration}
            selectedValue={values.duration}
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'duration')
            }
          />

          <Stack>
            {values?.mComment?.map((comment: any, i: number) => {
              const label = `${comment.username} . ${dayjs(comment.date).format(
                dateFormate + ' ' + timeFormate
              )}`;
              return (
                <CustomTextField
                  key={i}
                  label={label}
                  width={970}
                  disabled
                  selectedValue={comment.comment}
                />
              );
            })}
            {isEditing && mode !== 'view' && (
              <CustomTextField
                label={"Marketing Person's Comment"}
                width={970}
                selectedValue={comment}
                onChange={(event: any) => setComment(event.target.value)}
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
            onBlur={() => onBlur('clientEmail')}
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
            onBlur={() => onBlur('primeVendorEmail')}
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
            onBlur={() => onBlur('vendorCompany')}
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
            onBlur={() => onBlur('vendorPersonName')}
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
            onBlur={() => onBlur('vendorEmail')}
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
                inputFormat={dateFormate}
                label="Requirement Entered Date"
                value={values.createdAt}
                disabled
                onChange={() => ''}
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
                        backgroundColor: '#f0f0f0',
                      },
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: 'black',
                        backgroundColor: '#f0f0f0',
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>
          {GotReqFromField}
          <CustomSelectField
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
            disabled
            onChange={(event: any) => {
              handleChange(event, 'reqEnteredBy');
              const id = user?.id;
              handleChange({ target: { value: id } }, 'reqEnteredByRef');
            }}
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
            onBlur={() => onBlur('jobDescription')}
            onChange={(event: any) =>
              addValue('jobDescription', event.target.value)
            }
            error={!!errors.jobDescription}
            helperText={errors.jobDescription}
          />
        </Grid>
        {/* Section 6: Footer */}
        {mode === 'view' ? (
          <div
            style={{
              marginTop: '20px',
              justifyContent: 'space-between',
              display: 'flex',
              fontSize: '14px',
              borderTop: '1px solid #ccc',
            }}
          >
            <p>
              <span>Entered By:</span>
              <strong> {values.reqEnteredBy}</strong>
              <span> On Date:</span>
              <strong>
                {' '}
                {dayjs(values.createdAt).format(
                  dateFormate + ' ' + timeFormate
                )}
              </strong>
            </p>
            <p>
              <span>Last Updated By: </span>
              <strong>
                {values.mComment && values.mComment.length > 0
                  ? values.mComment[values.mComment.length - 1].username
                  : 'N/A'}
              </strong>
              <span> On Date:</span>
              <strong>
                {' '}
                {values.mComment && values.mComment.length > 0
                  ? dayjs(
                      values.mComment[values.mComment.length - 1].date
                    ).format(dateFormate + ' ' + timeFormate)
                  : 'N/A'}
              </strong>
            </p>
          </div>
        ) : null}
      </form>
    </>
  );
}
