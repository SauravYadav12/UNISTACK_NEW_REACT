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
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import CustomTextField from '../../../components/text_field/CustomTextField';
import CustomSelectField from '../../../components/select/CustomSelectField';
import { useEffect, useState } from 'react';
import {
  DatePicker,
  LocalizationProvider,
  TimePicker,
} from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  intDurationOptions,
  interviewFormInitialValues,
  interviewValidationMeta,
  intModeOptions,
  intRoundOptions,
  intStatusOptions,
  intTypeOptions,
  intWithOptions,
  meetingTypeOptions,
  resultOptions,
  timeZoneOptions,
} from './interviewValues';
import {
  createInterview,
  createInterviewLog,
  deleteInterview,
  updateInterview,
} from '../../../services/interviewApi';
import InterviewLogTable from '../../../components/interview/InterviewLogTable';
import { LogOperation } from '../../../Interfaces/requirement';
import { CreateInterviewLogPayload } from '../../../Interfaces/interview';
import { dateFormate, timeFormate } from '../../../components/constants';
import ScriptModal from '../../../components/interview/ScriptModal';
import { isFieldValid, validateAllFields } from '../../../utils/validators';
import { convertValuesToEmptyString } from '../../../utils/utils';
import useHardKeySubmit from '../../../hooks/hardKeySubmitHook';
import { UserRole } from '../../../Interfaces/iUser';
import RequirementDrawer from '../../../components/requirement/RequirementDrawer';
import { SetResults } from '../../../hooks/paginationHook';
import { FormMode } from '../Requirements/Requirements';
import { useAuth } from '../../../AuthGaurd/AuthContextProvider';
import { toast } from 'react-toastify';
import ScriptBox from './ScriptBox';
import { IInterview, IRequirement, ITeam } from '../../../Interfaces/types';
import { tokens } from '../../../theme/theme';

