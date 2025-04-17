import {
  Button,
  CircularProgress,
  FormControlLabel,
  Grid,
  SelectChangeEvent,
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
import { updateProfile } from '../../../services/userProfileApi';
import AddressField from '../../../components/profile/formFields/addressField/AddressField';
import RenderFields from '../../../components/profile/formFields/RenderFields';
import DocumentsField from '../../../components/profile/formFields/DocumentsField';
import { uploadFile } from '../../../services/storageApi';
import { convertValuesToEmptyString } from '../../../utils/utils';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';

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
  const [myProfile, setMyProfile] = useState<UserProfile>(template);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<UserProfile>(
    convertValuesToEmptyString(template) as UserProfile
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
        target: {
          value: data.data.url,
        },
      } as any);
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
      const { data } = await updateProfile(myProfile._id, payload);
      if (data.error || !data.data) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      onSubmitSuccessfully(data.data);
    } catch (error: any) {
      const { codeName, keyPattern, keyValue } = error.response.data.error;
      if (codeName === 'DuplicateKey' && keyPattern.employeeId) {
        toast.error(
          `Employee Id ${keyValue.employeeId} already Associated with another profile`
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
    let { fieldName, label, inputAttributes, customValidation } = field;
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
        setFormErrors((pre) => ({
          ...pre,
          [fieldName]: message,
        }));
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
      if (!validateField(field)) {
        isAllValuesValid = false;
      }
      if (field.associatedField && !validateField(field.associatedField)) {
        isAllValuesValid = false;
      }
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
      return {
        ...profile,
        [field.fieldName]: e.target.value,
      };
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
    setMyProfile((pre) => {
      return {
        ...pre,
        [secondryAddress]: { ...address },
      };
    });
  };

  const handleSameAddressCheckBox = () => {
    setIsBothAddressSame((pre) => {
      if (!pre) {
        applySameAddress();
      }
      return !pre;
    });
  };

  useHardKeySubmit(
    {
      onSubmit: (e) => {
        submitForm();
      },
    },
    [
      myProfile,
      formErrors,
      isFormSubmitting,
      selectedBlobFiles,
      isBothAddressSame,
      viewMode,
      template,
    ]
  );

  useEffect(() => {
    const templateCopy: UserProfile = { ...template };
    if (!viewMode) {
      templateCopy.permanentAddress.country =
        templateCopy.permanentAddress.country || 'IN';
      templateCopy.communicationAddress.country =
        templateCopy.communicationAddress.country || 'IN';
    }
    setMyProfile(templateCopy);
  }, [template]);

  useEffect(() => {
    if (isBothAddressSame) {
      applySameAddress();
    }
  }, [myProfile[primaryAddress], isBothAddressSame]);

  return (
    !!myProfile && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          validateForm() && submitForm();
        }}
      >
        <Grid
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
            marginRight: 10,
          }}
        >
          {viewMode ? (
            <Button
              variant="contained"
              color="primary"
              type="button"
              size="small"
              sx={{ borderRadius: '10px' }}
              onClick={onClickEdit}
              disabled={isFormSubmitting}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="error"
                type="button"
                size="small"
                sx={{ borderRadius: '10px' }}
                onClick={onClickCancel}
                disabled={isFormSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                size="small"
                sx={{ borderRadius: '10px' }}
                onClick={() => validateForm()}
                disabled={isFormSubmitting}
              >
                {!isFormSubmitting ? (
                  'Submit'
                ) : (
                  <>
                    <CircularProgress
                      style={{
                        color: '#1976d2',
                        width: '14px',
                        height: '14px',
                      }}
                    />
                    <span style={{ paddingLeft: '5px' }}>Submitting</span>
                  </>
                )}
              </Button>
            </>
          )}
        </Grid>

        {profileFormSections.map((section, i) => {
          const { sectionTitle, sectionFields, parentFieldName } = section;

          if (
            parentFieldName === 'permanentAddress' ||
            parentFieldName === 'communicationAddress'
          ) {
            return (
              <div key={i}>
                <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
                  <Grid item xs={12}>
                    <h4>
                      {i + 1}. {sectionTitle}{' '}
                      {isBothAddressSame &&
                        parentFieldName !== primaryAddress && (
                          <span style={{ color: 'green', fontWeight: 'bold' }}>
                            {' '}
                            {`: Same as ${
                              primaryAddress.split('Address')[0]
                            } address`}
                          </span>
                        )}
                    </h4>
                  </Grid>

                  <AddressField
                    formErrors={formErrors}
                    key={i}
                    disabled={
                      (parentFieldName !== primaryAddress &&
                        isBothAddressSame) ||
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
                  <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        disabled={isFormSubmitting}
                        control={
                          <Android12Switch checked={isBothAddressSame} />
                        }
                        label={`Is ${
                          parentFieldName.split('Address')[0]
                        } address same as ${
                          primaryAddress.split('Address')[0]
                        } address`}
                        onChange={() => handleSameAddressCheckBox()}
                      />
                    </Grid>
                  </Grid>
                )}
              </div>
            );
          }
          return (
            <Grid key={i} container spacing={1} sx={{ maxWidth: '100%' }}>
              <Grid item xs={12}>
                <h4>
                  {i + 1}. {sectionTitle}
                </h4>
              </Grid>

              {sectionFields.map((field, j) => {
                return (
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
                );
              })}
            </Grid>
          );
        })}

        {documentFormSection.length && (
          <>
            <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
              <Grid item xs={12}>
                <h4>
                  {profileFormSections.length + 1}.{' '}
                  {documentSectionHeader || 'Documents'}
                </h4>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
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
                    onChange={(f, e) => {
                      onChangeProfileValues(undefined, f, e);
                    }}
                    myProfile={myProfile}
                    onBlur={(f) => onBlurFields(f)}
                    formErrors={formErrors}
                  />
                );
              })}
            </Grid>
          </>
        )}
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
