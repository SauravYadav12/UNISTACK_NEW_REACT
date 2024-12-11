import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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

  const handleSearch = async () => {
    try {
      const query = searchRecord.trim();
      if (!query) return;
      const res = await requirementsList(query);
      console.log('handleSearch--', res.data.data);
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
    <Box sx={{ p: 3, width: '700px' }}>
      {/* Search Section */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Search Record"
          value={searchRecord}
          size="small"
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
      </Box>

      {/* Table Section */}
      {records.length > 0 && (
        <TableContainer component={Paper}>
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
        </TableContainer>
      )}
    </Box>
  );
}