interface iProps {
  viewData?: IInterview;
  requirement?: IRequirement;
  teamsList: ITeam[];
  isEditing?: boolean;
  hideButtons?: boolean;
  mode?: FormMode;
  disableGenerateScript?: boolean;
  disableDelete?: boolean;
  archive?: boolean;
  /** Show the "View logs" affordance in view mode. Mirrors the
   *  requirement form's `showLogs` prop — opt-in so callers that
   *  embed the form in compact contexts can hide it. */
  showLogs?: boolean;
  onDrawerClose?: () => void;
  onCreate?: () => void;
  onEdit?: (editMode: boolean) => void;
  setResults?: SetResults;
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

export default function InterviewForm(props: iProps) {
  const {
    viewData, requirement, teamsList, mode = 'view', isEditing = false,
    hideButtons = false, disableGenerateScript, disableDelete, archive,
    showLogs = false,
    onEdit, onDrawerClose, setResults, onCreate,
  } = props;
  const [values, setValues] = useState<Partial<IInterview>>(interviewFormInitialValues);
  const [errors, setErrors] = useState<{ [key: string]: string }>(convertValuesToEmptyString(interviewFormInitialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [scriptModal, setScriptModal] = useState(false);
  const [reqDrawer, setReqDrawer] = useState<string>();
  const user = useAuth().iUser;

  useHardKeySubmit(
    { onSubmit: (e) => { mode === 'add' && handleSubmitForm(e); mode === 'edit' && handleEditSubmitForm(e); } },
    [values, errors, isEditing, hideButtons, mode, viewData, requirement]
  );

  useEffect(() => { requirement && initializeValuesToCreateInterview(requirement); }, [requirement]);
  useEffect(() => {
    if (mode === 'view' || mode === 'edit') setValues(viewData || {});
    setErrors(convertValuesToEmptyString(interviewFormInitialValues));
  }, [mode, viewData]);

  function initializeValuesToCreateInterview(req: IRequirement) {
    if (!req) return;
    // Marketing credit follows the requirement's `assignedTo` — that
    // person owns the lead and should get the performance credit when the
    // interview gets confirmed / completed, regardless of who is actually
    // clicking "Create interview" (support / admin often do this on behalf
    // of the marketer). Falls back to the current user only when the req
    // has no assignee — defensive for legacy standalones; the multi-assign
    // flow always sets assignedTo on the child rows.
    const reqAssignedTo = (req.assignedTo || '').trim();
    const reqAssignedRef = req.assignedToRef;
    const marketingPerson = reqAssignedTo
      ? reqAssignedTo
      : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    const marketingPersonRef = reqAssignedRef || user?.id;
    setValues((prev) => ({
      ...prev, consultant: req.appliedFor, consultantRef: req.appliedForRef,
      clientName: req.clientCompany, reqID: req.reqID, vendorCompany: req.vendorCompany,
      primeVendorCompany: req.primeVendorCompany, jobDescription: req.jobDescription,
      jobTitle: req.jobTitle, duration: req.duration, taxType: req.taxType,
      interviewStatus: intStatusOptions[0] || '',
      marketingPerson, marketingPersonRef,
    }));
  }

  const addValue = (key: keyof IInterview, newValue: unknown) => {
    const meta = interviewValidationMeta.find((m) => m.field === key);
    if (meta) {
      if (errors[key] && isFieldValid(meta, newValue)) setErrors((pre) => ({ ...pre, [key]: '' }));
      if (meta.transform) newValue = meta.transform(newValue);
    }
    setValues((pre) => {
      const u = { ...pre, [key]: newValue };
      const { interviewWith = '', interviewDuration = '', interviewType = '', interviewViaMode = '', meetingType = '', vendorCompany = '', primeVendorCompany = '', clientName = '' } = u;
      const sl = (t: string) => `${interviewDuration}_${interviewType}_${interviewViaMode}_${meetingType}_${t}`;
      if (interviewWith === 'Vendor') u.subjectLine = sl(`Interview_With_Vendor_${vendorCompany}`);
      else if (interviewWith === 'IMP/PV') u.subjectLine = sl(`Interview_With_IMP/PV_${primeVendorCompany}`);
      else if (interviewWith === 'Client') u.subjectLine = sl(`Interview_With_Client_${clientName}`);
      return u;
    });
  };

  /**
   * Helper to post an activity-log entry after a successful create / update
   * / delete. Mirrors `RequirementsForm.createLog` exactly — fire-and-
   * forget; we don't block the UI on the log write or surface its errors
   * to the user (the underlying business write already succeeded). A
   * failed log entry shows in the console only.
   */
  async function createLog(
    id: string,
    data: Record<string, unknown>,
    operation: LogOperation,
  ) {
    if (!user) return;
    try {
      const logPayload: CreateInterviewLogPayload = {
        interviewRef: id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        userRef: user._id,
        oldData: values as Record<string, unknown>,
        newData: data,
        operation,
      };
      await createInterviewLog(logPayload);
    } catch (e) {
      console.error('Failed to write interview log:', e);
    }
  }

  async function handleSubmitForm(event: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateAllFields(interviewValidationMeta, values, setErrors)) return;
    setIsSubmitting(true);
    try {
      const { data } = await createInterview(values);
      setResults?.((pre) => [data.data, ...pre]);
      if (data.data?._id) {
        await createLog(data.data._id, values as Record<string, unknown>, 'create');
      }
      onCreate?.();
      onDrawerClose?.();
    } catch (e) { console.log('Error saving:', e); }
    finally { setIsSubmitting(false); }
  }

  async function handleEditSubmitForm(event: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) {
    event.preventDefault();
    if (isSubmitting || !values._id) return;
    if (!validateAllFields(interviewValidationMeta, values, setErrors)) return;
    setIsSubmitting(true);
    try {
      const { data } = await updateInterview(values._id, values);
      setResults?.((pre) => pre.map((d) => d._id === data.data?._id ? data.data : d));
      await createLog(values._id, values as Record<string, unknown>, 'update');
      onDrawerClose?.();
    } catch (e) { console.log('Error updating:', e); }
    finally { setIsSubmitting(false); }
  }

  const handleSaveScript = async (script: string) => {
    if (!values._id) { toast.error('Missing interview id'); return; }
    try {
      const { data } = await updateInterview(values._id, { script });
      setValues({ ...values, script });
      setResults?.((pre) => pre.map((d) => d._id === data.data?._id ? data.data : d));
      // Script edits are a real update — log them too so the activity
      // history shows when a script was last refreshed.
      await createLog(values._id, { script }, 'update');
    }
    catch { toast.error('Failed to save'); }
  };

  async function handleDeleteInterview() {
    if (!values._id) { toast.error('Missing interview id'); return; }
    try {
      // Write the delete log FIRST while we still have an interview ref
      // — once the delete lands, the `interviewRef` FK would be orphaned,
      // but the log row keeps the historical record (same pattern as
      // requirement deletes).
      await createLog(values._id, values as Record<string, unknown>, 'delete');
      await deleteInterview(values._id);
      setResults?.((pre) => pre.filter((p) => p._id !== values._id));
      onDrawerClose?.();
    } catch (e) { console.error('Error deleting:', e); }
  }

  const onBlur = (key: keyof typeof values) => {
    const meta = interviewValidationMeta.find((m) => m.field === key);
    meta && isFieldValid(meta, values[key], setErrors);
  };

  if (!values) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress size={25} /></Box>;

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); mode === 'add' && handleSubmitForm(e as any); mode === 'edit' && handleEditSubmitForm(e as any); }}>

        {/* ── Top bar: Script + Action buttons ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 3, pb: 2.5, borderBottom: '1px solid', borderColor: 'grey.200' }}>
          <Box>
            {!!values?.script && mode === 'view' && <ScriptBox scriptUrl={values.script} />}
          </Box>
          {!hideButtons && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {mode === 'add' ? (
                <Button variant="contained" type="submit" disabled={isSubmitting} size="small" sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>
                  {isSubmitting ? <><CircularProgress style={{ color: '#fff', width: 14, height: 14 }} /><span style={{ paddingLeft: 6 }}>Saving</span></> : 'Submit'}
                </Button>
              ) : isEditing ? (
                <>
                  <Button variant="outlined" size="small" onClick={() => { setValues(viewData || {}); onEdit?.(false); }} sx={{ borderColor: 'grey.300', color: '#5A6A85', textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>Cancel</Button>
                  <Button variant="contained" type="submit" size="small" disabled={isSubmitting} sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>
                    {isSubmitting ? <><CircularProgress style={{ color: '#fff', width: 14, height: 14 }} /><span style={{ paddingLeft: 6 }}>Saving</span></> : 'Submit'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="contained" size="small" onClick={() => onEdit?.(true)} sx={{ bgcolor: '#032840', color: '#fff', '&:hover': { bgcolor: '#0A3555' }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2.5, boxShadow: 'none' }}>Edit</Button>
                  {!disableGenerateScript && !['Interview Cancelled', 'Interview Tentative'].includes(values.interviewStatus || '') && (
                    <Button variant="outlined" size="small" onClick={() => setScriptModal(true)} sx={{ borderColor: tokens.colors.blue, color: tokens.colors.blue, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>
                      {values.script ? 'Re-generate Script' : 'Generate Script'}
                    </Button>
                  )}
                  {!disableDelete && user?.role.includes(UserRole['super-admin']) && (
                    <Button variant="outlined" size="small" onClick={() => setOpenAlert(true)} sx={{ borderColor: alpha('#EF4444', 0.3), color: '#EF4444', '&:hover': { borderColor: '#EF4444', bgcolor: alpha('#EF4444', 0.04) }, textTransform: 'none', fontWeight: 600, borderRadius: '8px', px: 2 }}>Delete</Button>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* ── Section 1: Interview Details ── */}
          <SectionCard number={1} title="Interview Details">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker format={dateFormate} disabled={!isEditing} label="Interview Date"
                  value={values.interviewDate ? dayjs(values.interviewDate) : null}
                  onChange={(v) => addValue('interviewDate', v)}
                  slotProps={{ textField: { onBlur: () => onBlur('interviewDate'), size: 'small', fullWidth: true, error: !!errors.interviewDate, helperText: errors.interviewDate, disabled: !isEditing, sx: pickerSx } }} />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker onClose={() => onBlur('interviewTime')} disabled={!isEditing} format={timeFormate} label="Interview Time"
                  value={values.interviewTime ? dayjs(values.interviewTime, timeFormate) : null}
                  onChange={(v) => addValue('interviewTime', v)}
                  slotProps={{ textField: { onBlur: () => onBlur('interviewTime'), size: 'small', fullWidth: true, error: !!errors.interviewTime, helperText: errors.interviewTime, disabled: !isEditing, sx: pickerSx } }} />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Time Zone" valueOptions={timeZoneOptions} selectedValue={values.timeZone || ''} onChange={(v) => addValue('timeZone', v)} fullWidth disabled={!isEditing} /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Interview Type" onBlur={() => onBlur('interviewType')} valueOptions={intTypeOptions} selectedValue={values.interviewType || ''} error={!!errors.interviewType} helperText={errors.interviewType} disabled={!isEditing} freeSolo onChange={(v) => addValue('interviewType', v)} fullWidth /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Interview Status" valueOptions={intStatusOptions} selectedValue={values.interviewStatus || ''} onChange={(v) => addValue('interviewStatus', v)} fullWidth disabled={!isEditing} /></Grid>
            <CustomTextField label="Consultant" fullWidth selectedValue={values.consultant || ''} disabled onChange={(e) => addValue('consultant', e.target.value)} />
            <CustomTextField label="Marketing Person" fullWidth selectedValue={values.marketingPerson || ''} disabled onChange={(e) => addValue('marketingPerson', e.target.value)} />
            <CustomTextField label="Vendor Company" fullWidth selectedValue={values.vendorCompany || ''} disabled onChange={(e) => addValue('vendorCompany', e.target.value)} />
            <CustomTextField label="Prime Vendor Company" fullWidth selectedValue={values.primeVendorCompany || ''} disabled onChange={(e) => addValue('primeVendorCompany', e.target.value)} />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Interview With" onBlur={() => onBlur('interviewWith')} valueOptions={intWithOptions} selectedValue={values.interviewWith || ''} error={!!errors.interviewWith} helperText={errors.interviewWith} onChange={(v) => addValue('interviewWith', v)} fullWidth freeSolo disabled={!isEditing} /></Grid>
            <CustomTextField label="Code Link" fullWidth selectedValue={values.codeLink || ''} disabled={!isEditing} onChange={(e) => addValue('codeLink', e.target.value)} />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Result" valueOptions={resultOptions} selectedValue={values.intResult || ''} onChange={(v) => addValue('intResult', v)} fullWidth disabled={!isEditing} /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Interview Round" valueOptions={intRoundOptions} selectedValue={values.interviewRound || ''} onChange={(v) => addValue('interviewRound', v)} fullWidth freeSolo disabled={!isEditing} /></Grid>
            <CustomTextField label="Tentative Reason" fullWidth selectedValue={values.tentativeReason || ''} onChange={(e) => addValue('tentativeReason', e.target.value)} disabled={!isEditing} />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Interview via Mode" onBlur={() => onBlur('interviewViaMode')} valueOptions={intModeOptions} selectedValue={values.interviewViaMode || ''} error={!!errors.interviewViaMode} helperText={errors.interviewViaMode} onChange={(v) => addValue('interviewViaMode', v)} fullWidth freeSolo disabled={!isEditing} /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Meeting Type" valueOptions={meetingTypeOptions} selectedValue={values.meetingType || ''} onChange={(v) => addValue('meetingType', v)} fullWidth freeSolo disabled={!isEditing} /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><CustomSelectField label="Interview Duration" onBlur={() => onBlur('interviewDuration')} valueOptions={intDurationOptions} selectedValue={values.interviewDuration || ''} error={!!errors.interviewDuration} helperText={errors.interviewDuration} onChange={(v) => addValue('interviewDuration', v)} fullWidth freeSolo disabled={!isEditing} /></Grid>
            <Grid size={12}>
              <TextField label="Remarks / Comments" value={values.remarks || ''} disabled={!isEditing} fullWidth size="small" multiline minRows={2} onChange={(e) => addValue('remarks', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
          </SectionCard>

          {/* ── Section 2: Details of Interview ── */}
          <SectionCard number={2} title="Details of Interview">
            <Grid size={12}>
              <TextField label="Subject Line" value={values.subjectLine || ''} disabled fullWidth size="small" multiline sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#F6F9FC' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
            <Grid size={12}>
              <TextField label="Interview / Interviewer / Mode Details" value={values.interviewMode || ''} disabled={!isEditing} fullWidth size="small" multiline onChange={(e) => addValue('interviewMode', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
            <Grid size={12}>
              <TextField label="Interview Link" value={values.interviewLink || ''} disabled={!isEditing} fullWidth size="small" multiline onChange={(e) => addValue('interviewLink', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
            <Grid size={12}>
              <TextField label="Interview Focus" value={values.interviewFocus || ''} disabled={!isEditing} fullWidth size="small" multiline onChange={(e) => addValue('interviewFocus', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
            <Grid size={12}>
              <TextField label="Special Note" value={values.specialNote || ''} disabled={!isEditing} fullWidth size="small" multiline onChange={(e) => addValue('specialNote', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
            <Grid size={12}>
              <TextField label="Job Description" value={values.jobDescription || ''} disabled fullWidth size="small" multiline minRows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#F6F9FC' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
          </SectionCard>

          {/* ── Section 3: Interview Feedback ── */}
          <SectionCard number={3} title="Interview Feedback">
            <Grid size={12}>
              <TextField label="Feedback" value={values.interviewFeedback || ''} disabled={!isEditing} fullWidth size="small" multiline minRows={2} onChange={(e) => addValue('interviewFeedback', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: !isEditing ? '#F6F9FC' : 'transparent' }, '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#2A3547' } }} />
            </Grid>
            <CustomTextField label="Job Title" fullWidth disabled selectedValue={values.jobTitle || ''} onChange={(e) => addValue('jobTitle', e.target.value)} />
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              {/* Wrapper owns the click — MUI sets `pointer-events: none`
                  on a disabled input, so an `onClick` on the TextField
                  never fired on the value area (only the narrow label).
                  The outer Box receives the click and we let events pass
                  through the TextField via `pointerEvents: 'none'`. */}
              <Box
                onClick={() => values.reqID && setReqDrawer(values.reqID)}
                sx={{ cursor: values.reqID ? 'pointer' : 'default' }}
              >
                <TextField
                  label="Req ID" value={values.reqID || ''} disabled fullWidth size="small"
                  sx={{
                    pointerEvents: 'none',
                    '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#F6F9FC' },
                    '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#0A3555', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' },
                  }}
                />
              </Box>
            </Grid>
            <CustomTextField label="Client Name" fullWidth disabled selectedValue={values.clientName || ''} onChange={(e) => addValue('clientName', e.target.value)} />
            <CustomTextField label="Tax Type" fullWidth disabled selectedValue={values.taxType?.toString() || ''} onChange={(e) => addValue('taxType', e.target.value)} />
            <CustomTextField label="Duration" fullWidth disabled selectedValue={values.duration?.toString() || ''} onChange={(e) => addValue('duration', e.target.value)} />
          </SectionCard>

          {/* ── Section 4: Interviewee Candidate Details ── */}
          {user && user.role.some(role => [UserRole.admin, UserRole['super-admin'], UserRole.hr].includes(role)) && (
            <SectionCard number={4} title="Interviewee Candidate Details">
              {isEditing ? (
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <CustomSelectField label="Team" valueOptions={teamsList.map((c) => c.teamName || '')} selectedValue={values.candidateName || ''} onChange={(v) => { const _id = teamsList?.find((c) => c.teamName === v)?._id; addValue('candidateName', v); addValue('candidateRef', _id); }} fullWidth />
                </Grid>
              ) : (
                <CustomTextField label="Team" fullWidth disabled={!isEditing} selectedValue={values.candidateName || ''} onChange={(e) => addValue('candidateName', e.target.value)} />
              )}
              <CustomTextField label="Tech Stack" fullWidth disabled={!isEditing} selectedValue={values.teckStack || ''} onChange={(e) => addValue('teckStack', e.target.value)} />
              <CustomTextField label="Developer Name" fullWidth selectedValue={values.developerName || ''} disabled={!isEditing} onChange={(e) => addValue('developerName', e.target.value)} />
            </SectionCard>
          )}

        </Box>
      </form>

      {/* Activity log — only in view mode (matches RequirementsForm
          pattern), gated by the opt-in `showLogs` prop so embedded
          callers can hide it when space is tight. */}
      {showLogs && mode === 'view' && viewData?._id && (
        <InterviewLogTable interviewObjectId={viewData._id} />
      )}

      {scriptModal && viewData && (
        <ScriptModal interview={{ ...viewData, ...values }} open={scriptModal} onClose={() => setScriptModal(!scriptModal)} onSave={handleSaveScript} />
      )}

      {values.reqID && (
        <RequirementDrawer open={Boolean(reqDrawer)} onClose={() => setReqDrawer(undefined)} reqID={values.reqID} archive={archive} hideButtons={archive} />
      )}

      {/* Delete confirmation */}
      <Dialog open={openAlert} onClose={() => setOpenAlert(false)} sx={{ '& .MuiDialog-paper': { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2A3547' }}>Delete Interview?</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this Interview? This action cannot be undone.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAlert(false)} sx={{ textTransform: 'none', color: '#5A6A85' }}>Cancel</Button>
          <Button onClick={handleDeleteInterview} variant="contained" sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' }, textTransform: 'none', boxShadow: 'none', borderRadius: '8px' }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
