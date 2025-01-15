import {
  Button,
  DialogActions,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { requirementsList } from '../../../services/requirementApi';

type Record = {
  id: number;
  name: string;
  company: string;
  title: string;
};

export default function CustomSearch(props: any) {
  const [searchRecord, setSearchRecord] = useState('');
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      const query = searchRecord.trim();
      const validSearchId = /^REQ-\d{13}$/.test(query);
      if (!query) {
        setError('Search field cannot be empty. Please enter a search ID.');
        return;
      }
      if (!validSearchId) {
        setError(
          'Invalid search ID format. Please enter a valid ID (e.g., REQ-XXXXXXXXXXXXX)'
        );
        return;
      }
      const res = await requirementsList(query);
      // console.log('handleSearch--', res.data.data);
      const fetchedRecords = res.data.data.map((val: any) => ({
        id: val.reqID,
        name: val.clientPerson,
        company: val.vendorCompany,
        title: val.jobTitle,
        primeVendorCompany: val.primeVendorCompany,
        jobDescription: val.jobDescription,
        jobTitle: val.jobTitle,
        taxType: val.taxType,
        duration: val.duration,
      }));
      setRecords(fetchedRecords);
      setError('');
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const handleRecordSelect = (record: Record) => {
    console.log('button hit--', record);
    props.onClick(record);
    props.setDrawerOpen(true);
  };

  return (
    <DialogContent>
      {/* Search Section */}
      <DialogActions>
        <TextField
          label="Search Record"
          value={searchRecord}
          size="small"
          error={Boolean(error)}
          helperText={error}
          sx={{
            '& .MuiOutlinedInput-root': { borderRadius: '10px' },
            flexGrow: 1,
          }}
          onChange={(event) => setSearchRecord(event.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{ borderRadius: '10px' }}
        >
          Search
        </Button>
      </DialogActions>

      {/* Table Section */}
      {records.length > 0 && (
        <DialogContent>
          {/* <TableContainer component={Paper}> */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requirement ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.id}</TableCell>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.company}</TableCell>
                  <TableCell>{record.title}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      // onClick={props.onClick}
                      onClick={() => handleRecordSelect(record)}
                      size="small"
                      sx={{ borderRadius: '10px' }}
                    >
                      Create Interview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* </TableContainer> */}
        </DialogContent>
      )}
    </DialogContent>
  );
}
