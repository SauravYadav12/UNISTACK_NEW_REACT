import * as React from 'react';
import {
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  AssociatedField,
  DocumentSectionField,
} from '../../../pages/Marketing/Profile/constants';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Document, Page } from 'react-pdf';
import { UserProfile } from '../../../Interfaces/profile';
import {
  getBlobFileByUrl,
  isImage,
  isPDF,
  parseError,
} from '../../../utils/utils';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import { toast } from 'react-toastify';
import { tokens } from '../../../theme/theme';
import {
  IconUpload,
  IconTrash,
  IconExternalLink,
  IconPaperclip,
  IconCloudUpload,
} from '@tabler/icons-react';

export default function DocumentsField({
  viewMode,
  field,
  disabled,
  formErrors,
  myProfile,
  selectedFile,
  setSelectedFile,
  onUpload,
  onChange,
  onBlur,
}: MyProps) {
  disabled = disabled || !!viewMode;
  const maxSize = 5 * (1024 * 1024);
  const savedFile = myProfile[field.fieldName];
  const [validationErrorMessage, setValidationErrorMessage] = React.useState('');
  const { label, associatedField } = field;
  const currentFile = selectedFile || savedFile;

  const isFileValid = async (file: File) => {
    if (file.size > maxSize) {
      setValidationErrorMessage(`File size should be less than ${maxSize / (1024 * 1024)} MB`);
      return false;
    }
    setValidationErrorMessage('');
    return true;
  };

  const handleMyDocumentFileChange = (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!e?.target.files?.length) return;
    const file = e.target.files[0];
    if (file) {
      if (!isFileValid(file)) { setSelectedFile(undefined); return; }
      setSelectedFile(file);
    } else {
      setSelectedFile(undefined);
    }
  };

  const removeFile = () => {
    setSelectedFile(undefined);
    onChange(field, { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    onBlur && onBlur(field);
  };

  return (
    <Box
      sx={{
        width: 300,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: '#fff',
        overflow: 'hidden',
        m: 1,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'grey.100',
          bgcolor: '#F6F9FC',
        }}
      >
        <Typography variant="body2" fontWeight={600} color="#2A3547">
          {label}
        </Typography>
        {currentFile && (
          <img
            src={`${getMaterialFileIcon(typeof currentFile === 'string' ? currentFile : currentFile.name)}`}
            alt="icon"
            width="18"
          />
        )}
      </Box>

      {/* File area */}
      <Box sx={{ p: 2 }}>
        {currentFile ? (
          <SelectedFile
            disabled={disabled}
            hideDeleteIcon={viewMode || disabled}
            file={currentFile}
            onClickDelete={removeFile}
            onClickUpload={() => selectedFile && onUpload(selectedFile)}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 2.5,
              px: 2,
              borderRadius: 2.5,
              border: '2px dashed',
              borderColor: 'grey.300',
              bgcolor: alpha('#F6F9FC', 0.5),
              cursor: disabled ? 'default' : 'pointer',
              transition: 'all 0.2s',
              '&:hover': disabled ? {} : {
                borderColor: tokens.colors.blue,
                bgcolor: alpha(tokens.colors.blue, 0.04),
              },
            }}
          >
            <IconCloudUpload size={28} color={tokens.colors.blue} style={{ marginBottom: 8, opacity: 0.7 }} />
            <Button
              disabled={disabled}
              variant="text"
              component="label"
              size="small"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8125rem',
                color: tokens.colors.blue,
              }}
            >
              {viewMode ? 'Not found' : 'Choose File'}
              <input
                type="file"
                accept={field.accept || '*'}
                hidden
                onChange={handleMyDocumentFileChange}
              />
            </Button>
            {!viewMode && (
              <Typography variant="caption" color="text.secondary" mt={0.5}>
                Max 5MB
              </Typography>
            )}
          </Box>
        )}

        {(!!formErrors[field.fieldName] || !!validationErrorMessage) && (
          <Typography variant="caption" color="error" mt={1} display="block">
            {formErrors[field.fieldName] || validationErrorMessage}
          </Typography>
        )}
      </Box>

      {/* Associated field (e.g. document number) */}
      {!!associatedField && (
        <Box sx={{ px: 2, pb: 2 }}>
          <TextField
            disabled={disabled}
            onBlur={() => onBlur && onBlur(associatedField)}
            label={associatedField.label}
            type={associatedField.fieldType}
            value={myProfile[associatedField.fieldName]}
            onChange={(e) => {
              if (associatedField.transformValue) {
                e.target.value = associatedField.transformValue(e.target.value);
              }
              onChange(associatedField, e as React.ChangeEvent<HTMLInputElement>);
            }}
            fullWidth
            error={!!formErrors[associatedField.fieldName]}
            helperText={formErrors[associatedField.fieldName]}
            inputProps={{ ...associatedField.inputAttributes }}
            size="small"
            multiline={associatedField.fieldType !== 'number'}
          />
        </Box>
      )}
    </Box>
  );
}

