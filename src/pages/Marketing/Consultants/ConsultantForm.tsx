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
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import examples from 'libphonenumber-js/examples.mobile.json';
import CustomTextField from '../../../components/text_field/CustomTextField';
import CustomSelectField from '../../../components/select/CustomSelectField';
import React, { useEffect, useState } from 'react';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  consultantStatusOptions,
  consultantValidationMeta,
  timeZoneOptions,
  visaStatusOptions,
} from './consultantValues';
import {
  createConsultant,
  deleteConsultant,
  updateConsultant,
} from '../../../services/consultantApi';
import { Android12Switch } from '../Profile/constants';
import { isFieldValid, validateAllFields } from '../../../utils/validators';
import { convertValuesToEmptyString } from '../../../utils/utils';
import { MuiTelInput, MuiTelInputInfo } from 'mui-tel-input';
import { getExampleNumber } from 'libphonenumber-js';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { SetResults } from '../../../hooks/paginationHook';
import { FormMode } from '../Requirements/Requirements';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { IConsultant, IConsultantProject } from '../../../Interfaces/types';
import { UserRole } from '../../../Interfaces/iUser';
import { toast } from 'react-toastify';
import { IconTrash, IconPlus } from '@tabler/icons-react';

const initialValues: Partial<IConsultant> = {
  timeZone: '', consultantStatus: '', visaStatus: '', projects: [],
  dob: null, consultantName: '', currentAddress: '', previousAddress: '',
  email: '', phone: '', degree: '', university: '', yearPassing: '',
  ssn: '', dlNo: '', psuedoName: '', skypeId: '', getVisa: '',
  cameToUsYear: '', originCountry: '', lookingToChange: '', createdBy: '',
};

interface iProps {
  viewData?: IConsultant;
  mode?: FormMode;
  isEditing?: boolean;
  onDrawerClose: () => void;
  onEdit?: (editMode: boolean) => void;
  setResults?: SetResults;
}

const pickerSx = {
  '& .MuiOutlinedInput-root': { borderRadius: '10px' },
  '& .MuiOutlinedInput-root.Mui-disabled': { backgroundColor: '#F6F9FC' },
  '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' },
};

function SectionCard({ number, title, action, children }: { number: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#F6F9FC', borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip label={number} size="small" sx={{ bgcolor: '#032840', color: '#fff', fontWeight: 700, fontSize: '0.75rem', height: 24, minWidth: 24 }} />
          <Typography variant="body1" fontWeight={600} color="#2A3547">{title}</Typography>
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2}>{children}</Grid>
      </Box>
    </Box>
  );
}

