import { useEffect, useState } from 'react';
import { Box, Button, Card } from '@mui/material';
import './profile.css';
import { useAuth } from '../../AuthGaurd/AuthContextProvider';
import Divider from '@mui/material/Divider';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getBlobFileByUrl, getFileMetaData, getIUser } from '../../utils/utils';
import { getMaterialFileIcon } from 'file-extension-icon-js';
import { updateProfile } from '../../services/userProfileApi';
import './profile.css';
const Documents = () => {
  const { myProfile, setMyProfile } = useAuth();
  const [myDocuments, setMyDocuments] = useState<DocumentsSchema[]>([]);
  const user = getIUser();

  const deleteFile = async (fieldName: DocumentsField) => {
    if (!myProfile?._id) return;
    try {
      const { data } = await updateProfile(myProfile?._id, { [fieldName]: '' });
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
    const pofilePhotoPromise = filesInformation(myProfile!.photo);
    const aadharPromise = filesInformation(myProfile!.aadharCopy);
    const panPromise = filesInformation(myProfile!.panCopy);
    const resumePromise = filesInformation(myProfile!.resume);
    const [pofilePhoto, aadharCopy, panCopy, resume] = await Promise.all([
      pofilePhotoPromise,
      aadharPromise,
      panPromise,
      resumePromise,
    ]);
    const documentsSchema: DocumentsSchema[] = [
      {
        label: 'Profile photo',
        name: pofilePhoto?.name,
        size: pofilePhoto?.size,
        url: myProfile?.photo,
        fieldName: 'photo',
      },
      {
        label: 'Aadhar',
        name: aadharCopy?.name,
        size: aadharCopy?.size,
        url: myProfile?.aadharCopy,
        fieldName: 'aadharCopy',
      },
      {
        label: 'PAN',
        name: panCopy?.name,
        size: panCopy?.size,
        url: myProfile?.panCopy,
        fieldName: 'panCopy',
      },
      {
        label: 'Resume',
        name: resume?.name,
        size: resume?.size,
        url: myProfile?.resume,
        fieldName: 'resume',
      },
    ];
    setMyDocuments(documentsSchema);
  };

  useEffect(() => {
    initSchema();
  }, [myProfile]);

  return (
    <div className="myDetails-container">
      <>
        {!myDocuments.filter((d) => !!d.url).length && (
          <>
            <Box className="loader">Not found</Box>
          </>
        )}
        {myDocuments.map((detail, i) => {
          let { label, name, size, url } = detail;
          if (!url) return null;
          name = (name || getFileMetaData(url).name)
            .split('-')
            .slice(1)
            .join('');
          return (
            <Card key={i} sx={{ width: '300px', minWidth: '300px' }}>
              <Box
                className="document-container"
                sx={{ width: '100%', py: '0px' }}
              >
                <p
                  className="myDetail-value"
                  style={{
                    width: '80%',
                    textTransform: 'capitalize',
                    margin: 0,
                    paddingLeft: '5px',
                  }}
                >
                  {label}
                </p>
                {user?.role === 'super-admin' && (
                  <span
                    style={{
                      width: '20%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <a onClick={() => deleteFile(detail.fieldName)}>
                      <DeleteOutlineIcon
                        style={{
                          color: 'red',
                          width: '20px',
                          cursor: 'pointer',
                        }}
                      />
                    </a>
                  </span>
                )}
              </Box>
              <Divider />
              <Box className="document-container" sx={{ width: '100%' }}>
                <img
                  src={`${getMaterialFileIcon(url)}`}
                  alt="icon"
                  style={{ width: '20%', height: '20%' }}
                />
                <div
                  style={{
                    width: '60%',
                    height: '60px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    paddingTop: '6px',
                  }}
                >
                  <p
                    className="myDetail-label"
                    style={{
                      textTransform: 'capitalize',
                      margin: 0,
                    }}
                  >
                    {name.slice(0, 20)}
                    {name.length > 20 && '...'}
                  </p>
                  {!!size && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'small',
                        paddingBottom: '5px',
                      }}
                    >
                      {(size / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
                <div
                  style={{
                    width: '20%',
                    height: '60px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Button target="_blank" href={url} size="small">
                    <OpenInNewIcon
                      style={{ color: '#1976d2', width: '18px' }}
                    />
                  </Button>
                </div>
              </Box>
            </Card>
          );
        })}
      </>
    </div>
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