interface MyProps {
  disabled: boolean;
  viewMode?: boolean;
  field: DocumentSectionField;
  myProfile: UserProfile;
  formErrors: UserProfile;
  selectedFile?: File;
  setSelectedFile: (file: File | undefined) => void;
  onUpload: (file: File) => void;
  onChange: (field: DocumentSectionField | AssociatedField, e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: DocumentSectionField | AssociatedField) => void;
}

export const SelectedFile = ({
  disabled,
  file,
  hideDeleteIcon,
  previewType = 'file',
  onClickDelete,
  onClickUpload,
}: SelectedFileProps) => {
  const [selectedFile, setSelectedFile] = React.useState<File>();
  const [uploadingFile, setUploadingFile] = React.useState(false);
  const [failedToloadPdf, setFailedToloadPdf] = React.useState(false);

  const handleUploadButton = async () => {
    try {
      setUploadingFile(true);
      await onClickUpload();
    } catch (error) {
      toast.error(parseError(error));
    } finally {
      setUploadingFile(false);
    }
  };

  const fileMetaData = (input: File | string) => {
    if (input instanceof File) return input;
    const url = new URL(input);
    const name = url.pathname.split('/').pop() || 'unknown-file';
    return { name, size: undefined };
  };

  const imgSrc = (input: File | string) => {
    if (input instanceof File) return URL.createObjectURL(input);
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

  React.useEffect(() => { initSelectedFile(); }, [file]);

  const info = fileMetaData(selectedFile || file);
  let { name } = info;
  const { size } = info;
  if (name.includes('-') && new Date(parseInt(name.split('-')[0])).toString() !== 'Invalid Date') {
    name = name.split('-').slice(1).join('');
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: '#F6F9FC',
      }}
    >
      {/* Preview */}
      {previewType === 'file' ? (
        <Box
          sx={{
            width: 44,
            height: 48,
            borderRadius: 1.5,
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid',
            borderColor: 'grey.200',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPDF(selectedFile || file) && !failedToloadPdf ? (
            <Document file={selectedFile || file} onLoadError={() => setFailedToloadPdf(true)}>
              <Page pageNumber={1} width={40} />
            </Document>
          ) : isImage(selectedFile || file) ? (
            <img src={imgSrc(selectedFile || file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <embed
              width={40} height={44}
              style={{ pointerEvents: 'none', border: 'none' }}
              src={typeof file === 'string' ? file : URL.createObjectURL(file)}
            />
          )}
        </Box>
      ) : (
        <img
          src={`${getMaterialFileIcon(typeof file === 'string' ? file : file.type)}`}
          alt="icon"
          style={{ width: 44, height: 44 }}
        />
      )}

      {/* File info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={500} color="#2A3547" noWrap>
          {name.slice(0, 22)}{name.length > 22 && '...'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {size ? (size / 1024).toFixed(1) + ' KB' : ''}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {!hideDeleteIcon && (
          <IconButton disabled={disabled} size="small" onClick={onClickDelete} sx={{ color: '#EF4444', '&:hover': { bgcolor: alpha('#EF4444', 0.08) } }}>
            <IconTrash size={15} />
          </IconButton>
        )}
        {typeof file === 'string' ? (
          <IconButton size="small" component="a" href={file} target="_blank" sx={{ color: tokens.colors.blue }}>
            <IconExternalLink size={15} />
          </IconButton>
        ) : (
          <>
            {!uploadingFile ? (
              <IconButton disabled={disabled} size="small" onClick={handleUploadButton} sx={{ color: tokens.colors.blue }}>
                <IconUpload size={15} />
              </IconButton>
            ) : (
              <CircularProgress size={16} sx={{ color: tokens.colors.blue, mx: 'auto' }} />
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

interface SelectedFileProps {
  file: File | string;
  disabled: boolean;
  hideDeleteIcon?: boolean;
  previewType?: 'icon' | 'file';
  onClickDelete: () => void;
  onClickUpload: () => void;
}
