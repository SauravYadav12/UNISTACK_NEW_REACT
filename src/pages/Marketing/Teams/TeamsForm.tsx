import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Typography,
  alpha,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import CustomTextField from '../../../components/text_field/CustomTextField';
import { createTeam, deleteTeam, updateTeam } from '../../../services/teamsApi';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { dateFormate } from '../../../components/constants';
import {
  isFieldValid,
  validateAllFields,
  ValidationMeta,
} from '../../../utils/validators';
import { convertValuesToEmptyString } from '../../../utils/utils';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { ITeam } from '../../../Interfaces/types';
import { UserRole } from '../../../Interfaces/iUser';
import { FormMode } from '../Requirements/Requirements';
import { toast } from 'react-toastify';
import { SetResults } from '../../../hooks/paginationHook';

const teamValidationMeta: ValidationMeta[] = [
  { field: 'teamName', required: true },
];

const initialValues = {
  teamName: '', teckStack: '', developerName: '', createdBy: '',
};

interface iProps {
  viewData?: ITeam;
  mode: FormMode;
  setDrawerOpen: (open: boolean) => void;
  isEditing: boolean;
  onEdit: (editing: boolean) => void;
  setResults: SetResults;
}

const pickerSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
  '& .MuiOutlinedInput-root.Mui-disabled': { backgroundColor: '#F6F9FC' },
  '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' },
};

function SectionCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F6F9FC', borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Chip label={number} size="small" sx={{ bgcolor: '#032840', color: '#fff', fontWeight: 700, fontSize: '0.75rem', height: 24, minWidth: 24 }} />
        <Typography variant="body1" fontWeight={600} color="#2A3547">{title}</Typography>
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2}>{children}</Grid>
      </Box>
    </Box>
  );
}