export default function ConsultantForm(props: iProps) {
  const dobFormate = 'MMM DD';
  const [values, setValues] = useState<Partial<IConsultant>>(initialValues);
  const [openAlert, setOpenAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { viewData, mode, isEditing, onDrawerClose, onEdit, setResults } = props;
  const user = useAuth().iUser!;
  const [projects, setProjects] = useState<Partial<IConsultant['projects']>>([]);
  const [errors, setErrors] = useState<{ [key in keyof IConsultant]?: string }>(convertValuesToEmptyString(initialValues));

  useHardKeySubmit(
    { onSubmit: (e) => { mode === 'add' && handleSubmitForm(e); mode === 'edit' && handleEditSubmitForm(e); } },
    [values, mode, viewData, isEditing, errors]
  );

  useEffect(() => {
    if (mode === 'view' || mode === 'edit') {
      setValues(viewData || {});
      setProjects(viewData?.projects || []);
    } else if (mode === 'add') {
      setValues(initialValues);
      setProjects([{
        projectNumber: '1', projectName: '', projectCity: '', projectState: '',
        projectStartDate: null, projectEndDate: null, projectDescription: '', isCurrent: true,
      }]);
    }
    setErrors(convertValuesToEmptyString(initialValues));
  }, [viewData, mode]);

  const handleAddProject = () => {
    setProjects([
      ...(projects || []),
      {
        projectNumber: ((projects?.length ?? 0) + 1).toString(),
        projectName: '', projectCity: '', projectState: '',
        projectStartDate: null, projectEndDate: null, projectDescription: '',
      },
    ]);
  };

  const addValue = (key: keyof IConsultant, newValue: string | null) => {
    const meta = consultantValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) setErrors((pre) => ({ ...pre, [key]: '' }));
      if (meta.transform) newValue = meta.transform(newValue) as string;
    }
    setValues((prev) => ({ ...prev, [key]: newValue }));
  };

  function onProjectChange(key: keyof IConsultantProject, value: string | null | boolean | dayjs.Dayjs, index: number) {
    setProjects((prev) => {
      const updated = [...(prev || [])];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  async function handleSubmitForm(event: KeyboardEvent | React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields(consultantValidationMeta, values, setErrors)) return;
    setIsSubmitting(true);
    const filteredProjects = projects?.filter((project) => !!project && Object.values(project).some((val) => !!val));
    const payload = { ...values, projects: filteredProjects, createdBy: user.firstName };
    try {
      const { data } = await createConsultant(payload);
      setResults?.((pre) => [data.data, ...(pre || [])]);
      onDrawerClose();
    } catch (error) { console.log('Error saving:', error); }
    finally { setIsSubmitting(false); }
  }

  async function handleEditSubmitForm(event: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields(consultantValidationMeta, values, setErrors)) return;
    setIsSubmitting(true);
    const filteredProjects = projects?.filter(
      (p) => p?.projectName || p?.projectCity || p?.projectState || p?.projectStartDate || p?.projectEndDate || p?.projectDescription
    );
    const payload = { ...values, projects: filteredProjects };
    try {
      if (!values._id) { toast.error('Consultant ID is missing'); return; }
      const { data } = await updateConsultant(values._id, payload);
      setResults?.((pre) => pre?.map((d) => d._id === data.data._id ? data.data : d) || []);
      onDrawerClose();
    } catch (error) { console.log('Error updating:', error); }
    finally { setIsSubmitting(false); }
  }

  async function handleDeleteConsultant() {
    if (!values._id) { toast.error('Consultant ID is missing'); return; }
    try {
      await deleteConsultant(values._id);
      setResults?.((pre) => [...(pre || [])].filter((p) => p._id !== values._id));
      onDrawerClose();
    } catch (error) { console.error('Error deleting:', error); }
  }

  const onBlur = (key: keyof IConsultant) => {
    const meta = consultantValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
  };

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
            <Button variant="outlined" size="small" onClick={() => onEdit?.(false)} sx={{ borderColor: 'grey.300', color: '#5A6A85', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>Cancel</Button>
            <Button variant="contained" type="submit" size="small" disabled={isSubmitting} sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>
              {isSubmitting ? <><CircularProgress style={{ color: '#fff', width: 14, height: 14 }} /><span style={{ paddingLeft: 6 }}>Saving</span></> : 'Submit'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="contained" size="small" onClick={() => onEdit?.(true)} sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>Edit</Button>
            {user.role.includes(UserRole['super-admin']) && (
              <Button variant="outlined" size="small" onClick={() => setOpenAlert(true)} sx={{ borderColor: alpha('#EF4444', 0.3), color: '#EF4444', '&:hover': { borderColor: '#EF4444', bgcolor: alpha('#EF4444', 0.04) }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>Delete</Button>
            )}
          </>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* ── Section 1: Consultant Info ── */}
        <SectionCard number={1} title="Consultant Info">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CustomSelectField label="Consultant Status" valueOptions={consultantStatusOptions} selectedValue={values.consultantStatus || ''} error={!!errors.consultantStatus} helperText={errors.consultantStatus} disabled={!isEditing} onChange={(v) => addValue('consultantStatus', v)} onBlur={() => onBlur('consultantStatus')} fullWidth />
          </Grid>
          <CustomTextField label="Consultant Name" fullWidth selectedValue={values.consultantName || ''} error={!!errors.consultantName} helperText={errors.consultantName} disabled={!isEditing} onChange={(e) => addValue('consultantName', e.target.value)} onBlur={() => onBlur('consultantName')} />
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CustomSelectField onBlur={() => onBlur('visaStatus')} label="Visa Status" valueOptions={visaStatusOptions} selectedValue={values.visaStatus || ''} error={!!errors.visaStatus} helperText={errors.visaStatus} disabled={!isEditing} onChange={(v) => addValue('visaStatus', v)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker views={['month', 'day']} format={dobFormate} disabled={!isEditing} label="Date of Birth"
                value={values.dob ? dayjs(values.dob) : null}
                onChange={(v) => addValue('dob', v?.format(dobFormate) || '')}
                slotProps={{ textField: { onBlur: () => onBlur('dob'), size: 'small', fullWidth: true, error: !!errors.dob, helperText: errors.dob, disabled: !isEditing, sx: pickerSx } }} />
            </LocalizationProvider>
          </Grid>
          <CustomTextField label="Current Address" fullWidth selectedValue={values.currentAddress || ''} error={!!errors.currentAddress} helperText={errors.currentAddress} disabled={!isEditing} onChange={(e) => addValue('currentAddress', e.target.value)} onBlur={() => onBlur('currentAddress')} />
          <CustomTextField label="Previous Address" fullWidth selectedValue={values.previousAddress || ''} disabled={!isEditing} onChange={(e) => addValue('previousAddress', e.target.value)} />
          <CustomTextField label="Email" fullWidth selectedValue={values.email || ''} error={errors.email} helperText={errors.email} disabled={!isEditing} onChange={(e) => addValue('email', e.target.value?.toLowerCase())} onBlur={() => onBlur('email')} />
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <PhoneField onBlur={() => onBlur('phone')} label="Phone" value={values.phone || ''} errorText={errors.phone || ''} disabled={!isEditing} onChange={(v) => addValue('phone', v)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CustomSelectField label="Consultant Timezone" valueOptions={timeZoneOptions} selectedValue={values.timeZone || ''} disabled={!isEditing} onChange={(v) => addValue('timeZone', v)} fullWidth />
          </Grid>
          <CustomTextField label="Degree Name" fullWidth selectedValue={values.degree || ''} disabled={!isEditing} onChange={(e) => addValue('degree', e.target.value)} />
          <CustomTextField label="University" fullWidth selectedValue={values.university || ''} disabled={!isEditing} onChange={(e) => addValue('university', e.target.value)} />
          <CustomTextField label="Year of Passing" fullWidth selectedValue={values.yearPassing || ''} disabled={!isEditing} onChange={(e) => addValue('yearPassing', e.target.value)} />
          <CustomTextField label="SSN" fullWidth selectedValue={values.ssn || ''} disabled={!isEditing} onChange={(e) => addValue('ssn', e.target.value)} />
          <CustomTextField label="Driving License" fullWidth selectedValue={values.dlNo || ''} error={!!errors.dlNo} helperText={errors.dlNo} disabled={!isEditing} onBlur={() => onBlur('dlNo')} onChange={(e) => addValue('dlNo', e.target.value)} />
          <CustomTextField label="Pseudo Name" fullWidth selectedValue={values.psuedoName || ''} disabled={!isEditing} onChange={(e) => addValue('psuedoName', e.target.value)} />
          <CustomTextField label="Skype ID" fullWidth selectedValue={values.skypeId || ''} disabled={!isEditing} onChange={(e) => addValue('skypeId', e.target.value)} />
          <CustomTextField label="How did you get the VISA?" fullWidth selectedValue={values.getVisa || ''} disabled={!isEditing} onChange={(e) => addValue('getVisa', e.target.value)} />
          <CustomTextField label="Year came to US" fullWidth selectedValue={values.cameToUsYear || ''} disabled={!isEditing} onChange={(e) => addValue('cameToUsYear', e.target.value)} />
          <CustomTextField label="Country of Origin" fullWidth selectedValue={values.originCountry || ''} disabled={!isEditing} onChange={(e) => addValue('originCountry', e.target.value)} />
          <CustomTextField label="Reason for Change" fullWidth selectedValue={values.lookingToChange || ''} disabled={!isEditing} onChange={(e) => addValue('lookingToChange', e.target.value)} />
        </SectionCard>

        {/* ── Section 2: Projects ── */}
        {(isEditing || !!projects?.length) && (
          <SectionCard
            number={2}
            title="Projects"
            action={isEditing ? (
              <Button
                variant="outlined" size="small" startIcon={<IconPlus size={14} />}
                onClick={handleAddProject}
                sx={{ borderColor: 'grey.300', color: '#5A6A85', textTransform: 'none', fontWeight: 600, borderRadius: '8px', fontSize: '0.75rem', py: 0.5 }}
              >
                Add Project
              </Button>
            ) : undefined}
          >
            <Grid size={12}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {projects?.length === 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No projects added yet</Typography>
                )}
                {projects?.map((project, index) => (
                  <Box
                    key={index}
                    sx={{
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Project header */}
                    <Box sx={{ px: 2, py: 1, bgcolor: alpha('#F6F9FC', 0.6), borderBottom: '1px solid', borderColor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600} color="#5A6A85">
                        Project {index + 1}
                      </Typography>
                      {isEditing && (
                        <IconButton size="small" onClick={() => setProjects((pre) => pre?.filter((_, i) => i !== index))} sx={{ color: '#EF4444', '&:hover': { bgcolor: alpha('#EF4444', 0.08) } }}>
                          <IconTrash size={15} />
                        </IconButton>
                      )}
                    </Box>

                    {/* Project fields */}
                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <CustomTextField label="Project Name" fullWidth selectedValue={project?.projectName || ''} disabled={!isEditing} onChange={(e) => onProjectChange('projectName', e.target.value, index)} />
                        <CustomTextField label="Project Domain" fullWidth selectedValue={project?.projectDomain || ''} disabled={!isEditing} onChange={(e) => onProjectChange('projectDomain', e.target.value, index)} />
                        <CustomTextField label="Project City" fullWidth selectedValue={project?.projectCity || ''} disabled={!isEditing} onChange={(e) => onProjectChange('projectCity', e.target.value, index)} />
                        <CustomTextField label="Project State" fullWidth selectedValue={project?.projectState || ''} disabled={!isEditing} onChange={(e) => onProjectChange('projectState', e.target.value, index)} />
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker views={['month', 'year']} disabled={!isEditing} label="Project Start Date"
                              value={project?.projectStartDate ? dayjs(project.projectStartDate) : null}
                              onChange={(v) => onProjectChange('projectStartDate', v, index)}
                              slotProps={{ textField: { size: 'small', fullWidth: true, disabled: !isEditing, sx: pickerSx } }} />
                          </LocalizationProvider>
                        </Grid>
                        {!project?.isCurrent && (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker views={['month', 'year']} disabled={!isEditing} label="Project End Date"
                                value={project?.projectEndDate ? dayjs(project.projectEndDate) : null}
                                onChange={(v) => onProjectChange('projectEndDate', v, index)}
                                slotProps={{ textField: { size: 'small', fullWidth: true, disabled: !isEditing, sx: pickerSx } }} />
                            </LocalizationProvider>
                          </Grid>
                        )}
                        {(isEditing || project?.isCurrent) && (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 1 }}>
                              <FormControlLabel
                                control={<Android12Switch checked={!!project?.isCurrent} disabled={!isEditing || isSubmitting} />}
                                label={<Typography variant="body2" color="text.secondary">Current Project</Typography>}
                                onChange={() => {
                                  if (isSubmitting || !isEditing) return;
                                  onProjectChange('isCurrent', !project?.isCurrent, index);
                                }}
                              />
                            </Box>
                          </Grid>
                        )}
                        <Grid size={12}>
                          <TextField
                            label="Project Description"
                            value={project?.projectDescription || ''}
                            disabled={!isEditing}
                            fullWidth
                            size="small"
                            multiline
                            minRows={2}
                            onChange={(e) => onProjectChange('projectDescription', e.target.value, index)}
                            sx={{
                              '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' },
                              '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </SectionCard>
        )}
      </Box>

      {/* Delete confirmation */}
      <Dialog open={openAlert} onClose={() => setOpenAlert(false)} sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2A3547' }}>Delete Consultant?</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this Consultant? This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAlert(false)} sx={{ textTransform: 'none', color: '#5A6A85' }}>Cancel</Button>
          <Button onClick={handleDeleteConsultant} variant="contained" sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' }, textTransform: 'none', boxShadow: 'none', borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </form>
  );
}

function PhoneField({ disabled, onChange, onBlur, label, value, errorText }: PhoneFieldProps) {
  const [maxPhoneLength, setMaxPhoneLength] = useState(15);
  const [muiTelInputInfo, setMuiTelInputInfo] = useState<MuiTelInputInfo>();

  const onPhoneChange = (value: string, info: MuiTelInputInfo) => {
    if (info.countryCode && info.countryCode !== muiTelInputInfo?.countryCode) {
      const exampleNumberLength = getExampleNumber(info.countryCode, examples)?.formatInternational().length;
      exampleNumberLength && setMaxPhoneLength(exampleNumberLength);
      setMuiTelInputInfo(info);
    }
    onChange(value);
  };

  return (
    <MuiTelInput
      disabled={disabled}
      slotProps={{ htmlInput: { maxLength: maxPhoneLength } as React.InputHTMLAttributes<HTMLInputElement> }}
      defaultCountry="US"
      onChange={onPhoneChange}
      onBlur={() => onBlur && onBlur()}
      label={label}
      value={value}
      fullWidth
      error={!!errorText}
      helperText={errorText}
      size="small"
      sx={{
        '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: disabled ? '#F6F9FC' : 'transparent' },
        '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' },
      }}
    />
  );
}

interface PhoneFieldProps {
  disabled: boolean;
  label: string;
  value: string;
  errorText?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}
