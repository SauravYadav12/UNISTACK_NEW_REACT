import { useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Country, State, City } from 'country-state-city';
import { alpha } from '@mui/material/styles';
import {
  IconBriefcase,
  IconCalendar,
  IconCertificate,
  IconCheck,
  IconCloudUpload,
  IconFileText,
  IconMail,
  IconMapPin,
  IconPhoto,
  IconReceipt,
  IconSchool,
  IconSend,
  IconSparkles,
  IconUser,
  IconUserCircle,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import { axiosClient } from '../../config/axios.config';
import {
  resolvePublicToken,
  submitPublicForm,
} from '../../services/onboardingApi';
import { ResolveTokenResult } from '../../Interfaces/onboarding';
import LinkUnavailable from './LinkUnavailable';
import {
  isValidEmail,
  isValidPhone,
  digitsOnly,
} from '../../utils/onboardingValidators';
import { tokens } from '../../theme';

/**
 * Candidate's public onboarding form page.
 *
 * Visual design notes (rewrite):
 *   - Hero card at the top: brand band + "Welcome aboard, X" + the
 *     position/start-date chips + a live completion meter.
 *   - Each form section sits in its own card with an accent stripe +
 *     icon (same SectionTitle pattern used across the portal).
 *   - Document uploads render as a grid of file tiles with file-type
 *     icons, photo thumbnails, and inline replace/remove affordances.
 *   - Reference blocks use avatar bubbles for visual rhythm.
 *   - Sticky bottom action bar with progress + submit so the candidate
 *     never has to scroll back to find the submit button.
 *
 * Functional behaviour (unchanged): resolveToken on mount, uploads
 * via the public `/p/onboarding/:token/upload` endpoint, validators
 * from `utils/onboardingValidators`, submit POSTs the assembled
 * payload back through `submitPublicForm`.
 */

interface FormState {
  // pre-filled, locked
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;

  dob: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  // ISO codes track the selected country / state so the city dropdown
  // can chain off them. The submitted payload still uses the human
  // names (country / state / city) so the backend stays unchanged.
  countryIso: string;
  stateIso: string;
  referredBy: string;
  highestDegree: string;
  collegeName: string;
  degreeCompletionDate: string;

  references: { name: string; relationship: string; phone: string; email: string }[];

  documents: {
    resume?: string;
    passportPhoto?: string;
    panCard?: string;
    addressProof?: string;
    degreeCopy?: string;
    lastThreeSalarySlips: string[];
  };
}

function emptyForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    dob: '',
    address1: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
    countryIso: 'IN',
    stateIso: '',
    referredBy: '',
    highestDegree: '',
    collegeName: '',
    degreeCompletionDate: '',
    references: [
      { name: '', relationship: '', phone: '', email: '' },
      { name: '', relationship: '', phone: '', email: '' },
    ],
    documents: {
      lastThreeSalarySlips: [],
    },
  };
}

