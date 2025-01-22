import * as React from 'react';
import { Button, Card, Divider, Grid, TextField } from '@mui/material';
import {
  AssociatedField,
  DocumentSectionField,
} from '../../../pages/Marketing/Profile/constants';
import CircularProgress from '@mui/material/CircularProgress';
import { uploadFile } from '../../../services/storageApi';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Document, Page } from 'react-pdf';
import { toast } from 'react-toastify';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import '../profile.css';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { AttachFile } from '@mui/icons-material';
import { UserProfile } from '../../../Interfaces/profile';
import { getBlobFileByUrl, isImage, isPDF } from '../../../utils/utils';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import './formFields.css';
export default function DocumentsField({
  field,
  formErrors,
  onChange,
  myProfile,
  onBlur,
}: MyProps) {
  const maxSize = 5 * (1024 * 1024);
  const savedFile = myProfile[field.fieldName];
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [validationErrorMessage, setValidationErrorMessage] =
    React.useState<string>('');
  const { label, associatedField } = field;

  const currentFile = selectedFile || savedFile;

  const isFileValid = async (file: File) => {
    if (file.size > maxSize) {
      setValidationErrorMessage(
        `File size should be less than ${maxSize / (1024 * 1024)} MB`
      );
      return false;
    }

    setValidationErrorMessage('');
    return true;
  };

  const handleMyDocumentFileChange = (
    e?: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e?.target.files?.length) return;
    const file = e.target.files[0];
    if (file) {
      if (!isFileValid(file)) {
        setSelectedFile(undefined);
        return;
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(undefined);
    }
  };
  const handleMyDocumentUpload = async () => {
    if (!selectedFile) return;

    try {
      const { data } = await uploadFile(selectedFile);
      onChange(field, {
        target: {
          value: data.data.url,
        },
      } as any);
      setSelectedFile(undefined);
    } catch (error) {
      toast.error('Failed to upload');
      console.error(error);
    }
  };

  const removeFile = () => {
    setSelectedFile(undefined);
    onChange(field, { target: { value: '' } } as any);
    onBlur && onBlur(field);
  };
  return (
    <>
      <Card
        variant="outlined"
        sx={{ width: '300px', borderRadius: '10px', m: 1 }}
      >
        <Grid
          item
          sx={{
            mx: '12px',
            py: 0.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <p style={{ margin: 0 }}>{label}</p>
          {currentFile && (
            <div style={{ display: 'flex', marginRight: '24px' }}>
              <img
                src={`${getMaterialFileIcon(
                  typeof currentFile === 'string'
                    ? currentFile
                    : currentFile.name
                )}`}
                alt="icon"
                width="18"
              />
            </div>
          )}
        </Grid>
        <Divider />
        <Grid item sx={{ m: 1 }}>
          <Card
            variant="outlined"
            className="document-container"
            sx={{
              borderRadius: '10px',
              minHeight: '68px',
              justifyContent: 'center',
            }}
          >
            {!!currentFile ? (
              <SelectedFile
                file={currentFile}
                onClickDelete={removeFile}
                onClickUpload={handleMyDocumentUpload}
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
                    Choose File
                    <input
                      type="file"
                      accept={field.accept || '*'}
                      hidden
                      onChange={handleMyDocumentFileChange}
                    />
                  </Button>
                </div>
              </>
            )}
          </Card>
          {(!!formErrors[field.fieldName] || !!validationErrorMessage) && (
            <p style={{ margin: 0, fontSize: 'small', color: 'red' }}>
              {formErrors[field.fieldName] || validationErrorMessage}
            </p>
          )}
        </Grid>
        {!!associatedField && (
          <div style={{ marginTop: '15px' }}>
            <Grid item sx={{ m: 1 }}>
              <TextField
                onBlur={() => onBlur && onBlur(associatedField)}
                label={associatedField.label}
                type={associatedField.fieldType}
                value={myProfile[associatedField.fieldName]}
                onChange={(e) => {
                  if (associatedField.transformValue) {
                    e.target.value = associatedField.transformValue(
                      e.target.value
                    );
                  }
                  onChange(associatedField, e as any);
                }}
                fullWidth
                error={!!formErrors[associatedField.fieldName]}
                helperText={formErrors[associatedField.fieldName]}
                inputProps={{ ...associatedField.inputAttributes }}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                multiline={
                  associatedField.fieldType === 'number' ? false : true
                }
              />
            </Grid>
          </div>
        )}
      </Card>
    </>
  );
}

interface MyProps {
  field: DocumentSectionField;
  myProfile: UserProfile;
  formErrors: UserProfile;
  onChange: (
    field: DocumentSectionField | AssociatedField,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  onBlur?: (e: DocumentSectionField | AssociatedField) => void;
}

const SelectedFile = ({
  file,
  onClickDelete,
  onClickUpload,
}: SelectedFileProps) => {
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [uploadingFile, setUploadingFile] = React.useState<boolean>(false);
  const [failedToloadPdf, setFailedToloadPdf] = React.useState<boolean>(false);

  const handleUploadButton = async () => {
    try {
      setUploadingFile(true);
      await onClickUpload();
    } catch (error) {
    } finally {
      setUploadingFile(false);
    }
  };

  const fileMetaData = (input: File | string) => {
    if (input instanceof File) {
      return input;
    }

    const url = new URL(input);
    const name = url.pathname.split('/').pop() || 'unknown-file';
    return { name, size: undefined };
  };

  const imgSrc = (input: File | string) => {
    if (input instanceof File) {
      return URL.createObjectURL(input);
    }

    return input;
  };
  const initSelectedFile = async () => {
    if (typeof file === 'string') {
      const blob = await getBlobFileByUrl(file);
      blob && setSelectedFile(blob);
      return;
    }
    setSelectedFile(file);
  };

  React.useEffect(() => {
    initSelectedFile();
  }, [file]);

  let { name, size } = fileMetaData(selectedFile || file);
  name = name.split('-').slice(1).join('');
  return (
    <>
      <Card variant="outlined" className="selected-file-card" sx={{ p: 0.2 }}>
        {isPDF(selectedFile || file) && !failedToloadPdf ? (
          <Document
            file={selectedFile || file}
            onLoadError={() => setFailedToloadPdf(true)}
          >
            <Page pageNumber={1} width={38} />
          </Document>
        ) : (
          <>
            {isImage(selectedFile||file) ? (
              <>
                <img
                  className="img-preview"
                  src={imgSrc(selectedFile || file)}
                  alt="preview"
                />
              </>
            ) : (
              <embed
                width={38}
                height={40}
                className="embed-other-files"
                src={
                  typeof file === 'string' ? file : URL.createObjectURL(file)
                }
              ></embed>
            )}
          </>
        )}
      </Card>
      <div className="file-details">
        <p
          className="myDetail-label"
          style={{
            textTransform: 'capitalize',
            margin: 0,
            marginTop: '5px',
          }}
        >
          {name.slice(0, 20)}
          {name.length > 20 && '...'}
        </p>

        {size && (
          <p
            style={{
              margin: 0,
              fontSize: 'small',
              marginBottom: '5px',
            }}
          >
            {(size / (1024)).toFixed(2)} KB
          </p>
        )}
      </div>
      <div className="action-buttons">
        <Button size="small" onClick={() => onClickDelete()}>
          <DeleteOutlineIcon style={{ color: 'red', width: '18px' }} />
        </Button>
        {typeof file === 'string' ? (
          <>
            <Button target="_blank" href={file} size="small">
              <OpenInNewIcon style={{ color: '#1976d2', width: '16px' }} />
            </Button>
          </>
        ) : (
          <>
            {!uploadingFile ? (
              <Button size="small" onClick={handleUploadButton}>
                <FileUploadIcon style={{ color: '#1976d2', width: '18px' }} />
              </Button>
            ) : (
              <CircularProgress
                style={{ color: '#1976d2', width: '18px', height: '18px' }}
              />
            )}
          </>
        )}
      </div>
    </>
  );
};

interface SelectedFileProps {
  file: File | string;
  onClickDelete: () => void;
  onClickUpload: () => void;
}
