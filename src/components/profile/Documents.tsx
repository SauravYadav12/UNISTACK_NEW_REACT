import { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  IconButton,
  alpha,
  Tooltip,
  Skeleton,
} from '@mui/material';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import { getBlobFileByUrl, getFileMetaData, isImage } from '../../utils/utils';
import { updateProfile } from '../../services/userProfileApi';
import { UserRole } from '../../Interfaces/iUser';
import { tokens } from '../../theme/theme';
import {
  IconTrash,
  IconExternalLink,
  IconPhoto,
  IconFileText,
  IconFile,
} from '@tabler/icons-react';

const Documents = () => {
  const { myProfile, iUser: user, setMyProfile } = useAuth();
  const [myDocuments, setMyDocuments] = useState<DocumentsSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const canDelete = user?.role.includes(UserRole['super-admin']);

  const deleteFile = async (fieldName: DocumentsField) => {
    if (!myProfile?._id) return;
    try {
      const { data } = await updateProfile(myProfile._id, { [fieldName]: '' });
      if (data.data && !data.error) {
        setMyProfile(data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const filesInformation = async (input: string) => {
    if (!input) return null;
    try {
      return await getBlobFileByUrl(input);
    } catch (error) {
      return await getFileMetaData(input);
    }
  };

  const initSchema = async () => {
    setLoading(true);
    const [profilePhoto, aadharCopy, panCopy, resume] = await Promise.all([
      filesInformation(myProfile!.photo),
      filesInformation(myProfile!.aadharCopy),
      filesInformation(myProfile!.panCopy),
      filesInformation(myProfile!.resume),
    ]);
    setMyDocuments([
      { label: 'Profile Photo', name: profilePhoto?.name, size: profilePhoto?.size, url: myProfile?.photo, fieldName: 'photo' },
      { label: 'Aadhar Card', name: aadharCopy?.name, size: aadharCopy?.size, url: myProfile?.aadharCopy, fieldName: 'aadharCopy' },
      { label: 'PAN Card', name: panCopy?.name, size: panCopy?.size, url: myProfile?.panCopy, fieldName: 'panCopy' },
      { label: 'Resume', name: resume?.name, size: resume?.size, url: myProfile?.resume, fieldName: 'resume' },
    ]);
    setLoading(false);
  };

  useEffect(() => { initSchema(); }, [myProfile]);

  const getIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'photo': return <IconPhoto size={20} />;
      case 'resume': return <IconFileText size={20} />;
      default: return <IconFile size={20} />;
    }
  };

  const docsWithUrl = myDocuments.filter((d) => !!d.url);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!docsWithUrl.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="body2" color="text.secondary">No documents uploaded</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {docsWithUrl.map((doc, i) => {
        let { label, name, size, url } = doc;
        name = (name || getFileMetaData(url!).name).split('-').slice(1).join('') || 'File';
        const isImg = isImage(url!);

        return (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'grey.200',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0px 4px 16px rgba(0,0,0,0.06)' },
              }}
            >
              {/* Preview area */}
              <Box
                sx={{
                  height: 160,
                  bgcolor: '#F6F9FC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {isImg ? (
                  <img
                    src={url}
                    alt={label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ color: tokens.colors.blue, opacity: 0.5 }}>
                    {getIcon(doc.fieldName)}
                    <Typography variant="caption" display="block" textAlign="center" mt={0.5} color="text.secondary">
                      {url?.split('.').pop()?.toUpperCase()}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Info + Actions */}
              <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} color="#2A3547" noWrap>
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {name.slice(0, 18)}{name.length > 18 && '...'} {size ? `· ${(size / 1024).toFixed(1)} KB` : ''}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 0.25 }}>
                  <Tooltip title="Open">
                    <IconButton
                      size="small"
                      component="a"
                      href={url}
                      target="_blank"
                      sx={{ color: tokens.colors.blue }}
                    >
                      <IconExternalLink size={16} />
                    </IconButton>
                  </Tooltip>
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => deleteFile(doc.fieldName)}
                        sx={{ color: '#EF4444', '&:hover': { bgcolor: alpha('#EF4444', 0.08) } }}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default Documents;

interface DocumentsSchema {
  label: string;
  name?: string;
  size?: number;
  url?: string;
  fieldName: DocumentsField;
}

type DocumentsField = 'aadharCopy' | 'panCopy' | 'resume' | 'photo';