export default function OnboardingFormPage() {
  const { token = '' } = useParams<{ token: string }>();
  const [resolved, setResolved] = useState<ResolveTokenResult | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [proposedStartDate, setProposedStartDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    resolvePublicToken(token).then((r) => {
      setResolved(r);
      if (r.ok) {
        const c = r.data.candidate;
        setForm((p) => ({
          ...p,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          phone: c.phone,
          position: c.position,
        }));
        setProposedStartDate(c.proposedStartDate);
      }
      setLoading(false);
    });
  }, [token]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }
  function setDoc<K extends keyof FormState['documents']>(
    key: K,
    value: FormState['documents'][K],
  ) {
    setForm((p) => ({ ...p, documents: { ...p.documents, [key]: value } }));
  }

  async function uploadOne(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axiosClient.post<{ data: { url: string } }>(
        `/p/onboarding/${token}/upload`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data?.data?.url || null;
    } catch (e) {
      toast.error(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Upload failed.',
      );
      return null;
    }
  }

  async function handleUpload(
    field: keyof FormState['documents'],
    file?: File | null,
  ) {
    if (!file) return;
    const url = await uploadOne(file);
    if (!url) return;
    if (field === 'lastThreeSalarySlips') {
      setForm((p) => ({
        ...p,
        documents: {
          ...p.documents,
          lastThreeSalarySlips: [
            ...(p.documents.lastThreeSalarySlips || []),
            url,
          ].slice(0, 3),
        },
      }));
    } else {
      setDoc(field, url);
    }
  }

  // ── Validation (unchanged) ───────────────────────────────────────
  const candidatePhoneOk = !form.phone || isValidPhone(form.phone);
  const refsOk = form.references.every(
    (r) =>
      r.name && isValidEmail(r.email) && (!r.phone || isValidPhone(r.phone)),
  );
  function valid() {
    return Boolean(
      form.dob &&
        form.address1.trim() &&
        form.city.trim() &&
        form.highestDegree.trim() &&
        form.collegeName.trim() &&
        candidatePhoneOk &&
        refsOk &&
        form.documents.resume &&
        form.documents.panCard,
    );
  }

  // ── Completion meter ─────────────────────────────────────────────
  // Counts how many of the required items the candidate has filled so
  // we can paint a percent bar in the hero + sticky footer. Order of
  // the keys mirrors the visible order in the form so the count goes
  // up as the candidate scrolls and fills things in.
  // ── Country / State / City option lists ──────────────────────────
  // The library reads from a bundled ISO dataset — no network calls.
  // Country list is static; state + city are derived from the
  // currently-selected ISO codes so the dropdowns cascade naturally.
  const countryOptions = useMemo(() => Country.getAllCountries(), []);
  const stateOptions = useMemo(
    () =>
      form.countryIso ? State.getStatesOfCountry(form.countryIso) : [],
    [form.countryIso],
  );
  const cityOptions = useMemo(
    () =>
      form.countryIso && form.stateIso
        ? City.getCitiesOfState(form.countryIso, form.stateIso)
        : [],
    [form.countryIso, form.stateIso],
  );

  const REQUIRED_CHECKS = useMemo(
    () => [
      Boolean(form.dob),
      Boolean(form.address1.trim()),
      Boolean(form.city.trim()),
      Boolean(form.highestDegree.trim()),
      Boolean(form.collegeName.trim()),
      Boolean(form.documents.resume),
      Boolean(form.documents.panCard),
      Boolean(form.references[0]?.name && isValidEmail(form.references[0]?.email)),
      Boolean(form.references[1]?.name && isValidEmail(form.references[1]?.email)),
    ],
    [form],
  );
  const completedCount = REQUIRED_CHECKS.filter(Boolean).length;
  const totalRequired = REQUIRED_CHECKS.length;
  const completionPct = Math.round((completedCount / totalRequired) * 100);

  async function submit() {
    if (!valid()) {
      toast.error(
        'Please complete every required field and upload the required documents before submitting.',
      );
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicForm(token, {
        dob: form.dob,
        address1: form.address1,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
        referredBy: form.referredBy,
        highestDegree: form.highestDegree,
        collegeName: form.collegeName,
        degreeCompletionDate: form.degreeCompletionDate,
        references: form.references,
        documents: form.documents,
      });
      setDone(true);
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || 'Submission failed.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!resolved || !resolved.ok) {
    return (
      <LinkUnavailable
        reason={resolved?.ok === false ? resolved.reason : 'not-found'}
      />
    );
  }

  if (done) {
    return <SuccessShell firstName={form.firstName} />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: tokens.gradients.warmGlow,
        pt: { xs: 3, sm: 5 },
        pb: 14, // breathing room so the sticky footer doesn't cover the signature
      }}
    >
      <Container maxWidth="md">
        {/* ── Hero card ──────────────────────────────────────── */}
        <HeroCard
          firstName={form.firstName}
          position={form.position}
          proposedStartDate={proposedStartDate}
          completedCount={completedCount}
          totalRequired={totalRequired}
          completionPct={completionPct}
        />

        {/* ── Personal details ───────────────────────────────── */}
        <SectionCard
          accent={tokens.colors.pink}
          icon={<IconUserCircle size={16} />}
          title="Personal details"
          subtitle="Locked fields come from HR — drop us a note if anything looks off."
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="First name"
                value={form.firstName}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Last name"
                value={form.lastName}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                value={form.email}
                disabled
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone (10 digits)"
                value={form.phone || ''}
                onChange={(e) =>
                  set('phone', digitsOnly(e.target.value, 10))
                }
                inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
                error={Boolean(form.phone) && !isValidPhone(form.phone)}
                helperText={
                  form.phone && !isValidPhone(form.phone)
                    ? 'Phone must be exactly 10 digits.'
                    : ' '
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                size="small"
                type="date"
                label="Date of birth"
                InputLabelProps={{ shrink: true }}
                value={form.dob}
                onChange={(e) => set('dob', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Referred by"
                placeholder="Who told you about this role?"
                value={form.referredBy}
                onChange={(e) => set('referredBy', e.target.value)}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── Address ────────────────────────────────────────── */}
        <SectionCard
          accent={tokens.colors.blue}
          icon={<IconMapPin size={16} />}
          title="Address"
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                size="small"
                label="Address"
                placeholder="House / flat, street, locality"
                value={form.address1}
                onChange={(e) => set('address1', e.target.value)}
              />
            </Grid>
            {/* Country dropdown — default India, full ISO list.
                Changing the country resets state + city since their
                lists are derived from the active country. */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Autocomplete
                size="small"
                options={countryOptions}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.isoCode === b.isoCode}
                value={
                  countryOptions.find((c) => c.isoCode === form.countryIso) ||
                  null
                }
                onChange={(_, v) =>
                  setForm((p) => ({
                    ...p,
                    country: v?.name || '',
                    countryIso: v?.isoCode || '',
                    state: '',
                    stateIso: '',
                    city: '',
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="Country"
                    placeholder="Pick a country"
                  />
                )}
              />
            </Grid>
            {/* State dropdown — derived from the selected country. */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Autocomplete
                size="small"
                options={stateOptions}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.isoCode === b.isoCode}
                disabled={!form.countryIso || stateOptions.length === 0}
                value={
                  stateOptions.find((s) => s.isoCode === form.stateIso) || null
                }
                onChange={(_, v) =>
                  setForm((p) => ({
                    ...p,
                    state: v?.name || '',
                    stateIso: v?.isoCode || '',
                    city: '',
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="State"
                    placeholder={
                      stateOptions.length === 0
                        ? 'Pick a country first'
                        : 'Pick a state'
                    }
                  />
                )}
              />
            </Grid>
            {/* City dropdown — derived from country + state. freeSolo so
                small towns / villages not in the dataset can still be
                typed (the library has wide coverage but not 100%). */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={cityOptions.map((c) => c.name)}
                value={form.city}
                onChange={(_, v) =>
                  set('city', typeof v === 'string' ? v : v || '')
                }
                onInputChange={(_, v) => set('city', v || '')}
                disabled={!form.stateIso || cityOptions.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    label="City"
                    placeholder={
                      cityOptions.length === 0
                        ? 'Pick a state first'
                        : 'Pick or type a city'
                    }
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="ZIP / PIN"
                value={form.zip}
                onChange={(e) => set('zip', e.target.value)}
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── Education ──────────────────────────────────────── */}
        <SectionCard
          accent={tokens.colors.yellowDark}
          icon={<IconSchool size={16} />}
          title="Education"
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                required
                size="small"
                label="Highest degree"
                placeholder="e.g. B.Tech / M.A. / MBA"
                value={form.highestDegree}
                onChange={(e) => set('highestDegree', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                size="small"
                label="College / University"
                value={form.collegeName}
                onChange={(e) => set('collegeName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Completed on"
                InputLabelProps={{ shrink: true }}
                value={form.degreeCompletionDate}
                onChange={(e) =>
                  set('degreeCompletionDate', e.target.value)
                }
              />
            </Grid>
          </Grid>
        </SectionCard>

        {/* ── Documents ─────────────────────────────────────── */}
        <SectionCard
          accent={tokens.colors.pink}
          icon={<IconFileText size={16} />}
          title="Documents"
          subtitle="PDF, JPG or PNG. Max 10 MB per file. Required documents are marked *."
        >
          <Grid container spacing={1.5}>
            <DocTile
              label="Resume"
              required
              url={form.documents.resume}
              icon={<IconFileText size={18} />}
              onFile={(f) => handleUpload('resume', f)}
              onClear={() => setDoc('resume', undefined)}
            />
            <DocTile
              label="Passport-size photo"
              required
              isImage
              accept="image/*"
              url={form.documents.passportPhoto}
              icon={<IconPhoto size={18} />}
              onFile={(f) => handleUpload('passportPhoto', f)}
              onClear={() => setDoc('passportPhoto', undefined)}
            />
            <DocTile
              label="PAN card"
              required
              url={form.documents.panCard}
              icon={<IconCertificate size={18} />}
              onFile={(f) => handleUpload('panCard', f)}
              onClear={() => setDoc('panCard', undefined)}
            />
            <DocTile
              label="Address proof"
              url={form.documents.addressProof}
              icon={<IconMapPin size={18} />}
              onFile={(f) => handleUpload('addressProof', f)}
              onClear={() => setDoc('addressProof', undefined)}
            />
            <DocTile
              label="Degree copy / final marksheets"
              url={form.documents.degreeCopy}
              icon={<IconSchool size={18} />}
              onFile={(f) => handleUpload('degreeCopy', f)}
              onClear={() => setDoc('degreeCopy', undefined)}
            />
            {/* Salary slips — multi-upload up to 3 */}
            {form.documents.lastThreeSalarySlips.map((u, i) => (
              <DocTile
                key={`slip-${i}`}
                label={`Salary slip ${i + 1}`}
                url={u}
                icon={<IconReceipt size={18} />}
                onFile={() => {}}
                onClear={() =>
                  setForm((p) => ({
                    ...p,
                    documents: {
                      ...p.documents,
                      lastThreeSalarySlips:
                        p.documents.lastThreeSalarySlips.filter(
                          (_, idx) => idx !== i,
                        ),
                    },
                  }))
                }
              />
            ))}
            {form.documents.lastThreeSalarySlips.length < 3 && (
              <DocTile
                label={`Salary slip ${form.documents.lastThreeSalarySlips.length + 1}`}
                hint="Last 3 months — add up to 3 files"
                url={undefined}
                icon={<IconReceipt size={18} />}
                onFile={(f) => handleUpload('lastThreeSalarySlips', f)}
                onClear={() => {}}
              />
            )}
          </Grid>
        </SectionCard>

        {/* ── References ────────────────────────────────────── */}
        <SectionCard
          accent={tokens.colors.blue}
          icon={<IconUsers size={16} />}
          title="References"
          subtitle="Two professional references HR can reach out to during background verification."
        >
          <Grid container spacing={2}>
            {form.references.map((r, i) => (
              <Grid size={{ xs: 12 }} key={i}>
                <ReferenceCard
                  index={i + 1}
                  reference={r}
                  onChange={(patch) =>
                    setForm((p) => {
                      const next = [...p.references];
                      next[i] = { ...next[i], ...patch };
                      return { ...p, references: next };
                    })
                  }
                />
              </Grid>
            ))}
          </Grid>
        </SectionCard>

        {/* Signature is no longer collected on the onboarding form —
            the candidate signs only on the offer letter step where it
            has legal meaning. The submit-button + acceptance copy in
            the sticky footer below carries the same intent for this
            data-entry step. */}
      </Container>

      {/* ── Sticky bottom action bar ────────────────────────── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          py: 1.5,
          px: 2,
          bgcolor: alpha('#fff', 0.95),
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid',
          borderColor: 'divider',
          zIndex: 10,
        }}
      >
        <Container maxWidth="md">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1, width: '100%' }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: tokens.colors.lightText,
                    letterSpacing: 0.3,
                  }}
                >
                  {completedCount}/{totalRequired} required items complete
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: tokens.colors.pink,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {completionPct}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={completionPct}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(tokens.colors.pink, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: tokens.gradients.brand,
                  },
                }}
              />
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={
                submitting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IconSend size={16} />
                )
              }
              onClick={submit}
              disabled={submitting || !valid()}
              sx={{ minWidth: 200 }}
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components

interface HeroProps {
  firstName: string;
  position: string;
  proposedStartDate?: string;
  completedCount: number;
  totalRequired: number;
  completionPct: number;
}

function HeroCard({
  firstName,
  position,
  proposedStartDate,
  completedCount,
  totalRequired,
  completionPct,
}: HeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        sx={{
          position: 'relative',
          borderRadius: 4,
          overflow: 'hidden',
          mb: 3,
          color: '#fff',
          background: `linear-gradient(135deg, ${tokens.colors.pink} 0%, ${tokens.colors.lightText} 100%)`,
          boxShadow: tokens.shadows.soft4,
        }}
      >
        {/* Decorative blobs */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: alpha(tokens.colors.yellow, 0.15),
            filter: 'blur(20px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: alpha(tokens.colors.blue, 0.18),
            filter: 'blur(24px)',
          }}
        />
        <Box sx={{ position: 'relative', p: { xs: 3, sm: 4 } }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 1.5 }}
          >
            <IconSparkles size={16} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              Unicodez Onboarding
            </Typography>
          </Stack>

          <Typography
            sx={{
              fontSize: { xs: 26, sm: 32 },
              fontWeight: 900,
              lineHeight: 1.15,
              mb: 0.5,
            }}
          >
            Welcome aboard, {firstName || 'there'}!
          </Typography>
          <Typography
            sx={{
              fontSize: 14,
              opacity: 0.9,
              maxWidth: 560,
              mb: 2.5,
            }}
          >
            We're excited to have you join us. Please complete the form
            below so HR can take the next step.
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap' }} useFlexGap>
            <Chip
              icon={<IconBriefcase size={14} />}
              label={position || 'Position'}
              sx={{
                bgcolor: alpha('#fff', 0.18),
                color: '#fff',
                fontWeight: 700,
                '& .MuiChip-icon': { color: '#fff' },
              }}
            />
            {proposedStartDate && (
              <Chip
                icon={<IconCalendar size={14} />}
                label={`Start ${moment(proposedStartDate).format('DD MMM YYYY')}`}
                sx={{
                  bgcolor: alpha('#fff', 0.18),
                  color: '#fff',
                  fontWeight: 700,
                  '& .MuiChip-icon': { color: '#fff' },
                }}
              />
            )}
          </Stack>

          {/* Inline progress */}
          <Box>
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 0.5 }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  opacity: 0.9,
                }}
              >
                {completedCount}/{totalRequired} required items complete
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {completionPct}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={completionPct}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha('#fff', 0.18),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  bgcolor: tokens.colors.yellow,
                },
              }}
            />
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
}

interface SectionCardProps {
  accent: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function SectionCard({
  accent,
  icon,
  title,
  subtitle,
  children,
}: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Box
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderLeft: `4px solid ${accent}`,
          bgcolor: 'background.paper',
          boxShadow: tokens.shadows.soft1,
          mb: 2.5,
          overflow: 'hidden',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: alpha(accent, 0.1),
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(accent, 0.12),
              color: accent,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: tokens.colors.lightText,
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', lineHeight: 1.3, mt: 0.25 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
      </Box>
    </motion.div>
  );
}

interface DocTileProps {
  label: string;
  required?: boolean;
  isImage?: boolean;
  accept?: string;
  url?: string;
  hint?: string;
  icon: React.ReactNode;
  onFile: (file: File | null) => void;
  onClear: () => void;
}

function DocTile({
  label,
  required,
  isImage,
  accept,
  url,
  hint,
  icon,
  onFile,
  onClear,
}: DocTileProps) {
  const filled = Boolean(url);
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Box
        sx={{
          height: '100%',
          p: 1.5,
          borderRadius: 2.5,
          border: '1.5px dashed',
          borderColor: filled
            ? alpha(tokens.colors.success, 0.4)
            : alpha(tokens.colors.pink, 0.25),
          bgcolor: filled
            ? alpha(tokens.colors.success, 0.04)
            : '#fff',
          transition: 'border-color 0.18s, background-color 0.18s',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        {/* Visual leading: photo thumbnail OR colored type-icon tile */}
        {isImage && filled ? (
          <Box
            component="img"
            src={url}
            alt={label}
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(
                filled ? tokens.colors.success : tokens.colors.pink,
                0.1,
              ),
              color: filled ? tokens.colors.success : tokens.colors.pink,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              lineHeight: 1.3,
              color: tokens.colors.lightText,
            }}
            noWrap
          >
            {label}
            {required && (
              <Box
                component="span"
                sx={{ color: tokens.colors.pink, ml: 0.25 }}
              >
                *
              </Box>
            )}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: filled
                ? tokens.colors.success
                : tokens.colors.lightTextSecondary,
              fontSize: 11,
              lineHeight: 1.3,
              display: 'block',
            }}
          >
            {filled
              ? 'Uploaded · click View to confirm'
              : hint || 'PDF, JPG or PNG · up to 10 MB'}
          </Typography>
        </Box>

        {filled ? (
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              variant="outlined"
              component="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                minWidth: 0,
                px: 1,
                fontSize: 11,
              }}
            >
              View
            </Button>
            <Button
              size="small"
              color="error"
              onClick={onClear}
              startIcon={<IconX size={12} />}
              sx={{
                minWidth: 0,
                px: 1,
                fontSize: 11,
              }}
            >
              Remove
            </Button>
          </Stack>
        ) : (
          <Button
            component="label"
            size="small"
            variant="contained"
            startIcon={<IconCloudUpload size={14} />}
            sx={{ fontSize: 11 }}
          >
            Upload
            <input
              type="file"
              hidden
              accept={accept || '.pdf,.png,.jpg,.jpeg'}
              onChange={(e) => onFile(e.target.files?.[0] || null)}
            />
          </Button>
        )}
      </Box>
    </Grid>
  );
}

