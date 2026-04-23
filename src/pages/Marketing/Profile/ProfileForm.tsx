import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  SelectChangeEvent,
  Switch,
  Typography,
  alpha,
} from '@mui/material';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { UserProfile } from '../../../Interfaces/profile';
import { toast } from 'react-toastify';
import {
  Android12Switch,
  DocumentSectionField,
  FormSections,
  SectionField,
} from './constants';
import {
  createUserProfile,
  updateProfile,
} from '../../../services/userProfileApi';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import AddressField from '../../../components/profile/formFields/addressField/AddressField';
import RenderFields from '../../../components/profile/formFields/RenderFields';
import DocumentsField from '../../../components/profile/formFields/DocumentsField';
import { uploadFile } from '../../../services/storageApi';
import { convertValuesToEmptyString } from '../../../utils/utils';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { tokens } from '../../../theme/theme';

const ProfileForm = ({
  viewMode,
  template,
  profileFormSections,
  documentFormSection,
  documentSectionHeader,
  onClickEdit,
  onClickCancel,
  onSubmitSuccessfully,
}: MyProps) => {
  // Read the logged-in user so first-time profile creation (no `_id` on
  // the template) can stamp the profile with a `user` ownership ref.
  const { iUser } = useAuth();
  const [myProfile, setMyProfile] = useState<UserProfile>(template);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState(
    convertValuesToEmptyString(
      template as unknown as { [key: string]: unknown }
    ) as unknown as UserProfile
  );
  const [selectedBlobFiles, setSelectedBlobFiles] = React.useState<
    SelectedBlobFiles[]
  >([]);
  const primaryAddress: AddressTypes = 'permanentAddress';
  const secondryAddress: AddressTypes = 'communicationAddress';
  const [isBothAddressSame, setIsBothAddressSame] = useState<boolean>(false);

  const handleMyDocumentUpload = async (
    field: DocumentSectionField,
    file?: File
  ) => {
    if (!file) return;
    try {
      const { data } = await uploadFile(file);
      onChangeProfileValues(undefined, field, {
        target: { value: data.data.url },
      } as ChangeEvent<HTMLInputElement>);
      setSelectedBlobFiles((pre) =>
        pre.filter((f) => f.field.fieldName !== field.fieldName)
      );
      return { field, value: data.data.url };
    } catch (error) {
      toast.error('Failed to upload');
      console.log(error);
    }
  };

  const uploadUnsavedFiles = async () => {
    const promise = [...selectedBlobFiles].map((f) =>
      handleMyDocumentUpload(f.field, f.value)
    );
    return await Promise.all(promise);
  };

  const submitForm = async () => {
    if (isFormSubmitting) return;
    if (!validateForm()) {
      toast.error('Invalid submission');
      return;
    }
    setIsFormSubmitting(true);
    const payload = { ...myProfile };
    if (selectedBlobFiles.length) {
      const res = await uploadUnsavedFiles();
      for (const element of res) {
        if (!element) continue;
        payload[element.field.fieldName] = element.value;
      }
    }
    try {
      // Branch on `_id`: update an existing profile, or create one the
      // first time the user hits Save. Super-admin / newly-created
      // accounts often land on this form with no profile doc yet — an
      // update to /user-profiles/ (empty id) 404s, so create instead.
      const hasProfileId = !!myProfile._id;
      const createBody: Partial<UserProfile> = {
        ...payload,
        // If the template didn't carry a `user` (common when the admin
        // opens a never-profiled user), fall back to the logged-in
        // user's id so the profile is at least self-owned. Prevents
        // orphan docs.
        user: payload.user || iUser?._id || '',
      };
      const { data } = hasProfileId
        ? await updateProfile(myProfile._id, payload)
        : await createUserProfile(createBody);
      if (data.error || !data.data) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      onSubmitSuccessfully(data.data);
    } catch (error) {
      const { codeName, keyPattern, keyValue } =
        (error as any)?.response?.data?.error || {};
      if (codeName === 'DuplicateKey' && keyPattern?.employeeId) {
        toast.error(
          `Employee Id ${keyValue?.employeeId} already Associated with another profile`
        );
      } else {
        toast.error('Something went wrong');
      }
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const validateField = (
    field: SectionField,
    parentFieldName?: keyof UserProfile,
    value?: string,
    applyErrors: boolean = true
  ) => {
    let isValueValid = true;
    let message: string = '';
    const { fieldName, inputAttributes, customValidation } = field;
    let { label } = field;
    parentFieldName = field.parentFieldName || parentFieldName;
    label = label || fieldName;
    label = label[0].toUpperCase() + label.slice(1);
    const setMessage = (val: string) => {
      if (
        (inputAttributes?.required && !val) ||
        (val && customValidation && !customValidation(val))
      ) {
        message =
          field.fieldType === 'file'
            ? `Please upload ${label}`
            : `${label} is not valid`;
        isValueValid = false;
      } else {
        message = '';
      }
    };
    if (parentFieldName) {
      const val = value || (myProfile as any)[parentFieldName][fieldName];
      setMessage(val);
      applyErrors &&
        setFormErrors((pre) => ({
          ...pre,
          [parentFieldName]: {
            ...(pre as any)[parentFieldName],
            [fieldName]: message,
          },
        }));
    } else {
      const val = value || (myProfile as any)[fieldName];
      setMessage(val);
      applyErrors &&
        setFormErrors((pre) => ({ ...pre, [fieldName]: message }));
    }
    return isValueValid;
  };

  const validateForm = () => {
    let isAllValuesValid = true;
    profileFormSections.map((section) => {
      section.sectionFields.forEach((f) => {
        if (!validateField(f, section.parentFieldName)) {
          isAllValuesValid = false;
        }
      });
    });
    documentFormSection.map((field) => {
      if (!validateField(field)) isAllValuesValid = false;
      if (field.associatedField && !validateField(field.associatedField))
        isAllValuesValid = false;
    });
    return isAllValuesValid;
  };

  const onBlurFields = (
    field: SectionField,
    parentFieldName?: keyof UserProfile
  ) => {
    validateField(field, parentFieldName);
  };

  const onChangeProfileValues = (
    parentFieldName: keyof UserProfile | undefined,
    field: SectionField,
    e: ChangeEvent<HTMLInputElement> | SelectChangeEvent
  ) => {
    setMyProfile((profile) => {
      if (parentFieldName) {
        (profile as any)[parentFieldName][field.fieldName] = e.target.value;
        return {
          ...profile,
          [parentFieldName]: {
            ...(profile as any)[parentFieldName],
            [field.fieldName]: e.target.value,
          },
        };
      }
      return { ...profile, [field.fieldName]: e.target.value };
    });
    const errorMessage = parentFieldName
      ? (formErrors as any)[parentFieldName][field.fieldName]
      : (formErrors as any)[field.fieldName];
    if (
      !!errorMessage &&
      validateField(field, parentFieldName, e.target.value, false)
    ) {
      validateField(field, parentFieldName, e.target.value);
    }
  };

  const handleChangeBlobFile = (field: DocumentSectionField, file?: File) => {
    setSelectedBlobFiles((pre) => {
      pre = pre.filter((pf) => pf.field.fieldName !== field.fieldName);
      return [...pre, { field, value: file }];
    });
  };

  const applySameAddress = () => {
    const address = myProfile[primaryAddress];
    setMyProfile((pre) => ({ ...pre, [secondryAddress]: { ...address } }));
  };

  const handleSameAddressCheckBox = () => {
    setIsBothAddressSame((pre) => {
      if (!pre) applySameAddress();
      return !pre;
    });
  };

  useHardKeySubmit(
    { onSubmit: () => { submitForm(); } },
    [myProfile, formErrors, isFormSubmitting, selectedBlobFiles, isBothAddressSame, viewMode, template]
  );

  useEffect(() => {
    const templateCopy: UserProfile = { ...template };
    if (!viewMode) {
      templateCopy.permanentAddress.country = templateCopy.permanentAddress.country || 'IN';
      templateCopy.communicationAddress.country = templateCopy.communicationAddress.country || 'IN';
    }
    setMyProfile(templateCopy);
  }, [template]);

  useEffect(() => {
    if (isBothAddressSame) applySameAddress();
  }, [myProfile[primaryAddress], isBothAddressSame]);

  return (
    !!myProfile && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          validateForm() && submitForm();
        }}
      >
        {/* Form sections */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {profileFormSections.map((section, i) => {
            const { sectionTitle, sectionFields, parentFieldName } = section;
            const isAddress =
              parentFieldName === 'permanentAddress' ||
              parentFieldName === 'communicationAddress';

            return (
              <Box
                key={i}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  overflow: 'hidden',
                }}
              >
                {/* Section header */}
                <Box
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    bgcolor: '#F6F9FC',
                    borderBottom: '1px solid',
                    borderColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Chip
                    label={i + 1}
                    size="small"
                    sx={{
                      bgcolor: '#032840',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 24,
                      minWidth: 24,
                    }}
                  />
                  <Typography variant="body1" fontWeight={600} color="#2A3547">
                    {sectionTitle}
                  </Typography>
                  {isAddress && isBothAddressSame && parentFieldName !== primaryAddress && (
                    <Chip
                      label={`Same as ${primaryAddress.split('Address')[0]} address`}
                      size="small"
                      sx={{
                        bgcolor: alpha('#10B981', 0.1),
                        color: '#10B981',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 22,
                      }}
                    />
                  )}
                </Box>

                {/* Section fields */}
                <Box sx={{ p: 2.5 }}>
                  {isAddress ? (
                    <>
                      <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
                        <AddressField
                          formErrors={formErrors}
                          disabled={
                            (parentFieldName !== primaryAddress && isBothAddressSame) ||
                            isFormSubmitting ||
                            !!viewMode
                          }
                          parentFieldName={parentFieldName}
                          myProfile={myProfile}
                          sectionFields={sectionFields}
                          onChangeProfileValues={onChangeProfileValues}
                          setMyProfile={setMyProfile}
                        />
                      </Grid>
                      {!viewMode && parentFieldName !== primaryAddress && (
                        <FormControlLabel
                          disabled={isFormSubmitting}
                          control={<Android12Switch checked={isBothAddressSame} />}
                          label={
                            <Typography variant="body2" color="text.secondary">
                              Same as {primaryAddress.split('Address')[0]} address
                            </Typography>
                          }
                          onChange={() => handleSameAddressCheckBox()}
                          sx={{ mt: 1.5 }}
                        />
                      )}
                    </>
                  ) : (
                    <Grid container spacing={2} sx={{ maxWidth: '100%' }}>
                      {sectionFields.map((field, j) => (
                        <RenderFields
                          formError={formErrors}
                          disabled={isFormSubmitting || !!viewMode}
                          key={j}
                          parentFieldName={parentFieldName || field.parentFieldName}
                          field={field}
                          setMyProfile={setMyProfile}
                          myProfile={myProfile}
                          onChange={(e) =>
                            onChangeProfileValues(
                              parentFieldName || field.parentFieldName,
                              field,
                              e
                            )
                          }
                          onBlur={() => onBlurFields(field, section.parentFieldName)}
                        />
                      ))}
                    </Grid>
                  )}
                </Box>
              </Box>
            );
          })}

          {/* Documents section */}
          {documentFormSection.length > 0 && (
            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.5,
                  bgcolor: '#F6F9FC',
                  borderBottom: '1px solid',
                  borderColor: 'grey.200',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Chip
                  label={profileFormSections.length + 1}
                  size="small"
                  sx={{
                    bgcolor: '#032840',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 24,
                    minWidth: 24,
                  }}
                />
                <Typography variant="body1" fontWeight={600} color="#2A3547">
                  {documentSectionHeader || 'Documents'}
                </Typography>
              </Box>

              <Box sx={{ p: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {documentFormSection.map((field, i) => {
                  const selectedFile = selectedBlobFiles.find(
                    (f) => f.field.fieldName === field.fieldName
                  );
                  return (
                    <DocumentsField
                      viewMode={viewMode}
                      disabled={isFormSubmitting || !!viewMode}
                      selectedFile={selectedFile?.value}
                      setSelectedFile={(f) => handleChangeBlobFile(field, f)}
                      onUpload={(f) => handleMyDocumentUpload(field, f)}
                      key={i}
                      field={field}
                      onChange={(f, e) => onChangeProfileValues(undefined, f, e)}
                      myProfile={myProfile}
                      onBlur={(f) => onBlurFields(f)}
                      formErrors={formErrors}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        {/* Action buttons at the bottom */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
            mt: 4,
            mb: 2,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          {viewMode ? (
            <Button
              variant="contained"
              type="button"
              size="medium"
              sx={{
                bgcolor: '#032840',
                color: '#fff',
                '&:hover': { bgcolor: '#0A3555' },
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                px: 3,
                boxShadow: 'none',
              }}
              onClick={onClickEdit}
              disabled={isFormSubmitting}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                type="button"
                size="medium"
                sx={{
                  borderColor: 'grey.300',
                  color: '#5A6A85',
                  '&:hover': { borderColor: 'grey.400', bgcolor: '#F6F9FC' },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 3,
                }}
                onClick={onClickCancel}
                disabled={isFormSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                type="submit"
                size="medium"
                sx={{
                  bgcolor: '#032840',
                  color: '#fff',
                  '&:hover': { bgcolor: '#0A3555' },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 3,
                  boxShadow: 'none',
                }}
                onClick={() => validateForm()}
                disabled={isFormSubmitting}
              >
                {!isFormSubmitting ? (
                  'Submit'
                ) : (
                  <>
                    <CircularProgress style={{ color: '#fff', width: '16px', height: '16px' }} />
                    <span style={{ paddingLeft: '8px' }}>Submitting</span>
                  </>
                )}
              </Button>
            </>
          )}
        </Box>
      </form>
    )
  );
};

export default ProfileForm;

interface MyProps {
  viewMode?: boolean;
  template: UserProfile;
  onClickEdit?: () => void;
  onClickCancel: () => void;
  onSubmitSuccessfully: (profile: UserProfile) => void;
  profileFormSections: FormSections[];
  documentFormSection: DocumentSectionField[];
  documentSectionHeader?: string;
}

type AddressTypes = 'communicationAddress' | 'permanentAddress';
interface SelectedBlobFiles {
  field: DocumentSectionField;
  value: File | undefined;
}
