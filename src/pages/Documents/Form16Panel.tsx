import { useMemo, useState } from 'react';
import {
  Box, Button, CircularProgress, FormControl, IconButton, InputLabel,
  MenuItem, Select, Stack, Typography, alpha,
} from '@mui/material';
import moment from 'moment';
import { motion } from 'framer-motion';
import {
  IconChevronLeft, IconChevronRight, IconDownload, IconFileOff,
  IconReceiptTax,
} from '@tabler/icons-react';

import { useFetchData } from '../../hooks/fetchDataHook';
import { tokens } from '../../theme/theme';
import { getMyForm16s } from '../../services/form16Api';
import { MyForm16 } from '../../Interfaces/form16';
import { getCurrentFYStart, getFYLabel } from '../../utils/fiscalYearUtil';

const MotionBox = motion.create(Box);

/**
 * Tax Center → Form-16 viewer for employees. Mirrors PaySlipPanel but
 * FY-based: server returns every published Form-16 owned by the user,
 * the panel picks an FY in the selector + renders the PDF inline.
 *
 * No DOM-to-PDF rasterising here — the stored object IS a PDF, so we
 * embed it in an <iframe> and provide a native download link. Saves
 * the kilobyte cost of html2canvas/jsPDF on this page.
 */
export default function Form16Panel() {
  const { data, loading } = useFetchData<MyForm16[]>(async () => {
    try {
      const { data } = await getMyForm16s();
      return data || [];
    } catch {
      return [];
    }
  }, []);

  const docs = useMemo(() => data || [], [data]);

  // FY options: every FY the user has on file. We also include the
  // current FY at the top even if there's no doc yet, so the empty
  // state isn't disorienting at the start of a new financial year.
  const fyOptions = useMemo(() => {
    const set = new Set<number>(docs.map((d) => d.fiscalYearStart));
    const current = getCurrentFYStart();
    set.add(current);
    return Array.from(set).sort((a, b) => b - a);
  }, [docs]);

  const [selectedFY, setSelectedFY] = useState<number | ''>('');

  // First render: default to the most recent FY that actually has a
  // doc, falling back to current FY when nothing's published yet.
  const effectiveFY = useMemo(() => {
    if (selectedFY !== '') return selectedFY;
    const firstWithDoc = docs[0]?.fiscalYearStart;
    return firstWithDoc ?? getCurrentFYStart();
  }, [selectedFY, docs]);

  const selectedDoc = useMemo(
    () => docs.find((d) => d.fiscalYearStart === effectiveFY),
    [docs, effectiveFY],
  );

  function shiftFY(delta: number) {
    const idx = fyOptions.indexOf(effectiveFY);
    const next = fyOptions[idx + delta];
    if (next != null) setSelectedFY(next);
  }

  const filename = selectedDoc?.originalFilename
    || `Unicodez-Form16-FY${getFYLabel(effectiveFY)}.pdf`;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!docs.length) {
    return <EmptyState />;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: tokens.colors.lightText }}>
          View and download your annual Form-16
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <IconButton
            onClick={() => shiftFY(1)}
            size="small"
            disabled={fyOptions.indexOf(effectiveFY) >= fyOptions.length - 1}
          >
            <IconChevronLeft size={18} />
          </IconButton>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Financial year</InputLabel>
            <Select
              value={effectiveFY}
              label="Financial year"
              onChange={(e) => setSelectedFY(Number(e.target.value))}
            >
              {fyOptions.map((fy) => (
                <MenuItem key={fy} value={fy}>
                  FY {getFYLabel(fy)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            onClick={() => shiftFY(-1)}
            size="small"
            disabled={fyOptions.indexOf(effectiveFY) <= 0}
          >
            <IconChevronRight size={18} />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            startIcon={<IconDownload size={16} />}
            disabled={!selectedDoc}
            component="a"
            href={selectedDoc?.fileUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              bgcolor: tokens.colors.pink,
              '&:hover': { bgcolor: tokens.colors.pinkDark },
            }}
          >
            Download
          </Button>
        </Stack>
      </Stack>

      {selectedDoc ? (
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          sx={{
            bgcolor: '#F4F6F8',
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            p: 2,
          }}
        >
          {selectedDoc.publishedAt && (
            <Typography
              sx={{
                fontSize: 12,
                color: tokens.colors.lightTextSecondary,
                mb: 1,
              }}
            >
              Published on {moment(selectedDoc.publishedAt).format('DD MMM YYYY')}
              {selectedDoc.originalFilename ? ` · ${selectedDoc.originalFilename}` : ''}
            </Typography>
          )}
          <Box
            component="iframe"
            src={selectedDoc.fileUrl}
            title={`Form-16 FY ${getFYLabel(effectiveFY)}`}
            sx={{
              width: '100%',
              height: { xs: 480, md: 720 },
              border: 'none',
              borderRadius: 2,
              bgcolor: 'white',
            }}
          />
        </MotionBox>
      ) : (
        <NoFYDoc fy={effectiveFY} />
      )}
    </Box>
  );
}

function EmptyState() {
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        borderRadius: 4,
        bgcolor: alpha(tokens.colors.pink, 0.04),
        border: `1px dashed ${alpha(tokens.colors.pink, 0.3)}`,
      }}
    >
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: alpha(tokens.colors.pink, 0.12),
          color: tokens.colors.pink,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <IconReceiptTax size={28} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 16, color: tokens.colors.lightText }}>
        No tax documents on file yet
      </Typography>
      <Typography
        sx={{
          fontSize: 13,
          color: tokens.colors.lightTextSecondary,
          mt: 0.75,
          maxWidth: 460,
          mx: 'auto',
        }}
      >
        Your HR will publish your Form-16 at the end of the financial year.
        It&rsquo;ll appear here automatically as soon as they do.
      </Typography>
    </MotionBox>
  );
}

function NoFYDoc({ fy }: { fy: number }) {
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 8,
        bgcolor: alpha(tokens.colors.pink, 0.03),
        borderRadius: 4,
        border: `1px dashed ${alpha(tokens.colors.pink, 0.3)}`,
      }}
    >
      <IconFileOff size={48} color={tokens.colors.pink} strokeWidth={1.5} />
      <Typography sx={{ mt: 2, fontWeight: 600, color: tokens.colors.lightText }}>
        No Form-16 for FY {getFYLabel(fy)} yet
      </Typography>
      <Typography
        sx={{
          color: tokens.colors.lightTextSecondary,
          mt: 0.5,
          fontSize: 13,
        }}
      >
        HR will publish it after the FY closes. Try another year.
      </Typography>
    </MotionBox>
  );
}
