import {
  Box,
  Button,
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
import CloseIcon from '@mui/icons-material/Close';
import './scriptModal.css';
import { Margin, Options, usePDF } from 'react-to-pdf';

const ScriptModal = ({ open, onClose }: ScriptModalProps) => {
  const options: Options = {
    filename: 'script.pdf',
    page: {
      margin: Margin.SMALL,
    },
    overrides: {
      pdf: {
        compress: true,
        unit:'mm'
      },
      canvas: {
        useCORS: true,
      },
    },
  };

  const { toPDF, targetRef } = usePDF(options);

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
          overflow:'auto',
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
        <Stack direction={'row'} justifyContent={'space-between'} py={1}  width= '210mm'>
          <h2 style={{ margin: 0 }}>Script</h2>
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
          <Box
            ref={targetRef}
            sx={{
              p: 2,
              py: 3,
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box',
              pageBreakAfter: 'always',
            }}
          >
            <Header />
            <Divider />
            <CondidateDetail />
            <Divider />
            <VisaDetail />
            <Divider />
            <Notes />
            <Divider />
            <OverAllExperience />
            <Divider />
            <ConsultantsExperience />
            <Divider />
            <InterviewDetails />
            <Divider />
            <JobDescription />
            <Divider />
          </Box>
        </Box>

        <Stack direction={'row'} justifyContent={'space-between'} py={1} width= '210mm'>
          <Button
            variant="contained"
            // color="error"
            type="button"
            onClick={onClose}
            size="small"
            sx={{ borderRadius: '10px' }}
          >
            Close
          </Button>
          <Stack direction={'row'} justifyContent={'center'} columnGap={2}>
            <Button
              variant="contained"
              color="primary"
              type="button"
              // onClick={() => onEdit(true)}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="button"
              onClick={() => toPDF()}
              size="small"
              sx={{ borderRadius: '10px' }}
            >
              Save and download
            </Button>
          </Stack>
        </Stack>
      </Box>
      {/* </div> */}
    </Modal>
  );
};

export default ScriptModal;

interface ScriptModalProps {
  open: boolean;
  onClose: () => void;
}

function Header() {
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
      fontWeight={'bold'}
    >
      <Typography fontWeight={'bold'} color={'blue'}>
        INT_ID:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> 2827673 </Typography>
      <Typography fontWeight={'bold'} color={'white'} px={'5px'}>
        | |
      </Typography>
      <Typography fontWeight={'bold'} color={'blue'}>
        FULL NAME:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> {'Test name'.toUpperCase()} </Typography>

      <Typography fontWeight={'bold'} color={'white'} px={'5px'}>
        | |
      </Typography>
      <Typography fontWeight={'bold'} color={'blue'}>
        INT DATE:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> 2025/02/03 </Typography>

      <Typography fontWeight={'bold'} color={'white'} px={'5px'}>
        | |
      </Typography>
      <Typography fontWeight={'bold'} color={'blue'}>
        INT TIME:{' '}
      </Typography>
      <Typography fontWeight={'bold'}> 10:34 PM EST </Typography>
    </Stack>
  );
}

