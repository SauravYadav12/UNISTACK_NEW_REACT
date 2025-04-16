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

interface iProps {
  onSelect: (record: any) => void;
}
export default function SearchRequirement(props: iProps) {
  const { onSelect } = props;
  const [searchRecord, setSearchRecord] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    try {
      const query = searchRecord.trim();
      if (!query) {
        setError('Please enter a search ID');
        return;
      }
      if (!query.includes('REQ-')) {
        setError(
          'Invalid search ID format. Please enter a valid ID (e.g., REQ-XX)'
        );
        return;
      }
      const res = await requirementsList(`reqID=${query}`);
      const data = res.data.data?.results;
      if (!data?.length) {
        return setError('No records found for this ID');
      }
      setRecords(data);
      setError('');
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  return (
    <DialogContent>
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
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>{record.reqID}</TableCell>
                  <TableCell>{record.clientPerson}</TableCell>
                  <TableCell>{record.vendorCompany}</TableCell>
                  <TableCell>{record.jobTitle}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      onClick={() => onSelect(record)}
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
        </DialogContent>
      )}
    </DialogContent>
  );
}
