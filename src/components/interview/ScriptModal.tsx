import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import jsPDF from 'jspdf';
import CloseIcon from '@mui/icons-material/Close';
import './scriptModal.css';
import { Margin, Options, usePDF } from 'react-to-pdf';
import StarIcon from '@mui/icons-material/Star';
import { useEffect, useState } from 'react';
import { requirementsList } from '../../services/requirementApi';
import { consultantsList } from '../../services/consultantApi';
import { urlValidator } from '../../utils/validators';
import dayjs from 'dayjs';
import { uploadFile } from '../../services/storageApi';
import { toast } from 'react-toastify';
import { downloadFile } from '../../utils/utils';
import {
  IConsultant,
  IConsultantProject,
  IInterview,
  IRequirement,
  IVendor,
} from '../../Interfaces/types';

const dateFormate = 'MMM YYYY';

const ScriptModal = ({
  open,
  interview,
  onSave,
  onClose,
}: ScriptModalProps) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [requirement, setRequirement] = useState<IRequirement>();
  const [consultant, setConsultant] = useState<IConsultant>();
  const intId = 'intId' in interview ? interview.intId : interview.testID;
  const options: Options = {
    filename: 'script.pdf',
    page: {
      margin: Margin.SMALL,
    },
    overrides: {
      pdf: {
        compress: true,
        unit: 'mm',
      },
      canvas: {
        useCORS: true,
      },
    },
  };

  const { toPDF, targetRef } = usePDF({ ...options, method: 'build' });

  const fileInstance = async () => {
    const d = (await toPDF()) as unknown as InstanceType<typeof jsPDF>;
    const pdfBlob = d.output('blob');
    return new File([pdfBlob], `Script-${intId}.pdf`, {
      type: 'application/pdf',
    });
  };

  const saveScript = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const pdfFile = await fileInstance();
      const { data } = await uploadFile(pdfFile, 'gcp');
      await onSave(data.data.url);
      toast.success('Script: saved successfully');
    } catch (error) {
      toast.error('Script: Faild to save');
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  const downloadScript = async () => {
    if (saving) return;
    const pdfFile = await fileInstance();
    downloadFile(pdfFile);
  };

  const saveAndDownloadScript = async () => {
    await saveScript();
    await downloadScript();
  };

  const getData = async () => {
    try {
      if (!interview.consultantRef) {
        toast.error('Consultant is required');
        return;
      }
      const [cons, req] = await Promise.all([
        consultantsList(`_id=${interview.consultantRef}`),
        requirementsList(`reqID=${interview.reqID}`),
      ]);
      if (!req.data.data?.results?.length || !cons.data.data?.results?.length) {
        toast.error('Something is missing');
        return;
      }

      setRequirement(req.data.data.results[0]);
      setConsultant(cons.data.data.results[0]);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        mx: 5,
        my: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          overflow: 'auto',
          scrollbarWidth: 'thin',
          boxShadow: 24,
          borderRadius: '4px',
          px: 1,
          height: '100%',
          width: 'fit-content',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Stack
          direction={'row'}
          justifyContent={'space-between'}
          py={1}
          width="210mm"
        >
          <h2 style={{ margin: 0, fontSize: 'larger' }}>
            {interview.script ? 'Updated Script' : 'Script'} : {intId}
          </h2>
          <IconButton onClick={onClose} sx={{ height: 'fit-content' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            my: 1,
            width: 'fit-content',
          }}
        >
          {!!consultant && !!requirement ? (
            <Box
              ref={targetRef}
              sx={{
                p: 2,
                py: 3,
                width: '210mm',
                minHeight: '297mm',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
                display: 'flex',
                flexDirection: 'column',
                rowGap: '10px',
              }}
            >
              <Box>
                <Header
                  interview={interview}
                  name={consultant.consultantName || ''}
                />
                <Divider />
                <CondidateDetail consultant={consultant} />
              </Box>
              <VisaDetail consultant={consultant} />
              <Notes
                note={interview.specialNote || ''}
                poc={requirement.vendorPersonName || ''}
              />
              <OverAllExperience projects={consultant.projects || []} />
              <ConsultantsExperience projects={consultant.projects || []} />
              <InterviewDetails
                interview={interview}
                requirement={requirement}
              />
              <JobDescription
                primaryTech={requirement.primaryTech}
                secondaryTech={requirement.secondaryTech}
                jobDescription={requirement.jobDescription}
              />
              <Divider />
            </Box>
          ) : (
            <Box sx={{ py: 5, width: '210mm', textAlign: 'center' }}>
              <CircularProgress size={30} />
            </Box>
          )}
        </Box>

        <Stack
          direction={'row'}
          justifyContent={'space-between'}
          py={1}
          width="210mm"
        >
          <Button
            variant="contained"
            type="button"
            onClick={onClose}
            size="small"
            sx={{ borderRadius: '10px' }}
          >
            Close
          </Button>
          <Stack direction={'row'} justifyContent={'center'} columnGap={2}>
            {!saving ? (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  onClick={() => saveScript()}
                  size="small"
                  sx={{ borderRadius: '10px' }}
                  disabled={saving}
                >
                  Save
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  onClick={() => downloadScript()}
                  size="small"
                  sx={{ borderRadius: '10px' }}
                  disabled={saving}
                >
                  Download
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  onClick={() => saveAndDownloadScript()}
                  size="small"
                  sx={{ borderRadius: '10px' }}
                  disabled={saving}
                >
                  Save and download
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                color="primary"
                type="button"
                size="small"
                sx={{ borderRadius: '10px' }}
                disabled
              >
                <CircularProgress
                  style={{
                    color: '#1976d2',
                    width: '14px',
                    height: '14px',
                  }}
                />
                <span style={{ paddingLeft: '5px' }}> Saving</span>
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ScriptModal;

interface ScriptModalProps {
  interview: IInterview | IVendor;
  open: boolean;
  onSave: (scriptUrl: string) => Promise<void> | void;
  onClose: () => void;
}

function Header({
  interview,
  name,
}: {
  interview: IInterview | IVendor;
  name: string;
}) {
  const intId = 'intId' in interview ? interview.intId : interview.testID;
  return (
    <Stack
      direction={'row'}
      flexWrap={'wrap'}
      justifyContent={'space-evenly'}
      sx={{
        p: 1,
        my: 1,
        textAlign: 'center',
        backgroundColor: '#d3d3d3',
        fontSize: '20px',
        borderRadius: '5px',
      }}
    >
      <Typography fontWeight={'bold'} color={'blue'}>
        INT ID:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> {intId} </Typography>
      <Typography fontWeight={'bold'} color={'white'} px={'5px'}>
        ||
      </Typography>
      <Typography fontWeight={'bold'} color={'blue'}>
        FULL NAME:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> {name.toUpperCase()} </Typography>

      <Typography fontWeight={'bold'} color={'white'} px={'5px'}>
        ||
      </Typography>
      <Typography fontWeight={'bold'} color={'blue'}>
        INT DATE:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> {interview.interviewDate} </Typography>

      <Typography fontWeight={'bold'} color={'white'} px={'5px'}>
        ||
      </Typography>
      <Typography fontWeight={'bold'} color={'blue'}>
        INT TIME:{' '}
      </Typography>
      <Typography fontWeight={'bold'}>
        {' '}
        {interview.interviewTime} {interview.timeZone}{' '}
      </Typography>
    </Stack>
  );
}

function CondidateDetail({ consultant }: { consultant: IConsultant }) {
  const CandidateDetailsObj = {
    'Candidate Name': consultant.consultantName || 'NA',
    'Candidate Location': consultant.currentAddress || 'NA',
    'Candidate Number': consultant.phone || 'NA',
    'Candidate Email': consultant.email || 'NA',
    'Candidate Skyp id': consultant.skypeId || 'NA',
    Education: consultant.degree || 'NA',
    'Collage & passing year':
      (consultant.university || '') + '-' + (consultant.yearPassing || ''),
    DOB: dayjs(consultant.dob).format('MMM DD YYYY') || 'NA',
    'SSN (Last 4 digit)': consultant.ssn || 'NA',
    'Current visa status': consultant.visaStatus || 'NA',
  };
  const CandidateDetails = Object.entries(CandidateDetailsObj);
  return (
    <List
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'grey.400',
        borderRadius: '5px',
        p: 0,
        my: 1,
      }}
    >
      {CandidateDetails.map((entry, i) => {
        const [key, val] = entry;
        return (
          <ListItem key={i} sx={{ display: 'flex', width: '100%', p: 0 }}>
            <Typography
              sx={{
                width: '40%',
                color: 'grey.600',
                padding: '8px 16px',
                borderRight: '1px solid',
                borderBottom:
                  i + 1 === CandidateDetails.length ? 'none' : '1px solid',
                borderColor: 'grey.400',
              }}
              variant="subtitle2"
              fontWeight={'400'}
            >
              {key}
            </Typography>
            <Typography
              sx={{
                width: '60%',
                color: 'grey.600',
                padding: '8px 16px',
                borderBottom:
                  i + 1 === CandidateDetails.length ? 'none' : '1px solid',
                borderColor: 'grey.400',
              }}
              variant="subtitle2"
            >
              {val}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}

function VisaDetail({ consultant }: { consultant: IConsultant }) {
  const details = {
    'When did he came to US': consultant.cameToUsYear || 'NA',
    'How did you get the visa': consultant.getVisa || 'NA',
    'How are you looking for the change': consultant.lookingToChange || 'NA',
    'Basically from which country': consultant.originCountry || 'NA',
  };

  return (
    <List
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'grey.400',
        borderRadius: '5px',
        borderBottom: 'none',
        p: 0,
        my: 1,
      }}
    >
      {Object.entries(details).map(([key, val], i) => {
        return (
          <ListItem
            key={i}
            sx={{
              display: 'flex',
              width: '100%',
              p: 0,
              borderBottom: '1px solid',
              borderColor: 'grey.400',
            }}
          >
            <Typography
              sx={{
                padding: '8px 16px',
              }}
              variant="subtitle2"
            >
              {key}:
            </Typography>
            <Typography
              sx={{
                color: 'grey.600',
                padding: '8px 16px',
              }}
              variant="subtitle2"
            >
              {val}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}

function Notes({ note, poc }: { note: string; poc: string }) {
  const dataObj = {
    'SPECIAL NOTE': note || 'NA',
    POC: poc || 'NA',
  };
  const data = Object.entries(dataObj);
  return (
    <List
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'grey.400',
        borderRadius: '5px',
        borderBottom: 'none',
        p: 0,
        my: 1,
      }}
    >
      {data.map(([key, val], i) => {
        return (
          <ListItem
            key={i}
            sx={{
              display: 'flex',
              width: '100%',
              p: 0,
              borderBottom: '1px solid',
              borderColor: 'grey.400',
              backgroundColor: 'lightblue',
              borderRadius: i === data.length - 1 ? '0px 0px 5px 5px' : '',
            }}
          >
            <Typography
              sx={{
                padding: '8px 16px',
              }}
              variant="subtitle2"
            >
              {key}:
            </Typography>
            <Typography
              sx={{
                color: 'grey.600',
                padding: '8px 16px',
              }}
              variant="subtitle2"
            >
              {val}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}

function OverAllExperience({ projects }: { projects: IConsultantProject[] }) {
  return (
    <TableContainer component={Paper} sx={{ my: 1 }}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#d3d3d3' }}>
            <TableCell>Sr No.</TableCell>
            <TableCell>Over All experience at a glance</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Dates</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects?.map((row, i) => (
            <TableRow
              key={i}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>{i + 1}</TableCell>
              <TableCell>
                <Typography
                  sx={{
                    color: 'grey.600',
                  }}
                  variant="subtitle2"
                >
                  {row.projectName}
                </Typography>
              </TableCell>
              <TableCell>
                <Stack direction={'row'}>
                  <Typography variant="subtitle2">City:</Typography>
                  <Typography
                    sx={{
                      color: 'grey.600',
                      px: 1,
                    }}
                    variant="subtitle2"
                  >
                    {row.projectCity}
                  </Typography>
                </Stack>
                <Stack direction={'row'}>
                  <Typography variant="subtitle2">State:</Typography>

                  <Typography
                    sx={{
                      color: 'grey.600',
                      px: 1,
                    }}
                    variant="subtitle2"
                  >
                    {row.projectState}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography
                  sx={{
                    color: 'grey.600',
                  }}
                  variant="subtitle2"
                >
                  {dayjs(row.projectStartDate).format(dateFormate)} -{' '}
                  {row.isCurrent ? 'Present' : dayjs(row.projectEndDate).format(dateFormate)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {!projects.length && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No experience provided
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ConsultantsExperience({
  projects,
}: {
  projects: IConsultantProject[];
}) {
  return (
    <Box
      component={!projects.length ? Paper : undefined}
      sx={{
        my: 1,
      }}
    >
      <Stack
        sx={{
          backgroundColor: '#d3d3d3',
          borderRadius: '5px',
          p: 1,
        }}
      >
        <Typography fontWeight={'bold'}>CONSULTANT'S EXPERIENCE</Typography>
      </Stack>
      {projects?.map((e, i) => {
        const metaObj = {
          'CLIENT NAME': e.projectName || 'NA',
          'Project Domain': e.projectDomain || 'NA',
          city: e.projectCity || 'NA',
          state: e.projectState || 'NA',
          'Start Date': dayjs(e.projectStartDate).format(dateFormate) || 'NA',
          'End Date': e.isCurrent ? 'Present' : dayjs(e.projectEndDate).format(dateFormate) || 'NA',
        };
        return (
          <Box sx={{ my: 1 }} key={i}>
            <Typography fontWeight={'500'} variant="inherit">
              Project
              {' '}
              {i + 1}
            </Typography>
            <Divider sx={{ width: '20%', my: 1 }} />
            <Stack direction={'row'} columnGap={1} flexWrap={'wrap'}>
              <ListItemIcon sx={{ minWidth: 0 }}>
                <StarIcon sx={{ width: 15, fontSize: '', pt: '2px' }} />
              </ListItemIcon>
              {Object.entries(metaObj).map(([key, val], i) => {
                return (
                  <Stack direction={'row'} columnGap={1} key={i}>
                    <Typography
                      variant="subtitle2"
                      sx={{ textTransform: 'UPPERCASE' }}
                    >
                      {key}:
                    </Typography>
                    <Typography
                      sx={{
                        color: 'grey.600',
                      }}
                      variant="subtitle2"
                    >
                      {val}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
            <ListItemText>
              <StarIcon
                sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
              />
              <span className="key">PROJECT DESCRIPTION:</span>
              <span className="val">{e.projectDescription || ''}</span>
            </ListItemText>
          </Box>
        );
      })}

      {!projects.length && (
        <ListItemText
          sx={{
            m: 0,
            p: '16px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '0.875rem',
              lineHeight: 1.43,
              letterSpacing: '0.01071em',
            }}
          >
            No experience provided
          </span>
        </ListItemText>
      )}
    </Box>
  );
}

function InterviewDetails({
  interview,
  requirement,
}: {
  interview: IInterview | IVendor;
  requirement: IRequirement;
}) {
  const meta = {
    'ABOUT INTERVIEW': interview.subjectLine || 'NA',
    'INTERVIEW LINK': interview.interviewLink || 'NA',
    'INTERVIEW FOCUS': interview.interviewFocus || 'NA',
    'INTERVIEWER DETAILS': interview.interviewMode || 'NA',
    'PRIME VENDER NAME': requirement.primeVendorCompany || 'NA',
    'VENDER NAME': requirement.vendorCompany || 'NA',
    'CLIENT NAME': requirement.clientCompany || 'NA',
  };
  return (
    <Box
      sx={{
        my: 1,
      }}
    >
      <Stack
        sx={{
          backgroundColor: '#d3d3d3',
          borderRadius: '5px',
          p: 1,
        }}
      >
        <Typography fontWeight={'bold'} textTransform={'uppercase'}>
          Interview Details
        </Typography>
      </Stack>
      {Object.entries(meta).map(([key, val], i) => {
        return (
          <ListItemText
            key={i}
            style={{ width: '100%', overflowWrap: 'break-word' }}
          >
            <StarIcon
              sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
            />
            <span className="key">{key}:</span>
            {urlValidator(val) ? (
              <a
                href={val}
                target="_blank"
                className="val"
                style={{ color: '#4040e6' }}
              >
                {val}
              </a>
            ) : (
              <span className="val">{val}</span>
            )}
          </ListItemText>
        );
      })}
    </Box>
  );
}

function JobDescription({
  jobDescription,
  primaryTech,
  secondaryTech,
}: {
  jobDescription?: string;
  primaryTech?: string;
  secondaryTech?: string;
}) {
  return (
    <Box
      sx={{
        my: 1,
      }}
    >
      <Stack
        sx={{
          backgroundColor: '#d3d3d3',
          borderRadius: '5px',
          p: 1,
        }}
      >
        <Typography fontWeight={'bold'} textTransform={'uppercase'}>
          JOB DESCRIPTION
        </Typography>
      </Stack>
      <span className="val" style={{ whiteSpace: 'pre-line' }}>
        {jobDescription || ''}
      </span>
      <Box sx={{ my: 1 }}>
        <ListItemText>
          <StarIcon
            sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
          />
          <span className="key">PRIMARY SKILLS:</span>
          <span className="val">{primaryTech || ''}</span>
        </ListItemText>
        <ListItemText>
          <StarIcon
            sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
          />
          <span className="key">SECONDARY SKILLS:</span>
          <span className="val">{secondaryTech || ''}</span>
        </ListItemText>
      </Box>
    </Box>
  );
}