function CondidateDetail() {
  const CandidateDetailsObj = {
    'Candidate Name': 'Test name',
    'Candidate Location': 'Test Location',
    'Candidate Number': 'Test Number',
    'Candidate Email': 'Test Email',
    'Candidate Skyp id': 'Test Skype id',
    Education: 'Test Education',
    'Collage & passing year': 'Test passing year',
    DOB: '2025/02/03',
    'SSN (Last 4 digit)': '7263',
    'Current visa status': 'US CITIZEN',
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

function VisaDetail() {
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
      <ListItem
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
          When did he came to US:
        </Typography>
        <Typography
          sx={{
            color: 'grey.600',
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          2013 on family sponserd visa
        </Typography>
      </ListItem>
      <ListItem
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
          How did you get the visa:
        </Typography>
        <Typography
          sx={{
            color: 'grey.600',
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          family sponserd
        </Typography>
      </ListItem>
      <ListItem
        sx={{
          display: 'flex',
          width: '100%',
          p: 0,
          borderBottom: '1px solid',
          borderColor: 'grey.400',
          borderRadius: '5px',
        }}
      >
        <Typography
          sx={{
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          How are you looking for the change:
        </Typography>
        <Typography
          sx={{
            color: 'grey.600',
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          Current project is getting over due to budget issue
        </Typography>
      </ListItem>
    </List>
  );
}

function Notes() {
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
      <ListItem
        sx={{
          display: 'flex',
          width: '100%',
          p: 0,
          borderBottom: '1px solid',
          borderColor: 'grey.400',
          backgroundColor: 'lightblue',
        }}
      >
        <Typography
          sx={{
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          SPECIAL NOTE:
        </Typography>
        <Typography
          sx={{
            color: 'grey.600',
            padding: '8px 16px',
          }}
          variant="subtitle2"
        ></Typography>
      </ListItem>
      <ListItem
        sx={{
          display: 'flex',
          width: '100%',
          p: 0,
          borderBottom: '1px solid',
          borderColor: 'grey.400',
          borderRadius: '0px 0px 5px 5px',

          backgroundColor: 'lightblue',
        }}
      >
        <Typography
          sx={{
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          POC:
        </Typography>
        <Typography
          sx={{
            color: 'grey.600',
            padding: '8px 16px',
          }}
          variant="subtitle2"
        >
          Praveen
        </Typography>
      </ListItem>
    </List>
  );
}

function OverAllExperience() {
  const projects = [
    {
      name: 'Capco',
      city: 'bhopal',
      state: 'MP',
      startDate: '2024/03/04',
      endDate: '2024/03/04',
    },
    {
      name: 'Sisco',
      city: 'bhopal',
      state: 'MP',
      startDate: '2024/03/04',
      endDate: '2024/03/04',
    },
    {
      name: 'test name',
      city: 'bhopal',
      state: 'MP',
      startDate: '2024/03/04',
      endDate: '2024/03/04',
    },
  ];

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
          {projects.map((row, i) => (
            <TableRow
              key={row.name}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>
                {i + 1 < 10 && '0'}
                {i + 1}
              </TableCell>
              <TableCell>
                <Typography
                  sx={{
                    color: 'grey.600',
                  }}
                  variant="subtitle2"
                >
                  {row.name}
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
                    {row.city}
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
                    {row.state}
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
                  {row.startDate} - {row.endDate}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

import StarIcon from '@mui/icons-material/Star';
function ConsultantsExperience() {
  const projects = [
    {
      name: 'Capco',
      city: 'bhopal',
      state: 'MP',
      startDate: '2024/03/04',
      endDate: '2024/03/04',
      description: ` Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat placeat,
      doloremque dolorum natus, corporis fugit in voluptate laborum rem iure
      pariatur deleniti delectus vel, libero sapiente ipsa? Dolorum laudantium
      doloribus aperiam mollitia sed voluptate quisquam architecto, laborum nam
      sapiente! Ullam nobis nemo nostrum tempore necessitatibus quam inventore
      ducimus laborum vel?`,
    },
    {
      name: 'Sisco',
      city: 'bhopal',
      state: 'MP',
      startDate: '2024/03/04',
      endDate: '2024/03/04',
      description: ` Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat placeat,
      doloremque dolorum natus, corporis fugit in voluptate laborum rem iure
      pariatur deleniti delectus vel, libero sapiente ipsa? Dolorum laudantium
      doloribus aperiam mollitia sed voluptate quisquam architecto, laborum nam
      sapiente! Ullam nobis nemo nostrum tempore necessitatibus quam inventore
      ducimus laborum vel?`,
    },
    {
      name: 'test name',
      city: 'bhopal',
      state: 'MP',
      startDate: '2024/03/04',
      endDate: '2024/03/04',
      description: ` Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat placeat,
      doloremque dolorum natus, corporis fugit in voluptate laborum rem iure
      pariatur deleniti delectus vel, libero sapiente ipsa? Dolorum laudantium
      doloribus aperiam mollitia sed voluptate quisquam architecto, laborum nam
      sapiente! Ullam nobis nemo nostrum tempore necessitatibus quam inventore
      ducimus laborum vel?`,
    },
  ];

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
        <Typography fontWeight={'bold'}>CONSULTANT'S EXPERIENCE</Typography>
      </Stack>
      {projects.map((e, i) => {
        const { name, city, state, startDate, endDate, description } = e;
        const metaObj = {
          'CLIENT NAME': name,
          city,
          state,
          'Start Date': startDate,
          'End Date': endDate,
        };
        return (
          <Box sx={{ my: 1 }} key={i}>
            <Typography fontWeight={'500'} variant="inherit">
              Project {i + 1 < 10 && '0'}
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
              <span className="val">{description}</span>
            </ListItemText>
          </Box>
        );
      })}
    </Box>
  );
}

function InterviewDetails() {
  const meta = {
    'ABOUT INTERVIEW': `Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat placeat, doloremque dolorum natus, corporis fugit in voluptate laborum rem iure pariatur deleniti delectus vel, libero sapiente ipsa? Dolorum laudantium doloribus aperiam mollitia sed voluptate quisquam architecto, laborum nam sapiente! Ullam nobis nemo nostrum tempore necessitatibus quam inventore ducimus laborum vel?`,
    'INTERVIEW LINK':
      'https://stackoverflow.com/questions/1871874/alternatives-for-using-in-href-attribute',
    'INTERVIEW FOCUS': 'Javascript, python, react, django',
    'INTERVIEWER DETAILS':
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quaerat placeat, doloremque dolorum natus, corporis fugit in voluptate laborum rem iure pariatur deleniti delectus vel, libero sapiente ipsa? Dolorum laudantium doloribus aperiam mollitia sed voluptate quisquam architecto,',
    'PRIME VENDER NAME': '',
    'VENDER NAME': '',
    'CLIENT NAME': '',
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
          <ListItemText key={i}>
            <StarIcon
              sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
            />
            <span className="key">{key}</span>
            {key === 'INTERVIEW LINK' ? (
              <a
                href={val}
                target="_blank"
                className="val"
                style={{ color: '#4040e6' }}
              >
                {val}:
              </a>
            ) : (
              <span className="val">{val}:</span>
            )}
          </ListItemText>
        );
      })}
    </Box>
  );
}

function JobDescription() {
  const description = `Role:- GCP Engineer
Location:- Remote

Job Description:-


Candidates must be certified in GKE and/or AKS.

The GCP/GKE Engineer enables cloud resources to provide optimal performance, continuity and efficiency in virtualized, on-demand environments.
The GCP/GKE Engineer work assignments are varied and frequently require interpretation and independent determination of the appropriate courses of action.
The GCP/GKE Engineer utilizes software that manages and monitors networks, systems and applications not only to guarantee performance to cloud software environments but also to better orchestrate and automate provisioning of resources.
Understands department, segment, and organizational strategy and operating objectives, including their linkages to related areas.
Makes decisions regarding own work methods, occasionally in ambiguous situations, and requires minimal direction and receives guidance where needed.
Follows established guidelines/procedures.


Best Regards,`;
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
        {description}
      </span>
      <Box sx={{ my: 1 }}>
        <ListItemText>
          <StarIcon
            sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
          />
          <span className="key">PRIMARY SKILLS:</span>
          <span className="val">Java, python, django, rust, react, vue</span>
        </ListItemText>
        <ListItemText>
          <StarIcon
            sx={{ width: 15, fontSize: '', pt: '2px', color: '#0000008a' }}
          />
          <span className="key">SECONDARY SKILLS:</span>
          <span className="val">Angular, node, springboot</span>
        </ListItemText>
      </Box>
    </Box>
  );
}
