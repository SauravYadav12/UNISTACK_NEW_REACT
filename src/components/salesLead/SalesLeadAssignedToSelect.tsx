import React from 'react';
import { SetResults } from '../../hooks/paginationHook';
import { iSalesLead } from '../../Interfaces/salesLeads';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { toast } from 'react-toastify';
import { updateSalesLead } from '../../services/salesLeadsApi';

const SalesLeadAssignedToSelect = ({
  selectOptions,
  row,
  setRows,
}: SalesLeadAssignedToSelectProps) => {
  const handleChange = async (event: SelectChangeEvent) => {
    const _id = event.target.value;
    const selectedUsr = selectOptions.find((u) => u._id === _id);
    const assignedTo = selectedUsr.firstName + ' ' + selectedUsr.lastName;
    try {
      await updateSalesLead(row._id, { assignedTo, assignedToRef: _id });
      setRows<iSalesLead>((pre) => {
        pre =
          pre?.map((r) => {
            if (r._id === row._id) {
              r.assignedTo = assignedTo;
              r.assignedToRef = _id;
            }
            return r;
          }) || [];
        return [...pre];
      });
      toast.success(`Assigned To ${assignedTo}`);
    } catch (error) {
      toast.error(`Request failed`);
      console.log(error);
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
          value={row.assignedToRef}
          label="Status"
          onChange={handleChange}
        >
          {selectOptions.map((usr, i) => {
            return (
              <MenuItem key={i} value={usr._id}>
                {usr.firstName + ' ' + usr.lastName}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SalesLeadAssignedToSelect;
interface SalesLeadAssignedToSelectProps {
  selectOptions: any[];
  row: iSalesLead;
  setRows: SetResults;
}
