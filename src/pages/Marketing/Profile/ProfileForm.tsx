import {
  Button,
  FormControlLabel,
  Grid,
  SelectChangeEvent,
} from '@mui/material';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { UserProfile } from '../../../Interfaces/profile';
import { toast } from 'react-toastify';
import {
  Android12Switch,
  convertValuesToEmptyString,
  // documentFormSection,
  DocumentSectionField,
  FormSections,
  // profileFormSections,
  SectionField,
} from './constants';
import { updateProfile } from '../../../services/userProfileApi';
import AddressField from '../../../components/profile/formFields/addressField/AddressField';
import RenderFields from '../../../components/profile/formFields/RenderFields';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';

import { pdfjs } from 'react-pdf';
import DocumentsField from '../../../components/profile/formFields/DocumentsField';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
const ProfileForm = ({
  template,
  onClose,
  profileFormSections,
  documentFormSection,
  documentSectionHeader
}: MyProps) => {
  const auth = useAuth();
  const [myProfile, setMyProfile] = useState<UserProfile>(
    JSON.parse(JSON.stringify(template))
  );
  const [formErrors, setFormErrors] = useState<UserProfile>(() => {
    const templateCopy = convertValuesToEmptyString(template) as UserProfile;
    return templateCopy;
  });
  const primaryAddress: AddressTypes = 'permanentAddress';
  const [isBothAddressSame, setIsBothAddressSame] = useState<boolean>(false);

  const submitForm = async () => {
    if (!validateForm()) {
      toast.error('Invalid submission');
      return;
    }
    try {
      const { data } = await updateProfile(myProfile._id, myProfile);
      if (data.error || !data.data) {
        toast.error(data.error || 'Something went wrong');
        return;
      }
      auth.setMyProfile(data.data);
      onClose();
    } catch (error) {
      toast.error('Something went wrong');
      console.log({ error });
    }
  };

  const validateField = (field: SectionField, section?: FormSections) => {
    let isValueValid = true;
    let message: string = '';
    let { fieldName, parentFieldName, label, optional, customValidation } =
      field;
    parentFieldName = parentFieldName || section?.parentFieldName;
    label = label || fieldName;
    label = label[0].toUpperCase() + label.slice(1);

    const setMessage = (val: string) => {
      if (
        (!optional && !val) ||
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
      const val = (myProfile as any)[parentFieldName][fieldName];
      setMessage(val);
      setFormErrors((pre) => ({
        ...pre,
        [parentFieldName]: {
          ...(pre as any)[parentFieldName],
          [fieldName]: message,
        },
      }));
    } else {
      const val = (myProfile as any)[fieldName];
      setMessage(val);
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
        if (!validateField(f, section)) {
          isAllValuesValid = false;
        }
      });
    });
    documentFormSection.map((section) => {
      if (!validateField(section)) {
        isAllValuesValid = false;
      }
      if (section.associatedField && !validateField(section.associatedField)) {
        isAllValuesValid = false;
      }
    });
    return isAllValuesValid;
  };

  const onBlurFields = (field: SectionField, section?: FormSections) => {
    validateField(field, section);
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
  };

  const applySameAddress = () => {
    const address = myProfile[primaryAddress];
    setMyProfile((pre) => {
      return {
        ...pre,
        communicationAddress: { ...address },
        permanentAddress: { ...address },
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

  useEffect(() => {
    setMyProfile(JSON.parse(JSON.stringify(template)));
  }, [template]);
  useEffect(() => {
    if (isBothAddressSame) {
      applySameAddress();
    }
  }, [myProfile.permanentAddress]);

  return (
    !!myProfile && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
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
          <Button
            variant="contained"
            color="error"
            type="button"
            size="small"
            sx={{ borderRadius: '10px' }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            size="small"
            sx={{ borderRadius: '10px' }}
          >
            Submit
          </Button>
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
                      parentFieldName !== primaryAddress && isBothAddressSame
                    }
                    parentFieldName={parentFieldName}
                    myProfile={myProfile}
                    sectionFields={sectionFields}
                    onChangeProfileValues={onChangeProfileValues}
                    setMyProfile={setMyProfile}
                  />
                </Grid>
                {parentFieldName !== primaryAddress && (
                  <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
                    <Grid item xs={12}>
                      <FormControlLabel
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
                    required={!field.optional}
                    disabled={false}
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
                    onBlur={() => onBlurFields(field, section)}
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
                  {profileFormSections.length + 1}. {documentSectionHeader||'Documents'}
                </h4>
              </Grid>
            </Grid>

            <Grid container spacing={1} sx={{ maxWidth: '100%' }}>
              {documentFormSection.map((field, i) => {
                return (
                  <DocumentsField
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
  template: UserProfile;
  onClose: () => void;
  profileFormSections: FormSections[];
  documentFormSection: DocumentSectionField[];
  documentSectionHeader?:string
}

type AddressTypes = 'communicationAddress' | 'permanentAddress';
