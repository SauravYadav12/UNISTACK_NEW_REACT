import {
  Box,
  Chip,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconBriefcase,
  IconCake,
  IconCalendar,
  IconCertificate,
  IconExternalLink,
  IconFile,
  IconFileText,
  IconMail,
  IconMapPin,
  IconPhoto,
  IconPhone,
  IconReceipt,
  IconSchool,
  IconSignature,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react';
import moment from 'moment';
import { OnboardingFormData } from '../../Interfaces/onboarding';
import { tokens } from '../../theme';

/**
 * Rendered snapshot of an onboarding candidate's submitted form.
 *
 * Replaces the original flat "label / value" list inside the
 * candidate drawer with a more scannable, branded layout:
 *   - A header strip with the receive timestamp + signature pill.
 *   - Three info cards (Personal / Address / Education) with the
 *     same accent-stripe pattern used by the salary slip + offer
 *     letter — pink / blue / yellow on a thin left border.
 *   - References as side-by-side mini-cards with avatar + chips for
 *     relationship + contact info.
 *   - Documents as a grid of file tiles with type icons, labels and
 *     external-link affordances. The passport photo renders a tiny
 *     thumbnail directly in the tile.
 *
 * Pure presentational — accepts a single `formData` object and one
 * optional `candidateName` for the implicit "Personal" card header.
 */

interface Props {
  formData: OnboardingFormData;
  candidateName: string;
}

export default function FormSnapshotPanel({ formData, candidateName }: Props) {
  const fullAddress = [
    formData.address1,
    formData.city,
    formData.state,
    formData.zip,
    formData.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* ── Header strip ─────────────────────────────────────────── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: 2.25,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${alpha(
            tokens.colors.pink,
            0.04,
          )} 0%, ${alpha(tokens.colors.blue, 0.04)} 100%)`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tokens.gradients.brand,
              color: '#fff',
              boxShadow: tokens.shadows.glow,
            }}
          >
            <IconFileText size={16} />
          </Box>
          <Box>
            <Typography fontWeight={800} sx={{ fontSize: 13, lineHeight: 1.1 }}>
              Submitted form
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block' }}
            >
              {formData.submittedAt
                ? `Received ${moment(formData.submittedAt).format(
                    'DD MMM YYYY · hh:mm A',
                  )}`
                : 'Awaiting submission'}
            </Typography>
          </Box>
        </Stack>
        {formData.candidateSignatureDataUrl && (
          <Tooltip title="Candidate signed the form" arrow placement="top">
            <Chip
              icon={<IconSignature size={14} />}
              label="Signed"
              size="small"
              sx={{
                fontWeight: 700,
                bgcolor: alpha(tokens.colors.success, 0.1),
                color: tokens.colors.success,
                '& .MuiChip-icon': { color: tokens.colors.success },
              }}
            />
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ p: 2.25 }}>
        <Stack spacing={2}>
          {/* ── Personal card ──────────────────────────────────── */}
          <InfoCard
            accent={tokens.colors.pink}
            icon={<IconUserCircle size={16} />}
            title="Personal"
            subtitle={candidateName}
          >
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldChip
                  icon={<IconCake size={14} />}
                  label="Date of birth"
                  value={
                    formData.dob
                      ? moment(formData.dob).format('DD MMM YYYY')
                      : '—'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FieldChip
                  icon={<IconBriefcase size={14} />}
                  label="Referred by"
                  value={formData.referredBy || '—'}
                />
              </Grid>
            </Grid>
          </InfoCard>

          {/* ── Address card ──────────────────────────────────── */}
          <InfoCard
            accent={tokens.colors.blue}
            icon={<IconMapPin size={16} />}
            title="Address"
          >
            <Typography
              variant="body2"
              sx={{ color: tokens.colors.lightText, lineHeight: 1.65 }}
            >
              {fullAddress || (
                <em style={{ color: tokens.colors.lightTextSecondary }}>
                  Not provided
                </em>
              )}
            </Typography>
          </InfoCard>

          {/* ── Education card ────────────────────────────────── */}
          <InfoCard
            accent={tokens.colors.yellowDark}
            icon={<IconSchool size={16} />}
            title="Education"
          >
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FieldChip
                  icon={<IconCertificate size={14} />}
                  label="Highest degree"
                  value={formData.highestDegree || '—'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }}>
                <FieldChip
                  icon={<IconSchool size={14} />}
                  label="College"
                  value={formData.collegeName || '—'}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FieldChip
                  icon={<IconCalendar size={14} />}
                  label="Completed"
                  value={
                    formData.degreeCompletionDate
                      ? moment(formData.degreeCompletionDate).format(
                          'MMM YYYY',
                        )
                      : '—'
                  }
                />
              </Grid>
            </Grid>
          </InfoCard>

          {/* ── References ───────────────────────────────────── */}
          {formData.references && formData.references.length > 0 && (
            <InfoCard
              accent={tokens.colors.pink}
              icon={<IconUsers size={16} />}
              title="References"
              subtitle={`${formData.references.filter((r) => r.name).length} provided`}
            >
              <Grid container spacing={1.5}>
                {formData.references.map((r, i) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={i}>
                    <ReferenceCard reference={r} index={i + 1} />
                  </Grid>
                ))}
              </Grid>
            </InfoCard>
          )}

          {/* ── Documents ────────────────────────────────────── */}
          <InfoCard
            accent={tokens.colors.blue}
            icon={<IconFile size={16} />}
            title="Documents"
          >
            <Grid container spacing={1.25}>
              <DocTile
                label="Resume"
                url={formData.documents?.resume}
                icon={<IconFileText size={16} />}
              />
              <DocTile
                label="Passport photo"
                url={formData.documents?.passportPhoto}
                icon={<IconPhoto size={16} />}
                isImage
              />
              <DocTile
                label="PAN card"
                url={formData.documents?.panCard}
                icon={<IconCertificate size={16} />}
              />
              <DocTile
                label="Address proof"
                url={formData.documents?.addressProof}
                icon={<IconMapPin size={16} />}
              />
              <DocTile
                label="Degree copy"
                url={formData.documents?.degreeCopy}
                icon={<IconSchool size={16} />}
              />
              {(formData.documents?.lastThreeSalarySlips || []).map((u, i) => (
                <DocTile
                  key={i}
                  label={`Salary slip ${i + 1}`}
                  url={u}
                  icon={<IconReceipt size={16} />}
                />
              ))}
            </Grid>
          </InfoCard>
        </Stack>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sub-components

interface InfoCardProps {
  accent: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function InfoCard({ accent, icon, title, subtitle, children }: InfoCardProps) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${accent}`,
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 1.75,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: alpha(accent, 0.12),
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(accent, 0.12),
            color: accent,
          }}
        >
          {icon}
        </Box>
        <Typography
          fontWeight={800}
          sx={{
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: tokens.colors.lightText,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: tokens.colors.lightTextSecondary,
              ml: 'auto',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>
      <Box sx={{ p: 1.75 }}>{children}</Box>
    </Box>
  );
}

function FieldChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        alignItems: 'flex-start',
        p: 1.25,
        borderRadius: 2,
        bgcolor: alpha(tokens.colors.lightSurfaceAlt, 0.6),
        height: '100%',
      }}
    >
      <Box
        sx={{
          mt: '2px',
          color: tokens.colors.lightTextSecondary,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: tokens.colors.lightTextSecondary,
            fontSize: 10,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'block',
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: tokens.colors.lightText,
            fontSize: 13,
            lineHeight: 1.4,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

function ReferenceCard({
  reference,
  index,
}: {
  reference: { name?: string; relationship?: string; phone?: string; email?: string };
  index: number;
}) {
  const initials = (reference.name || `R${index}`)
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(tokens.colors.lightSurfaceAlt, 0.4),
        height: '100%',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: tokens.gradients.brand,
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: 0.3,
            flexShrink: 0,
          }}
        >
          {initials}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 13,
              color: tokens.colors.lightText,
              lineHeight: 1.2,
            }}
            noWrap
          >
            {reference.name || `Reference ${index}`}
          </Typography>
          {reference.relationship && (
            <Typography
              variant="caption"
              sx={{
                color: tokens.colors.lightTextSecondary,
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              {reference.relationship}
            </Typography>
          )}
        </Box>
      </Stack>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ mt: 1.25, flexWrap: 'wrap' }}
        useFlexGap
      >
        {reference.phone && (
          <Chip
            size="small"
            icon={<IconPhone size={11} />}
            label={reference.phone}
            component="a"
            href={`tel:${reference.phone}`}
            clickable
            sx={{
              height: 22,
              fontSize: 11,
              bgcolor: alpha(tokens.colors.blue, 0.08),
              color: tokens.colors.blue,
              '& .MuiChip-icon': { color: tokens.colors.blue, ml: 0.5 },
            }}
          />
        )}
        {reference.email && (
          <Chip
            size="small"
            icon={<IconMail size={11} />}
            label={reference.email}
            component="a"
            href={`mailto:${reference.email}`}
            clickable
            sx={{
              height: 22,
              fontSize: 11,
              maxWidth: '100%',
              bgcolor: alpha(tokens.colors.pink, 0.08),
              color: tokens.colors.pink,
              '& .MuiChip-icon': { color: tokens.colors.pink, ml: 0.5 },
              '& .MuiChip-label': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          />
        )}
      </Stack>
    </Box>
  );
}

function DocTile({
  label,
  url,
  icon,
  isImage,
}: {
  label: string;
  url?: string;
  icon: React.ReactNode;
  isImage?: boolean;
}) {
  const isMissing = !url;
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
      <Box
        component={isMissing ? 'div' : 'a'}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          p: 1.25,
          borderRadius: 2,
          border: '1px solid',
          borderColor: isMissing ? 'divider' : alpha(tokens.colors.pink, 0.25),
          bgcolor: isMissing
            ? alpha(tokens.colors.lightTextSecondary, 0.05)
            : '#fff',
          textDecoration: 'none',
          color: 'inherit',
          height: '100%',
          transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
          ...(isMissing
            ? { opacity: 0.55 }
            : {
                '&:hover': {
                  borderColor: tokens.colors.pink,
                  transform: 'translateY(-1px)',
                  boxShadow: tokens.shadows.soft2,
                },
              }),
        }}
      >
        {/* Thumbnail for image docs (passport photo) — otherwise the
            type icon in a colored tile. */}
        {isImage && url ? (
          <Box
            component="img"
            src={url}
            alt={label}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(
                isMissing ? tokens.colors.lightTextSecondary : tokens.colors.pink,
                0.1,
              ),
              color: isMissing
                ? tokens.colors.lightTextSecondary
                : tokens.colors.pink,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25 }}
            noWrap
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: isMissing
                ? tokens.colors.lightTextSecondary
                : tokens.colors.pink,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            {isMissing ? 'Not provided' : 'View document'}
          </Typography>
        </Box>

        {!isMissing && (
          <IconExternalLink
            size={14}
            style={{
              color: tokens.colors.lightTextSecondary,
              flexShrink: 0,
            }}
          />
        )}
      </Box>
    </Grid>
  );
}