interface ReferenceCardProps {
  index: number;
  reference: { name: string; relationship: string; phone: string; email: string };
  onChange: (
    patch: Partial<{ name: string; relationship: string; phone: string; email: string }>,
  ) => void;
}

function ReferenceCard({ index, reference, onChange }: ReferenceCardProps) {
  const initials = (reference.name || `R${index}`)
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || `R${index}`;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(tokens.colors.lightSurfaceAlt, 0.4),
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: tokens.gradients.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 0.3,
            flexShrink: 0,
          }}
        >
          {initials}
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: tokens.colors.lightText,
              lineHeight: 1.1,
            }}
          >
            Reference {index}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', lineHeight: 1.3 }}
          >
            Must include a valid email so HR can verify.
          </Typography>
        </Box>
      </Stack>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Name"
            value={reference.name}
            onChange={(e) => onChange({ name: e.target.value })}
            InputProps={{
              startAdornment: (
                <Box
                  sx={{
                    color: 'text.disabled',
                    display: 'flex',
                    mr: 0.75,
                  }}
                >
                  <IconUser size={14} />
                </Box>
              ),
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Relationship"
            placeholder="e.g. Reporting Manager"
            value={reference.relationship}
            onChange={(e) => onChange({ relationship: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            label="Phone (10 digits)"
            value={reference.phone}
            onChange={(e) =>
              onChange({ phone: digitsOnly(e.target.value, 10) })
            }
            inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
            error={Boolean(reference.phone) && !isValidPhone(reference.phone)}
            helperText={
              reference.phone && !isValidPhone(reference.phone)
                ? 'Phone must be exactly 10 digits.'
                : ' '
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            size="small"
            label="Email"
            type="email"
            value={reference.email}
            onChange={(e) => onChange({ email: e.target.value })}
            error={Boolean(reference.email) && !isValidEmail(reference.email)}
            helperText={
              reference.email && !isValidEmail(reference.email)
                ? 'Enter a valid email address.'
                : ' '
            }
            InputProps={{
              startAdornment: (
                <Box
                  sx={{
                    color: 'text.disabled',
                    display: 'flex',
                    mr: 0.75,
                  }}
                >
                  <IconMail size={14} />
                </Box>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

function SuccessShell({ firstName }: { firstName: string }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.gradients.warmGlow,
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Stack
            spacing={2}
            alignItems="center"
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: tokens.shadows.soft4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: tokens.gradients.brand,
                color: '#fff',
                boxShadow: tokens.shadows.glow,
              }}
            >
              <IconCheck size={36} />
            </Box>
            <Typography variant="h4" fontWeight={800}>
              Thanks, {firstName}!
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 440 }}>
              We've received your onboarding details. HR will review and
              write back within 2 business days. You can safely close this
              tab.
            </Typography>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}
