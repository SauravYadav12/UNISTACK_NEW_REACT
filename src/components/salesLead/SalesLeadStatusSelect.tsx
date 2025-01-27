import {
  Box,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import React from 'react';
import { iSalesLead, iSalesLeadStatus } from '../../Interfaces/salesLeads';
import { salesLeadStatusOptions } from '../../pages/Marketing/SalesLeads/constants';
import { updateSalesLead } from '../../services/salesLeadsApi';
import { toast } from 'react-toastify';

const SalesLeadStatusSelect = ({ row, setRows }: SalesLeadStatusProps) => {
  const handleChange = async (event: SelectChangeEvent) => {
    const status = event.target.value as iSalesLeadStatus;
    try {
      await updateSalesLead(row._id, { status });
      setRows((pre) => {
        pre =
          pre?.map((r) => {
            if (r._id === row._id) {
              r.status = status;
            }
            return r;
          }) || [];
        return [...pre];
      });
      toast.success(`Status changed to ${status}`);
    } catch (error) {
      toast.error(`Request failed`);
      console.log(error);
    } finally {
    }
  };
  return (
    <Box sx={{ minWidth: 120, width: '100%' }}>
      <FormControl fullWidth>
        <Select
          sx={{
            boxShadow: 'none',
            '.MuiOutlinedInput-notchedOutline': { border: 0 },
          }}
          fullWidth
          value={row.status}
          label="Status"
          onChange={handleChange}
        >
          {salesLeadStatusOptions.map((s, i) => {
            return (
              <MenuItem key={i} value={s}>
                {s}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SalesLeadStatusSelect;

interface SalesLeadStatusProps {
  row: iSalesLead;
  setRows: React.Dispatch<React.SetStateAction<iSalesLead[] | undefined>>;
}
