import { Box, Button, Card, Grid, Stack, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import CustomTextField from '../../../components/text_field/CustomTextField';
import dayjs from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  appliedForOptions,
  duration,
  gotRequirementForm,
  requirementFormInitialValues,
  requestStatusOptions,
  taxTypeOptions,
  techStack,
} from './requirementsValues';
import {
  createRequirement,
  deleteRequirement,
  updateRequirement,
} from '../../../services/requirementApi';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { getIUser } from '../../../utils/utils';
import { SelectedFile } from '../../../components/profile/formFields/DocumentsField';
import { AttachFile } from '@mui/icons-material';
import { uploadFile } from '../../../services/storageApi';
import { toast } from 'react-toastify';
import AlertBox from '../../../components/alert/AlertBox';
import { useNavigate } from 'react-router-dom';
import { dateFormate, timeFormate } from '../../../components/constants';
import { urlValidator } from '../../../utils/validators';

export default function RequirementsForm(props: any) {
  const [values, setValues] = useState<any>(requirementFormInitialValues);
  const [file, setFile] = useState<File>();
  const [errors, setErrors] = useState(requirementFormInitialValues);
  const [comments, setComments] = useState<any>('');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [copyAlert, setCopyAlert] = useState(false);
  const { viewData, mode, setDrawerOpen, isEditing, onEdit, onCopy,hideButtons = false,accounts } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentFile = file || urlValidator(values.resumeUpload)?values.resumeUpload:'';
  const fileCardButtonDisabled = mode === 'view' || isSubmitting;
  const navigate = useNavigate();


  useEffect(() => {
    setValues(viewData);
    mode === 'add' &&
      setValues((pre: any) => ({
        ...pre,
        reqEnteredBy: `${getIUser()?.firstName} ${getIUser()?.lastName}`,
        reqEnteredByRef: `${getIUser()?.id}`,
      }));
  }, []);

  useEffect(() => {
    setFile(undefined);
  }, [mode]);

  const handleCopyRequirement = () => {
    onCopy();
    const copy = {
      ...values,
      reqEnteredBy: `${getIUser()?.firstName} ${getIUser()?.lastName}`,
      reqEnteredByRef: `${getIUser()?.id}`,
      isDuplicate: true,
      duplicateWith: values.reqID,
      rate: '',
      taxType: '',
      remote: '',
      duration: '',
      mComment: [],
      resumeUpload: '',
    };
    delete copy.createdAt;
    delete copy.reqID;
    delete copy._id;
    delete copy.__v;
    setValues({ ...copy });
    setErrors(requirementFormInitialValues);
  };

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
    setIsSubmitting(true);
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
      setIsSubmitting(false);
      return; // Stop the form submission
    }
    const commentsPayload = {
      username: `${user.firstName} ${user.lastName}`,
      date: new Date(),
      comment: comments,
    };
    values.mComment = values.mComment
      ? [...values.mComment, commentsPayload]
      : [commentsPayload];

    if (file) {
      const url = await handleFileUpload(file);
      if (url) {
        values.resumeUpload = url;
      }
    }

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
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmitForm(event: any) {
    event.preventDefault();
    if (!comments.trim()) {
      toast.warning('Comment is required');
      return;
    }
    const commentsPayload = {
      username: `${user.firstName} ${user.lastName}`,
      date: new Date(),
      comment: comments,
    };
    const updatedComments = values.mComment
      ? [...values.mComment, commentsPayload]
      : [commentsPayload];

    try {
      const payload = { ...values, mComment: updatedComments };
      if (file) {
        const url = await handleFileUpload(file);
        if (url) {
          payload.resumeUpload = url;
        }
      }
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

  async function handleDeleteRequirement() {
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

  const handleChange = (event: any, key: string) => {
    setErrors(requirementFormInitialValues);
    setValues((prev: any) => ({ ...prev, [key]: event.target.value }));
  };

  const addValue = (key: any, newValue: any) => {
    setErrors(requirementFormInitialValues);
    if (key === 'createdAt') {
      const formattedDate = newValue
        ? dayjs(newValue).format(dateFormate)
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
  const reqFields = () => {
    const val = viewData;
    const record = {
      id: val.reqID,
      name: val.clientPerson,
      company: val.vendorCompany,
      title: val.jobTitle,
      primeVendorCompany: val.primeVendorCompany,
      jobDescription: val.jobDescription,
      jobTitle: val.jobTitle,
      taxType: val.taxType,
      duration: val.duration,
      consultant: val.appliedFor,
    };
    return record;
  };
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
            <h4 style={{ margin: 0 }}>Resume for</h4>
            <Card
              variant="outlined"
              className="document-container"
              sx={{
                borderRadius: '10px',
                justifyContent: 'center',
                width: '275px',
              }}
            >
              {!!currentFile ? (
                <SelectedFile
                  disabled={isSubmitting}
                  hideDeleteIcon={mode === 'view'}
                  file={currentFile}
                  onClickDelete={removeFile}
                  onClickUpload={() => file && handleFileUpload(file)}
                />
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      columnGap: '5px',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      disabled={fileCardButtonDisabled}
                      variant="contained"
                      component="label"
                      startIcon={<AttachFile />}
                      size="small"
                      sx={{
                        borderRadius: '10px',
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' },
                      }}
                    >
                      {mode === 'view' ? 'Not found' : 'Choose File'}
                      <input
                        type="file"
                        accept={'.pdf'}
                        hidden
                        onChange={handleFileChange}
                      />
                    </Button>
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

       {!hideButtons &&   <Grid
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
                {viewData.reqStatus === 'Submitted' && (
                  <Button
                    variant="contained"
                    color="primary"
                    type="button"
                    onClick={() =>
                      navigate(
                        `/interviews?createInterviewByReq=${JSON.stringify(
                          reqFields()
                        )}`
                      )
                    }
                    size="small"
                    sx={{ borderRadius: '10px', width: 'max-content' }}
                  >
                    Create interview
                  </Button>
                )}
                <AlertBox
                  open={copyAlert}
                  title="Copy Requirement"
                  description="Are you sure you want to copy this requirement ?"
                  onClose={() => setCopyAlert(false)}
                  onOk={handleCopyRequirement}
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
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      type="button"
                      size="small"
                      sx={{ borderRadius: '10px' }}
                      onClick={() => setDeleteAlert(true)}
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
          </Grid>}
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
            onChange={(value: any) =>
              handleChange({ target: { value } }, 'reqStatus')
            }
            width={230}
            error={!!errors.reqStatus}
            helperText={errors.reqStatus}
          />
          <CustomSelectField
            label="Assigned To"
            valueOptions={
              accounts?.map((a:any) => `${a.firstName} ${a.lastName}`) || []
            }
            selectedValue={values.assignedTo}
            disabled={!isEditing}
            onChange={(value: any) => {
              handleChange({ target: { value } }, 'assignedTo');
              const id = accounts?.find(
                (a:any) => `${a.firstName} ${a.lastName}` === value
              )._id;
              handleChange({ target: { value: id } }, 'assignedToRef');
            }}
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
          <CustomSelectField
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
            {values?.mComment?.filter((comment: any) => comment.comment?.trim())
              .length
              ? values?.mComment
                  ?.filter((comment: any) => comment.comment.trim())
                  .map((comment: any, i: number) => {
                    return (
                      <CustomTextField
                        key={i}
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
                inputFormat={dateFormate}
                label="Requirement Entered Date"
                value={values.createdAt}
                disabled
                onChange={(newValue) => addValue('createdAt', newValue)} // Handle date change
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

          <CustomSelectField
            label="Requirement Entered By"
            valueOptions={
              accounts?.map((a:any) => `${a.firstName} ${a.lastName}`) || []
            }
            selectedValue={values.reqEnteredBy}
            disabled
            width={315}
            onChange={(value: any) => {
              handleChange({ target: { value } }, 'reqEnteredBy');
              const id = accounts?.find(
                (a:any) => `${a.firstName} ${a.lastName}` === value
              )._id;
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