export default function TeamsForm(props: iProps) {
  const [values, setValues] = useState<Partial<ITeam>>(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const user = useAuth().iUser!;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>(convertValuesToEmptyString(initialValues));
  const { viewData, mode, setDrawerOpen, isEditing, onEdit, setResults } = props;

  useHardKeySubmit(
    { onSubmit: (e) => { mode === 'add' && handleSubmitForm(e); mode === 'edit' && handleEditSubmitForm(e); } },
    [values, mode, errors, isEditing]
  );

  useEffect(() => {
    if (!user) return;
    if (mode === 'view' || mode === 'edit') {
      setValues(viewData || {});
    } else if (mode === 'add') {
      setValues((prev) => ({ ...prev, createdBy: user.firstName + ' ' + user.lastName }));
    }
    setErrors(convertValuesToEmptyString(initialValues));
  }, [mode, viewData]);

  const addValue = (key: keyof ITeam, newValue: unknown) => {
    const meta = teamValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) setErrors((pre) => ({ ...pre, [key]: '' }));
      if (meta.transform) newValue = meta.transform(newValue);
    }
    setValues((prev) => ({ ...prev, [key]: newValue }));
  };

  async function handleSubmitForm(event: React.FormEvent<HTMLButtonElement> | KeyboardEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields(teamValidationMeta, values, setErrors)) return;
    setIsSubmitting(true);
    try {
      const { data } = await createTeam(values);
      setResults((pre) => [data.data, ...pre || []]);
      setDrawerOpen(false);
    } catch (error) { console.log('Error saving:', error); }
    finally { setIsSubmitting(false); }
  }

  async function handleEditSubmitForm(event: React.FormEvent<HTMLButtonElement> | KeyboardEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields(teamValidationMeta, values, setErrors)) return;
    setIsSubmitting(true);
    try {
      if (!values._id) { toast.error('Team ID is missing. Cannot update the team.'); return; }
      const { data } = await updateTeam(values._id, values);
      setResults((pre) => pre?.map((d) => d._id === data.data._id ? data.data : d) || []);
      setDrawerOpen(false);
    } catch (error) { console.log('Error updating:', error); }
    finally { setIsSubmitting(false); }
  }

  async function handleDeleteTeam() {
    if (!values._id) { toast.error('Team ID is missing. Cannot delete the team.'); return; }
    try {
      await deleteTeam(values._id);
      setResults((pre) => [...pre || []].filter((p) => p._id !== values._id));
      setDrawerOpen(false);
    } catch (error) { console.error('Error deleting:', error); toast.error('An error occurred while deleting the team.'); }
  }

  const onBlur = (key: keyof ITeam) => {
    const meta = teamValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
  };

  if (!user) return null;
  if (!values) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={25} /></Box>;

  return (
    <form onSubmit={(e) => { e.preventDefault(); mode === 'add' && handleSubmitForm(e as any); mode === 'edit' && handleEditSubmitForm(e as any); }}>

      {/* ── Top bar: Action buttons ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3, pb: 2.5, borderBottom: '1px solid', borderColor: 'grey.200' }}>
        {mode === 'add' ? (
          <Button variant="contained" type="submit" disabled={isSubmitting} size="small" sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>
            {isSubmitting ? <><CircularProgress style={{ color: '#fff', width: 14, height: 14 }} /><span style={{ paddingLeft: 6 }}>Saving</span></> : 'Submit'}
          </Button>
        ) : isEditing ? (
          <>
            <Button variant="outlined" size="small" onClick={() => onEdit(false)} sx={{ borderColor: 'grey.300', color: '#5A6A85', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>Cancel</Button>
            <Button variant="contained" type="submit" size="small" disabled={isSubmitting} sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>
              {isSubmitting ? <><CircularProgress style={{ color: '#fff', width: 14, height: 14 }} /><span style={{ paddingLeft: 6 }}>Saving</span></> : 'Submit'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="contained" size="small" onClick={() => onEdit(true)} sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>Edit</Button>
            {user?.role.includes(UserRole['super-admin']) && (
              <Button variant="outlined" size="small" onClick={() => setOpenAlert(true)} sx={{ borderColor: alpha('#EF4444', 0.3), color: '#EF4444', '&:hover': { borderColor: '#EF4444', bgcolor: alpha('#EF4444', 0.04) }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>Delete</Button>
            )}
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ── Section 1: Team Info ── */}
        <SectionCard number={1} title="Team Info">
          <CustomTextField
            label="Team Name" fullWidth
            selectedValue={values.teamName || ''}
            error={!!errors.teamName} helperText={errors.teamName}
            disabled={!isEditing}
            onBlur={() => onBlur('teamName')}
            onChange={(e) => addValue('teamName', e.target.value)}
          />
          <CustomTextField
            label="Tech Stack" fullWidth
            onBlur={() => onBlur('teckStack')}
            selectedValue={values.teckStack || ''}
            error={!!errors.teckStack} helperText={errors.teckStack}
            disabled={!isEditing}
            onChange={(e) => addValue('teckStack', e.target.value)}
          />
          <CustomTextField
            label="Developer Name" fullWidth
            onBlur={() => onBlur('developerName')}
            selectedValue={values.developerName || ''}
            error={!!errors.developerName} helperText={errors.developerName}
            disabled={!isEditing}
            onChange={(e) => addValue('developerName', e.target.value)}
          />
          {mode === 'view' && (
            <>
              <CustomTextField
                label="Created By" fullWidth disabled
                selectedValue={values.createdBy || ''}
                error={!!errors.createdBy} helperText={errors.createdBy}
                onChange={(e) => addValue('createdBy', e.target.value)}
              />
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format={dateFormate} label="Created At"
                    value={values.createdAt ? dayjs(values.createdAt) : null}
                    disabled onChange={(v) => addValue('createdAt', v)}
                    slotProps={{ textField: { size: 'small', fullWidth: true, disabled: true, sx: pickerSx } }}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}
        </SectionCard>
      </Box>

      {/* Delete confirmation */}
      <Dialog open={openAlert} onClose={() => setOpenAlert(false)} sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2A3547' }}>Delete Team?</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this Team? This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAlert(false)} sx={{ textTransform: 'none', color: '#5A6A85' }}>Cancel</Button>
          <Button onClick={handleDeleteTeam} variant="contained" sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' }, textTransform: 'none', boxShadow: 'none', borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </form>
  );
}
