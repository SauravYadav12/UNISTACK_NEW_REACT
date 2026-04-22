import { useState } from 'react';
import { Box, Tab, Tabs, Typography, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { IconFileDollar, IconUserPlus } from '@tabler/icons-react';

import { tokens } from '../../theme/theme';
import PaySlipPanel from './PaySlipPanel';

const MotionBox = motion.create(Box);

type DocTab = 'payslip' | 'onboarding';

export default function MyDocuments() {
  const [tab, setTab] = useState<DocTab>('payslip');

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        sx={{ mb: 3 }}
      >
        <Typography variant="h1" fontWeight={700} sx={{ mb: 0.5 }}>
          My{' '}
          <Box component="span" sx={{
            background: tokens.gradients.pinkBlue,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Documents
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Payslips, onboarding paperwork, and anything else HR sends you
        </Typography>
      </MotionBox>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as DocTab)}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: tokens.colors.pink },
          '& .MuiTabs-indicator': { bgcolor: tokens.colors.pink },
        }}
      >
        <Tab
          value="payslip"
          label="Pay Slip"
          icon={<IconFileDollar size={16} />}
          iconPosition="start"
        />
        <Tab
          value="onboarding"
          label="Onboarding"
          icon={<IconUserPlus size={16} />}
          iconPosition="start"
        />
      </Tabs>

      {tab === 'payslip' && <PaySlipPanel />}
      {tab === 'onboarding' && <OnboardingPanel />}
    </Box>
  );
}

// Placeholder — TODO: surface onboarding checklist / paperwork here.
function OnboardingPanel() {
  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{
        py: 10,
        px: 3,
        textAlign: 'center',
        borderRadius: 4,
        bgcolor: alpha(tokens.colors.blue, 0.04),
        border: `1px dashed ${alpha(tokens.colors.blue, 0.3)}`,
      }}
    >
      <Box sx={{
        width: 60, height: 60, borderRadius: '50%',
        bgcolor: alpha(tokens.colors.blue, 0.12),
        color: tokens.colors.blue,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        mb: 2,
      }}>
        <IconUserPlus size={28} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 16, color: tokens.colors.lightText }}>
        Onboarding documents
      </Typography>
      <Typography sx={{ fontSize: 13, color: tokens.colors.lightTextSecondary, mt: 0.5, maxWidth: 420, mx: 'auto' }}>
        This space will hold your offer letter, policy acknowledgements, and other first-day paperwork. We&rsquo;re still putting this together — check back soon.
      </Typography>
    </MotionBox>
  );
}
